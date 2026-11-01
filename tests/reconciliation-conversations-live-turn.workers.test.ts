import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient, says, scriptedClient } from './support/scripted-model-client'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * STORY-103 — one continuing conversation about a site, upgraded by BUG-46:
 * opening a conversation mid-turn shows the turn so far, a turn outlives its
 * caller, a reattach tails the rest from a cursor, and a transcript that cannot
 * be read is a failure rather than an empty conversation.
 *
 * The one double is the Anthropic client. `pacedClient` holds the model open so
 * "during a turn" is somewhere a test can stand; the session manager, junction,
 * archive, D1 ticket store and SSE framing are all real.
 */

const TENANT = 'story103live'

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

/** An `ExecutionContext` that keeps what it is handed, so a test can await it. */
function collectingCtx(): {
  ctx: ExecutionContext
  held: () => Promise<unknown>[]
  settled: () => Promise<unknown[]>
} {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, held: () => held, settled: () => Promise.all(held) }
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

interface Opened {
  sessionId: string
  turns: { role: string; markdown: string }[]
  cursor: number
  live: boolean
}

/** Read `data:` frames one at a time, so a test can act mid-turn. */
function frameReader(response: Response): {
  next: () => Promise<Frame | null>
  drain: () => Promise<Frame[]>
  cancel: () => Promise<void>
} {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const queued: Frame[] = []
  const next = async (): Promise<Frame | null> => {
    for (;;) {
      if (queued.length > 0) return queued.shift()!
      const { value, done } = await reader.read()
      if (done) return null
      buffer += decoder.decode(value, { stream: true })
      let split
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, split).trim()
        buffer = buffer.slice(split + 2)
        if (frame.startsWith('data:')) queued.push(JSON.parse(frame.slice(5).trim()) as Frame)
      }
    }
  }
  return {
    next,
    drain: async () => {
      const all: Frame[] = []
      for (;;) {
        const frame = await next()
        if (frame === null) return all
        all.push(frame)
        if (frame.kind === 'done') return all
      }
    },
    cancel: () => reader.cancel(),
  }
}

const spoken = (frames: Frame[]): string =>
  frames
    .filter((f) => f.kind === 'text')
    .map((f) => f.content ?? '')
    .join('')

async function store(): Promise<TicketStore> {
  return ticketStoreFor(workerEnv())
}

/** The chat ticket's `chat_transcript` comment for `sessionId`, or null. */
async function transcriptComment(sessionId: string): Promise<{ uid: string; body: string } | null> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  if (!chat) return null
  const { comments } = await (await store()).comments({ uid: chat.uid })
  const found = comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')
  return found ? { uid: found.uid, body: found.body ?? '' } : null
}

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

async function open(slug: string): Promise<Opened> {
  const res = await post('/api/ai/session', { slug })
  expect(res.status).toBe(200)
  return (await res.json()) as Opened
}

async function openFor(prefix: string): Promise<{ slug: string; opened: Opened }> {
  const slug = nextSlug(prefix)
  await seedSite(slug)
  return { slug, opened: await open(slug) }
}

