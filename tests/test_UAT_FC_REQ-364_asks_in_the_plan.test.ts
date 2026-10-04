import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  ASK_INPUTS,
  ASK_STATUSES,
  clientAnswer,
  clientChangesLine,
  clientChangesSince,
  panelView,
  PLAN_ANSWERS_BUDGET_CHARS,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'

/**
 * [[REQ-364]] — **the consultant's questions for the client, kept in the plan.**
 *
 * WHAT IS REAL HERE. The Toolbox, the capability gate, the plan declaration, the
 * plan operations and `checkPlan` are production code, driven through `box.run` —
 * the call a model's tool use becomes — and `clientAnswer`, the one function the
 * panel's route runs. ONE double: the host's storage port, in memory, for
 * REQ-356's reason; the real store, the route and compare-and-set are the workers
 * suite's (`test_UAT_FC_REQ-364_the_panel_answers.workers.test.ts`).
 */

const SLUG = 'plumbing'
const AT = '2026-10-02T12:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req364-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** REQ-356's port contract, in memory, with a hook to stand in for the client. */
function memoryPlan(): PlanDeps & { stored: () => Plan; client: (input: Parameters<typeof clientAnswer>[1], at?: string) => void } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => open(),
    client: (input, at = AT) => {
      plan = clientAnswer(open(), input, at)
    },
    now: () => '2026-10-02T11:00:00.000Z',
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
  manual: (opts: { level: string }) => string
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
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, role), granted: planInstanceConfig(role) }] as never,
  }) as Promise<Box>
}

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

const ask = (deps: { stored: () => Plan }, id: string) => deps.stored().fields.asks.find((a) => a.id === id)

describe('REQ-364 — asks are part of the plan, and the validator holds their shape', () => {
  it('test_UAT_FC_REQ-364_every_input_type_and_status_is_accepted_and_a_malformed_ask_is_refused', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)

    // EVERY INPUT TYPE, added by the agent.
    for (const input of ASK_INPUTS) {
      const choice = input === 'single_choice' || input === 'multi_choice'
      const out = await alice.run('set_ask', {
        ask: `q_${input}`,
        prompt: `A ${input} question?`,
        why: 'It goes on the site.',
        input,
        ...(choice ? { options: ['Yes', 'No', 'Sometimes'] } : {}),
        ...(input === 'upload' ? {} : { accepts_upload: input === 'text' }),
        needed_by: 'prelaunch',
      })
      expect(JSON.parse(unwrap(out)).ask).toMatchObject({ id: `q_${input}`, input, status: 'open', blocking: false })
    }
    // EVERY STATUS: answered (typed, picked, a document), skipped, withdrawn, open.
    deps.client({ ask: 'q_text', action: 'answer', answer: 'Charlie Plumbing' })
    deps.client({ ask: 'q_number', action: 'answer', answer: '12' })
    deps.client({ ask: 'q_single_choice', action: 'answer', answer: 'No' })
    deps.client({ ask: 'q_multi_choice', action: 'answer', answer: ['Yes', 'Sometimes'] })
    deps.client({ ask: 'q_upload', action: 'answer', answer_material: 'material-abc' })
    deps.client({ ask: 'q_phone', action: 'skip' })
    await alice.run('withdraw_ask', { ask: 'q_email', reason: 'He does not want an email address on the site.' })
    const statuses = new Set(deps.stored().fields.asks.map((a) => a.status))
    expect([...statuses].sort()).toEqual([...ASK_STATUSES].sort())

    // A MALFORMED ASK IS REFUSED, and the plan is exactly as it was.
    const before = JSON.stringify(deps.stored())
    expect(await alice.run('set_ask', { ask: 'bad', prompt: 'Which?', why: 'x', input: 'single_choice' })).toContain('PLAN_INVALID')
    expect(await alice.run('set_ask', { ask: 'bad', prompt: 'Which?', input: 'text' })).toContain('UNKNOWN_ASK')
    expect(await alice.run('set_ask', { ask: 'bad', prompt: 'Which?', why: 'x', input: 'colour' })).toMatch(/must be one of|SCHEMA_INVALID/)
    expect(await alice.run('withdraw_ask', { ask: 'q_url', reason: '   ' })).toContain('PLAN_INVALID')
    // …and so is an answer the ask cannot take.
    expect(() => deps.client({ ask: 'q_single_choice', action: 'answer', answer: 'Maybe' })).toThrow(/no option/)
    expect(() => deps.client({ ask: 'q_number', action: 'answer', answer: 'twelve' })).toThrow(/takes a number/)
    expect(() => deps.client({ ask: 'q_date', action: 'answer', answer_material: 'material-abc' })).toThrow(/does not take a document/)
    expect(JSON.stringify(deps.stored())).toBe(before)
  })
})

