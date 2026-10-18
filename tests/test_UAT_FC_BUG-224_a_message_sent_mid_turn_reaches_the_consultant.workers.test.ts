import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor, type Ticket } from '../apps/control-app/src/tickets'
import { INBOX_FIELD } from '../apps/control-app/src/session-inbox'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { calls, says, scriptedClient, type ModelRequest } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * BUG-224 — **a message the client sends while a turn is running reaches the
 * consultant**.
 *
 * THE INCIDENT. The consultant spent twenty minutes in one turn of sequential
 * `Delegate` calls; the client wrote to her several times meanwhile, and none of
 * it ever reached her — not between the delegations, not at the end of the turn,
 * not in the next one.
 *
 * WHAT THIS PROVES. `/api/ai/interpose` keeps the message on the session's chat
 * ticket — a store every isolate shares — and the turn running in another
 * request takes it after its next tool call, so the model's very next request
 * carries it. A message that arrives after the last call is not lost: it waits,
 * the session says so, and it runs as the next prompt exactly once.
 *
 * The one double is the Anthropic client; the routes, session manager, junction,
 * D1 ticket store and SSE framing are the real thing. The interposing request is
 * made from INSIDE the model call, which is the only place a test can stand that
 * is genuinely "while the turn is running".
 */

const TENANT = 'bug224'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => void held.push(promise),
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    ctx,
  )

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

async function frames(response: Response): Promise<Frame[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as Frame)
}

async function chatTicket(sessionId: string): Promise<Ticket | null> {
  const store = await ticketStoreFor(workerEnv(), { businessId: TENANT })
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

async function archivedTranscript(sessionId: string): Promise<string> {
  const chat = await chatTicket(sessionId)
  if (!chat) return ''
  const store = await ticketStoreFor(workerEnv(), { businessId: TENANT })
  const { comments } = await store.comments({ uid: chat.uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')?.body ?? ''
}

interface Opened {
  sessionId: string
  live: boolean
  waiting?: { id: string; text: string }[]
}

const openSite = async (site: string): Promise<Opened> =>
  (await (await post('/api/ai/session', { site })).json()) as Opened

/** The model's request, as text — every message, so nothing it was shown is missed. */
const requestText = (req: ModelRequest): string => JSON.stringify(req.messages)

describe('BUG-224 — a message sent while a turn runs reaches the consultant', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-224_a_message_sent_mid_turn_is_in_the_next_model_call', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('mid') })
    const { sessionId } = await openSite(site)
    const WROTE = 'Actually, make the header teal like the comparison site.'

    const inner = scriptedClient([calls('DescribeTools', { tools: ['Delegate'] }), says('Teal it is.')])
    let interposed: Response | null = null
    setModelClient({
      seen: inner.seen,
      messages: {
        create: async (req: ModelRequest) => {
          // THE FIRST CALL IS IN FLIGHT: the client writes now, from its own request.
          if (inner.seen.length === 0) interposed = await post('/api/ai/interpose', { sessionId, text: WROTE })
          return inner.messages.create(req)
        },
      },
    })

    const { ctx, settled } = collectingCtx()
    const turn = await frames(await post('/api/ai/prompt', { sessionId, text: 'Rebuild the header.' }, ctx))
    await settled()

    expect(interposed!.status).toBe(200)
    const { messageId } = (await interposed!.json()) as { messageId: string }
    expect(messageId).toMatch(/\S/)
    // THE OBSERVATION THAT MATTERS: the model's next request carried it, while
    // the request before it — the one the message arrived during — did not.
    expect(inner.seen).toHaveLength(2)
    expect(requestText(inner.seen[0])).not.toContain(WROTE)
    expect(requestText(inner.seen[1])).toContain(WROTE)
    // The client's stream says it was delivered, so the pending bubble turns solid.
    const delivered = turn.filter((f) => f.kind === 'interposition')
    expect(delivered).toHaveLength(1)
    expect(JSON.stringify(delivered[0])).toContain(WROTE)
    // It is in the conversation's record, and nothing is left waiting.
    expect(await archivedTranscript(sessionId)).toContain(WROTE)
    expect(((await chatTicket(sessionId))?.fields ?? {})[INBOX_FIELD] ?? '').toBe('')
    expect((await openSite(site)).waiting).toBeUndefined()
  })

  it('test_UAT_FC_BUG-224_a_message_that_misses_every_call_waits_and_runs_next_once', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('late') })
    const { sessionId } = await openSite(site)
    const WROTE = 'One more thing: the opening hours changed.'

    // A TURN WITH NO TOOL CALL has no boundary left to deliver into.
    const inner = scriptedClient([says('Done with the header.'), says('Noted, updating the hours.')])
    let messageId = ''
    setModelClient({
      seen: inner.seen,
      messages: {
        create: async (req: ModelRequest) => {
          if (inner.seen.length === 0) {
            const res = await post('/api/ai/interpose', { sessionId, text: WROTE })
            messageId = ((await res.json()) as { messageId: string }).messageId
          }
          return inner.messages.create(req)
        },
      },
    })

    const first = collectingCtx()
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Finish the header.' }, first.ctx))
    await first.settled()
    expect(requestText(inner.seen[0])).not.toContain(WROTE)

    // NOT DROPPED: the session says it is waiting, by the id the client was given.
    const reopened = await openSite(site)
    expect(reopened.live).toBe(false)
    expect(reopened.waiting).toEqual([expect.objectContaining({ id: messageId, text: WROTE })])

    // The panel runs it as the next prompt, naming it. It reaches the model as
    // that prompt and is not delivered a second time into the same round.
    const second = collectingCtx()
    const turn = await frames(
      await post('/api/ai/prompt', { sessionId, text: WROTE, fromMessages: [messageId] }, second.ctx),
    )
    await second.settled()
    expect(turn.filter((f) => f.kind === 'interposition')).toHaveLength(0)
    const asked = requestText(inner.seen[1])
    expect(asked.split(WROTE).length - 1).toBe(1)
    expect((await openSite(site)).waiting).toBeUndefined()
  })

  it('test_UAT_FC_BUG-224_interpose_refuses_a_session_it_does_not_know', async () => {
    const res = await post('/api/ai/interpose', { sessionId: 'site-no-such-site', text: 'hello' })
    expect(res.status).toBe(404)
    const empty = await post('/api/ai/interpose', { sessionId: 'site-no-such-site', text: '  ' })
    expect(empty.status).toBe(400)
  })
})
