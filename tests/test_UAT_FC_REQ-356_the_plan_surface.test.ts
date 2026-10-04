import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import { PROJECT_CORPUS_TYPES } from '../tools/generate/src/cli/kb'

/**
 * REQ-356 — **the site plan, through the tools the consultant and the
 * coordinator hold.**
 *
 * WHAT IS REAL HERE. The Toolbox, the capability gate, the declaration, the plan
 * operations and the rules they enforce are production code, driven through
 * `box.run` — the call a model's tool use becomes. ONE double: the host's
 * storage port, kept in memory for the reason REQ-171's ledger cases give —
 * these cases assert what the SURFACE does with what the model sent. The real
 * store behind the port (one plan per site, compare-and-set, the log moving off
 * the chat ticket) is `test_UAT_FC_REQ-356_*` in the workers suite.
 */

const SLUG = 'studio'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req356-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** The port's contract, in memory: a missing plan is created, seeded, when opened. */
function memoryPlan(): PlanDeps & { stored: () => Plan | null } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => plan,
    now: () => '2026-10-01T12:00:00.000Z',
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
  toolNames: () => string[]
}

/** A Toolbox for `role`, holding the plan surface under that role's grant. */
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

describe('REQ-356 — each role holds its own part of the plan', () => {
  it('test_UAT_FC_REQ-356_the_consultant_proposes_and_the_coordinator_records', async () => {
    const alice = (await toolbox('consultant', memoryPlan())).toolNames()
    const bob = (await toolbox('coordinator', memoryPlan())).toolNames()

    // Both read the plan and keep the brief.
    for (const names of [alice, bob]) {
      expect(names).toEqual(expect.arrayContaining(['read_plan', 'update_brief', 'set_feature', 'add_note']))
    }
    // The consultant owns tasks, proposes decisions and answers checks…
    expect(alice).toEqual(expect.arrayContaining(['set_decision', 'set_task', 'answer_check']))
    expect(alice).not.toContain('record_client_answer')
    // [[REQ-379]] — the milestones are both roles': with the room off there is no
    // coordinator to raise a check or move the phase, so the consultant does.
    for (const names of [alice, bob]) {
      expect(names).toEqual(expect.arrayContaining(['ask_check', 'record_check_answer', 'set_phase']))
    }
    // …the coordinator records the client's answers, asks checks and tracks
    // progress, and has no way to propose or to answer in its own voice.
    expect(bob).toEqual(
      expect.arrayContaining(['record_client_answer', 'ask_check', 'record_check_answer', 'set_task_status', 'set_phase']),
    )
    expect(bob).not.toContain('set_decision')
    expect(bob).not.toContain('answer_check')
    expect(bob).not.toContain('set_task')
  })
})

describe('REQ-356 — the plan is in the project corpus, under its new name', () => {
  it('test_UAT_FC_REQ-356_the_corpus_indexes_plans_and_no_longer_names_brief', () => {
    // The plan's body — the client's own words and the decision log — is what a
    // search of the client's project should find.
    expect([...PROJECT_CORPUS_TYPES]).toContain('plan')
    expect([...PROJECT_CORPUS_TYPES]).not.toContain('brief')
  })
})

