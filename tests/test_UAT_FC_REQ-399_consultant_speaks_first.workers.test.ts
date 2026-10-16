import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { openingPrompt } from '../tools/generate/src/cli/ai/roles'
import { says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-399]] — **the consultant speaks first.** Opening a builder conversation
 * with nothing in it says so (`opening`), and the panel starts the opening turn:
 * `/api/ai/prompt` with `opening`, no client message. It runs once.
 *
 * The one double is the Anthropic client. The router, the host, the session
 * manager, the junction, the archive and the D1 ticket store are the real thing,
 * as in [[BUG-121]]'s suite, whose apparatus this borrows.
 */

const TENANT = 'req399'

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

/** BUG-46's reader: frames one at a time, so a test can act mid-turn. */
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

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  live: boolean
  opening?: boolean
}

const open = async (site: string): Promise<OpenedSession> =>
  (await (await post('/api/ai/session', { site })).json()) as OpenedSession

describe('REQ-399 — the consultant opens the conversation', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-399_an_empty_conversation_gets_exactly_one_opening_turn', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('open') })
    const first = await open(site)
    expect(first.turns).toEqual([])
    expect(first.opening).toBe(true)

    const model = scriptedClient([says("Hi — I'm the one building your website. What does your business do?")])
    setModelClient(model)
    const { ctx, settled } = collectingCtx()
    const frames = await frameReader(await post('/api/ai/prompt', { sessionId: first.sessionId, opening: true }, ctx)).drain()
    await settled()
    expect(frames.filter((f) => f.kind === 'text').map((f) => f.content).join('')).toContain('What does your business do?')
    // SHE IS TOLD WHAT TO DO IN PLACE OF A CLIENT MESSAGE, through the normal turn.
    expect(JSON.stringify(model.seen[0].messages)).toContain('You speak first')

    // EXACTLY ONE ASSISTANT TURN, AND NO CLIENT MESSAGE BEFORE IT.
    const again = await open(site)
    expect(again.turns.map((t) => t.role)).toEqual(['assistant'])
    expect(again.turns[0].markdown).toContain('What does your business do?')
    expect(again.turns.some((t) => t.markdown.includes(openingPrompt()))).toBe(false)
    // OPENING AGAIN STARTS NONE.
    expect(again.opening).toBeUndefined()
    const refused = await post('/api/ai/prompt', { sessionId: again.sessionId, opening: true })
    expect(refused.status).toBe(409)
    expect(model.seen).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-399_a_conversation_that_already_has_turns_gets_no_opening', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('talked') })
    const { sessionId } = await open(site)
    const model = scriptedClient([says('Hello.')])
    setModelClient(model)
    const { ctx, settled } = collectingCtx()
    await frameReader(await post('/api/ai/prompt', { sessionId, text: 'Hi, I run a bakery.' }, ctx)).drain()
    await settled()

    const reopened = await open(site)
    expect(reopened.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(reopened.opening).toBeUndefined()
    expect((await post('/api/ai/prompt', { sessionId, opening: true })).status).toBe(409)
    expect(model.seen).toHaveLength(1)
  })
})
