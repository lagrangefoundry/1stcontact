import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { route, resetChatHost } from '../apps/control-app/src/router'
import { R2TranscriptArchive } from '../apps/control-app/src/ai'
import { REDACTED } from '../apps/control-app/src/redact'
import { resetAiHost, setModelClient, sessionIdFor } from '../tools/generate/src/cli/ai/host-core'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * **One continuing conversation, on the host that is actually deployed**
 * (story-a58a0974 — AC-1404, AC-1405, AC-1408, AC-1409).
 *
 * The companion file `reconciliation-assistant-conversation.test.ts` proves the
 * same conversation contract against the host that runs on the operator's
 * machine. These four criteria are the ones that are only *about* the deployed
 * runtime — the credential arriving as a deploy secret, the transcript living in
 * shared storage rather than beside a directory, the storage region a request
 * can address, and what a raw failure is allowed to say on the way out. None of
 * them can be established from Node, so they run here.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion below runs INSIDE workerd, through
 * the Worker's own `fetch` (or its own route table), against a real D1 database
 * and a real R2 bucket. The session manager, role assembly, tool loop, tool
 * handlers, `edit.ts` writes, SSE framing, transcript archive and audit trail are
 * all the real thing.
 *
 * ONE DOUBLE, and it is the one that cannot be otherwise: the Anthropic client.
 * It is the network, and it is the boundary the AI library's own backend is
 * written to have injected. It speaks the STREAMING wire protocol the backend
 * really consumes — `content_block_start` / `_delta` / `_stop` — rather than
 * handing back a finished message, because a finished-message double would make
 * every assertion here an assertion against a fiction. Nothing is asserted
 * against a live model provider.
 *
 * The two criteria that a passing turn cannot establish — the import graph of
 * the shipped artifact (AC-1406) and the build that refuses to emit an assistant
 * -less Worker (AC-1407) — live in `reconciliation-assistant-conversation-
 * artifact.test.ts`, in the node project, because each is a statement about the
 * artifact rather than about a running conversation.
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
 * A client answering with a scripted sequence of STREAMS. The last step repeats,
 * so a tool loop that runs an extra iteration fails an assertion rather than
 * hanging.
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

/** Add a page, then say so — the site-changing turn these cases use. */
const addsPage = (page: string, title: string) => [
  calls('add_page', { page, title }),
  says(`Done — I added a page called "${title}".`),
]

// ── the deployment ───────────────────────────────────────────────────────────

const TENANT = 'story-a58a0974'
/** The credential as a deploy secret. Absent from any process environment. */
const DEPLOY_SECRET = 'sk-ant-deploy-secret-not-a-real-key'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: DEPLOY_SECRET,
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 404 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const url = (p: string): string => `https://app.example/${p.replace(/^\//, '')}`

const call = (p: string, init?: RequestInit, overrides?: Partial<Env>): Promise<Response> =>
  worker.fetch(new Request(url(p), init), workerEnv(overrides))

const post = (p: string, body: unknown, overrides?: Partial<Env>): Promise<Response> =>
  call(
    p,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
    overrides,
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

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  ready: boolean
  error?: string
}

async function open(slug: string, overrides?: Partial<Env>): Promise<OpenedSession> {
  const res = await post('/api/ai/session', { slug }, overrides)
  expect(res.status).toBe(200)
  return (await res.json()) as OpenedSession
}

/**
 * A site made only of L1, imported through the Worker's own route — built from
 * the scaffolder's own starter rather than a fixture written here, so nothing
 * below restates the schema.
 */
async function seedSite(
  slug: string,
  assets: { name: string; base64: string }[] = [],
): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets,
  })
  expect(res.status).toBe(200)
}

/** A site file — the one kind of thing a request address is allowed to reach. */
const LOGO = { name: 'logo.svg', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }

/** A tenant-scoped handle that is NOT the host's — the store read independently. */
function sharedStore() {
  return d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
}