describe('REQ-364 — the agent owns the wording; the client owns the answer', () => {
  it('test_UAT_FC_REQ-364_an_agent_edit_to_the_wording_keeps_the_clients_answer', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('set_ask', { ask: 'callout_fee', prompt: 'What do you charge?', why: 'Reassuring.', input: 'currency' })
    deps.client({ ask: 'callout_fee', action: 'answer', answer: '£60' })

    await alice.run('set_ask', {
      ask: 'callout_fee',
      prompt: 'What do you charge to come out?',
      why: 'A published callout fee is the most reassuring fact a plumber can show.',
      blocking: true,
    })
    expect(ask(deps, 'callout_fee')).toMatchObject({
      prompt: 'What do you charge to come out?',
      blocking: true,
      status: 'answered',
      answer: '£60',
      answered_by: 'client',
    })
    // Filling from material never replaces it, and withdrawing never hides it.
    expect(await alice.run('fill_ask', { ask: 'callout_fee', material: 'material-x', answer: '£75' })).toContain('ASK_ANSWERED')
    expect(await alice.run('withdraw_ask', { ask: 'callout_fee', reason: 'not needed' })).toContain('ASK_ANSWERED')
    expect(ask(deps, 'callout_fee')?.answer).toBe('£60')
  })

  it('test_UAT_FC_REQ-364_a_document_answers_asks_as_the_agent_that_filled_them_and_the_client_can_change_them', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    const bob = await toolbox('coordinator', deps)
    await alice.run('set_ask', { ask: 'phone', prompt: 'Phone number?', why: 'The one thing every visitor needs.', input: 'phone', accepts_upload: true })
    await alice.run('set_ask', { ask: 'licence', prompt: 'Licence number?', why: 'Shown in the footer.', input: 'text', needed_by: 'prelaunch' })
    deps.client({ ask: 'licence', action: 'skip' })

    await alice.run('fill_ask', { ask: 'phone', material: 'material-card', answer: '07700 900123' })
    await bob.run('fill_ask', { ask: 'licence', material: 'material-card', answer: 'GS-44102' })
    expect(ask(deps, 'phone')).toMatchObject({ status: 'answered', answered_by: 'consultant', answer_material: 'material-card' })
    expect(ask(deps, 'licence')).toMatchObject({ status: 'answered', answered_by: 'coordinator', answer: 'GS-44102' })
    // The client sees those questions leave "needs your answer"… (the seeded
    // features ask, [[REQ-379]], is the only one still there)
    expect(panelView(deps.stored().fields).asks.filter((a) => a.status === 'open').map((a) => a.id)).toEqual(['features'])
    // …and can still change one.
    deps.client({ ask: 'phone', action: 'answer', answer: '07700 900124' })
    expect(ask(deps, 'phone')).toMatchObject({ answered_by: 'client', answer: '07700 900124', previous_answer: '07700 900123' })
  })
})

describe('REQ-364 — a withdrawn ask leaves the panel and keeps its reason', () => {
  it('test_UAT_FC_REQ-364_a_withdrawn_ask_keeps_its_reason_and_is_not_asked_again_by_accident', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('set_ask', { ask: 'email', prompt: 'Email address?', why: 'For the contact block.', input: 'email' })
    await alice.run('withdraw_ask', { ask: 'email', reason: 'Charlie does not want an email address on his site.' })

    expect(ask(deps, 'email')).toMatchObject({ status: 'withdrawn', withdrawn_reason: 'Charlie does not want an email address on his site.' })
    expect(panelView(deps.stored().fields).asks.map((a) => a.id)).not.toContain('email')
    expect(() => deps.client({ ask: 'email', action: 'answer', answer: 'c@example.com' })).toThrow(/no longer needed/)
    // A later turn re-adding it is refused, naming the reason, unless it says it means it.
    expect(await alice.run('set_ask', { ask: 'email', prompt: 'Email address?', why: 'x', input: 'email' })).toContain('ASK_WITHDRAWN')
    await alice.run('set_ask', { ask: 'email', reopen: true })
    expect(ask(deps, 'email')).toMatchObject({ status: 'open' })
    expect(ask(deps, 'email')?.withdrawn_reason).toBeUndefined()
  })
})

