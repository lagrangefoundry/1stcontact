import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  clientAnswer,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  STAGE_IDS,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'
import planSurface from '../tools/generate/src/cli/ai/plan-surface.json'

/**
 * [[REQ-390]] — **the build's stages, ticked off by the consultant, and the
 * multi-line answer**, through the tools the consultant holds.
 *
 * WHAT IS REAL HERE: the Toolbox, the capability gate, the plan declaration, the
 * plan operations and their rules, driven through `box.run` — the call a model's
 * tool use becomes. One double, the host's storage port, in memory, for the reason
 * REQ-356's surface suite gives. The stored half (a legacy plan migrated on read)
 * is the workers suite beside this one.
 */

const SLUG = 'plumbing'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req390-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan | null } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => plan,
    now: () => '2026-10-04T12:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

async function toolbox(role: PlanRole, deps: PlanDeps): Promise<Box> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps), granted: planInstanceConfig(role) }] as never,
  }) as Promise<Box>
}

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

/** The stages as `read_plan`'s panel projects them: `[label, state]`. */
async function stages(box: Box): Promise<[string, string][]> {
  const panel = JSON.parse(unwrap(await box.run('read_plan', {}))).panel
  return panel.stages.map((s: { label: string; state: string }) => [s.label, s.state])
}

const OPERATOR_LIST = [
  'Getting to know you',
  'Looking at other sites',
  'First draft',
  'Refining',
  'Colours & fonts',
  'Finishing touches',
  'Ready to publish',
]

describe('REQ-390 — the consultant ticks off the stages', () => {
  it('test_UAT_FC_REQ-390_stages_are_ticked_reopened_and_set_in_any_order', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)

    // THE OPERATOR-APPROVED LIST, in order: a new plan starts at the first.
    expect(await stages(alice)).toEqual(
      OPERATOR_LIST.map((label, i) => [label, i === 0 ? 'in_progress' : 'not_started']),
    )

    // THE TOOL OFFERS EXACTLY THE SEED'S STAGES, so the two lists cannot drift.
    const op = planSurface.operations.find((o) => o.op === 'set_stage') as { params: { stage: { enum: string[] } } }
    expect(op.params.stage.enum).toEqual([...STAGE_IDS])

    // TICKED: done.
    await alice.run('set_stage', { stage: 'getting_to_know_you', state: 'done' })
    // OUT OF ORDER: Colours & fonts started before Looking at other sites — fine.
    const started = JSON.parse(unwrap(await alice.run('set_stage', { stage: 'colours_and_fonts', state: 'in_progress' })))
    expect(started.stage).toMatchObject({ id: 'colours_and_fonts', state: 'in_progress', label: 'Colours & fonts' })
    // STARTING A STAGE MOVES THE MARKER: the first draft, started next, takes it.
    const moved = JSON.parse(unwrap(await alice.run('set_stage', { stage: 'first_draft', state: 'in_progress' })))
    expect(moved.moved_from).toBe('colours_and_fonts')
    expect(await stages(alice)).toEqual([
      ['Getting to know you', 'done'],
      ['Looking at other sites', 'not_started'],
      ['First draft', 'in_progress'],
      ['Refining', 'not_started'],
      ['Colours & fonts', 'not_started'],
      ['Finishing touches', 'not_started'],
      ['Ready to publish', 'not_started'],
    ])

    // BACKWARDS: a done stage reopened is in progress again, and un-ticked.
    await alice.run('set_stage', { stage: 'first_draft', state: 'done' })
    await alice.run('set_stage', { stage: 'getting_to_know_you', state: 'in_progress' })
    const now = await stages(alice)
    expect(now[0]).toEqual(['Getting to know you', 'in_progress'])
    expect(now[2]).toEqual(['First draft', 'done'])
    expect(now.filter(([, state]) => state === 'in_progress')).toHaveLength(1)

    // AN UNKNOWN STAGE IS REFUSED, and the plan is left as it was.
    const before = JSON.stringify(deps.stored())
    expect(await alice.run('set_stage', { stage: 'go_live', state: 'done' })).toMatch(/^Error: .*go_live/)
    expect(JSON.stringify(deps.stored())).toBe(before)
  })

  it('test_UAT_FC_REQ-390_the_digest_names_the_stages_and_says_when_they_are_behind_the_build', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('read_plan', {})
    expect(planReminder(deps.stored())).toContain(
      'Stages — in progress: Getting to know you (getting_to_know_you); done: none.',
    )

    // PAGES HAVE BEEN BUILT while "Getting to know you" is still the only stage
    // started: the digest says so, as a fact, and names the operation.
    const built = deps.stored()!
    built.fields.milestones = { first_pass_at: '2026-10-04T12:30:00.000Z' }
    expect(planReminder(built)).toContain(
      'The stages are behind the build: pages have been built, but "Getting to know you" is still the stage in progress. Tick the stages that are done and start "First draft" (first_draft) with set_stage.',
    )

    // ONCE A STAGE THAT FAR ALONG IS TOUCHED, it is not behind — even out of order.
    await deps.write((p) => ({ ...p, fields: { ...p.fields, milestones: built.fields.milestones } }))
    await alice.run('set_stage', { stage: 'refining', state: 'in_progress' })
    expect(planReminder(deps.stored())).not.toContain('behind the build')
  })
})

describe('REQ-390 — a multi-line answer', () => {
  it('test_UAT_FC_REQ-390_a_long_text_ask_takes_several_lines', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    const added = await alice.run('set_ask', {
      ask: 'story',
      prompt: 'How did the business start?',
      why: 'It becomes your About page.',
      input: 'long_text',
    })
    expect(added).not.toMatch(/INVALID/)
    // THE CLIENT'S ANSWER, through the write `/api/plan/ask` makes: several lines kept.
    const answer = 'My dad started it in 1987.\nI took over in 2010.\n- Gas Safe\n- Family run'
    const answered = clientAnswer(deps.stored()!, { ask: 'story', action: 'answer', answer }, '2026-10-04T13:00:00.000Z')
    const story = answered.fields.asks.find((a) => a.id === 'story')!
    expect(story).toMatchObject({ input: 'long_text', status: 'answered', answer })
  })
})
