import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  agendaLines,
  builderSessionCompleted,
  MAX_UNREACTED_NOTES,
  owedPromises,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  talkerAgenda,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'
import { talkerDiscovery } from '../tools/generate/src/cli/ai/roles'

/**
 * [[REQ-428]] — **executive function**: the help the consultant needs in the middle
 * of a stage is a check it cannot read past, not advice. Here, the plan's half: the
 * story board refuses more notes than the client can react to, every voice reads one
 * agenda, and a request the client makes mid-build is a promise on the plan.
 *
 * THE REAL CONSULTANT TOOLBOX over the real plan surface, with the plan held in
 * memory — the store is the one thing replaced.
 */

const SLUG = 'welder'
let clock = '2026-10-22T10:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req428-'))
  cmdNew(SLUG, { cwd })
  clock = '2026-10-22T10:00:00.000Z'
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => open(),
    now: () => clock,
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

const sayings = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({
    text: `Saying ${from + i + 1}`,
    quote: `I always say saying ${from + i + 1}.`,
    emoji: '💬',
    theme: 'Craft',
  }))

describe('REQ-428 — executive function on the plan', () => {
  it('test_UAT_FC_REQ-428_more_unreacted_notes_than_the_cap_refuses_pin_notes_until_a_story_task_covers_them', async () => {
    const deps = memoryPlan()
    const alice = await consultant(deps)
    expect(MAX_UNREACTED_NOTES).toBe(8)
    expect(await alice.run('pin_notes', { notes: sayings(9) })).not.toMatch(/NOTES_UNREACTED|PLAN_INVALID/)

    // NINE WAITING: the tenth is refused, by name, saying what to do instead.
    const refused = await alice.run('pin_notes', { notes: sayings(1, 9) })
    expect(refused).toContain('NOTES_UNREACTED')
    expect(refused).toContain('start_focus with kind story')
    expect(deps.stored().fields.board!.notes.length).toBe(9)

    // A reaction task runs over them (it covers eight), the client walks away, and
    // pinning works again: one note is still new, under the cap.
    expect(await alice.run('start_focus', { kind: 'story', intro: 'React to what I pinned.' })).not.toMatch(/NOTHING_TO_FOCUS|PLAN_INVALID/)
    expect(await alice.run('end_focus', {})).not.toMatch(/NO_FOCUS/)
    expect(await alice.run('pin_notes', { notes: sayings(1, 9) })).not.toMatch(/NOTES_UNREACTED|PLAN_INVALID/)
    expect(deps.stored().fields.board!.notes.length).toBe(10)
  })

  it('test_UAT_FC_REQ-428_the_plan_entry_carries_the_open_decisions_and_due_lines_the_talker_reads_once', async () => {
    const deps = memoryPlan()
    const alice = await consultant(deps)
    await alice.run('pin_notes', { notes: sayings(2) })
    // The first pass is built: its check falls due.
    const plan = builderSessionCompleted(deps.stored(), '2026-10-22T11:00:00.000Z')

    const agenda = agendaLines(plan.fields)
    expect(agenda[0]).toMatch(/^Open decisions, most valuable first: Core story/)
    expect(agenda).toContain('Due: ask the client "Are we all happy with the layout?" (layout_happy) — the first pass is built.')
    expect(agenda.some((l) => l.startsWith('Due: ') && l.includes('2 new story notes waiting for a reaction task'))).toBe(true)

    // THE CONSULTANT'S PLAN ENTRY — what the worker, the talker and a plain turn
    // all read — carries every one of those lines, word for word.
    const entry = planReminder(plan)!
    for (const line of agenda) expect(entry).toContain(line)
    expect(entry).toContain('Record that you asked a due check with ask_check and their answer with record_check_answer.')

    // …and the talker's own notes say none of them again: one agenda, said once.
    const talker = talkerDiscovery(plan)
    for (const line of agenda) expect(talker).not.toContain(line)
  })

  it('test_UAT_FC_REQ-428_a_request_made_mid_build_is_a_promise_on_the_plan_until_started_or_explained', async () => {
    const deps = memoryPlan()
    const alice = await consultant(deps)
    const since = '2026-10-22T10:00:00.000Z'
    clock = '2026-10-22T10:05:00.000Z'
    expect(
      await alice.run('set_task', { task: 'buttons', title: 'Bigger buttons', client_asked: 'Can you make the buttons bigger?' }),
    ).not.toMatch(/PLAN_INVALID|UNKNOWN_TASK/)

    // A promise: the client's words, when, and next — in "Being built or next".
    const task = deps.stored().fields.tasks.find((t) => t.id === 'buttons')!
    expect(task).toMatchObject({ status: 'todo', asked: { quote: 'Can you make the buttons bigger?', at: '2026-10-22T10:05:00.000Z' } })
    expect(talkerAgenda(deps.stored().fields)[0]).toContain('Being built or next: Bigger buttons')
    // OWED to a hand-back from a build that began before it, not one after.
    expect(owedPromises(deps.stored().fields, since).map((t) => t.title)).toEqual(['Bigger buttons'])
    expect(owedPromises(deps.stored().fields, '2026-10-22T10:06:00.000Z')).toEqual([])

    // Explained to the client: no longer owed.
    await alice.run('set_task', { task: 'buttons', told_client: 'The buttons are next, straight after the header.' })
    expect(owedPromises(deps.stored().fields, since)).toEqual([])
    expect(deps.stored().fields.tasks.find((t) => t.id === 'buttons')!.told).toBe('The buttons are next, straight after the header.')

    // Started: not owed either.
    await alice.run('set_task', { task: 'shop', title: 'Shop page', client_asked: 'And a shop page?' })
    expect(owedPromises(deps.stored().fields, since).map((t) => t.id)).toEqual(['shop'])
    await alice.run('set_task', { task: 'shop', status: 'doing' })
    expect(owedPromises(deps.stored().fields, since)).toEqual([])
  })
})
