import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-38 — **a turn survives the isolate that opened its session**.
 *
 * WHAT WAS WRONG. `/api/ai/session` and `/api/ai/prompt` are two requests, and
 * the host bound one to the other through a module-level `Map` written by the
 * first and read by the second. Under `1c builder` that map lives for the
 * operator's whole session; in workerd it lives for one isolate, and nothing
 * promises two requests the same one. Every turn that reached a cold isolate was
 * told "that conversation is no longer open" — which, on a fresh deploy, was
 * every turn.
 *
 * WHY THE TEST LOOKS LIKE THIS. Dropping `resetAiHost` + `resetChatHost` between
 * the two requests IS the new-isolate case: those two calls are exactly the
 * per-isolate state a cold start does not have. The existing REQ-146 suite
 * already drops them and then RE-OPENS the session, which re-populated the map
 * and so could never see this — the client does not re-open, it holds the id and
 * sends the next turn.
 *
 * The one double is the Anthropic client, as everywhere else here. The session
 * resolution under test is the real thing, against a real D1 store.
 */

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

type WireEvent = Record<string, unknown>

/** Answers with one text block, streamed as the SDK streams it. */
function speaks(text: string) {
  return {
    messages: {
      create: async (_req: ModelRequest) =>
        (async function* () {
          yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text },
          }
          yield { type: 'content_block_stop', index: 0 }
        })() as AsyncGenerator<WireEvent>,
    },
  }
}

const TENANT = 'bug38'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
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

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
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

/** Everything a cold isolate would not have. */
function newIsolate(): void {
  resetAiHost()
  resetChatHost()
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  newIsolate()
})

describe('BUG-38 — a conversation is not a property of one isolate', () => {
  it('test_UAT_FC_BUG-38_a_turn_runs_on_an_isolate_that_did_not_open_the_session', async () => {
    const slug = nextSlug('churn')
    await seedSite(slug)

    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }

    // The turn is served by an isolate that has never seen this session id —
    // the client only ever held the id, and does not re-open.
    newIsolate()
    setModelClient(speaks('Yes, I can hear you.'))

    const turn = await post('/api/ai/prompt', {
      sessionId: opened.sessionId,
      text: 'Can you hear me?',
    })
    expect(turn.status).toBe(200)

    const events = await frames(turn)
    const said = events
      .filter((e) => e.kind === 'text')
      .map((e) => e.content)
      .join('')
    expect(said).toContain('Yes, I can hear you.')
    expect(said).not.toContain('no longer open')
  })

  it('test_UAT_FC_BUG-38_the_conversation_continues_across_isolates', async () => {
    // Resolution alone would be worth little if the turn started a FRESH
    // conversation each time: the transcript has to be the same one, which it is
    // because the archive is durable and the id derives from the site.
    const slug = nextSlug('continues')
    await seedSite(slug)

    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }
    setModelClient(speaks('The first thing I said.'))
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hello.' }))

    newIsolate()
    setModelClient(speaks('The second thing I said.'))
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Again.' }))

    // Read the transcript back on a third isolate. Both turns are in the one
    // conversation, in order.
    newIsolate()
    setModelClient(null)
    const again = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
      turns: { role: string; markdown: string }[]
    }
    expect(again.sessionId).toBe(opened.sessionId)
    const transcript = again.turns.map((t) => t.markdown).join('\n')
    expect(transcript).toContain('The first thing I said.')
    expect(transcript).toContain('The second thing I said.')
    expect(transcript.indexOf('The first thing I said.')).toBeLessThan(
      transcript.indexOf('The second thing I said.'),
    )
  })

  it('test_UAT_FC_BUG-38_an_id_naming_no_site_is_still_refused', async () => {
    // The registry that was deleted existed to stop an arbitrary client string
    // becoming a free-form key into the session store. That property is not
    // deleted with it: an id resolves only against a site this tenant holds.
    setModelClient(speaks('Should never be reached.'))

    for (const sessionId of ['site-not-a-real-site', 'not-even-shaped-like-one', 'site-']) {
      const turn = await post('/api/ai/prompt', { sessionId, text: 'Hello.' })
      expect(turn.status).toBe(200)
      const said = (await frames(turn))
        .filter((e) => e.kind === 'text')
        .map((e) => e.content)
        .join('')
      expect(said).toContain('no longer open')
    }
  })
})
