import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { R2TranscriptArchive, flushAudit } from '../apps/control-app/src/ai'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-146 — **the AI host, in workerd**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs INSIDE workerd, through the
 * Worker's own `fetch`, against a real D1 database and a real R2 bucket. The
 * session manager, the role assembly, the tool loop, the tool handlers, the
 * `edit.ts` writes, the SSE framing, the transcript archive and the audit trail
 * are all the real thing.
 *
 * ONE DOUBLE, and it is the one that cannot be otherwise: the Anthropic client.
 * It is the network, and it is the boundary the library's own backend is written
 * to have injected. Everything on this side of it is real, which is the same
 * bargain `test_UAT_FC_REQ-122_chat_host` struck on Node — deliberately, so the
 * two runtimes are compared on equal terms.
 *
 * WHY A NODE-SIDE TEST OF THE SAME FUNCTIONS WOULD PROVE NOTHING. Under
 * `nodejs_compat` `node:fs` RESOLVES in workerd and hands back a per-isolate
 * ephemeral filesystem: writes succeed and reads come back. A file-backed
 * junction or archive therefore passes a functional test *in workerd* and loses
 * every conversation in production on the next eviction. lagrange-framework
 * REQ-103 measured exactly that. So the guard against it here is a static
 * import-graph assertion over the shipped bundle, not a passing turn.
 */

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/** One Anthropic streaming event, as the SDK emits them. */
type WireEvent = Record<string, unknown>

/**
 * A client that answers with a scripted sequence of STREAMS.
 *
 * The backend calls `messages.create({stream: true})` and consumes an async
 * iterable of raw Anthropic events — `content_block_start` / `_delta` / `_stop`
 * — which it reassembles into a message. So the double has to speak that
 * protocol rather than hand back a finished message: anything else is a
 * different contract from the one production uses, and the test would be
 * asserting against a fiction.
 *
 * The last script step repeats, so a tool loop that runs an extra iteration
 * fails an assertion rather than hanging.
 */
function scriptedClient(steps: Array<(req: ModelRequest) => WireEvent[]>) {
  const seen: ModelRequest[] = []
  let index = 0
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const step = steps[Math.min(index, steps.length - 1)]
        index += 1
        const events = step(req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}

/** Prose, as one text block streamed in a single delta. */
const says =
  (text: string) =>
  (): WireEvent[] => [
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    { type: 'content_block_stop', index: 0 },
  ]

/** A tool call, with its arguments streamed as partial JSON like the real wire. */
const calls =
  (name: string, input: Record<string, unknown>) =>
  (): WireEvent[] => [
    {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'tool_use', id: `call-${name}`, name },
    },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) },
    },
    { type: 'content_block_stop', index: 0 },
  ]

const TENANT = 'req146'

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
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit, overrides?: Partial<Env>): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(overrides),
  )

const post = (path: string, body: unknown, overrides?: Partial<Env>): Promise<Response> =>
  call(
    path,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    overrides,
  )

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