/** Every key currently in the bucket, sorted — the whole of what is stored. */
async function storedKeys(): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await env.SITES.list({ cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── a whole turn, on the deployed host ───────────────────────────────────────

describe('a whole turn runs on the deployed host', () => {
  it('test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store', async () => {
    const slug = nextSlug('deployed')
    await seedSite(slug)

    // The credential reaches the host ONLY as the deployment's own secret: it is
    // a binding on `env`, and nothing in this test puts it in a process
    // environment. The negative half at the bottom is what makes that legible —
    // remove it from the deployment and the very same open reports it cannot run.
    const opened = await open(slug)
    expect(opened.ready).toBe(true)
    expect(opened.turns).toEqual([])

    setModelClient(scriptedClient(addsPage('about', 'About us')))

    const res = await post('/api/ai/prompt', {
      sessionId: opened.sessionId,
      text: 'Add a page called About us.',
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const events = await frames(res)

    // The stream says what it DID, naming the operation…
    const activity = events.find((e) => e.kind === 'tool_activity')
    expect(activity?.meta).toMatchObject({ event: 'tool_call', name: 'add_page' })
    // …and what it SAID…
    expect(
      events
        .filter((e) => e.kind === 'text')
        .map((e) => e.content)
        .join(''),
    ).toContain('About us')
    // …and ends in exactly one completion that releases the caller.
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
    expect(events.at(-1)?.kind).toBe('done')

    // THE CHANGE IS THE EVIDENCE, not the stream — and it is read back out of
    // the shared store through a handle this host never saw, which is what
    // "readable by anything else that reads that store" means.
    const pages = await (await sharedStore()).readPages(slug)
    expect(pages.map((p) => p.name)).toContain('about.json')

    // A deployment carrying no model credential is NOT a boot failure. Drop the
    // secret, drop everything held in memory, and open the same site again.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const cold = await open(slug, { ANTHROPIC_API_KEY: undefined })
    expect(cold.sessionId).toBe(opened.sessionId)
    // The conversation survives: both turns come back, attributed.
    expect(cold.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(cold.turns[0].markdown).toContain('About us')
    // …and the reason a turn cannot be run is reported alongside it.
    expect(cold.ready).toBe(false)
    expect(cold.error).toBeTruthy()
  })
})

// ── the stored form ──────────────────────────────────────────────────────────

describe('a transcript is stored in one language-neutral form', () => {
  it('test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable', async () => {
    const slug = nextSlug('neutral')
    await seedSite(slug)

    const opened = await open(slug)
    setModelClient(scriptedClient([says('A conversation written by the deployed host.')]))
    await frames(
      await post('/api/ai/prompt', {
        sessionId: opened.sessionId,
        text: 'Say something I can read back.',
      }),
    )

    const key = `chat/${TENANT}/${opened.sessionId}.md`
    const object = await env.SITES.get(key)
    expect(object, `no transcript at ${key}`).not.toBeNull()
    const stored = await object!.text()

    // THE FORM IS THE LIBRARY'S OWN, not a storage-shaped record of this host's:
    // an `xgd-session` JSON header followed by the `xgd-chat` transcript — the
    // same two halves `FileArchive` writes on the operator's machine and the same
    // the separate implementation of this session model reads.
    expect(stored.startsWith('<!-- xgd-session\n')).toBe(true)
    const header = JSON.parse(stored.slice('<!-- xgd-session\n'.length, stored.indexOf('\n-->'))) as
      Record<string, unknown>
    expect(header.id).toBe(opened.sessionId)
    // Nothing in it is particular to where it happens to be stored. A field
    // naming the bucket, the tenant or the database would make a transcript
    // belong to the runtime that wrote it rather than to the site.
    for (const foreign of ['bucket', 'r2', 'd1', 'tenant', 'tenantId', 'key', 'etag']) {
      expect(Object.keys(header), foreign).not.toContain(foreign)
    }
    // Both speakers, attributed, in the neutral markup.
    expect(stored).toContain('<!-- xgd-chat role="user"')
    expect(stored).toContain('<!-- xgd-chat role="assistant"')
    expect(stored).toContain('A conversation written by the deployed host.')

    // BYTE FOR BYTE. What the archive loads re-serialises to exactly the bytes on
    // the store, so the deployed host writes the neutral form itself rather than
    // a shape that merely converts to it.
    const archive = new R2TranscriptArchive(env.SITES, TENANT)
    const session = (await archive.load(opened.sessionId)) as { toFile(): string }
    expect(session.toFile()).toBe(stored)

    // AND IT TRAVELS. The same bytes, filed under a different site's conversation,
    // are replayed by that conversation with the same text and the same
    // attribution — nothing in the file binds it to the host or the session that
    // wrote it, which is what lets a conversation begun in one runtime be read by
    // the other.
    const other = nextSlug('portable')
    await seedSite(other)
    await env.SITES.put(`chat/${TENANT}/${sessionIdFor(other)}.md`, stored)

    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const carried = await open(other, { ANTHROPIC_API_KEY: DEPLOY_SECRET })
    expect(carried.sessionId).toBe(sessionIdFor(other))
    expect(carried.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(carried.turns[0].markdown).toContain('Say something I can read back.')
    expect(carried.turns[1].markdown).toContain('A conversation written by the deployed host.')
  })
})

// ── what the host is allowed to say ──────────────────────────────────────────

describe('no credential the host holds appears in anything it says', () => {
  it('test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream', async () => {
    // Deliberately full of characters a pattern matcher would treat as
    // metacharacters. The defence matches the value the host actually holds, so
    // it must not be a regex — and this is the key that proves it is not.
    const key = 'sk-ant-a+b.c*d[e]f$g|h(i)j?k^l-0123456789'
    // Prose that merely LOOKS like a credential. A scrubber that guessed by shape
    // would eat this and take the diagnostic with it.
    const decoy = 'sk-ant-this-string-is-ordinary-prose'

    const slug = nextSlug('secret')
    await seedSite(slug)

    // PATH ONE — a failure before a turn starts. The store's construction throws
    // from below with the request it tried to send embedded in the message, which
    // is exactly how this class of leak arrives: nobody wrote it.
    resetChatHost()
    const failing = await route(
      new Request(url('/api/ai/session'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      }),
      workerEnv({ ANTHROPIC_API_KEY: key }),
      {
        store: async () => {
          throw new Error(
            `upstream refused: {"authorization":"Bearer ${key}"} (compare ${decoy})`,
          )
        },
      },
    )
    const envelope = await failing.text()
    expect(failing.status).toBe(500)
    expect(envelope).not.toContain(key)
    // A visible marker stands where the value was…
    expect(envelope).toContain(REDACTED)
    // …the rest of the message survives, because a diagnostic scrubbed into
    // uselessness is its own failure…
    expect(envelope).toContain('upstream refused')
    // …and prose that merely resembles a credential is untouched.
    expect(envelope).toContain(decoy)

    // PATH TWO — a failure once the turn is already streaming, where there is no
    // status code left to change. The backend is the one component here that
    // holds the credential, so this is the path most likely to carry it.
    resetAiHost()
    resetChatHost()
    const opened = await open(slug, { ANTHROPIC_API_KEY: key })
    setModelClient({
      messages: {
        create: async () => {
          throw new Error(`upstream refused: sent key ${key} (compare ${decoy})`)
        },
      },
    })
    const turn = await post(
      '/api/ai/prompt',
      { sessionId: opened.sessionId, text: 'Go.' },
      { ANTHROPIC_API_KEY: key },
    )
    const body = await turn.text()
    expect(turn.status).toBe(200)
    expect(body).not.toContain(key)
    expect(body).toContain(REDACTED)
    expect(body).toContain('upstream refused')
    expect(body).toContain(decoy)
  })
})

// ── where a transcript lives ─────────────────────────────────────────────────

describe('transcripts live outside the region site files are addressed within', () => {
  it('test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record', async () => {
    const slug = nextSlug('private')
    // WITH A SITE FILE, so the region a request address is composed within is not
    // empty — otherwise every probe below would be refused for the uninteresting
    // reason that there was nothing there at all.
    await seedSite(slug, [{ name: LOGO.name, base64: btoa(LOGO.body) }])

    const opened = await open(slug)
    setModelClient(scriptedClient(addsPage('contact', 'Contact')))
    const secretish = 'Our best customer is Acme Ltd and they pay late.'
    await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: secretish }),
    )

    // Both artifacts exist: the conversation, and the record of what it did.
    const transcripts = await env.SITES.list({ prefix: `chat/${TENANT}/` })
    const audit = await env.SITES.list({ prefix: `audit/${TENANT}/${opened.sessionId}/` })
    expect(transcripts.objects.length).toBeGreaterThan(0)
    expect(audit.objects.length).toBeGreaterThan(0)

    // A site's own files are addressed within ONE region, and neither of these is
    // in it. Because a requested address is composed only within that region and
    // nothing derives a storage root from a request, there is nothing left to
    // sanitise.
    for (const object of [...transcripts.objects, ...audit.objects]) {
      expect(object.key.startsWith('draft/'), object.key).toBe(false)
    }
    const before = await storedKeys()
    expect(before).toContain(`draft/${TENANT}/${slug}/assets/${LOGO.name}`)

    // THE PROBES ARE NOT VACUOUS: an address composed within the site region does
    // reach a site file. What follows is the same machinery being asked for
    // something outside it.
    const reachable = await call(`/preview/${slug}/draft/assets/${LOGO.name}`)
    expect(reachable.status).toBe(200)
    expect(await reachable.text()).toContain('<svg')

    // Addresses constructed to reach them anyway — by naming the region outright,
    // and by climbing out of the site region with traversal segments.
    const probes = [
      `/preview/${encodeURIComponent(`chat/${TENANT}`)}/draft/${opened.sessionId}.md`,
      `/preview/${encodeURIComponent(`audit/${TENANT}`)}/draft/${opened.sessionId}/`,
      `/preview/${slug}/draft/..%2F..%2F..%2Fchat%2F${TENANT}%2F${opened.sessionId}.md`,
      `/preview/..%2F..%2Fchat/draft/${opened.sessionId}.md`,
      `/preview/${encodeURIComponent(`../../chat/${TENANT}`)}/draft/${opened.sessionId}.md`,
    ]
    for (const probe of probes) {
      const res = await call(probe)
      const body = await res.text()
      expect(res.status, probe).not.toBe(200)
      // Whatever it answered, it is not somebody's conversation and not the
      // record of what the assistant did.
      expect(body, probe).not.toContain(secretish)
      expect(body, probe).not.toContain('xgd-chat')
      expect(body, probe).not.toContain('tool_call')
    }

    // And nothing moved: asking for an address is a read, refused or not.
    expect(await storedKeys()).toEqual(before)
  })
})
