import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { configureDelegation } from '../tools/generate/src/cli/ai/delegation'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { OPENING_MESSAGE } from '../tools/generate/src/cli/ai/plan-core'
import { openingCue } from '../tools/generate/src/cli/ai/roles'
import { says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-403]] — **the first entry explains itself.** A brand-new
 * conversation opens with the consultant's stock introduction, recorded as her
 * first turn with no model call and no spend, and the client's first message
 * reaches the model with that introduction in its history. (The preview and
 * publish half is [[BUG-215]]'s now: `test_UAT_FC_BUG-215_starter_is_the_grey_page`.)
 *
 * The one double is the Anthropic client. The router, the host, the session
 * manager, the junction, the archive, the D1 store and the spend ledger are the
 * real thing, as in BUG-43's and REQ-292's suites.
 */

const TENANT = 'req403'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

/** BUG-46's collecting context: the test standing in for the runtime's `waitUntil`. */
function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const call = (path: string, init?: RequestInit, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv(), ctx)

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ctx)

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  ready: boolean
  opening?: boolean
}

const open = async (site: string): Promise<OpenedSession> =>
  (await (await post('/api/ai/session', { site })).json()) as OpenedSession

/** Run one client turn to the end, the way the chat panel does. */
async function prompt(sessionId: string, text: string): Promise<void> {
  const { ctx, settled } = collectingCtx()
  const res = await post('/api/ai/prompt', { sessionId, text }, ctx)
  expect(res.status).toBe(200)
  await res.text()
  await settled()
}

/** A model client that fails the test if anything calls it. */
function untouchable() {
  const seen: unknown[] = []
  return {
    seen,
    messages: {
      create: (req: unknown) => {
        seen.push(req)
        throw new Error('the model must not be called')
      },
    },
  }
}

const spendRows = async (sessionId: string): Promise<number> =>
  ((await env.DB.prepare('SELECT COUNT(*) AS n FROM turn_spend WHERE session_id = ?').bind(sessionId).first<{ n: number }>())
    ?.n ?? 0)

beforeAll(async () => {
  await applySchema(env.DB)
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-403 — the consultant’s stock introduction opens the conversation', () => {
  it('test_UAT_FC_REQ-403_starting_records_one_assistant_turn_with_no_model_call_and_no_spend', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('start') })
    const first = await open(site)
    expect(first.ready).toBe(true)
    expect(first.turns).toEqual([])
    expect(first.opening).toBe(true)

    const model = untouchable()
    setModelClient(model as never)
    const started = await post('/api/ai/opening', { sessionId: first.sessionId })
    expect(started.status).toBe(200)
    const { turn } = (await started.json()) as { turn: { role: string; markdown: string } }
    expect(turn.role).toBe('assistant')
    expect(turn.markdown).toBe(OPENING_MESSAGE)
    // STOCK TEXT: nothing asked of the model, nothing spent.
    expect(model.seen).toHaveLength(0)
    expect(await spendRows(first.sessionId)).toBe(0)

    // A RELOAD SHOWS THE TRANSCRIPT, with exactly one turn and no button.
    const again = await open(site)
    expect(again.turns.map((t) => t.role)).toEqual(['assistant'])
    expect(again.turns[0].markdown).toBe(OPENING_MESSAGE)
    expect(again.turns.some((t) => t.markdown.includes(openingCue()))).toBe(false)
    expect(again.opening).toBeUndefined()

    // ONCE PER CONVERSATION.
    expect((await post('/api/ai/opening', { sessionId: first.sessionId })).status).toBe(409)
    expect((await open(site)).turns).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-403_the_clients_first_message_reaches_the_model_after_the_opening', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('reply') })
    const { sessionId } = await open(site)
    expect((await post('/api/ai/opening', { sessionId })).status).toBe(200)

    const model = scriptedClient([says('A bakery — lovely. Who buys from you?')])
    setModelClient(model)
    await prompt(sessionId, 'I run a bakery in Bristol.')

    expect(model.seen).toHaveLength(1)
    const messages = model.seen[0].messages
    const opening = messages.findIndex((m) => m.role === 'assistant' && JSON.stringify(m.content).includes('tell me about your business'))
    // THE OPENING IS HER OWN TURN, answering the cue, and the client's words
    // follow it as the reply.
    expect(opening).toBeGreaterThan(0)
    expect(messages[opening - 1].role).toBe('user')
    expect(JSON.stringify(messages[opening - 1].content)).toContain('pressed Start')
    expect(messages[opening + 1].role).toBe('user')
    expect(JSON.stringify(messages[opening + 1].content)).toContain('I run a bakery in Bristol.')

    const reopened = await open(site)
    expect(reopened.turns.map((t) => t.role)).toEqual(['assistant', 'user', 'assistant'])
  })

  it('test_UAT_FC_REQ-403_a_conversation_that_already_has_turns_is_never_offered_the_start', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('talked') })
    const { sessionId } = await open(site)
    setModelClient(scriptedClient([says('Hello.')]))
    await prompt(sessionId, 'Hi, I run a bakery.')

    const reopened = await open(site)
    expect(reopened.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(reopened.opening).toBeUndefined()
    expect((await post('/api/ai/opening', { sessionId })).status).toBe(409)
    expect((await open(site)).turns.map((t) => t.role)).toEqual(['user', 'assistant'])
  })
})
