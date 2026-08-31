import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient, sessionIdFor } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * **A conversation is not a property of the process that opened it**
 * (story-a58a0974 — AC-1456).
 *
 * The companion files prove the rest of the conversation contract: the whole
 * turn on the deployed host, the transcript's stored form, redaction and the
 * addressable storage region live in
 * `reconciliation-assistant-conversation-deployed.workers.test.ts`; the local
 * host's contract lives in `reconciliation-assistant-conversation.test.ts`.
 * THIS criterion is the one that can only be established where two requests are
 * not promised the same process, so it runs in workerd. AC-1055's companion half
 * rides along for the same reason: the criterion states its refusal on two origin
 * shapes, and the streaming one — "the origin's own message ahead of the
 * completion" — exists only here.
 *
 * WHY IT RUNS HERE AND NOT IN NODE. `1c builder` holds one process for the
 * operator's whole session, so a binding kept in memory there looks durable
 * forever; in workerd the process is one isolate and `/api/ai/session` and
 * `/api/ai/prompt` are two requests. A criterion asserted only against the local
 * host would pass on a host-shaped accident rather than on the property.
 *
 * WHAT "A PROCESS THAT NEVER OPENED THE SESSION" IS, mechanically. `resetAiHost`
 * and `resetChatHost` drop every cached manager and every cached host — exactly
 * and only the per-process state a replaced or newly started one does not have.
 * Dropping them between the two requests IS the cold-process case; the client
 * does not re-open, because a client holds nothing but the identifier it was
 * given.
 *
 * ONE DOUBLE, and it is the one that cannot be otherwise: the Anthropic client.
 * It speaks the STREAMING wire protocol the backend really consumes, because a
 * finished-message double would make every assertion here an assertion against a
 * fiction. Everything else — the session resolution under test, the session
 * manager, the tool loop, the transcript archive, the SSE framing — is the real
 * thing, against a real D1 database and a real R2 bucket.
 */

// ── the model double ─────────────────────────────────────────────────────────

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/** One Anthropic streaming event, as the SDK emits them. */
type WireEvent = Record<string, unknown>

/**
 * A client that answers with one text block and records what it was asked. The
 * recording is half the evidence here: what the model is SENT on the second turn
 * is how "the turns accumulate into ONE conversation" is observable from the
 * assistant's own side rather than only from the replay.
 */
function scriptedClient(text: string) {
  const seen: ModelRequest[] = []
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        return (async function* () {
          yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
          yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }
          yield { type: 'content_block_stop', index: 0 }
        })() as AsyncGenerator<WireEvent>
      },
    },
  }
}

// ── the deployment ───────────────────────────────────────────────────────────

const TENANT = 'story-a58a0974-continuity'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'sk-ant-deploy-secret-not-a-real-key',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 404 }),
    } as unknown as Fetcher,
  }
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<StreamEvent[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as StreamEvent)
}

const spoken = (events: StreamEvent[]): string =>
  events
    .filter((e) => e.kind === 'text')
    .map((e) => e.content)
    .join('')

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  ready: boolean
  error?: string
}

/** Open a site's conversation — the ONLY call that names a site. */
async function open(slug: string): Promise<OpenedSession> {
  const res = await post('/api/ai/session', { slug })
  expect(res.status).toBe(200)
  return (await res.json()) as OpenedSession
}

/**
 * A site made only of L1, imported through the Worker's own route — built from
 * the scaffolder's own starter rather than a fixture written here.
 */
async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

/** Everything a newly started or replaced process would not have. */
function newProcess(): void {
  resetAiHost()
  resetChatHost()
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  newProcess()
})

// ── continuity across processes ──────────────────────────────────────────────

