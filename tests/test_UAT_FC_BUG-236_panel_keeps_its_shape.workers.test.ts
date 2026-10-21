import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
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
import {
  planOperations,
  type PlanAsk,
  type PlanFields,
} from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, scriptedClient, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-236]] — **the host half: a question on the client's panel keeps its form,
 * and "I've finished commenting" reaches the consultant.**
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/plan`, `/api/plan/comp`,
 * `/api/ai/session`, `/api/ai/prompt` — through the Worker's own `route`, against a
 * real D1 and the real ticket store the plan lives in. The double is the Anthropic
 * client (the network).
 */

const BUSINESS = 'bug236-business'

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
const deps: RouterDeps = { index: async () => async () => {} }

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

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

async function storedAsks(site: string): Promise<Record<string, PlanAsk>> {
  const plan = await findPlan(await tickets(), site)
  const asks = ((plan?.fields ?? {}) as unknown as PlanFields).asks ?? []
  return Object.fromEntries(asks.map((a) => [a.id, a]))
}

async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug236') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

/** What the last tool call answered, as the model was sent it on the next request. */
function toolResult(req: ModelRequest): string {
  const last = req.messages.at(-1)?.content
  const block = (Array.isArray(last) ? last : []).find((b: { type?: string }) => b?.type === 'tool_result') as
    | { content?: unknown }
    | undefined
  const content = block?.content
  return typeof content === 'string' ? content : JSON.stringify(content ?? '')
}

const CONTACT = {
  ask: 'contact',
  prompt: 'Phone number for the site — the one customers ring',
  why: 'So customers can ring you.',
  input: 'phone',
}

beforeAll(async () => {
  await applySchema()
})

afterEach(async () => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe("BUG-236 — a question on the client's panel keeps its form", () => {
  it('test_UAT_FC_BUG-236_set_ask_changing_a_shown_asks_input_is_refused_and_says_to_withdraw_and_add', async () => {
    const ctx = await site()
    await planOperations(sitePlan(await tickets(), ctx.site)).set_ask(CONTACT)

    // THE CONSULTANT REWRITES THE SAME ASK AS BUTTONS: refused, with the way out.
    const seen = await turn(ctx.sessionId, 'Can you put my number on?', [
      calls('set_ask', { ask: 'contact', input: 'single_choice', options: ['Phone', 'Email'] }),
      says('Done.'),
    ])
    const refused = toolResult(seen[1])
    expect(refused).toMatch(/ASK_SHOWN/)
    expect(refused).toMatch(/withdraw/i)
    expect(refused).toMatch(/new id/i)
    // …and nothing changed under the client.
    expect((await storedAsks(ctx.site)).contact).toMatchObject({ input: 'phone', status: 'open' })
    expect((await storedAsks(ctx.site)).contact.options).toBeUndefined()

    // REWORDING IS STILL FINE, and a withdrawn ask plus a new id is a new item.
    const agent = planOperations(sitePlan(await tickets(), ctx.site))
    await agent.set_ask({ ask: 'contact', why: 'So customers can ring you directly.' })
    await agent.withdraw_ask({ ask: 'contact', reason: 'asking how they prefer to be reached instead' })
    await agent.set_ask({
      ask: 'contact_way',
      prompt: 'How customers reach you — phone or email',
      why: 'So the site shows the right one.',
      input: 'single_choice',
      options: ['Phone', 'Email'],
    })
    const view = (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(ctx.site)}`)).json()) as { asks: PlanAsk[] }
    expect(view.asks.map((a) => [a.id, a.input])).toEqual([['contact_way', 'single_choice']])
  })
})

// [[BUG-245]] — "I've finished commenting" is replaced by a board that knows it is
// finished (every card sent or skipped). See
// test_UAT_FC_BUG-245_one_voice_one_thing.workers.test.ts.
