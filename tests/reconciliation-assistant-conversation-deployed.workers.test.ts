import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { route, resetChatHost } from '../apps/control-app/src/router'
import { sessionArchive } from '../apps/control-app/src/ai'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { REDACTED } from '../apps/control-app/src/redact'
import { resetAiHost, setModelClient, sessionIdFor } from '../tools/generate/src/cli/ai/host-core'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * **One continuing conversation, on the host that is actually deployed**
 * (story-a58a0974 — AC-1404, AC-1405, AC-1408, AC-1409, and AC-1057's deployed
 * half).
 *
 * The companion file `reconciliation-assistant-conversation.test.ts` proves the
 * same conversation contract against the host that runs on the operator's
 * machine. Four of these criteria are the ones that are only *about* the deployed
 * runtime — the credential arriving as a deploy secret, the transcript living in
 * the store the site belongs to rather than beside a directory, the storage
 * region a request can address, and what a raw failure is allowed to say on the
 * way out. None of them can be established from Node, so they run here.
 *
 * AC-1057 is different in kind: it is a property of the STORE rather than of
 * either host, and it says so — "do this on both hosts … since the store, not the
 * host, is what the replay comes from". Its local half lives next door; its
 * deployed half has to run here, because the deployed store is the other one.
 *
 * THE CARRIER CHANGED AND THE PROPERTIES DID NOT (REQ-160). The transcript was an
 * R2 object at `chat/<tenant>/<session>.md`; it is now a `chat_transcript` comment
 * on the conversation's own `chat` ticket in the account's ticket store, and the
 * R2 archive class is gone. AC-1057, AC-1405 and AC-1409 were written to
 * properties — through the store the site belongs to, one language-neutral form
 * byte for byte, reachable by no request address — and all three survive the swap
 * intact. What had to change is only where each one LOOKS. Their substance is
 * unchanged, which is why they are retargeted here rather than replaced by a
 * second pair of ticket-shaped criteria: two sets would make the two runtimes
 * stop being the same product in the matrix, which is the outcome the neutral
 * form exists to prevent.
 *
 * The *arrangement* the carrier now takes — one ticket per conversation, the
 * session file in one comment, the body reserved, the fold compare-and-set, the
 * cursor as a field — is AC-1792 / AC-1793 / AC-1794's, in
 * `reconciliation-assistant-conversation-ticket-archive.workers.test.ts`.
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
    // The ticket store's own bucket, and it is NOT `SITES`. Required since
    // REQ-160 homed the transcript in the ticket store: `ticketStoreFor` refuses
    // to build without a blob store, and the chat routes build one per isolate.
    BLOBS: env.BLOBS,
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

/**
 * The account's own ticket store — the conversation's home since REQ-160.
 *
 * Built here independently of the host's, and bound to one account by
 * `forTenant` when it is built. That binding is the confinement AC-1409 now
 * claims: there is no argument anywhere on this path that could name another
 * account's conversation, because the account is not composed into a key.
 */
const ticketStore = (tenant = TENANT): Promise<TicketStore> =>
  ticketStoreFor({ DB: env.DB, BLOBS: env.BLOBS, TENANT_ID: tenant })

/** The `chat` ticket homing `sessionId` in `tenant`'s store, or `null`. */
async function chatTicket(sessionId: string, tenant = TENANT): Promise<Ticket | null> {
  const { tickets } = await (await ticketStore(tenant)).query({
    predicate: 'type=chat',
    limit: 'all',
  })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

/** The session file, read back out of the carrier the deployed host wrote it into. */
async function storedSessionFile(sessionId: string, tenant = TENANT): Promise<string | null> {
  const chat = await chatTicket(sessionId, tenant)
  if (chat === null) return null
  const { comments } = await (await ticketStore(tenant)).comments({ uid: chat.uid })
  const transcript = comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')
  return transcript ? transcript.body : null
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
    // …and the reason a turn cannot be run is reported alongside it, naming the
    // credential that is missing rather than merely saying that something is.
    expect(cold.ready).toBe(false)
    expect(cold.error).toContain('ANTHROPIC_API_KEY')
  })
})

// ── the replay comes from the store, not from the host ───────────────────────