describe('a conversation is not a property of the process that opened it', () => {
  it('test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session', async () => {
    const slug = nextSlug('continuity')
    await seedSite(slug)

    // Open once, and keep ONLY the identifier — which is all a client ever
    // carries between opening a conversation and speaking in it.
    const opened = await open(slug)
    expect(opened.sessionId).toBe(sessionIdFor(slug))
    expect(opened.turns).toEqual([])
    expect(opened.ready).toBe(true)
    const sessionId = opened.sessionId

    // ── the first turn, on a process that has never seen this identifier ─────
    // The discard is the cold-process case: nothing about this conversation is
    // in memory, and the client does NOT re-open.
    newProcess()
    const first = scriptedClient('The first thing I said.')
    setModelClient(first)

    const one = await post('/api/ai/prompt', { sessionId, text: 'Can you hear me?' })
    expect(one.status).toBe(200)
    expect(one.headers.get('content-type')).toContain('text/event-stream')

    const oneEvents = await frames(one)
    // It is answered BY THE ASSISTANT — not with a report that the conversation
    // is closed, which is what a process-local binding would have produced here.
    expect(spoken(oneEvents)).toContain('The first thing I said.')
    expect(spoken(oneEvents)).not.toContain('no longer open')
    expect(oneEvents.filter((e) => e.kind === 'done')).toHaveLength(1)
    // The turn really reached the model on this process, so the resolution
    // happened rather than the answer coming from anything cached.
    expect(first.seen).toHaveLength(1)

    // ── a second turn, after discarding again ────────────────────────────────
    newProcess()
    const second = scriptedClient('The second thing I said.')
    setModelClient(second)

    const two = await post('/api/ai/prompt', { sessionId, text: 'Are you still there?' })
    expect(two.status).toBe(200)
    const twoEvents = await frames(two)
    expect(spoken(twoEvents)).toContain('The second thing I said.')
    expect(spoken(twoEvents)).not.toContain('no longer open')
    expect(twoEvents.filter((e) => e.kind === 'done')).toHaveLength(1)

    // Resolution alone would be worth little if each turn started a FRESH
    // conversation: the second process was handed the first exchange as the
    // history it is continuing, which is the accumulation seen from the
    // assistant's own side rather than only from the replay below.
    const carried = JSON.stringify(second.seen[0].messages)
    expect(carried).toContain('Can you hear me?')
    expect(carried).toContain('The first thing I said.')

    // ── re-open, on a process that served neither turn ───────────────────────
    newProcess()
    setModelClient(null)

    const again = await open(slug)
    // The SAME conversation, not a new one.
    expect(again.sessionId).toBe(sessionId)
    // Both turns, in the order they were spoken, each attributed to who spoke it.
    expect(again.turns.map((t) => t.role)).toEqual(['user', 'assistant', 'user', 'assistant'])
    expect(again.turns[0].markdown).toContain('Can you hear me?')
    expect(again.turns[1].markdown).toContain('The first thing I said.')
    expect(again.turns[2].markdown).toContain('Are you still there?')
    expect(again.turns[3].markdown).toContain('The second thing I said.')
  })
})

// ── the refusal, on the origin that always streams ───────────────────────────

/**
 * AC-1055's companion half, and the one that can only be established here.
 *
 * The criterion states the refusal on TWO origin shapes: "as a plain structured
 * not-found answer, with no event stream, on the origin that answers turns with
 * a status code, and as the origin's own message ahead of the completion on the
 * origin that always streams." The first is asserted against the local host in
 * `reconciliation-assistant-conversation.test.ts`. This is the second: workerd
 * has already sent the status line with the first byte, so there is no status
 * code left to change and a dropped socket would render as a turn that simply
 * stopped — the caller has to be told in the channel it is already reading.
 */
describe('an unresolvable identifier is refused in the channel the caller is reading', () => {
  it('test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion', async () => {
    // A real site exists in this account, so a refusal below is a statement
    // about the identifier rather than about an empty store.
    const held = nextSlug('streaming-refusal')
    await seedSite(held)

    // Transcript storage as it stands BEFORE any refusal. Compared as a delta
    // rather than asserted empty: the bucket is shared with the criterion above,
    // whose conversation legitimately left a transcript, and "no transcript
    // storage appears" is a claim about what a refusal adds.
    const transcripts = async (): Promise<string[]> =>
      (await env.SITES.list({ prefix: `chat/${TENANT}/` })).objects.map((o) => o.key).sort()
    const before = await transcripts()

    const unresolvable = [
      ['a fabricated identifier', 'not-a-session-id'],
      ['one naming a site that does not exist', sessionIdFor(nextSlug('never-seeded'))],
      ['one carrying no derivable site name', 'site-'],
      ['one carrying path-traversal characters', 'site-../../chat/other'],
    ] as const

    for (const [what, sessionId] of unresolvable) {
      newProcess()
      // The model is armed rather than absent: "nothing of the assistant's was
      // streamed" is only worth asserting if there was something to stream.
      const model = scriptedClient('An answer that must never be given.')
      setModelClient(model)

      const res = await post('/api/ai/prompt', { sessionId, text: 'Are you there?' })

      // The origin that always streams does not switch shape to refuse: it is
      // still 200, still an event stream.
      expect(res.status, what).toBe(200)
      expect(res.headers.get('content-type'), what).toContain('text/event-stream')

      const events = await frames(res)
      // The origin's own message …
      expect(spoken(events), what).toContain('no longer open')
      // … and nothing of the assistant's: no fabricated apology, and the model
      // was never reached, so the refusal arrived AHEAD of anything streamed.
      expect(spoken(events), what).not.toContain('An answer that must never be given.')
      expect(model.seen, `${what}: the turn reached the model`).toHaveLength(0)
      // … followed by the completion that releases the caller. A panel left
      // waiting on a stream that never completes is indistinguishable from one
      // still thinking.
      expect(events.filter((e) => e.kind === 'done'), what).toHaveLength(1)
      expect(events[events.length - 1].kind, `${what}: the completion was not last`).toBe('done')

      // No conversation was created: transcript storage is keyed by session id
      // outside every site prefix, and none of these produced an object.
      expect(await transcripts(), `${what}: a refusal left transcript storage behind`).toEqual(before)
    }

    // And the site this account does hold is untouched by any of it — it still
    // opens, and opens empty.
    newProcess()
    setModelClient(null)
    const opened = await open(held)
    expect(opened.sessionId).toBe(sessionIdFor(held))
    expect(opened.turns).toEqual([])
  })
})
