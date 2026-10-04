import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_ASK_PATH, PLAN_PATH, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { findPlan, sitePlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { FEATURE_CATALOGUE, planOperations, type PlanAsk, type PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import {
  calls,
  says,
  scriptedClient,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-379]] — **the consultant keeps the client oriented**: it says before it
 * goes quiet, points at the panel while quiet, and the milestones of a build fall
 * due as facts in its per-turn plan entry.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/ai/session`,
 * `/api/ai/prompt`, `/api/publish`, `/api/plan`, `/api/plan/ask` — through the
 * Worker's own `route`, against a real D1, the real ticket store the plan lives
 * in, the real session machinery and the real delegation surface on both sides of
 * the hand-off. The one double is the Anthropic client, which is the network.
 */

const BUSINESS = 'req379-business'
const WORKER_MODEL = backendsDocument.claude_builder.model
const ENABLED = { ...delegationDocument, enabled: true }

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scope: Scope = { businessId: BUSINESS }
const deps: RouterDeps = {}

const ask = (path: string, init: RequestInit = {}): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, init),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

async function storedPlan(site: string): Promise<PlanFields> {
  return ((await findPlan(await tickets(), site))?.fields ?? {}) as unknown as PlanFields
}

/** A site, its plan, and an open one-to-one conversation about it. */
async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req379') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

/** One double, two conversations, told apart by the model they are addressed to. */
function twoSided(caller: ModelStep[], builder: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

/** A turn, scripted on both sides. Answers the frames streamed and the requests sent. */
async function turn(sessionId: string, text: string, client: ScriptedClient): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
}

const NOTE = 'Building your home page now — it takes about ten minutes.'
const REWRITE = {
  page: 'home',
  path: '0.0',
  node: { kind: 'text', text: 'Built for the trades', axes: { fontSizePx: 56 } },
}
/** A builder that writes the site and reports. */
const BUILDS: ModelStep[] = [
  calls('set_l1', REWRITE),
  calls('ReportResult', { summary: 'Built the home page.', changed: ['home'] }),
  says('Reported.'),
]

const CALLOUT = { ask: 'callout_fee', prompt: 'What do you charge to come out?', why: 'Reassuring.', input: 'currency' }
const PHONE = { ask: 'phone', prompt: 'Your phone number?', why: 'Every visitor needs it.', input: 'phone' }

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-379 — the consultant says so before it goes quiet', () => {
  it('test_UAT_FC_REQ-379_a_delegate_call_shows_its_note_and_the_panel_count_before_the_builder_session_completes', async () => {
    configureDelegation(ENABLED)
    const { site: key, sessionId } = await site()
    const plan = planOperations(sitePlan(await tickets(), key))
    await plan.set_ask(CALLOUT)
    await plan.set_ask(PHONE)

    const client = twoSided(
      [
        calls('Delegate', { role: BUILDER_ROLE, goal: 'Build the home page.', note: NOTE }),
        calls('Delegate', { role: BUILDER_ROLE, goal: 'Tidy the footer.', note: 'Tidying the footer.' }),
        says('The home page is built.'),
      ],
      BUILDS,
    )
    const out = await turn(sessionId, 'Build my site.', client)

    // THE DECLARATION ASKS FOR THE NOTE, AS REQUIRED.
    const delegate = out.seen[0].tools.find((t) => t.name === 'Delegate')!
    expect((delegate.input_schema as { required?: string[] }).required).toContain('note')

    // ONE STATUS LINE, ahead of the hand-off it announces, carrying the
    // consultant's words and the panel's count: three open asks — the two added
    // here and the features ask every new plan starts with.
    const said = out.frames.filter((f) => f.kind === 'text').map((f) => f.content)
    const line = said.find((t) => t.includes(NOTE))
    expect(line).toBeDefined()
    expect(line).toContain('Meanwhile, 3 questions above need you.')
    const lineAt = out.frames.findIndex((f) => f.kind === 'text' && f.content.includes(NOTE))
    const handOffAt = out.frames.findIndex((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')
    expect(handOffAt).toBeGreaterThan(-1)
    expect(lineAt).toBeLessThan(handOffAt)
    // ONCE A TURN: the second hand-off in the same turn is not announced again.
    expect(said.join('')).not.toContain('Tidying the footer.')

    // AND IT IS THE ASSISTANT'S OWN WORDS IN THE TRANSCRIPT: the consultant's next
    // request carries it back as what it said.
    const callerRequests = out.seen.filter((req) => req.model !== WORKER_MODEL)
    const assistantSaid = JSON.stringify(callerRequests.at(-1)!.messages.filter((m) => m.role === 'assistant'))
    expect(assistantSaid).toContain(NOTE)
  })

  it('test_UAT_FC_REQ-379_with_no_open_asks_the_line_says_only_what_is_being_built', async () => {
    configureDelegation(ENABLED)
    const { site: key, sessionId } = await site()
    const plan = planOperations(sitePlan(await tickets(), key))
    await plan.withdraw_ask({ ask: 'features', reason: 'They told me in the chat.' })
    const out = await turn(
      sessionId,
      'Build it.',
      twoSided([calls('Delegate', { role: BUILDER_ROLE, goal: 'Build the home page.', note: NOTE }), says('Built.')], BUILDS),
    )
    const said = out.frames.filter((f) => f.kind === 'text').map((f) => f.content).join('')
    expect(said).toContain(NOTE)
    expect(said).not.toContain('Meanwhile')
  })
})

describe('REQ-379 — milestones fall due as facts', () => {
  it('test_UAT_FC_REQ-379_a_completed_first_builder_session_makes_layout_happy_due_and_flags_the_stale_phase_until_the_consultant_acts', async () => {
    configureDelegation(ENABLED)
    const { site: key, sessionId } = await site()
    await turn(
      sessionId,
      'Build my site.',
      twoSided([calls('Delegate', { role: BUILDER_ROLE, goal: 'Build the home page.', note: NOTE }), says('Built.')], BUILDS),
    )

    const stored = await storedPlan(key)
    expect(stored.milestones?.first_pass_at).toBeTruthy()
    expect(stored.phase).toBe('intake')
    expect(stored.checks.find((c) => c.id === 'layout_happy')?.due?.trigger).toBe('first_pass_complete')

    // THE NEXT TURN IS TOLD, AS FACTS: the milestone is due and the phase is behind.
    const next = await turn(
      sessionId,
      'What do you think?',
      scriptedClient([
        calls('ask_check', { check: 'layout_happy' }),
        calls('record_check_answer', { check: 'layout_happy', by: 'user', verdict: 'yes', note: 'Looks right to me.' }),
        calls('set_phase', { phase: 'first_pass' }),
        says('Noted.'),
      ]),
    )
    const tail = turnTailText(next.seen[0])
    expect(tail).toContain('Due: ask the client "Are we all happy with the layout?" (layout_happy) — the first pass is built.')
    expect(tail).toContain('The phase is behind the build: it still says intake, but pages have been built. Move it on to first_pass with set_phase.')

    // THE CONSULTANT CAN ACT ON BOTH, and what it records is in the plan's checks.
    const after = await storedPlan(key)
    const layout = after.checks.find((c) => c.id === 'layout_happy')!
    expect(layout.due).toBeUndefined()
    expect(layout.asked_at).toBeTruthy()
    expect(layout.answers).toEqual([{ by: 'user', verdict: 'yes', note: 'Looks right to me.' }])
    expect(after.phase).toBe('first_pass')

    const third = await turn(sessionId, 'Thanks.', scriptedClient([says('Any time.')]))
    const quiet = turnTailText(third.seen[0])
    expect(quiet).not.toContain('Are we all happy with the layout?" (layout_happy)')
    expect(quiet).not.toContain('The phase is behind the build')
  })

  it('test_UAT_FC_REQ-379_a_later_builder_session_is_a_revision_round_and_layout_happy_falls_due_again', async () => {
    configureDelegation(ENABLED)
    const { site: key, sessionId } = await site()
    // Each session writes something new, so each is a session that wrote the site.
    const build = (text: string): ScriptedClient =>
      twoSided(
        [calls('Delegate', { role: BUILDER_ROLE, goal: 'Change the page.', note: NOTE }), says('Done.')],
        [
          calls('set_l1', { ...REWRITE, node: { ...REWRITE.node, text } }),
          calls('ReportResult', { summary: 'Changed the headline.', changed: ['home'] }),
          says('Reported.'),
        ],
      )
    await turn(sessionId, 'Build it.', build('Built for the trades'))
    await planOperations(sitePlan(await tickets(), key)).answer_check({ check: 'layout_happy', verdict: 'yes' })
    expect((await storedPlan(key)).checks.find((c) => c.id === 'layout_happy')?.due).toBeUndefined()

    await turn(sessionId, 'Change the headline.', build('Plumbing you can trust'))
    const stored = await storedPlan(key)
    expect(stored.milestones?.revision_rounds).toBe(1)
    expect(stored.checks.find((c) => c.id === 'layout_happy')?.due?.trigger).toBe('revision_round_finished')
  })

  it('test_UAT_FC_REQ-379_a_builder_session_that_wrote_nothing_is_not_a_milestone', async () => {
    configureDelegation(ENABLED)
    const { site: key, sessionId } = await site()
    await turn(
      sessionId,
      'Have a look.',
      twoSided(
        [calls('Delegate', { role: BUILDER_ROLE, goal: 'Look at the page.', note: 'Having a look.' }), says('Looked.')],
        [calls('ReportResult', { summary: 'Nothing to change.', changed: [] }), says('Reported.')],
      ),
    )
    const stored = await storedPlan(key)
    expect(stored.milestones?.first_pass_at).toBeUndefined()
    expect(stored.checks.some((c) => c.due)).toBe(false)
  })

  it('test_UAT_FC_REQ-379_opening_publish_makes_the_pre_publish_checks_due', async () => {
    const { site: key, sessionId } = await site()
    // Whatever the publish itself then answers, opening it is the milestone.
    await post('/api/publish', { site: key })
    const stored = await storedPlan(key)
    expect(stored.milestones?.publish_opened_at).toBeTruthy()
    const due = stored.checks.filter((c) => c.due?.trigger === 'before_publish').map((c) => c.id).sort()
    expect(due).toEqual(['quality_bar_met', 'ready_to_publish', 'scroll_feel', 'seen_on_phone'])

    const next = await turn(sessionId, 'Is it ready?', scriptedClient([says('Nearly.')]))
    const tail = turnTailText(next.seen[0])
    expect(tail).toContain('Due: ask the client "Have we looked at it on a phone?" (seen_on_phone) — Publish has been opened.')
    expect(tail).toContain('Move it on to prelaunch with set_phase.')
  })
})

describe('REQ-379 — features are captured first', () => {
  it('test_UAT_FC_REQ-379_a_new_plan_carries_the_features_ask_and_answering_it_fills_functionality', async () => {
    const { site: key } = await site()
    const view = (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(key)}`)).json()) as { asks: PlanAsk[] }
    const features = view.asks.find((a) => a.id === 'features')!
    expect(features).toMatchObject({
      prompt: 'Which of these does your site need?',
      input: 'multi_choice',
      status: 'open',
      options: [...FEATURE_CATALOGUE],
    })

    const picked = [FEATURE_CATALOGUE[0], FEATURE_CATALOGUE[1]]
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'features', action: 'answer', answer: picked })).status).toBe(200)
    expect((await storedPlan(key)).functionality).toEqual(picked.map((feature) => ({ feature, status: 'wanted' })))

    // CHANGING THE ANSWER MOVES THE LIST WITH IT.
    await post(PLAN_ASK_PATH, { site: key, ask: 'features', action: 'answer', answer: [FEATURE_CATALOGUE[1]] })
    expect((await storedPlan(key)).functionality).toEqual([
      { feature: FEATURE_CATALOGUE[0], status: 'not_wanted' },
      { feature: FEATURE_CATALOGUE[1], status: 'wanted' },
    ])
  })
})