describe('REQ-356 — a new plan starts from the generic list', () => {
  it('test_UAT_FC_REQ-356_a_new_plan_holds_the_generic_decisions_and_checks', async () => {
    const deps = memoryPlan()
    const box = await toolbox('coordinator', deps)

    await box.run('update_brief', {
      business: 'A Bristol furniture restorer',
      site_job: 'Bring in restoration enquiries',
      quality_bar: 'premium',
      quote: 'I want people to see the craft before they see a price.',
    })

    const plan = deps.stored() as Plan
    expect(plan.fields).toMatchObject({ kind: 'site', site_key: SLUG })
    expect(plan.fields.phase).toBe('intake')
    // EVERY GENERIC DECISION, OPEN, and every standing check, unasked — from the
    // seed data, so the list can change without a code change.
    expect(plan.fields.decisions.map((d) => d.id)).toEqual(planSeed.decisions.map((d) => d.id))
    expect(new Set(plan.fields.decisions.map((d) => d.state))).toEqual(new Set(['open']))
    expect(plan.fields.checks.map((c) => c.id)).toEqual(planSeed.checks.map((c) => c.id))
    expect(plan.fields.checks.every((c) => !c.asked_at && c.answers.length === 0)).toBe(true)
    // The brief is structured AND the client's own words are kept verbatim.
    expect(plan.fields.brief).toMatchObject({ business: 'A Bristol furniture restorer', quality_bar: 'premium' })
    expect(plan.body).toMatch(/## Brief\n\n> I want people to see the craft before they see a price\./)
    expect(plan.body).toContain('## Decision log')
    expect(plan.body).toContain('## Notes')
  })
})

describe('REQ-356 — the coordinator has no opinion of the site', () => {
  it('test_UAT_FC_REQ-356_a_check_answer_by_anyone_but_alice_or_the_user_is_refused', async () => {
    const deps = memoryPlan()
    const bob = await toolbox('coordinator', deps)
    await bob.run('ask_check', { check: 'layout_happy' })
    const before = JSON.stringify(deps.stored())

    for (const by of ['bob', 'coordinator', '']) {
      const refused = await bob.run('record_check_answer', { check: 'layout_happy', by, verdict: 'no' })
      // Refused at the declaration's enum first; `checkPlan` refuses the same
      // answer again on the write path (the workers suite proves that wall alone).
      expect(refused).toMatch(/must be one of 'alice', 'user'|PLAN_INVALID/)
    }
    expect(JSON.stringify(deps.stored())).toBe(before)

    // The consultant and the client are both recorded, and the check stays open
    // until both have answered.
    await bob.run('record_check_answer', { check: 'layout_happy', by: 'user', verdict: 'not_sure', note: 'It feels busy.' })
    let panel = JSON.parse(unwrap(await bob.run('read_plan', {}))).panel
    expect(panel.open_checks.map((c: { id: string }) => c.id)).toContain('layout_happy')

    const alice = await toolbox('consultant', deps)
    await alice.run('answer_check', { check: 'layout_happy', verdict: 'no', note: 'Too many columns above the fold.' })
    const plan = deps.stored() as Plan
    const check = plan.fields.checks.find((c) => c.id === 'layout_happy')!
    expect(check.answers.map((a) => a.by).sort()).toEqual(['alice', 'user'])
    panel = JSON.parse(unwrap(await bob.run('read_plan', {}))).panel
    expect(panel.open_checks.map((c: { id: string }) => c.id)).not.toContain('layout_happy')
  })
})

describe('REQ-356 — only the client settles a decision', () => {
  it('test_UAT_FC_REQ-356_chosen_needs_the_clients_words_and_parked_needs_a_reason', async () => {
    const deps = memoryPlan()
    const bob = await toolbox('coordinator', deps)
    const alice = await toolbox('consultant', deps)

    // The consultant can default or propose, never settle.
    await alice.run('set_decision', { decision: 'typography', value: 'Georgia / Helvetica', state: 'defaulted' })
    expect(await alice.run('set_decision', { decision: 'typography', state: 'chosen' })).toMatch(
      /must be one of 'open', 'defaulted', 'proposed'|PLAN_INVALID/,
    )
    const defaulted = JSON.stringify(deps.stored())

    // Recording a client state with no client answer is refused, and so is
    // parking with no reason; neither leaves a trace.
    expect(await bob.run('record_client_answer', { decision: 'typography', state: 'chosen' })).toContain('PLAN_INVALID')
    expect(
      await bob.run('record_client_answer', { decision: 'voice', state: 'parked', quote: "Let's do the words later." }),
    ).toContain('PLAN_INVALID')
    expect(JSON.stringify(deps.stored())).toBe(defaulted)

    // With the client's words attached, both land — and each is logged in them.
    await bob.run('record_client_answer', {
      decision: 'typography',
      state: 'chosen',
      value: 'Cormorant / Inter',
      compared: true,
      quote: 'The second one. That looks expensive.',
    })
    await bob.run('record_client_answer', {
      decision: 'voice',
      state: 'parked',
      quote: "Let's do the words later.",
      parked_reason: 'Visuals first; the words are easy to change.',
    })
    const plan = deps.stored() as Plan
    const typography = plan.fields.decisions.find((d) => d.id === 'typography')!
    expect(typography).toMatchObject({ state: 'chosen', value: 'Cormorant / Inter', compared: true, log: 1 })
    expect(typography.answer?.quote).toBe('The second one. That looks expensive.')
    expect(plan.fields.decisions.find((d) => d.id === 'voice')).toMatchObject({ state: 'parked', log: 2 })
    expect(plan.body).toMatch(/### Decision 1\n\nTypography: Cormorant \/ Inter\.\n\n\*\*The client said:\*\* "The second one\./)
    expect(plan.body).toMatch(/### Decision 2\n\nVoice: parked — Visuals first/)
  })
})

describe('REQ-356 — the consultant owns the tasks', () => {
  it('test_UAT_FC_REQ-356_tasks_take_optional_dependencies_and_the_coordinator_tracks_progress', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    const bob = await toolbox('coordinator', deps)

    await alice.run('set_task', { title: 'Build the home page, rough', decisions: ['layout_system'] })
    await alice.run('set_task', { title: 'Build the other pages', depends_on: ['t1'] })
    // A dependency on a task that does not exist is refused.
    expect(await alice.run('set_task', { title: 'Publish', depends_on: ['t9'] })).toContain('PLAN_INVALID')

    let panel = JSON.parse(unwrap(await bob.run('read_plan', {}))).panel
    expect(panel.tasks).toMatchObject({ done: 0, total: 2, next: ['Build the home page, rough'] })

    await bob.run('set_task_status', { task: 't1', status: 'done' })
    await bob.run('set_phase', { phase: 'first_pass' })
    panel = JSON.parse(unwrap(await bob.run('read_plan', {}))).panel
    expect(panel).toMatchObject({ phase: 'first_pass', tasks: { done: 1, total: 2, next: ['Build the other pages'] } })
  })
})

describe('REQ-356 — the plan is put in front of the session', () => {
  it('test_UAT_FC_REQ-356_the_reminder_names_what_is_unsettled', async () => {
    expect(planReminder(null)).toBeNull()
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('update_brief', { business: 'A Bristol furniture restorer', quality_bar: 'premium' })
    await alice.run('set_decision', { decision: 'palette', value: 'Oxblood and bone', state: 'defaulted' })

    const text = planReminder(deps.stored()) as string
    expect(text).toContain('### The site plan')
    expect(text).toContain('Phase: intake.')
    expect(text).toContain('quality bar: premium')
    // A default is named as one, so it is not mistaken for a choice.
    expect(text).toMatch(/Defaulted, never really chosen: Palette\./)
    expect(text.length).toBeLessThanOrEqual(2_000)
  })
})