/**
 * AC-1057's deployed-host leg.
 *
 * The criterion's Verification asks for the restart-and-replay "on both hosts —
 * the operator's local one and the deployed one — since the store, not the host,
 * is what the replay comes from". Its companion in
 * `reconciliation-assistant-conversation.test.ts` is the local host, where the
 * store is a directory on disk; this is the host where it is the account's own
 * TICKET STORE, and the point of running it twice is that the same property holds
 * across two entirely different stores.
 *
 * "REMOVE THE CONVERSATION FROM THE STORE" IS `archive`, not a row deletion, and
 * that is the store's own answer rather than a weakening of the criterion: the
 * ticket component has no hard delete, and `archive` is its only removal — a
 * recycle bin the caller may work on the assumption is gone. An archived ticket
 * leaves every scan the store answers, so the archive that reads a conversation
 * back cannot find it, which is exactly the state the criterion asks for.
 *
 * The second half — delete the conversation and re-open to nothing — is what
 * makes the first half a statement about WHERE the turns live. Without it a
 * replay is equally consistent with a second copy cached somewhere else.
 */
describe('a conversation is replayed out of the deployed store after the host is gone', () => {
  it('test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart', async () => {
    const slug = nextSlug('replayed')
    await seedSite(slug)

    const opened = await open(slug)
    expect(opened.turns).toEqual([])

    setModelClient(scriptedClient([says('I will remember this after you restart me.')]))
    const events = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Remember this.' }),
    )
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)

    // Everything the host held — every cached manager, every cached host. This is
    // the restart, and it is the whole of what a replaced deployment does not
    // carry over.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const replayed = await open(slug)
    expect(replayed.sessionId).toBe(opened.sessionId)
    expect(replayed.ready, replayed.error).toBe(true)
    // Both turns, with their original text and attribution.
    expect(replayed.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(replayed.turns[0].markdown).toContain('Remember this.')
    expect(replayed.turns[1].markdown).toContain('I will remember this after you restart me.')

    // THE CONVERSATION LIVED IN THE STORE AND NOWHERE ELSE. Remove the site's
    // conversation from the store the site belongs to — which on this host means
    // the account's own ticket store, because that is where it now is — restart
    // again, and the same open yields an empty conversation. There is no second
    // copy to fall back on, and the replay above was reading this ticket.
    const chat = await chatTicket(opened.sessionId)
    expect(chat, `no chat ticket for ${opened.sessionId}`).not.toBeNull()
    const removable = (await ticketStore()) as unknown as {
      archive(a: { uid: string }): Promise<unknown>
    }
    await removable.archive({ uid: chat!.uid })

    resetAiHost()
    resetChatHost()

    const emptied = await open(slug)
    expect(emptied.sessionId).toBe(opened.sessionId)
    expect(emptied.turns).toEqual([])
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

    // READ BACK OUT OF THE CARRIER THIS HOST WROTE IT INTO — the `chat_transcript`
    // comment on the conversation's own ticket. Where the file is carried differs
    // by host; the form does not, which is the whole of this criterion.
    const read = await storedSessionFile(opened.sessionId)
    expect(read, `no transcript comment for ${opened.sessionId}`).not.toBeNull()
    const stored = read!

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
    //
    // The header does carry the library's own `chat_ticket_uid` — stamped by
    // `TicketSessionArchive` so a reopen knows which ticket the summary hangs off.
    // That is a field of the SESSION MODEL, present in both implementations of it
    // and written by the component rather than by either host, which is what the
    // criterion's "no host writes a storage-shaped record of its own" turns on.
    // The portability assertion below is what actually proves it costs nothing.
    for (const foreign of ['bucket', 'r2', 'd1', 'tenant', 'tenantId', 'key', 'etag']) {
      expect(Object.keys(header), foreign).not.toContain(foreign)
    }
    // Both speakers, attributed, in the neutral markup.
    expect(stored).toContain('<!-- xgd-chat role="user"')
    expect(stored).toContain('<!-- xgd-chat role="assistant"')
    expect(stored).toContain('A conversation written by the deployed host.')

    // BYTE FOR BYTE. What the archive loads re-serialises to exactly the bytes in
    // the carrier, so the deployed host writes the neutral form itself rather than
    // a shape that merely converts to it. The archive is the one the Worker itself
    // wires — `sessionArchive` over the account's ticket store — not a second
    // implementation written here.
    const archive = sessionArchive(await ticketStore())
    const session = (await archive.load(opened.sessionId)) as { toFile(): string }
    expect(session.toFile()).toBe(stored)

    // AND IT TRAVELS. The same bytes, filed as a different site's conversation,
    // are replayed by that conversation with the same text and the same
    // attribution — nothing in the file binds it to the host or the session that
    // wrote it, which is what lets a conversation begun in one runtime be read by
    // the other.
    const other = nextSlug('portable')
    await seedSite(other)
    const carriedStore = await ticketStore()
    const { ticket: home } = await carriedStore.create({
      type: 'chat',
      title: sessionIdFor(other),
      fields: { session_id: sessionIdFor(other) },
    })
    await carriedStore.comment({ uid: home.uid, kind: 'chat_transcript', body: stored })

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

/**
 * AC-1409, retargeted at the carrier and STRENGTHENED rather than weakened.
 *
 * The object-backed transcript's isolation was that its key sat outside the site
 * region and nothing derived a storage root from a request — true, and held by a
 * comment. The conversation is now in a store whose handle is bound to one
 * account when it is built, so there is no argument on that path that could name
 * another account's conversation even if the caller knew its identifier. So the
 * criterion keeps its original claim (no request address names a transcript or
 * the record) and gains two observations: the conversation is not in the
 * addressable object storage AT ALL, and two accounts' handles cannot reach each
 * other's.
 *
 * The audit record is unchanged and stays in R2, one object per record outside
 * `draft/` — the trade the intent states explicitly and the matrix does not
 * revisit.
 */
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
    const transcript = await storedSessionFile(opened.sessionId)
    const audit = await env.SITES.list({ prefix: `audit/${TENANT}/${opened.sessionId}/` })
    expect(transcript).not.toBeNull()
    expect(transcript).toContain(secretish)
    expect(audit.objects.length).toBeGreaterThan(0)

    const before = await storedKeys()

    // THE CONVERSATION IS NOT IN THE ADDRESSABLE STORAGE AT ALL. It is in the
    // account-bound ticket store, reached through a handle bound to one account
    // when it is built — so the probes below are not merely refused an address,
    // there is no object for any address to name.
    for (const key of before) {
      const object = await env.SITES.get(key)
      const body = object === null ? '' : await object.text()
      expect(body, key).not.toContain(secretish)
      expect(body, key).not.toContain('xgd-chat')
    }

    // The record of what the assistant did IS still one object per record in
    // shared storage, and it is filed outside the region site files are addressed
    // within. A requested address is composed only within that region and nothing
    // derives a storage root from a request, so there is nothing left to sanitise.
    for (const object of audit.objects) {
      expect(object.key.startsWith('draft/'), object.key).toBe(false)
    }
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

    // CONFINED BY THE HANDLE, NOT BY A KEY CONVENTION. Two accounts' own handles,
    // each holding a conversation: neither can reach the other's, and there is no
    // address or identifier that changes that, because the account is bound into
    // the handle when it is built rather than composed into a key the caller
    // supplies.
    const neighbour = `${TENANT}-neighbour`
    const theirs = await ticketStore(neighbour)
    const { ticket: theirChat } = await theirs.create({
      type: 'chat',
      title: opened.sessionId,
      fields: { session_id: opened.sessionId },
    })
    await theirs.comment({
      uid: theirChat.uid,
      kind: 'chat_transcript',
      body: 'Somebody else’s conversation entirely.',
    })

    // The neighbour's handle, asked for the very same session identifier, answers
    // with the neighbour's own conversation and never with ours…
    const theirFile = await storedSessionFile(opened.sessionId, neighbour)
    expect(theirFile).toContain('Somebody else')
    expect(theirFile).not.toContain(secretish)
    // …and ours is unchanged and still ours.
    expect(await storedSessionFile(opened.sessionId)).toBe(transcript)

    // Nor can either handle so much as see the other's ticket by uid — existence
    // is not leaked across the barrier.
    const ours = await ticketStore()
    await expect(ours.get({ uid: theirChat.uid })).rejects.toThrow()
  })
})