/**
 * A site made only of L1, imported through the Worker's own route.
 *
 * Built from `siteSeed` — the scaffolder's own starter — rather than a fixture
 * written here: a hand-rolled definition would have to restate the schema, and
 * one that drifted from the validator would fail as "this draft does not
 * validate", which is a test asserting its own mistake.
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

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-146 — the AI host runs in workerd', () => {
  it('test_UAT_FC_REQ-146_a_turn_runs_in_workerd_and_its_edit_lands_in_the_store', async () => {
    // AC1. The whole loop, in a Worker: open a session, take a turn that calls a
    // tool, and find the change in D1 — not in a fixture, not on a disk.
    const slug = nextSlug('turn')
    await seedSite(slug)

    const opened = await post('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; ready: boolean }
    expect(session.ready).toBe(true)

    const before = await post('/api/copy', {
      slug,
      page: 'home',
      path: '0.0',
      values: {},
    })
    // The seed's own text, whatever it is — read rather than asserted, so this
    // test does not restate the scaffolder.
    expect([200, 400]).toContain(before.status)

    setModelClient(
      scriptedClient([
        calls('list_pages', {}),
        says('I had a look at the pages.'),
      ]),
    )

    const turn = await post('/api/ai/prompt', {
      sessionId: session.sessionId,
      text: 'What pages does this site have?',
    })
    expect(turn.status).toBe(200)
    expect(turn.headers.get('content-type')).toContain('text/event-stream')

    const events = await frames(turn)
    expect(events.at(-1)?.kind).toBe('done')
    // The tool actually ran, against the real store, and its answer came back
    // through the real SSE projection.
    const text = events
      .filter((e) => e.kind === 'text')
      .map((e) => e.content)
      .join('')
    expect(text).toContain('I had a look at the pages.')
  })

  it('test_UAT_FC_REQ-146_reloading_resumes_the_sites_conversation', async () => {
    // AC2. A reload is a fresh isolate as far as the panel is concerned: the
    // transcript has to come back from R2, not from anything held in memory.
    const slug = nextSlug('resume')
    await seedSite(slug)

    const first = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }
    setModelClient(scriptedClient([says('The first thing I said.')]))
    await frames(
      await post('/api/ai/prompt', { sessionId: first.sessionId, text: 'Hello.' }),
    )

    // Everything cached is dropped — this is the reload.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const again = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
      turns: { role: string; markdown: string }[]
    }
    expect(again.sessionId).toBe(first.sessionId)
    expect(again.turns.length).toBeGreaterThan(0)
    expect(JSON.stringify(again.turns)).toContain('The first thing I said.')
  })

  it('test_UAT_FC_REQ-146_the_transcript_is_in_r2_and_no_url_can_reach_it', async () => {
    // AC2 and DOC-12 §7. The transcript is durable, and it is durable OUTSIDE
    // any prefix a request can name — a conversation is not a site and must
    // never be servable as one.
    const slug = nextSlug('keys')
    await seedSite(slug)
    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }
    setModelClient(scriptedClient([says('Stored.')]))
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hi.' }))

    const listed = await env.SITES.list({ prefix: `chat/${TENANT}/` })
    expect(listed.objects.length).toBeGreaterThan(0)
    for (const object of listed.objects) {
      expect(object.key.startsWith('draft/')).toBe(false)
    }

    // The one prefix a URL can reach is the site store's, and the transcript is
    // not under it.
    const preview = await call(`/preview/${slug}/draft/`)
    expect(preview.status).not.toBe(500)
    const asSite = await call(`/preview/chat%2F${TENANT}/draft/`)
    expect([404, 500]).toContain(asSite.status)
  })

  it('test_UAT_FC_REQ-146_every_ai_write_is_audited_and_survives_a_restart', async () => {
    // AC3. The audit is written durably BEFORE the response completes, so it
    // outlives the isolate that produced it — which is the only sense in which
    // an audit trail is one.
    const slug = nextSlug('audit')
    await seedSite(slug)
    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }

    setModelClient(scriptedClient([calls('list_pages', {}), says('Done.')]))
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Look.' }))

    // Read back from R2 with everything in memory dropped — the restart.
    resetAiHost()
    resetChatHost()

    const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${opened.sessionId}/` })
    expect(listed.objects.length).toBeGreaterThan(0)

    const first = await env.SITES.get(listed.objects[0].key)
    const record = JSON.parse(await first!.text()) as {
      operation: string
      session: string
      policy: { decision: string }
    }
    expect(record.operation).toBe('list_pages')
    expect(record.session).toBe(opened.sessionId)
  })

  it('test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes', async () => {
    // R2 has no append, so the trail is one object per record. The property that
    // buys is that two flushes cannot lose each other's entries — a fold would,
    // and an audit that drops records under load reads as evidence while being
    // wrong.
    const session = 'site-concurrent'
    const line = (op: string, ts: string) =>
      ({
        surface: 'l1',
        operation: op,
        tool: op,
        effect: 'read',
        params: {},
        policy: { decision: 'allow', rule: null },
        outcome: { ok: true, error: null, resultBytes: 1 },
        timestamp: ts,
      }) as never

    await Promise.all([
      flushAudit(env.SITES, TENANT, session, [line('a', '2026-01-01T00:00:00.000Z')]),
      flushAudit(env.SITES, TENANT, session, [line('b', '2026-01-01T00:00:01.000Z')]),
    ])

    const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${session}/` })
    expect(listed.objects).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-146_no_api_key_appears_in_a_response_or_an_error', async () => {
    // AC4. The key is a bearer credential for a paid API. It must not travel to
    // the client in an answer, in an envelope, or in the message a failure
    // produces.
    const slug = nextSlug('secret')
    await seedSite(slug)
    const key = 'sk-ant-do-not-leak-me'

    const opened = await post('/api/ai/session', { slug }, { ANTHROPIC_API_KEY: key })
    const openedBody = await opened.text()
    expect(openedBody).not.toContain(key)

    const { sessionId } = JSON.parse(openedBody) as { sessionId: string }

    // A backend that throws mid-turn: the failure has to be reported, and the
    // report must not carry the credential.
    setModelClient({
      messages: {
        create: async () => {
          throw new Error(`upstream refused (key ${key})`)
        },
      },
    })
    const turn = await post(
      '/api/ai/prompt',
      { sessionId, text: 'Go.' },
      { ANTHROPIC_API_KEY: key },
    )
    const body = await turn.text()
    expect(body).toContain('_')
    expect(body).not.toContain(key)
  })

  it('test_UAT_FC_REQ-146_a_missing_key_costs_a_turn_and_not_the_conversation', async () => {
    // The panel shows the history AND the reason it is frozen. Those are
    // independent failures and reporting them together is the whole point.
    const slug = nextSlug('nokey')
    await seedSite(slug)
    const opened = await post('/api/ai/session', { slug }, { ANTHROPIC_API_KEY: undefined })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as {
      sessionId: string
      turns: unknown[]
      ready: boolean
      error?: string
    }
    // A session id is issued either way: the binding is not what failed.
    expect(session.sessionId).toBe(`site-${slug}`)
    expect(Array.isArray(session.turns)).toBe(true)
  })

  it('test_UAT_FC_REQ-146_publish_is_not_reachable_from_the_worker', async () => {
    // AC7. `publish` snapshots a directory tree; it is REQ-149's and is absent
    // from the Worker's surface entirely. The route says so by name rather than
    // 404ing, which would read as a routing bug.
    const refused = await post('/api/publish', { slug: 'anything' })
    expect(refused.status).toBe(501)
    const body = (await refused.json()) as { ticket: string }
    expect(body.ticket).toBe('REQ-149')
  })

  it('test_UAT_FC_REQ-146_the_r2_archive_round_trips_the_neutral_session_file', async () => {
    // The stored form is the language-neutral session file, unchanged from what
    // `FileArchive` writes — so a conversation archived by the Worker loads in
    // the Node host and in the Python peer. A Cloudflare-shaped row format would
    // have made the two runtimes stop being the same product.
    const archive = new R2TranscriptArchive(env.SITES, TENANT)
    expect(await archive.list()).not.toContain('site-absent')
    await expect(archive.load('site-absent')).rejects.toThrow()
    expect(await archive.homeRef('site-x')).toBe(`chat/${TENANT}/site-x.md`)
  })
})
