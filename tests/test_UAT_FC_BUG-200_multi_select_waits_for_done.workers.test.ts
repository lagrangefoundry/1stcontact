import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
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
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { planOperations, type PlanAsk, type PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import {
  calls,
  says,
  scriptedClient,
  turnTailText,
  type ModelRequest,
  type ModelStep,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-200]] — **a multi-select is finished with Done, not on the first tick.** The
 * ticks before Done are a draft: the question stays open, the client's count still
 * includes it, and the consultant hears nothing until Done answers with them all.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/plan`, `/api/plan/ask`,
 * `/api/material`, `/api/ai/session`, `/api/ai/prompt` and the group-chat switch —
 * through the Worker's own `route`, against a real D1, the real ticket store the
 * plan lives in, and the real session machinery. The doubles are the Anthropic
 * client (the network) and the upload's describer and indexer (the same network,
 * reached through `RouterDeps`).
 */

const BUSINESS = 'bug200-business'

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
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug200') })
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

const TOWNS = {
  ask: 'towns',
  prompt: 'Which towns do you cover?',
  why: 'So people know you come to them.',
  input: 'multi_choice',
  options: ['Bristol', 'Bath', 'Keynsham'],
}
const KIND = {
  ask: 'kind',
  prompt: 'Independent or franchise?',
  why: 'It changes how we introduce you.',
  input: 'single_choice',
  options: ['Independent', 'Franchise'],
}

type View = { asks: PlanAsk[] }
const view = async (key: string): Promise<View> =>
  (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(key)}`)).json()) as View
const openIds = (v: View): string[] => v.asks.filter((a) => a.status === 'open').map((a) => a.id)

beforeAll(async () => {
  await applySchema()
})

afterEach(async () => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-200 — a multi-select is a draft until Done', () => {
  it('test_UAT_FC_BUG-200_ticks_are_a_draft_that_leaves_the_ask_open_and_tells_the_consultant_nothing', async () => {
    const ctx = await site()
    await turn(ctx.sessionId, 'We are Charlie Plumbing.', [calls('set_ask', TOWNS), says('A question on your panel.')])

    // Two ticks, then one taken back: three drafts, as the panel sends them.
    for (const picked of [['Bristol'], ['Bristol', 'Bath'], ['Bath']]) {
      expect((await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'towns', action: 'draft', answer: picked })).status).toBe(200)
    }
    const stored = (await storedAsks(ctx.site)).towns
    expect(stored.status).toBe('open')
    expect(stored.draft).toEqual(['Bath'])
    expect(stored.answer).toBeUndefined()
    expect(stored.answered_by).toBeUndefined()
    // THE PANEL'S READ CARRIES THE DRAFT, so a reload draws the ticks; it is still open.
    const drawn = await view(ctx.site)
    expect(openIds(drawn)).toContain('towns')
    expect(drawn.asks.find((a) => a.id === 'towns')?.draft).toEqual(['Bath'])

    // NOTHING IS REPORTED FOR A DRAFT.
    const quiet = await turn(ctx.sessionId, 'Still thinking.', [says('No rush.')])
    expect(turnTailText(quiet.seen[0])).not.toContain('on the plan panel since your last turn')

    // Done: one answer with every tick, the draft gone, and the consultant told once.
    expect((await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'towns', action: 'answer', answer: ['Bath', 'Keynsham'] })).status).toBe(200)
    const done = (await storedAsks(ctx.site)).towns
    expect(done).toMatchObject({ status: 'answered', answer: ['Bath', 'Keynsham'], answered_by: 'client' })
    expect(done.draft).toBeUndefined()
    expect(openIds(await view(ctx.site))).not.toContain('towns')
    const told = turnTailText((await turn(ctx.sessionId, 'Done that.', [says('Thanks.')])).seen[0])
    expect(told).toMatch(/Your client updated 1 question on the plan panel since your last turn/)
    expect(told).toContain('answered towns: "Bath, Keynsham"')
  })

  it('test_UAT_FC_BUG-200_none_of_these_answers_with_nothing_picked', async () => {
    const ctx = await site()
    await turn(ctx.sessionId, 'Hello.', [calls('set_ask', TOWNS), says('A question on your panel.')])
    expect((await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'towns', action: 'answer', answer: [] })).status).toBe(200)
    expect((await storedAsks(ctx.site)).towns).toMatchObject({ status: 'answered', answer: [], answered_by: 'client' })
    const told = turnTailText((await turn(ctx.sessionId, 'None.', [says('Noted.')])).seen[0])
    expect(told).toContain('answered towns: "none of these"')
  })

  it('test_UAT_FC_BUG-200_drafting_an_answered_multi_select_keeps_its_answer_until_done', async () => {
    const { site: key } = await site()
    await planOperations(sitePlan(await tickets(), key)).set_ask(TOWNS)
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'towns', action: 'answer', answer: ['Bristol'] })).status).toBe(200)
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'towns', action: 'draft', answer: ['Bristol', 'Bath'] })).status).toBe(200)
    // Reopened to change: the answer still stands, and the new ticks are kept beside it.
    expect((await storedAsks(key)).towns).toMatchObject({ status: 'answered', answer: ['Bristol'], draft: ['Bristol', 'Bath'] })
  })

  it('test_UAT_FC_BUG-200_only_a_multi_select_takes_a_draft_and_only_of_its_own_options', async () => {
    const { site: key } = await site()
    const agent = planOperations(sitePlan(await tickets(), key))
    await agent.set_ask(TOWNS)
    await agent.set_ask(KIND)
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'kind', action: 'draft', answer: ['Franchise'] })).status).toBe(400)
    expect((await post(PLAN_ASK_PATH, { site: key, ask: 'towns', action: 'draft', answer: ['Swindon'] })).status).toBe(400)
    const asks = await storedAsks(key)
    expect(asks.kind.draft).toBeUndefined()
    expect(asks.towns.draft).toBeUndefined()
  })
})
