import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import {
  clientAnswer,
  clientChangesLine,
  clientChangesSince,
  FEATURE_CATALOGUE,
  panelView,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'

/**
 * [[REQ-399]] — **the features question: functional capabilities only, tailored
 * and raised by the consultant.**
 *
 * WHAT IS REAL HERE: the seed, the Toolbox, the plan declaration and operations
 * driven through `box.run` (the call a model's tool use becomes), `checkPlan`,
 * `clientAnswer` (the panel route's one function) and `panelView` (what the panel
 * draws). One double: the host's storage port, in memory, as in REQ-364's suite.
 */

const SLUG = 'plumbing'
const AT = '2026-10-15T12:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req399-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan; client: (input: Parameters<typeof clientAnswer>[1]) => void } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => open(),
    client: (input) => {
      plan = clientAnswer(open(), input, AT)
    },
    now: () => '2026-10-15T11:00:00.000Z',
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
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, role), granted: planInstanceConfig(role) }] as never,
  }) as Promise<Box>
}

const features = (deps: { stored: () => Plan }) => deps.stored().fields.asks.find((a) => a.id === 'features')

describe('REQ-399 — the catalogue is functional capabilities, and a new plan does not ask', () => {
  it('test_UAT_FC_REQ-399_a_new_plan_has_no_features_ask_and_the_catalogue_is_capabilities_only', () => {
    const plan = seedPlan(SLUG)
    expect(plan.fields.asks.find((a) => a.id === 'features')).toBeUndefined()
    // The `features` decision still exists, to be settled from the answer.
    expect(plan.fields.decisions.find((d) => d.id === 'features')).toBeDefined()

    // ONE CAPABILITY PER ENTRY, each with an id, a label and whether it is built.
    expect(FEATURE_CATALOGUE.map((c) => c.id)).toEqual([
      'contact_message',
      'quote_request',
      'booking',
      'online_payment',
      'newsletter_signup',
      'blog',
      'notices',
    ])
    for (const c of FEATURE_CATALOGUE) {
      expect(typeof c.label).toBe('string')
      expect(typeof c.available).toBe('boolean')
    }
    // Only the contact form is built today.
    expect(FEATURE_CATALOGUE.filter((c) => c.available).map((c) => c.id)).toEqual(['contact_message'])

    // CONTENT SECTIONS AND CLICK-TO-CALL ARE GONE.
    const words = JSON.stringify(planSeed.feature_catalogue).toLowerCase()
    for (const removed of ['click-to-call', 'review', 'photos of past work', 'areas you cover', 'price', 'opening hours', 'frequently asked']) {
      expect(words).not.toContain(removed)
    }
  })
})

describe('REQ-399 — the consultant tailors the question from the fixed list', () => {
  it('test_UAT_FC_REQ-399_ask_features_accepts_a_subset_preticks_and_relabels', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    const out = await alice.run('ask_features', {
      capabilities: ['contact_message', 'booking', 'blog'],
      ticked: ['contact_message', 'booking'],
      labels: { booking: 'Patients can book an appointment' },
    })
    expect(out).not.toContain('PLAN_INVALID')
    expect(features(deps)).toMatchObject({
      input: 'multi_choice',
      status: 'open',
      options: ['contact_message', 'booking', 'blog'],
      labels: {
        contact_message: 'Visitors can send you a message',
        booking: 'Patients can book an appointment',
        blog: 'You publish articles over time (a blog)',
      },
      other: true,
      // PRE-TICKED IS A DRAFT THE CLIENT CAN UNTICK, not an answer.
      draft: ['contact_message', 'booking'],
    })
    expect(features(deps)!.answer).toBeUndefined()

    // Raised only once posted: the reminder stops prompting for it.
    expect(planReminder(deps.stored())).not.toContain('Not yet asked: what the site needs to do')
  })

  it('test_UAT_FC_REQ-399_ask_features_refuses_an_option_outside_the_catalogue', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    expect(await alice.run('ask_features', { capabilities: ['contact_message', 'customer_reviews'] })).toContain('PLAN_INVALID')
    expect(await alice.run('ask_features', { ticked: ['click_to_call'] })).toContain('PLAN_INVALID')
    expect(await alice.run('ask_features', { labels: { opening_hours: 'Our hours' } })).toContain('PLAN_INVALID')
    // Nor can the generic path post it with options of its own.
    expect(
      await alice.run('set_ask', { ask: 'features', prompt: 'Which?', why: 'x', input: 'multi_choice', options: ['Reviews', 'Hours'] }),
    ).toContain('PLAN_INVALID')
    expect(features(deps)).toBeUndefined()
  })

  it('test_UAT_FC_REQ-399_answers_are_stored_by_capability_id_whatever_the_wording', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    await alice.run('ask_features', { capabilities: ['contact_message', 'booking'], labels: { booking: 'Patients can book an appointment' } })

    deps.client({ ask: 'features', action: 'answer', answer: ['booking'], other: 'A members-only area' })
    const answered = features(deps)!
    expect(answered).toMatchObject({ status: 'answered', answered_by: 'client', answer: ['booking'], answer_other: 'A members-only area' })
    // THE RELABELLED OPTION MAPS BACK TO ITS CAPABILITY; the unavailable one is
    // recorded like any other answer. "Something else" fills no feature.
    expect(deps.stored().fields.functionality).toEqual([{ feature: 'booking', status: 'wanted' }])

    // The consultant hears both, in the next turn's notice.
    const line = clientChangesLine(clientChangesSince(deps.stored().fields, '2026-10-15T00:00:00.000Z'))!
    expect(line).toContain('answered features')
    expect(line).toContain('booking')
    expect(line).toContain('something else: "A members-only area"')

    // An answer the client gave is not overwritten by re-posting the question.
    expect(await alice.run('ask_features', {})).toContain('ASK_ANSWERED')
  })
})

describe('REQ-399 — the panel is honest about what is not built yet', () => {
  it('test_UAT_FC_REQ-399_the_panel_marks_unavailable_options_from_the_catalogue', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    // BEFORE IT IS RAISED, the consultant is told the catalogue and what is not built.
    const before = planReminder(deps.stored())!
    expect(before).toContain('Not yet asked: what the site needs to do')
    expect(before).toContain('contact_message, quote_request [not yet available]')

    await alice.run('ask_features', { capabilities: ['contact_message', 'quote_request', 'online_payment'] })
    const shown = panelView(deps.stored().fields).asks.find((a) => a.id === 'features')!
    expect(shown.unavailable).toEqual(['quote_request', 'online_payment'])
    expect(shown.other).toBe(true)
  })
})
