import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  NETWORK_DELEGATION_PATH,
  NETWORK_GROUP_CHAT_PATH,
  PLAN_ASK_PATH,
  PLAN_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { findPlan, sitePlan } from '../apps/control-app/src/plan'
import { PLAN_CHANGED, resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { planOperations, type PlanAsk, type PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import {
  calls,
  says,
  scriptedClient,
  sentText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-364]] — **the client answers the consultant's questions on the plan panel,
 * and the agent hears about it on its next turn.**
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/plan`, `/api/plan/ask`,
 * `/api/material`, `/api/ai/session`, `/api/ai/prompt` and the group-chat switch —
 * through the Worker's own `route`, against a real D1, the real ticket store the
 * plan lives in, and the real session machinery. The doubles are the Anthropic
 * client (the network) and the upload's describer and indexer (the same network,
 * reached through `RouterDeps`).
 */

const BUSINESS = 'req364-business'
const COORDINATOR_MODEL = (backendsDocument as Record<string, { model?: string }>).claude_coordinator
  .model as string

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

/** The describer and indexer an upload reaches, as BUG-41's suite stubs them. */
const deps: RouterDeps = {
  index: async () => async () => {},
  describeText: async () => ({ text: 'A business card: Charlie Plumbing, 07700 900123.', model: 'stub/digest-1' }),
}

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

async function storedAsks(site: string): Promise<Record<string, PlanAsk>> {
  const plan = await findPlan(await tickets(), site)
  const asks = ((plan?.fields ?? {}) as unknown as PlanFields).asks ?? []
  return Object.fromEntries(asks.map((a) => [a.id, a]))
}

/** A site, its plan, and an open one-to-one conversation about it. */
async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req364') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

/** The consultant's turn, scripted. Answers the frames streamed and the requests sent. */
async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
}

const CALLOUT = {
  ask: 'callout_fee',
  prompt: 'What do you charge to come out?',
  why: 'A published callout fee is the most reassuring fact a plumber can show.',
  input: 'currency',
}
const PHONE = { ask: 'phone', prompt: 'Your phone number?', why: 'Every visitor needs it.', input: 'phone', accepts_upload: true }
const TOWNS = {
  ask: 'towns',
  prompt: 'Which towns do you cover?',
  why: 'So people know you come to them.',
  input: 'multi_choice',
  options: ['Bristol', 'Bath', 'Keynsham'],
}
const LICENCE = { ask: 'licence', prompt: 'Your licence number?', why: 'Shown in the footer.', input: 'text', needed_by: 'prelaunch' }

beforeAll(async () => {
  await applySchema()
})

afterEach(async () => {
  setModelClient(null)
  await env.DB.prepare('DELETE FROM business_network_settings').run()
  resetAiHost()
  resetChatHost()
})

describe('REQ-364 — the client answers in the panel', () => {
  it('test_UAT_FC_REQ-364_the_client_answers_skips_changes_and_uploads_and_no_turn_starts', async () => {
    const { site: key } = await site()
    const plan = sitePlan(await tickets(), key)
    const agent = planOperations(plan)
    for (const a of [CALLOUT, PHONE, TOWNS, LICENCE]) await agent.set_ask(a)

    // THE MODEL IS WATCHING: anything the panel does that started a turn would be
    // a request here.
    const watching = scriptedClient([says('I should never have been asked.')])
    setModelClient(watching)

    // Answer.
    let res = await post(PLAN_ASK_PATH, { site: key, ask: 'callout_fee', action: 'answer', answer: '£60' })
    expect(res.status).toBe(200)
    // Change: answering again.
    res = await post(PLAN_ASK_PATH, { site: key, ask: 'callout_fee', action: 'answer', answer: '£65' })
    expect(res.status).toBe(200)
    // Pick several.
    res = await post(PLAN_ASK_PATH, { site: key, ask: 'towns', action: 'answer', answer: ['Bristol', 'Bath'] })
    expect(res.status).toBe(200)
    // Skip.
    res = await post(PLAN_ASK_PATH, { site: key, ask: 'licence', action: 'skip' })
    expect(res.status).toBe(200)
    // Upload against an ask: the material path first, then the answer citing it.
    const form = new FormData()
    form.append('file', new File(['Charlie Plumbing — 07700 900123'], 'card.txt', { type: 'text/plain' }))
    form.append('role', 'reference')
    const uploaded = await ask('/api/material', { method: 'POST', body: form })
    expect(uploaded.status).toBe(200)
    const material = ((await uploaded.json()) as { uid: string }).uid
    res = await post(PLAN_ASK_PATH, { site: key, ask: 'phone', action: 'answer', answer_material: material })
    expect(res.status).toBe(200)

    const asks = await storedAsks(key)
    expect(asks.callout_fee).toMatchObject({ status: 'answered', answer: '£65', previous_answer: '£60', answered_by: 'client' })
    expect(asks.towns).toMatchObject({ status: 'answered', answer: ['Bristol', 'Bath'] })
    expect(asks.licence).toMatchObject({ status: 'skipped', answered_by: 'client' })
    expect(asks.phone).toMatchObject({ status: 'answered', answer_material: material, answered_by: 'client' })
    // The upload is a Library item: a material ticket in this business's store.
    expect((await (await tickets()).get({ uid: material })).ticket.type).toBe('material')

    // The panel's read draws what was stored, in its order, and nothing more.
    const view = (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(key)}`)).json()) as {
      stages: { id: string; state: string }[]
      asks: PlanAsk[]
    }
    // [[REQ-390]] — the stages replace the phase: a new plan is getting to know you.
    expect(view.stages.find((s) => s.state === 'in_progress')?.id).toBe('getting_to_know_you')
    // [[REQ-379]] — a new plan starts with the features ask, first in its order.
    expect(view.asks.map((a) => a.id)).toEqual(['features', 'callout_fee', 'phone', 'towns', 'licence'])

    // NO TURN STARTED, AND NOTHING WAS SAID IN THE CONVERSATION.
    expect(watching.seen).toEqual([])
  })

  it('test_UAT_FC_REQ-364_an_answer_never_loses_a_concurrent_agent_write_and_stays_in_scope', async () => {
    const { site: key } = await site()
    const agent = planOperations(sitePlan(await tickets(), key))
    await agent.set_ask(CALLOUT)
    await agent.set_ask(PHONE)

    // THE AGENT REWORDS ONE ASK WHILE THE CLIENT ANSWERS ANOTHER. The agent's
    // write retries on CONFLICT as a model told so would; the route re-reads.
    const reword = async (): Promise<void> => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await agent.set_ask({ ask: 'phone', why: 'The one thing every visitor to a plumber needs.' })
          return
        } catch (err) {
          if ((err as { code?: string }).code !== 'CONFLICT') throw err
        }
      }
    }
    const [answered] = await Promise.all([
      post(PLAN_ASK_PATH, { site: key, ask: 'callout_fee', action: 'answer', answer: '£60' }),
      reword(),
    ])
    expect(answered.status).toBe(200)
    const asks = await storedAsks(key)
    expect(asks.callout_fee).toMatchObject({ status: 'answered', answer: '£60' })
    expect(asks.phone.why).toBe('The one thing every visitor to a plumber needs.')

    // Scoped: a site this business does not hold, an ask the plan does not have,
    // and a document from nowhere are each refused, and nothing is written.
    expect((await post(PLAN_ASK_PATH, { site: 'site-not-ours', ask: 'callout_fee', action: 'skip' })).status).toBe(404)
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'nope', action: 'skip' })).status).toBe(404)
    expect(
      (await post(PLAN_ASK_PATH, { site: key, ask: 'phone', action: 'answer', answer_material: 'material-nope' })).status,
    ).toBe(400)
    expect((await storedAsks(key)).phone.status).toBe('open')
  })
})

