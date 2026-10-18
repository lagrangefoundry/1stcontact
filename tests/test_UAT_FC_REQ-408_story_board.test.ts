import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  builderSessionCompleted,
  clientBoardAction,
  panelView,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  PLAN_DECLARATION,
  publishOpened,
  seedPlan,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'
import { boardChangesLine, boardChangesSince, storyBrief } from '../tools/generate/src/cli/ai/story-core'
import priming from '../tools/generate/src/cli/ai/priming.json'

/**
 * [[REQ-408]] — **the story board**: the client's own words, pinned as sticky
 * notes, grouped into themes, with a headline at the top.
 *
 * WHAT IS REAL HERE: the seed, the Toolbox, the plan declaration and operations
 * driven through `box.run` (the call a model's tool use becomes), `checkPlan`,
 * the client's action (`clientBoardAction`, what `/api/plan/board` applies),
 * `panelView` (what the Story pane draws), `planReminder` and the board notice
 * (what the consultant is told). One double: the host's storage port, in memory,
 * as in REQ-403's suite.
 */

const SLUG = 'salon'
const NOW = '2026-10-18T11:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req408-'))
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
    client: (input, at = '2026-10-18T12:00:00.000Z') => {
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

const FAILED = /PLAN_INVALID|SCHEMA_INVALID|CLIENTS_WORDS|UNKNOWN_NOTE|not enabled|Unknown/i

/** Four sayings across two themes, pinned the way the consultant pins them. */
async function pinned(): Promise<{ deps: ReturnType<typeof memoryPlan>; alice: Awaited<ReturnType<typeof consultant>> }> {
  const deps = memoryPlan()
  const alice = await consultant(deps)
  const out = await alice.run('pin_notes', {
    notes: [
      { text: 'Three generations of one family cut hair here', quote: "My gran opened it, then my mum, and now it's me — three generations cutting hair on this corner.", emoji: '👪', theme: 'Family' },
      { text: 'Every cut starts with a cup of tea', quote: 'Everybody gets a cup of tea before we start, always have.', emoji: '💇', theme: 'The chair' },
      { text: '"I leave feeling like myself again"', quote: 'One lady told me last week, "I leave feeling like myself again."', emoji: '💬', theme: 'The chair' },
      { text: 'On the high street since 1971', quote: "We've been on the high street since 1971.", emoji: '📍', theme: 'Family' },
    ],
  })
  expect(out).not.toMatch(FAILED)
  return { deps, alice }
}

const notes = (plan: Plan) => panelView(plan.fields).board.themes.flatMap((t) => t.notes)
const note = (plan: Plan, text: string) => notes(plan).find((n) => n.text.startsWith(text))!

describe('REQ-408 — the story board', () => {
  it('test_UAT_FC_REQ-408_a_pinned_note_shows_its_text_emoji_theme_colour_and_original_sentence', async () => {
    const { deps } = await pinned()
    const view = panelView(deps.stored().fields)
    expect(view.board.themes.map((t) => t.name)).toEqual(['Family', 'The chair'])
    // EACH THEME ITS OWN COLOUR from the fixed palette.
    expect(new Set(view.board.themes.map((t) => t.colour)).size).toBe(2)
    const family = view.board.themes[0]
    expect(family.notes.map((n) => [n.text, n.emoji])).toEqual([
      ['Three generations of one family cut hair here', '👪'],
      ['On the high street since 1971', '📍'],
    ])
    // HOVERING SHOWS THE ORIGINAL SENTENCE: it travels with the note.
    expect(family.notes[0].quote).toContain('three generations cutting hair on this corner')

    // A note without its sentence or with more than one emoji is refused.
    const alice = await consultant(deps)
    expect(await alice.run('pin_notes', { notes: [{ text: 'Friendly', emoji: '😀', theme: 'Family' }] })).toMatch(/PLAN_INVALID/)
    expect(await alice.run('pin_notes', { notes: [{ text: 'Friendly', quote: 'We are friendly', emoji: '😀😀', theme: 'Family' }] })).toMatch(/PLAN_INVALID/)
    expect(notes(deps.stored())).toHaveLength(4)
  })

  it('test_UAT_FC_REQ-408_a_new_site_has_not_been_drafted_and_the_first_builder_session_drafts_it', () => {
    const plan = seedPlan(SLUG)
    expect(panelView(plan.fields).drafted).toBe(false)
    expect(panelView(builderSessionCompleted(plan, NOW).fields).drafted).toBe(true)
  })

  it('test_UAT_FC_REQ-408_reactions_are_exclusive_clear_on_a_second_click_and_delete_removes_the_note', async () => {
    const { deps } = await pinned()
    const tea = note(deps.stored(), 'Every cut').id
    deps.client({ action: 'react', note: tea, reaction: 'heart' })
    expect(note(deps.stored(), 'Every cut').reaction).toBe('heart')
    // ONE AT A TIME: 👍 replaces ❤️.
    deps.client({ action: 'react', note: tea, reaction: 'up' })
    expect(note(deps.stored(), 'Every cut').reaction).toBe('up')
    // THE SAME AGAIN CLEARS IT.
    deps.client({ action: 'react', note: tea, reaction: 'up' })
    expect(note(deps.stored(), 'Every cut').reaction).toBeUndefined()

    // 👎 LEAVES IT ON THE BOARD, marked.
    const street = note(deps.stored(), 'On the high').id
    deps.client({ action: 'react', note: street, reaction: 'down' })
    expect(note(deps.stored(), 'On the high').reaction).toBe('down')

    // 🗑 TAKES IT OFF.
    deps.client({ action: 'delete', note: street })
    expect(notes(deps.stored()).some((n) => n.id === street)).toBe(false)
    expect(notes(deps.stored())).toHaveLength(3)
  })

  it('test_UAT_FC_REQ-408_the_client_adds_and_edits_notes_and_the_consultant_never_rewords_their_words', async () => {
    const { deps, alice } = await pinned()
    const family = panelView(deps.stored().fields).board.themes[0].id
    deps.client({ action: 'add', theme: family, text: 'My daughter starts her apprenticeship in June' })
    const mine = note(deps.stored(), 'My daughter')
    expect(mine.by).toBe('client')

    const tea = note(deps.stored(), 'Every cut').id
    deps.client({ action: 'edit', note: tea, text: 'Every cut starts with a proper brew' })
    expect(note(deps.stored(), 'Every cut').text).toBe('Every cut starts with a proper brew')

    const quote = note(deps.stored(), '"I leave').id
    deps.client({ action: 'react', note: quote, reaction: 'heart' })
    const generations = note(deps.stored(), 'Three generations').id
    deps.client({ action: 'react', note: generations, reaction: 'up' })

    // CLIENT-WRITTEN, CLIENT-EDITED, ❤️ AND 👍 ARE ALL REFUSED.
    for (const id of [mine.id, tea, quote, generations]) {
      expect(await alice.run('reword_note', { note: id, text: 'Something smoother' })).toMatch(/CLIENTS_WORDS/)
      expect(await alice.run('remove_note', { note: id })).toMatch(/CLIENTS_WORDS/)
    }
    expect(note(deps.stored(), 'Every cut').text).toBe('Every cut starts with a proper brew')

    // A 👎 IS HERS TO REWORD, and the new words are a fresh offer.
    const street = note(deps.stored(), 'On the high').id
    deps.client({ action: 'react', note: street, reaction: 'down' })
    expect(await alice.run('reword_note', { note: street, text: 'Cutting hair on the high street since 1971' })).not.toMatch(FAILED)
    expect(note(deps.stored(), 'Cutting hair').reaction).toBeUndefined()
  })

  it('test_UAT_FC_REQ-408_headline_offers_step_choose_and_a_later_offer_leaves_the_choice_in_place', async () => {
    const { deps, alice } = await pinned()
    expect(panelView(deps.stored().fields).board.headline.state).toBe('empty')

    // NEVER FROM NOTHING: an offer needs hearted notes behind it.
    const options = ['Three generations on one corner', 'Where every cut starts with tea', 'Leave feeling like yourself again']
    expect(await alice.run('offer_headlines', { options, pick: 0, from: [] })).toMatch(/PLAN_INVALID/)
    const generations = note(deps.stored(), 'Three generations').id
    expect(await alice.run('offer_headlines', { options, pick: 0, from: [generations] })).toMatch(/PLAN_INVALID/)
    deps.client({ action: 'react', note: generations, reaction: 'heart' })
    expect(await alice.run('offer_headlines', { options, pick: 2, from: [generations] })).not.toMatch(FAILED)

    let h = panelView(deps.stored().fields).board.headline
    expect(h.state).toBe('offered')
    expect(h.options).toEqual(options)
    expect(h.pick).toBe(2)

    deps.client({ action: 'choose', option: options[0] })
    h = panelView(deps.stored().fields).board.headline
    expect(h.state).toBe('chosen')
    expect(h.text).toBe(options[0])
    expect(h.yours).toBe(false)
    expect(h.options).toEqual([])

    // UNCHOSEN OPTIONS ARE NEVER OFFERED AGAIN.
    expect(await alice.run('offer_headlines', { options: [options[1], 'A fresh line'], pick: 0, from: [generations] })).toMatch(/PLAN_INVALID/)

    // A NEW OFFER NEVER REPLACES A CHOICE: it waits as new options.
    expect(await alice.run('offer_headlines', { options: ['Your gran’s salon, still', 'Fifty years on the corner'], pick: 1, from: [generations] })).not.toMatch(FAILED)
    h = panelView(deps.stored().fields).board.headline
    expect(h.text).toBe(options[0])
    expect(h.new_options).toEqual(['Fifty years on the corner', 'Your gran’s salon, still'])
  })

  it('test_UAT_FC_REQ-408_typing_over_an_offer_makes_it_the_headline_in_the_clients_words', async () => {
    const { deps, alice } = await pinned()
    const generations = note(deps.stored(), 'Three generations').id
    deps.client({ action: 'react', note: generations, reaction: 'heart' })
    await alice.run('offer_headlines', { options: ['Three generations on one corner', 'Cut by family since 1971'], pick: 0, from: [generations] })

    deps.client({ action: 'write', text: 'Three generations, one chair, your corner' })
    const h = panelView(deps.stored().fields).board.headline
    expect(h.state).toBe('chosen')
    expect(h.text).toBe('Three generations, one chair, your corner')
    expect(h.yours).toBe(true)
    // THE OPTIONS ARE DISMISSED and kept as offered-not-chosen.
    expect(h.options).toEqual([])
    expect(deps.stored().fields.board!.headline.passed).toEqual(['Three generations on one corner', 'Cut by family since 1971'])
  })

  it('test_UAT_FC_REQ-408_the_next_turn_hears_reactions_client_notes_and_the_headline_but_not_her_own_pins', async () => {
    const { deps, alice } = await pinned()
    const since = '2026-10-18T11:30:00.000Z'
    // HER OWN PINS ARE NEVER REPORTED BACK TO HER.
    expect(boardChangesSince(deps.stored().fields, '')).toEqual([])

    const generations = note(deps.stored(), 'Three generations').id
    const street = note(deps.stored(), 'On the high').id
    const family = panelView(deps.stored().fields).board.themes[0].id
    deps.client({ action: 'react', note: generations, reaction: 'heart' }, '2026-10-18T12:00:00.000Z')
    deps.client({ action: 'react', note: street, reaction: 'down' }, '2026-10-18T12:01:00.000Z')
    deps.client({ action: 'add', theme: family, text: 'We do the whole wedding party' }, '2026-10-18T12:02:00.000Z')
    await alice.run('offer_headlines', { options: ['Three generations on one corner', 'Cut by family since 1971'], pick: 0, from: [generations] })
    deps.client({ action: 'choose', option: 'Cut by family since 1971' }, '2026-10-18T12:03:00.000Z')

    const line = boardChangesLine(boardChangesSince(deps.stored().fields, since))!
    expect(line).toContain('Your client worked on the story board since your last turn (4 changes)')
    expect(line).toContain(`gave ${generations} "Three generations of one family cut hair here" ❤️`)
    expect(line).toContain('👎')
    expect(line).toContain('Ask about each 👎')
    expect(line).toContain('added')
    expect(line).toContain('"We do the whole wedding party" under Family')
    expect(line).toContain('chose the headline "Cut by family since 1971"')
    // A LATER CURSOR HEARS NOTHING AGAIN.
    expect(boardChangesSince(deps.stored().fields, '2026-10-18T12:03:00.000Z')).toEqual([])
  })

  it('test_UAT_FC_REQ-408_the_per_turn_plan_entry_reports_the_board_and_its_finish_line', async () => {
    expect(planReminder(seedPlan(SLUG))).toContain('Story board: empty. Pin the client\'s own sayings with pin_notes')
    const { deps } = await pinned()
    const reminder = planReminder(deps.stored())!
    expect(reminder).toContain('Story board: 4 notes in 2 themes (Family, The chair)')
    expect(reminder).toContain('For "Getting to know you" to finish: no reaction yet on Family, The chair; no note has a heart; no headline offered.')
  })

  it('test_UAT_FC_REQ-408_builders_are_briefed_with_the_chosen_headline_and_the_hearted_notes', async () => {
    const { deps, alice } = await pinned()
    expect(storyBrief(deps.stored().fields)).toBeNull()
    const generations = note(deps.stored(), 'Three generations').id
    deps.client({ action: 'react', note: generations, reaction: 'heart' })
    await alice.run('offer_headlines', { options: ['Three generations on one corner', 'Cut by family since 1971'], pick: 0, from: [generations] })
    deps.client({ action: 'choose', option: 'Three generations on one corner' })
    const brief = storyBrief(deps.stored().fields)!
    expect(brief).toContain('Headline (the client chose it; use it as written): "Three generations on one corner"')
    expect(brief).toContain('- Three generations of one family cut hair here')
    // ONLY THE HEARTED NOTES.
    expect(brief).not.toContain('cup of tea')
  })

  it('test_UAT_FC_REQ-408_the_consultants_priming_and_manual_describe_the_board_reactions_and_headline', async () => {
    const text = (variant: { text?: string[] }[]) => variant.map((p) => (p.text ?? []).join('\n')).join('\n')
    for (const variant of [priming.priming, priming.priming_without_corpus] as { text?: string[] }[][]) {
      const t = text(variant)
      expect(t).toContain('## The story board')
      expect(t).toContain('never add a claim, a fact or an adjective')
      expect(t).toContain('pin_notes')
      expect(t).toContain('Ask about every 👎')
      expect(t).toContain('offer_headlines')
      expect(t).toContain('Write the copy from the hearted notes and the chosen headline')
      expect(t).toContain('On the story board: every theme has at least one reaction, at least one note has')
      expect(t).toContain('weakest_point')
    }
    // THE MANUAL: the declaration's overview, its operations, and the grant.
    const decl = PLAN_DECLARATION as { overview: string; operations: { op: string }[]; groups: { group: string; operations: string[] }[] }
    expect(decl.overview).toContain("**The story board is the client's story in their own words.**")
    const group = decl.groups.find((g) => g.group === 'KeepStoryBoard')!
    expect(group.operations).toEqual(['pin_notes', 'reword_note', 'move_note', 'remove_note', 'set_theme', 'offer_headlines'])
    for (const op of group.operations) expect(decl.operations.some((o) => o.op === op)).toBe(true)
    expect(JSON.stringify(planInstanceConfig('consultant'))).toContain('KeepStoryBoard')
  })

  it('test_UAT_FC_REQ-408_weakest_point_falls_due_after_the_first_draft_and_when_publish_opens', () => {
    const drafted = builderSessionCompleted(seedPlan(SLUG), NOW)
    expect(drafted.fields.checks.find((c) => c.id === 'weakest_point')?.due?.trigger).toBe('first_pass_complete')
    expect(planReminder(drafted)).toContain('Due: ask the client "Honestly, the weakest part of the site right now is [weakest point]. Shall I [what you would do about it]?" (weakest_point)')
    const opened = publishOpened(seedPlan(SLUG), NOW)
    expect(opened.fields.checks.find((c) => c.id === 'weakest_point')?.due?.trigger).toBe('before_publish')
  })
})
