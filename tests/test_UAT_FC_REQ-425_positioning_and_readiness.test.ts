import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  clientBoardAction,
  focusFinishedLine,
  focusFinishedSince,
  panelView,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'
import { boardChangesLine, boardChangesSince } from '../tools/generate/src/cli/ai/story-core'

/**
 * [[REQ-425]] — **the positioning card and readiness per area**: the synthesis step
 * between the client's hearted notes and the headline, and how ready the client
 * is in each area so the consultant proposes first.
 *
 * WHAT IS REAL HERE, as in REQ-408's suite: the seed, the Toolbox, the plan
 * declaration and operations driven through `box.run`, `checkPlan`, the client's
 * action (`clientBoardAction`, what `/api/plan/board` applies), `panelView` (what
 * the Story pane draws), `planReminder` and the notices. One double: the host's
 * storage port, in memory.
 */

const SLUG = 'welder'
const NOW = '2026-10-21T11:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req425-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan; client: (input: Record<string, unknown>, at?: string) => void } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => open(),
    client: (input, at = '2026-10-21T12:00:00.000Z') => {
      plan = clientBoardAction(open(), input, at)
    },
    now: () => NOW,
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

async function consultant(deps: PlanDeps): Promise<{ run: (tool: string, input: Record<string, unknown>) => Promise<string> }> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, 'consultant'), granted: planInstanceConfig('consultant') }] as never,
  }) as never
}

const FAILED = /PLAN_INVALID|SCHEMA_INVALID|CLIENTS_WORDS|UNKNOWN_NOTE|NO_POSITIONING|FOCUS_OPEN|not enabled|Unknown/i

/** Three sayings, the first hearted: what a card is written from. */
async function hearted(): Promise<{ deps: ReturnType<typeof memoryPlan>; alice: Awaited<ReturnType<typeof consultant>>; strength: string }> {
  const deps = memoryPlan()
  const alice = await consultant(deps)
  const out = await alice.run('pin_notes', {
    notes: [
      { text: 'Beauty and strength in every weld', quote: 'What I do is beauty and strength — quality custom metalwork.', emoji: '🔥', theme: 'The work' },
      { text: "If you wouldn't stand under it, don't weld it", quote: "My dad always said if you wouldn't stand under it, don't weld it.", emoji: '👪', theme: 'Family' },
      { text: 'Contractors call me for the hard one-offs', quote: 'The contractors call me when nobody else will take the job.', emoji: '🏗️', theme: 'The work' },
    ],
  })
  expect(out).not.toMatch(FAILED)
  const strength = panelView(deps.stored().fields).board.themes[0].notes[0].id
  deps.client({ action: 'react', note: strength, reaction: 'heart' })
  return { deps, alice, strength }
}

const card = (from: string) => ({
  hearing: ['Craft you can see', 'Work that holds'],
  known_for: 'Quality custom metalwork: beauty and strength',
  picks: [
    { customer: 'Contractors', why: 'deciding who will pass inspection on time: certified, and takes the hard one-off job' },
    { customer: 'Homeowners', why: 'deciding whether a gate can be beautiful and last: both, made by hand' },
  ],
  from: [from],
})

const view = (deps: ReturnType<typeof memoryPlan>) => panelView(deps.stored().fields)