describe('REQ-364 — the consultant hears the answers on its next turn', () => {
  it('test_UAT_FC_REQ-364_with_the_group_chat_off_the_next_turn_names_the_clients_answers_and_not_its_own', async () => {
    const ctx = await site()
    // THE CONSULTANT PUTS QUESTIONS ON THE PANEL, AND THE PANEL IS TOLD MID-TURN.
    const first = await turn(ctx.sessionId, 'We are Charlie Plumbing.', [
      calls('set_ask', CALLOUT),
      calls('set_ask', LICENCE),
      calls('set_ask', PHONE),
      says('I have put a few questions on your panel.'),
    ])
    expect(first.frames.some((f) => f.kind === PLAN_CHANGED)).toBe(true)
    expect(first.seen[0].tools.map((t) => t.name)).toEqual(expect.arrayContaining(['set_ask', 'withdraw_ask', 'fill_ask']))
    // ITS PRIMING CARRIES THE PANEL RULES.
    const primed = sentText(first.seen[0])
    expect(primed).toMatch(/Put a question on the panel the moment you think of it/)
    expect(primed).toMatch(/one topic and at most one question per message/)
    expect(primed).toMatch(/Before you go away to work/)

    // The client answers one and skips another between turns; the consultant fills
    // the third from a document itself.
    expect((await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'callout_fee', action: 'answer', answer: '£60' })).status).toBe(200)
    expect((await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'licence', action: 'skip' })).status).toBe(200)

    const second = await turn(ctx.sessionId, 'Done some of those.', [
      calls('fill_ask', { ask: 'phone', material: 'material-card', answer: '07700 900123' }),
      says('Thanks.'),
    ])
    const told = turnTailText(second.seen[0])
    expect(told).toMatch(/Your client updated 2 questions on the plan panel since your last turn/)
    expect(told).toContain('answered callout_fee: "£60"')
    expect(told).toContain('skipped licence')

    // ITS OWN WRITES ARE NEVER REPORTED BACK, and what was reported is not repeated.
    const third = await turn(ctx.sessionId, 'Next?', [says('Next, the hero.')])
    const after = turnTailText(third.seen[0])
    expect(after).not.toContain('on the plan panel since your last turn')
    // The plan entry still shows the facts, the fill included.
    expect(after).toContain('phone = "07700 900123"')
  })

  it('test_UAT_FC_REQ-364_with_the_group_chat_on_both_members_keep_asks_and_each_hears_the_answers', async () => {
    expect((await post(NETWORK_DELEGATION_PATH, { enabled: false })).status).toBe(200)
    expect((await post(NETWORK_GROUP_CHAT_PATH, { enabled: true })).status).toBe(200)
    const { site: key } = await seedTenantSite(BUSINESS, { slug: nextSlug('room364') })
    const opened = (await (await post('/api/ai/session', { site: key })).json()) as { sessionId: string }

    const room = roomClient({
      consultant: [{ step: calls('set_ask', CALLOUT), then: { say: 'One question for you on the panel.' } }],
      coordinator: [{ step: calls('set_ask', TOWNS), then: { say: 'And one from me.' } }],
    })
    setModelClient(room)
    const exchange = await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hello both.' }))
    expect(exchange.some((f) => f.kind === PLAN_CHANGED)).toBe(true)
    const coordinatorTools = room.seen.find((req) => memberOf(req) === 'coordinator')!.tools.map((t) => t.name)
    expect(coordinatorTools).toEqual(expect.arrayContaining(['read_plan', 'set_ask', 'withdraw_ask', 'fill_ask']))
    expect(Object.keys(await storedAsks(key)).sort()).toEqual(['callout_fee', 'features', 'towns'])

    // The client answers on the panel — the same route, whichever path is on.
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'callout_fee', action: 'answer', answer: '£60' })).status).toBe(200)

    const next = roomClient({ consultant: [{ say: 'Noted the fee.' }], coordinator: [{ decline: true }] })
    setModelClient(next)
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Answered one.' }))
    for (const who of ['consultant', 'coordinator'] as const) {
      const req = next.seen.find((r) => memberOf(r) === who)!
      expect(turnTailText(req), who).toContain('answered callout_fee: "£60"')
    }
  })
})