describe('REQ-364 — what the next turn is told', () => {
  it('test_UAT_FC_REQ-364_the_notice_names_the_clients_answers_and_never_the_agents_own_writes', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    for (const id of ['callout_fee', 'towns', 'licence', 'hours']) {
      await alice.run('set_ask', { ask: id, prompt: `${id}?`, why: 'It goes on the site.', input: 'text' })
    }
    deps.client({ ask: 'callout_fee', action: 'answer', answer: '£60' }, '2026-10-02T12:00:01.000Z')
    deps.client({ ask: 'licence', action: 'skip' }, '2026-10-02T12:00:02.000Z')
    deps.client({ ask: 'callout_fee', action: 'answer', answer: '£65' }, '2026-10-02T12:00:03.000Z')
    await alice.run('fill_ask', { ask: 'hours', material: 'material-flyer', answer: '8am–10pm' })
    await alice.run('set_ask', { ask: 'towns', why: 'So people know you come to them.' })

    const changes = clientChangesSince(deps.stored().fields, '')
    expect(changes.map((c) => c.id)).toEqual(['licence', 'callout_fee'])
    const line = clientChangesLine(changes)!
    expect(line).toContain('2 questions')
    expect(line).toContain('skipped licence')
    expect(line).toContain('changed callout_fee from "£60" to "£65"')
    expect(line).not.toContain('hours')
    expect(line).not.toContain('towns')
    // Nothing new since the last answer is no notice at all.
    expect(clientChangesLine(clientChangesSince(deps.stored().fields, '2026-10-02T12:00:03.000Z'))).toBeNull()
  })

  it('test_UAT_FC_REQ-364_the_notice_stays_within_its_budget_truncating_values_and_always_counting', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `fact_${i}`,
      status: 'answered',
      answer: `${'a very long answer that goes on and on '.repeat(6)}${i}`,
      at: `2026-10-02T12:00:${String(i).padStart(2, '0')}.000Z`,
    }))
    const line = clientChangesLine(many)!
    expect(line.length).toBeLessThanOrEqual(PLAN_ANSWERS_BUDGET_CHARS)
    expect(line).toContain('40 questions')
    expect(line).toContain('read_plan')
    // A few long answers are cut, not dropped.
    const three = clientChangesLine(many.slice(0, 3))!
    expect(three.length).toBeLessThanOrEqual(PLAN_ANSWERS_BUDGET_CHARS)
    for (const id of ['fact_0', 'fact_1', 'fact_2']) expect(three).toContain(id)
    expect(three).toContain('…')
  })

  it('test_UAT_FC_REQ-364_the_per_turn_plan_entry_names_open_and_answered_asks', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('set_ask', { ask: 'towns', prompt: 'Which towns?', why: 'x', input: 'text', blocking: true })
    await alice.run('set_ask', { ask: 'callout_fee', prompt: 'Fee?', why: 'x', input: 'currency' })
    deps.client({ ask: 'callout_fee', action: 'answer', answer: '£60' })
    const reminder = planReminder(deps.stored())!
    // [[REQ-379]] — the seeded features ask waits alongside, after the blocking one.
    expect(reminder).toMatch(/Waiting for the client on the panel \(2\): towns \(blocking\); features/)
    expect(reminder).toContain('callout_fee = "£60"')
  })
})

describe('REQ-364 — both roles keep asks, and the manual says how', () => {
  it('test_UAT_FC_REQ-364_both_roles_hold_the_ask_operations_and_the_manual_lists_them', async () => {
    for (const role of ['consultant', 'coordinator'] as const) {
      const box = await toolbox(role, memoryPlan())
      expect(box.toolNames()).toEqual(expect.arrayContaining(['set_ask', 'withdraw_ask', 'fill_ask']))
      const manual = String(box.manual({ level: 'summary' }))
      for (const op of ['set_ask', 'withdraw_ask', 'fill_ask']) expect(manual).toContain(op)
      // OPERATION TEXT NAMES ROLES, never the agents' code names.
      expect(manual).not.toMatch(/\bAlice\b|\bBob\b/)
    }
  })
})