describe('STORY-103 — a conversation stays whole across a live turn', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live', async () => {
    const { slug, opened: before } = await openFor('ac2088')
    expect(before.live).toBe(false)
    const model = pacedClient('Working on the heading. ', 'Done with the heading.')
    setModelClient(model)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId: before.sessionId, text: 'Fix the heading.' }, ctx),
    )
    expect((await turn.next())?.content).toBe('Working on the heading. ')

    // Mid-turn: the open answers from the live record, not the durable copy.
    const during = await open(slug)
    expect(during.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(during.turns[0].markdown).toBe('Fix the heading.')
    expect(during.turns[1].markdown).toBe('Working on the heading. ')
    expect(during.live).toBe(true)
    expect(during.cursor).toBeGreaterThan(before.cursor)
    // The durable copy deliberately holds only completed turns.
    expect((await transcriptComment(before.sessionId))?.body ?? '').not.toContain(
      'Working on the heading.',
    )

    model.release()
    expect(spoken(await turn.drain())).toBe('Done with the heading.')
    // The turn has ended once its ending — held open for the runtime — is done;
    // the `done` frame can reach the client before that ending is recorded.
    await settled()

    // After the turn ends: live false, the whole reply once.
    const after = await open(slug)
    expect(after.live).toBe(false)
    expect(after.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(after.turns[1].markdown).toBe('Working on the heading. Done with the heading.')

    // A host process that has never served the conversation seeds from the
    // durable copy: every completed turn, not live.
    resetAiHost()
    resetChatHost()
    const cold = await open(slug)
    expect(cold.sessionId).toBe(before.sessionId)
    expect(cold.live).toBe(false)
    expect(cold.turns.map((t) => t.markdown)).toEqual([
      'Fix the heading.',
      'Working on the heading. Done with the heading.',
    ])
  })

  it('test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted', async () => {
    const { opened } = await openFor('ac2089')
    const { sessionId, cursor: preTurn } = opened
    const model = pacedClient('Partial reply so far. ', 'Never delivered.')
    setModelClient(model)

    const { ctx, held, settled } = collectingCtx()
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Begin now.' }, ctx))
    expect((await turn.next())?.content).toBe('Partial reply so far. ')

    // The host handed the runtime something to keep the request alive for.
    expect(held().length).toBeGreaterThanOrEqual(1)

    await turn.cancel()
    model.release()
    // Await only what was registered with the runtime.
    await settled()

    const archived = (await transcriptComment(sessionId))?.body ?? null
    expect(archived).not.toBeNull()
    expect(archived).toContain('Begin now.')
    expect(archived).toContain('Partial reply so far.')

    const tailed = await frameReader(
      await post('/api/ai/reattach', { sessionId, cursor: preTurn }),
    ).drain()
    const done = tailed.filter((f) => f.kind === 'done')
    expect(done).toHaveLength(1)
    expect(done[0].meta?.status).toBe('aborted')
  })

  it('test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request', async () => {
    const { slug, opened } = await openFor('ac2090')
    const { sessionId } = opened
    const model = pacedClient('Alpha part, ', 'omega part.')
    setModelClient(model)

    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Two parts please.' }))
    await turn.next()

    const painted = await open(slug)
    const tailRes = await post('/api/ai/reattach', { sessionId, cursor: painted.cursor })
    expect(tailRes.status).toBe(200)
    expect(tailRes.headers.get('content-type')).toContain('text/event-stream')
    const tail = frameReader(tailRes)
    model.release()
    const tailed = await tail.drain()

    // Same reader, same vocabulary; no repeat and no gap.
    expect(painted.turns[1].markdown + spoken(tailed)).toBe('Alpha part, omega part.')
    expect(spoken(tailed)).toBe('omega part.')
    const done = tailed.filter((f) => f.kind === 'done')
    expect(done).toHaveLength(1)
    expect(tailed.at(-1)?.kind).toBe('done')
    expect(done[0].meta?.status).toBe('complete')
    await turn.drain()

    // A missing cursor is never zero; a negative one is refused; so is no id.
    for (const bad of [{ sessionId }, { sessionId, cursor: -1 }, { cursor: 0 }]) {
      const refused = await post('/api/ai/reattach', bad)
      expect(refused.status).toBe(400)
      expect(refused.headers.get('content-type') ?? '').not.toContain('text/event-stream')
    }

    // An identifier naming no conversation is answered inside the stream.
    const unknown = await post('/api/ai/reattach', { sessionId: 'no-such-conversation', cursor: 0 })
    expect(unknown.status).toBe(200)
    const unknownFrames = await frameReader(unknown).drain()
    expect(spoken(unknownFrames).trim().length).toBeGreaterThan(0)
    expect(unknownFrames.at(-1)?.kind).toBe('done')
    expect(unknownFrames.filter((f) => f.kind === 'done')).toHaveLength(1)
  })

  it('test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty', async () => {
    // No conversation yet: an ordinary, successful open with no turns.
    const { slug, opened } = await openFor('ac2091')
    expect(opened.turns).toEqual([])

    setModelClient(scriptedClient([says('Stored and remembered.')]))
    const done = await frameReader(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Remember me.' }),
    ).drain()
    expect(done.at(-1)?.kind).toBe('done')

    // Break the stored session file while its chat ticket — the store's
    // listing of which conversations it holds — still names the session.
    const comment = await transcriptComment(opened.sessionId)
    expect(comment).not.toBeNull()
    await (await store()).update({ uid: comment!.uid, patch: { body: 'not a session file {' } })
    expect((await transcriptComment(opened.sessionId))?.body).toBe('not a session file {')

    // A cold host has no live record, so the open must read the store.
    resetAiHost()
    resetChatHost()
    const res = await post('/api/ai/session', { slug })
    expect(res.status).not.toBe(200)
    const text = await res.text()
    let parsed: unknown = null
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
    // Never presented as a conversation with no turns.
    expect((parsed as { turns?: unknown } | null)?.turns).toBeUndefined()
  })
})