describe('REQ-425 — the positioning card', () => {
  it('test_UAT_FC_REQ-425_the_consultant_writes_the_card_from_hearted_notes_and_the_board_shows_it_above_the_headline', async () => {
    const { deps, alice, strength } = await hearted()
    expect(view(deps).board.positioning).toBeNull()

    // WRITTEN FROM HEARTED NOTES, NEVER FROM NOTHING, and in its three parts.
    const unhearted = view(deps).board.themes[1].notes[0].id
    expect(await alice.run('write_positioning', card(unhearted))).toMatch(/PLAN_INVALID/)
    expect(await alice.run('write_positioning', { ...card(strength), hearing: ['Only one'] })).toMatch(/PLAN_INVALID/)
    expect(await alice.run('write_positioning', { ...card(strength), picks: [] })).toMatch(/PLAN_INVALID/)
    expect(await alice.run('write_positioning', card(strength))).not.toMatch(FAILED)

    const p = view(deps).board.positioning!
    expect(p.state).toBe('written')
    expect(p.heart).toBe(false)
    expect(p.lines.map((l) => [l.id, l.kind, l.customer ?? null, l.text])).toEqual([
      ['h1', 'hearing', null, 'Craft you can see'],
      ['h2', 'hearing', null, 'Work that holds'],
      ['known', 'known_for', null, 'Quality custom metalwork: beauty and strength'],
      ['p1', 'pick', 'Contractors', 'deciding who will pass inspection on time: certified, and takes the hard one-off job'],
      ['p2', 'pick', 'Homeowners', 'deciding whether a gate can be beautiful and last: both, made by hand'],
    ])
    expect(p.lines.find((l) => l.id === 'p1')!.label).toBe('why Contractors pick you')
    // WHILE IT IS STILL HERS, she may write it again.
    expect(await alice.run('write_positioning', { ...card(strength), known_for: 'Custom metalwork that is beautiful and strong' })).not.toMatch(FAILED)
  })

  it('test_UAT_FC_REQ-425_the_client_hearts_or_edits_the_card_and_then_it_is_theirs', async () => {
    const { deps, alice, strength } = await hearted()
    await alice.run('write_positioning', card(strength))

    deps.client({ action: 'heart_card' }, '2026-10-21T12:01:00.000Z')
    expect(view(deps).board.positioning!.state).toBe('confirmed')
    expect(await alice.run('write_positioning', card(strength))).toMatch(/CLIENTS_WORDS/)
    // THE HEART TOGGLES, like a note's.
    deps.client({ action: 'heart_card' }, '2026-10-21T12:02:00.000Z')
    expect(view(deps).board.positioning!.state).toBe('written')

    deps.client({ action: 'edit_card', line: 'known', text: 'Beauty and Strength — quality custom metalwork' }, '2026-10-21T12:03:00.000Z')
    const p = view(deps).board.positioning!
    expect(p.state).toBe('confirmed')
    expect(p.lines.find((l) => l.id === 'known')).toMatchObject({ text: 'Beauty and Strength — quality custom metalwork', edited: true })
    expect(await alice.run('write_positioning', card(strength))).toMatch(/CLIENTS_WORDS/)

    // HER NEXT TURN HEARS IT.
    const line = boardChangesLine(boardChangesSince(deps.stored().fields, '2026-10-21T12:02:30.000Z'))!
    expect(line).toContain(`reworded the positioning card's known (what you’re known for) line to "Beauty and Strength — quality custom metalwork"`)
  })

  it('test_UAT_FC_REQ-425_headlines_come_from_the_card_and_each_option_names_its_line', async () => {
    const { deps, alice, strength } = await hearted()
    const options = ['Beauty and Strength in Steel', 'Built to pass, built to last']

    // NO CARD, NO HEADLINES.
    expect(await alice.run('offer_headlines', { options, pick: 0, sources: ['known', 'p1'] })).toMatch(/NO_POSITIONING/)
    await alice.run('write_positioning', card(strength))
    // EACH OPTION NAMES A LINE THE CARD HAS, one for one.
    expect(await alice.run('offer_headlines', { options, pick: 0, sources: ['known'] })).toMatch(/PLAN_INVALID/)
    expect(await alice.run('offer_headlines', { options, pick: 0, sources: ['known', 'p9'] })).toMatch(/PLAN_INVALID/)
    expect(await alice.run('offer_headlines', { options, pick: 0, sources: ['known', 'p1'] })).not.toMatch(FAILED)

    let h = view(deps).board.headline
    expect(h.options).toEqual(options)
    expect(h.sources).toEqual(['known', 'p1'])

    // A CHOSEN OPTION KEEPS ITS LINE; a later offer's lines travel with it.
    deps.client({ action: 'choose', option: options[1] })
    h = view(deps).board.headline
    expect(h.text).toBe(options[1])
    expect(h.source).toBe('p1')
    expect(await alice.run('offer_headlines', { options: ['Gates worth keeping', 'Strong enough to stand under'], pick: 1, sources: ['p2', 'h2'] })).not.toMatch(FAILED)
    h = view(deps).board.headline
    expect(h.new_options).toEqual(['Strong enough to stand under', 'Gates worth keeping'])
    expect(h.new_sources).toEqual(['h2', 'p2'])
  })

  it('test_UAT_FC_REQ-425_getting_to_know_you_finishes_on_a_confirmed_card_or_a_recorded_fallback', async () => {
    const { deps, alice, strength } = await hearted()
    const finish = () => planReminder(deps.stored())!.split('\n').find((l) => l.startsWith('Story board:'))!
    expect(finish()).toContain('no positioning card;')
    expect(finish()).toMatch(/For "Getting to know you" to finish: .*no positioning card/)

    await alice.run('write_positioning', card(strength))
    expect(finish()).toContain('positioning card written, not confirmed')
    expect(finish()).toContain('the positioning card is not confirmed (the client hearts or edits it)')

    deps.client({ action: 'heart_card' })
    expect(finish()).toContain('positioning card confirmed')
    expect(finish()).not.toMatch(/positioning card is not confirmed|no positioning card/)

    // THE HONEST FALLBACK: nothing distinctive yet, recorded as a decision, and the
    // finish line is met without a heart.
    const plain = memoryPlan()
    const other = await consultant(plain)
    expect(await other.run('write_positioning', { fallback: true })).not.toMatch(FAILED)
    const p = panelView(plain.stored().fields).board.positioning!
    expect(p.state).toBe('fallback')
    expect(p.lines.map((l) => l.kind)).toEqual(['known_for'])
    const decision = plain.stored().fields.decisions.find((d) => d.id === 'core_story')!
    expect(decision.state).toBe('proposed')
    expect(decision.value).toContain('Fallback — nothing distinctive yet: The most trustworthy choice, and the easiest to get hold of')
    const line = planReminder(plain.stored())!.split('\n').find((l) => l.startsWith('Story board:'))!
    expect(line).toContain('positioning fallback recorded')
    expect(line).not.toMatch(/no positioning card|no note has a heart|positioning card is not confirmed/)
  })
})

