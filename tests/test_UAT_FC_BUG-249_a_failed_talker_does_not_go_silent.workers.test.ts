import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { INBOX_FIELD } from '../apps/control-app/src/session-inbox'
import { resetAiHost, setModelClient, TALKER_DEFERRED_LINE } from '../tools/generate/src/cli/ai/host-core'
import { calls, says, sentText, type ModelRequest, type WireEvent } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-249]] — **a talker that fails does not leave the client's message
 * unanswered**.
 *
 * THE INCIDENT. The worker round was healthy, but every talker round failed at
 * once with a 400 (lagrange-framework BUG-91's empty thinking block), and the
 * client saw the consultant stop responding: their message had been taken from
 * the inbox to open the talker, and nothing put it anywhere after the talker died.
 *
 * THE REAL WORKER — router, session manager, Durable Object junction, D1 ticket
 * store — with one double, the Anthropic client, which fails every talker request
 * and answers the worker's. The client's message is written from inside the
 * worker's held model call, the only place that is "while the work is running".
 */

const BUSINESS = 'bug249-talker'
const WROTE = 'Also, the shop opens at seven on Saturdays.'

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

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

async function inbox(sessionId: string): Promise<string> {
  const store = await ticketStoreFor(routerEnv() as never, scope)
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  return String((chat?.fields ?? {})[INBOX_FIELD] ?? '')
}

const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

const until = async (ok: () => boolean | Promise<boolean>, ms = 8_000): Promise<void> => {
  const end = Date.now() + ms
  while (!(await ok())) {
    if (Date.now() > end) throw new Error('timed out waiting')
    await new Promise((r) => setTimeout(r, 25))
  }
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-249 — a talker that fails does not go silent', () => {
  it('test_UAT_FC_BUG-249_a_failed_talker_hands_the_message_to_the_work_and_says_so', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug249t') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const worker: Array<(req: ModelRequest) => WireEvent[]> = [
      calls('list_pages', {}),
      calls('list_references', {}),
      says('All done with the pages.'),
    ]
    const workerSeen: ModelRequest[] = []
    let talkerTries = 0
    setModelClient({
      messages: {
        create: async (req: ModelRequest) => {
          if (isTalker(req)) {
            talkerTries += 1
            throw new Error('400 invalid_request_error: thinking block must not be empty')
          }
          workerSeen.push(req)
          const n = workerSeen.length - 1
          if (n === 1) {
            // THE WORK IS RUNNING: the client writes now, and the talker fails on it.
            await post('/api/ai/interpose', { sessionId, text: WROTE })
            await until(() => talkerTries >= 1)
            // …and the message is back in the inbox, for the work to take.
            await until(async () => (await inbox(sessionId)).includes(WROTE))
          }
          const events = worker[Math.min(n, worker.length - 1)](req)
          return (async function* () {
            for (const event of events) yield event
          })()
        },
      },
    })

    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Tidy the pages up.' }))
    expect(stream.at(-1)?.kind).toBe('done')

    // THE CLIENT WAS TOLD, gently, on the status line.
    const status = stream.filter((f) => f.kind === 'progress').map((f) => f.content)
    expect(status).toContain(TALKER_DEFERRED_LINE)
    // THE MESSAGE WAS DELIVERED to the work at its next call boundary — not lost.
    expect(workerSeen.length).toBeGreaterThanOrEqual(3)
    expect(sentText(workerSeen[2])).toContain(WROTE)
    // NOTHING IS LEFT WAITING, and the failing talker was not retried for the round.
    expect(await inbox(sessionId)).not.toContain(WROTE)
    expect(talkerTries).toBe(1)
  }, 30_000)
})