// ── the room double (REQ-357's, trimmed to what these cases need) ────────────

const memberOf = (req: ModelRequest): 'consultant' | 'coordinator' =>
  req.model === COORDINATOR_MODEL ? 'coordinator' : 'consultant'

function afterTool(req: ModelRequest): boolean {
  const last = req.messages[req.messages.length - 1]
  return Array.isArray(last?.content) && (last.content as Array<{ type?: string }>).some((b) => b?.type === 'tool_result')
}

type Action = { say: string } | { decline: true } | { step: ModelStep; then?: Action }

function roomClient(script: { consultant: Action[]; coordinator: Action[] }): ScriptedClient {
  const seen: ModelRequest[] = []
  const pending: Record<string, Action | null> = { consultant: null, coordinator: null }
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const who = memberOf(req)
        const roomId = /You have a turn in room (\S+?)\./.exec(JSON.stringify(req.messages))?.[1]
        let action: Action | null
        if (!afterTool(req)) action = script[who].shift() ?? { decline: true }
        else {
          action = pending[who]
          pending[who] = null
        }
        let step: ModelStep
        if (action === null) step = says('Done.')
        else if ('step' in action) {
          step = action.step
          pending[who] = action.then ?? null
        } else if ('say' in action) step = calls('GroupSay', { group: roomId, text: action.say })
        else step = calls('GroupSay', { group: roomId, decline: true, text: 'Nothing from me.' })
        const events = step(req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}