describe('REQ-425 — readiness per area', () => {
  it('test_UAT_FC_REQ-425_readiness_persists_on_the_plan_and_rides_the_per_turn_entry', async () => {
    const deps = memoryPlan()
    const alice = await consultant(deps)
    expect(planReminder(deps.stored())).toContain(
      'Client readiness — messaging: not judged yet; look and feel: not judged yet; site functions: not judged yet.',
    )
    expect(await alice.run('set_readiness', {})).toMatch(/PLAN_INVALID/)
    // ("unknown" is a level here, so the refusal codes are checked, not the word.)
    expect(await alice.run('set_readiness', { messaging: 'knows_exactly', look: 'unknown' })).not.toMatch(/PLAN_INVALID|SCHEMA_INVALID|not enabled/)
    expect(await alice.run('set_readiness', { functions: 'has_ideas' })).not.toMatch(/PLAN_INVALID|SCHEMA_INVALID|not enabled/)
    expect(await alice.run('set_readiness', { look: 'whatever' })).toMatch(/must be one of/)
    expect(deps.stored().fields.readiness).toEqual({ messaging: 'knows_exactly', look: 'unknown', functions: 'has_ideas' })
    expect(planReminder(deps.stored())).toContain(
      'Client readiness — messaging: knows exactly; look and feel: unknown; site functions: has ideas. Propose and guide where unknown',
    )
  })
})

describe('REQ-425 — the story focus task, one step at a time', () => {
  it('test_UAT_FC_REQ-425_react_to_notes_then_confirm_the_card_then_pick_a_headline', async () => {
    const { deps, alice, strength } = await hearted()
    const notesLeft = view(deps).board.themes.flatMap((t) => t.notes).filter((n) => !n.reaction).map((n) => n.id).sort()

    // STEP ONE: the notes.
    expect(await alice.run('start_focus', { kind: 'story', intro: 'Heart the ones that are most you.' })).not.toMatch(FAILED)
    expect(view(deps).focus).toMatchObject({ kind: 'story', step: 'notes' })
    expect([...view(deps).focus!.pending].sort()).toEqual(notesLeft)
    for (const id of notesLeft) deps.client({ action: 'react', note: id, reaction: 'up' })
    expect(view(deps).focus).toBeNull()

    // STEP TWO: the card — and nothing new on the board while they confirm it.
    await alice.run('write_positioning', card(strength))
    expect(planReminder(deps.stored())).toContain('Waiting on the client: the positioning card to confirm.')
    expect(await alice.run('start_focus', { kind: 'story', intro: 'Here is what I am hearing — heart it, or put it in your words.' })).not.toMatch(FAILED)
    expect(view(deps).focus).toMatchObject({ kind: 'story', step: 'positioning', pending: ['positioning'] })
    expect(await alice.run('offer_headlines', { options: ['A', 'B'], pick: 0, sources: ['known', 'h1'] })).toMatch(/FOCUS_OPEN/)
    deps.client({ action: 'heart_card' }, '2026-10-21T12:10:00.000Z')
    const done = focusFinishedSince(deps.stored().fields, '2026-10-21T12:05:00.000Z')!
    expect(focusFinishedLine(deps.stored().fields, done)).toContain(
      'confirming the positioning card on the story board (every item is done); they hearted the positioning card',
    )

    // STEP THREE: the headline.
    await alice.run('offer_headlines', { options: ['Beauty and Strength in Steel', 'Built to pass, built to last'], pick: 0, sources: ['known', 'p1'] })
    expect(await alice.run('start_focus', { kind: 'story', intro: 'Pick the line for the top of your page.' })).not.toMatch(FAILED)
    expect(view(deps).focus).toMatchObject({ step: 'headline', pending: ['headline'] })
    deps.client({ action: 'choose', option: 'Beauty and Strength in Steel' }, '2026-10-21T12:20:00.000Z')
    const picked = focusFinishedSince(deps.stored().fields, '2026-10-21T12:15:00.000Z')!
    expect(focusFinishedLine(deps.stored().fields, picked)).toContain('they chose the headline "Beauty and Strength in Steel"')
  })
})
