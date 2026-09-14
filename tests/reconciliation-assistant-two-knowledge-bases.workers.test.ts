import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  route,
  resetChatHost,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import {
  SYSTEM_KB,
  systemKnowledge,
  type SystemKbBundle,
} from '../apps/control-app/src/system-knowledge'
import { PROJECT_KB, projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import {
  CURSOR_FIELD,
  advance,
  deltaLine,
  storedCursor,
  type Cursor,
} from '../apps/control-app/src/session-delta'
import {
  coRank,
  sessionKnowledgeFor,
  sessionKnowledgeSurface,
  type RankedHit,
} from '../apps/control-app/src/session-knowledge'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { STUB_DIM, stubEmbedder, stubVector } from './support/stub-embedder'
import { modelSaw, says, scriptedClient } from './support/scripted-model-client'

/**
 * **Two knowledge bases in one conversation, and the channel that says one of
 * them grew** (story-3cf3d57b — AC-1795 … AC-1799, AC-1802 … AC-1808).
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own route table, against a real D1 database and a real R2 bucket. The
 * conversation is opened and driven through `/api/ai/session` and
 * `/api/ai/prompt`; its transcript and its bookmark live on a real `chat` ticket
 * written by the component's own archive; the landscapes are real awareness
 * reports read by the component's own priming; the arrival sweep is the
 * component's own corpus resolution with a `since` bound. Nothing here
 * reimplements any of it.
 *
 * TWO DOUBLES, AND BOTH ARE MODEL BOUNDARIES. The Anthropic client, because a UAT
 * that called it would be asserting a sentence rather than a mechanism; and the
 * embedder, for the reasons `tests/support/stub-embedder.ts` sets out — it is the
 * component's declared model seam, no claim here is about embedding quality, and
 * miniflare has no local Workers AI to reach. The shipped corpus is planted by
 * this file rather than read off the release bundle, because that bundle is
 * whatever `1c kb build` last exported and a test asserting against it would be
 * asserting against whichever documents happened to be exported that week.
 *
 * WHAT THE CONTEXT IS READ THROUGH. {@link modelSaw}, never `request.system`: the
 * per-turn reminder rides the TAIL of the last message rather than the system
 * channel, and a suite reading only `system` would silently report every arrival
 * notice as absent — which is what half of these assertions want to see.
 *
 * ONE TENANT PER CASE. The arrival feed and the awareness report are both
 * properties of a whole client corpus, so cases sharing a tenant would leak each
 * other's uploads and each other's maps into assertions about "what arrived since
 * your last turn". A tenant is a hard barrier in the store, so a tenant per case
 * is the isolation the product itself provides.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The stamp the planted shipped corpus is indexed and served under. */
const STAMP = '2026-01-01T00:00:00Z'

/** The fact that exists nowhere but the planted shipped document. */
const SHIPPED_FACT = 'A page is a tree of typed elements held in the draft store.'

/** The shipped map's territory heading, and the shipped document's title. */
const SHIPPED_TERRITORY = 'Storage and publishing'
const SHIPPED_TITLE = 'How pages are stored'

let tenant = ''
let tenants = 0

/**
 * A Workers AI binding answering with the stub's vectors, widened.
 *
 * `projectKnowledgeFor` builds its own `WorkersAiEmbedder` from `env.AI` — which
 * is right, it is the one place the account's model is named — so a suite cannot
 * substitute the embedder without substituting the binding under it. This is that
 * binding, answering in Workers AI's own `{shape, data}` payload with stub vectors
 * zero-padded to the declared width. Padding with zeros preserves the unit norm,
 * so the dot product the component takes as a cosine is still a real overlap
 * measure.
 */
function fakeWorkersAi(): { run(model: string, input: unknown): Promise<unknown> } {
  return {
    async run(_model: string, input: unknown) {
      const texts = ((input as { text: string[] }).text ?? []) as string[]
      const data = texts.map((text) => {
        const row = new Array<number>(384).fill(0)
        const narrow = stubVector(text)
        for (let i = 0; i < STUB_DIM; i++) row[i] = narrow[i]
        return row
      })
      return { shape: [data.length, 384], data }
    },
  }
}

/** The shipped corpus: one document and the map that routes to it. */
const CORPUS: Record<string, string> = {
  'doc-storage.md': `---
uid: doc-storage
type: doc
title: ${SHIPPED_TITLE}
status: active
---

# ${SHIPPED_TITLE}

${SHIPPED_FACT}
`,
  'awareness.md': `---
uid: doc-awareness-system
type: system
title: 'Awareness map: system'
status: active
fields:
  kind: awareness_report
  kb: system
---

# Awareness map: system

## ${SHIPPED_TERRITORY}

*1 document · entry point: ${SHIPPED_TITLE} (doc-storage)*

Where a page lives before anybody else can see it.
`,
}

/**
 * The bundle built by the component's own index builders.
 *
 * `memoryIndexSource()` is writable and reports its own `files()`, which is
 * exactly the residency the release emitter serialises — so this is not a stand-in
 * for the build, it is the build's final step run in the runtime that consumes it.
 */
async function fixtureBundle(): Promise<SystemKbBundle> {
  const docs: SystemKbBundle['docs'] = {}
  for (const [name, text] of Object.entries(CORPUS)) docs[name] = { text, updated_at: STAMP }
  const store = new DocDirStore(bundleDocReader(docs), { type: 'doc' })
  const kbs = new Map([
    [
      SYSTEM_KB,
      {
        name: SYSTEM_KB,
        description: 'Test system knowledge.',
        corpus: { types: new Set(['doc']), terms: new Map() },
        landscape: 'authored',
        source: 'shipped',
        weight: 1,
      },
    ],
  ])
  const embedder = stubEmbedder()
  const sources = { shipped: store }
  const index = memoryIndexSource()
  const chunks = memoryIndexSource()
  await buildIndex(store, kbs, index, { embedder, sources })
  await buildChunkIndex(store, kbs, chunks, { embedder, sources })
  return { index: index.files(), chunks: chunks.files(), docs }
}

const fixtureRuntime = async (): Promise<unknown> =>
  systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() })

const deps: RouterDeps = { knowledge: fixtureRuntime }

/**
 * The deployed origin.
 *
 * @param opts.ai `false` drops the Workers AI binding, which is the ONLY way a
 *   conversation opens with no client knowledge at all: `sessionKnowledgeFor`
 *   needs an embedder for the tenant's half and the shipped half needs none.
 */
function workerEnv({ ai = true }: { ai?: boolean } = {}): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ...(ai ? { AI: fakeWorkersAi() } : {}),
  } as unknown as RouterEnv
}

const post = (path: string, body: unknown, opts?: { ai?: boolean }): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(opts),
    deps,
  )

/** Read an SSE body back into the frames the chat panel would see. */
async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

const tickets = (): Promise<TicketStore> => ticketStoreFor(workerEnv())

/** A site, imported through the Worker's own route. */
async function seedSite(slug: string, opts?: { ai?: boolean }): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post(
    '/api/import',
    {
      slug: seed.slug,
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({
        name,
        page: page as Record<string, unknown>,
      })),
      assets: [] as { name: string; base64: string }[],
    },
    opts,
  )
  expect(res.status).toBe(200)
}

/** A seeded site with a conversation open on it. */
async function conversation(
  prefix: string,
  opts?: { ai?: boolean },
): Promise<{ slug: string; sessionId: string }> {
  const slug = nextSlug(prefix)
  await seedSite(slug, opts)
  const opened = await post('/api/ai/session', { slug }, opts)
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { slug, sessionId }
}

/**
 * One turn, and everything the model was sent for it.
 *
 * The turn is asserted to have reached `done` before the context is read, so a
 * turn that failed mid-stream is a failure here rather than an empty string
 * downstream.
 */
async function takeTurn(sessionId: string, text: string, opts?: { ai?: boolean }): Promise<string> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const events = await frames(await post('/api/ai/prompt', { sessionId, text }, opts))
  expect(events.at(-1)?.kind).toBe('done')
  const spoken = events
    .filter((event) => event.kind === 'text')
    .map((event) => event.content ?? '')
    .join('')
  // THE TURN ANSWERED, rather than streaming a failure. `streamTurn` renders a
  // thrown error as an italic text frame followed by `done`, so a turn that broke
  // is indistinguishable from one that worked to a test that only checks for
  // `done` — and the model is never reached, which is why the assertion is paired
  // with the streamed text: the failure then names the cause instead of reporting
  // an empty recording.
  expect(spoken, spoken).toBe('Noted.')
  expect(client.seen).toHaveLength(1)
  return modelSaw(client.seen[0])
}

/** A `material` in the client's own knowledge — the happy shape [[DOC-38]] §9. */
async function upload(title: string, body: string): Promise<Ticket> {
  const { ticket } = await (await tickets()).create({
    type: 'material',
    title,
    fields: {
      rights: 'owned',
      republishable: true,
      exportable: false,
      origin: 'uploaded',
      kind: 'document',
    },
    body,
  })
  return ticket
}

/** The client's map, published directly, when the case only needs one to exist. */
async function publishProjectMap(body: string): Promise<Ticket> {
  const { ticket } = await (await tickets()).create({
    type: 'system',
    title: `Awareness map: ${PROJECT_KB}`,
    fields: { kind: 'awareness_report', kb: PROJECT_KB },
    body,
  })
  return ticket
}

/** The client's knowledge base, opened the way the Worker opens it. */
async function clientKnowledge(): Promise<Untyped> {
  return projectKnowledgeFor(workerEnv(), { store: await tickets() })
}

/** The `chat` ticket homing one conversation. */
async function chatTicket(sessionId: string): Promise<Ticket | null> {
  const { tickets: all } = await (await tickets()).query({ predicate: 'type=chat', limit: 'all' })
  return all.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

/** The wording every arrival notice opens with, and nothing else does. */
const ARRIVAL = /entered this client's knowledge since your last turn/

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  tenants += 1
  tenant = `bundle27-${tenants}`
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-1795: one landscape, both maps ────────────────────────────────────────

describe('a cold conversation is primed with both maps in one landscape section', () => {
  it('test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first', async () => {
    // ONE LANDSCAPE SECTION, NOT TWO. Splitting them would put the assistant back
    // where it had to know which KIND of thing it was looking for before it could
    // look — and a question half-answered by a design document and half by the
    // client's own paper has no such kind.
    const { slug, sessionId } = await conversation('prime')
    void slug
    await publishProjectMap(
      '# Awareness map: project\n\n## Brand and positioning\n\nWhat this client sounds like.\n',
    )

    const context = await takeTurn(sessionId, 'Hello.')

    const landscape = context.indexOf('# What exists')
    const purpose = context.indexOf('You look after a website for someone who is not technical')
    const mechanism = context.indexOf('# How to search')
    const closing = context.indexOf('Knowledge bases you can search:')
    const client = context.indexOf('Brand and positioning')
    const ours = context.indexOf(SHIPPED_TERRITORY)

    // A landscape section exists, and BOTH maps are inside it — after its heading
    // and before the purpose.
    expect(landscape).toBeGreaterThanOrEqual(0)
    expect(client).toBeGreaterThan(landscape)
    expect(ours).toBeGreaterThan(landscape)
    expect(client).toBeLessThan(purpose)
    expect(ours).toBeLessThan(purpose)

    // THE CLIENT'S MAP COMES FIRST. Their material is what the conversation is
    // about; the role purpose already frames standing capability.
    expect(client).toBeLessThan(ours)

    // Then purpose, then how to search, then the closing line — the order the
    // criterion names, asserted as an order rather than as four presences.
    expect(purpose).toBeGreaterThan(landscape)
    expect(mechanism).toBeGreaterThan(purpose)
    expect(closing).toBeGreaterThan(mechanism)

    // THERE IS NO SECOND LANDSCAPE SECTION — the clause that keeps everything
    // above from being satisfied by two sections that happen to be in this order.
    expect(context.split('# What exists')).toHaveLength(2)

    // And what the conversation is TOLD exists matches what it was GRANTED: both
    // knowledge bases are named as searchable.
    expect(context).toContain(`Knowledge bases you can search: ${PROJECT_KB}, ${SYSTEM_KB}.`)
  })
})

// ── AC-1796: a small client corpus is listed in full, and says so ────────────

describe('a client corpus small enough to list reaches the conversation in full', () => {
  it('test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete', async () => {
    // Below the floor a complete listing beats a summary, and LABELLING IT AS
    // COMPLETE is not decoration: a short list read as "knowledge here is thin"
    // produces very different behaviour in front of a new client than the same
    // list read as "this is everything there is".
    const { sessionId } = await conversation('listing')
    await upload('The kitchen at dusk', 'A photograph of the restaurant at closing time.')

    const built = await (await clientKnowledge()).rebuildMap()
    expect(built.mode).toBe('enumerated')

    const context = await takeTurn(sessionId, 'What do you already have of mine?')

    // Every document in it is named…
    expect(context).toContain('The kitchen at dusk')
    // …and the listing says, in so many words, that it is everything there is.
    expect(context).toContain('small enough to list in full')
  })
})

// ── AC-1797: one search, two knowledge bases, one ranked list ────────────────

describe('one search reaches both knowledge bases and returns one ranked list', () => {
  it('test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after', async () => {
    // The surface is built by the same two production functions the chat host
    // calls, over the same two runtimes — the tenant's D1-backed corpus and the
    // planted shipped bundle — so what is searched here is what a conversation
    // searches.
    await conversation('search')
    await upload('Ravenswood positioning note', 'We sell to independent restaurants.')
    await upload('Ravenswood winter menu', 'Six courses, from November.')
    const client = await clientKnowledge()
    await client.refreshIndex()

    const knowledge = await sessionKnowledgeFor(workerEnv(), {
      system: await fixtureRuntime(),
      tickets: await tickets(),
    })
    expect(knowledge).not.toBeNull()
    const { surface } = sessionKnowledgeSurface(knowledge!)
    const search = (args: Record<string, unknown>): Promise<RankedHit[]> =>
      (surface as Untyped).search(args) as Promise<RankedHit[]>

    // A query both corpora can answer: the client's own papers, and the shipped
    // document about how a page is stored.
    const both = await search({
      query: 'how pages are stored for independent restaurants',
      top_k: 3,
    })

    // BOTH SIDES ARE REACHED, in one list.
    const reached = new Set(both.flatMap((hit) => hit.kbs))
    expect(reached.has(PROJECT_KB)).toBe(true)
    expect(reached.has(SYSTEM_KB)).toBe(true)

    // ORDERED BY THE SCORE EACH SIDE ITSELF PRODUCED — descending, with no
    // re-ranking in between, so there is exactly one answer to how hits are
    // ordered.
    const scores = both.map((hit) => hit.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))

    // CUT TO `top_k` AFTER MERGING, not before: three over two corpora is three
    // in total rather than three per side.
    expect(both).toHaveLength(3)

    // TIES COME BACK CLIENT'S-MATERIAL-FIRST, the same precedence the landscape
    // uses. Asserted on the merge itself, because two hits scoring identically
    // across two real corpora cannot be arranged by choosing the documents.
    const tie = (title: string, kb: string): RankedHit => ({
      uid: `uid-${title}`,
      title,
      score: 0.5,
      kbs: [kb],
    })
    expect(
      coRank([[tie('the client paper', PROJECT_KB)], [tie('a design document', SYSTEM_KB)]], 2).map(
        (hit) => hit.title,
      ),
    ).toEqual(['the client paper', 'a design document'])

    // RESTRICTED TO ONE KNOWLEDGE BASE, only that one is reached.
    const only = await search({ query: 'independent restaurants', kb: [PROJECT_KB], top_k: 5 })
    expect(only.length).toBeGreaterThan(0)
    expect(new Set(only.flatMap((hit) => hit.kbs))).toEqual(new Set([PROJECT_KB]))

    // AND A KNOWLEDGE BASE THIS CONVERSATION WAS NEVER GRANTED IS REFUSED AS
    // UNKNOWN — not answered with an empty list, which reads as a working query
    // over a corpus that happens to hold nothing.
    await expect(search({ query: 'anything', kb: ['ledger'] })).rejects.toMatchObject({
      code: 'unknown_kb',
    })
  })
})

// ── AC-1798: the sentence the whole story exists for ────────────────────────

describe('a document uploaded mid-conversation is known by name on the next turn', () => {
  it('test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild', async () => {
    // NO MAP IS PUBLISHED HERE AT ALL, and that is the point: nothing about the
    // landscape changes between the two turns, so if the assistant learns of the
    // document it is because the arrival notice told it. A map is a description,
    // not a notification.
    const { sessionId } = await conversation('arrival')
    const before = await takeTurn(sessionId, 'Do you have any positioning material?')
    expect(before).not.toContain('Ravenswood positioning note')

    await upload('Ravenswood positioning note', 'We sell to independent restaurants.')
    const client = await clientKnowledge()
    // The index, and ONLY the index. `refreshIndex` is what makes a document
    // findable; the map is a separate, slower clock and this case turns it
    // deliberately — the assertion below proves none was ever built.
    await client.refreshIndex()
    expect(await client.publishedMap()).toBeNull()

    const after = await takeTurn(sessionId, 'I have just uploaded it.')

    // BY NAME…
    expect(after).toContain('Ravenswood positioning note')
    // …and as one document, in the singular. "1 documents" is the tell of a
    // machine-written line, and this one is read by something very good at
    // noticing register.
    expect(after).toMatch(/1 document entered this client's knowledge/)

    // AND IT CAN BE ANSWERED FROM: the document is retrievable through an
    // ordinary search, not merely announced.
    const knowledge = await sessionKnowledgeFor(workerEnv(), {
      system: await fixtureRuntime(),
      tickets: await tickets(),
    })
    const { surface } = sessionKnowledgeSurface(knowledge!)
    const hits = (await (surface as Untyped).search({
      query: 'independent restaurants positioning',
      top_k: 5,
    })) as RankedHit[]
    expect(hits.map((hit) => hit.title)).toContain('Ravenswood positioning note')

    // Still no map. The claim is "without a rebuild in between", so the absence
    // is asserted after the turn as well as before it.
    expect(await client.publishedMap()).toBeNull()
  })
})

// ── AC-1799: a quiet turn carries nothing at all ────────────────────────────

describe('a turn on which nothing arrived carries no arrival notice at all', () => {
  it('test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind', async () => {
    // NOT "nothing new", NOT a heading, NOT an empty line a caller could join into
    // the turn's context by accident. A line that appears every turn and is almost
    // always empty teaches the model to skim exactly the region the non-empty case
    // has to be noticed in.
    const { sessionId } = await conversation('quiet')
    await takeTurn(sessionId, 'Hello.')

    const second = await takeTurn(sessionId, 'Anything else?')
    expect(second).not.toMatch(ARRIVAL)
    expect(second).not.toMatch(/document[s]? entered/)

    // The same rule at the level of the notice itself: asked for a notice over an
    // empty set of arrivals, the answer is the ABSENCE of a notice rather than an
    // empty or placeholder string. `null` rather than `''` so a caller cannot
    // append it by accident.
    expect(deltaLine([])).toBeNull()
  })
})

// ── AC-1802: announced once, boundary and ties included ─────────────────────

describe('an arrival is announced once and never again', () => {
  it('test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice', async () => {
    const { sessionId } = await conversation('once')
    await takeTurn(sessionId, 'Hello.')

    await upload('Winter menu', 'Six courses, from November.')
    const first = await takeTurn(sessionId, 'Take a look.')
    expect(first).toContain('Winter menu')

    // THE SECOND TURN IS SILENT ABOUT IT. The change feed's bound is inclusive —
    // chosen so an indexer cannot miss a document written in the same instant its
    // bookmark was taken — so a bookmark that remembered only the instant would
    // re-announce this document every turn for the rest of the conversation.
    const second = await takeTurn(sessionId, 'Anything new?')
    expect(second).not.toContain('Winter menu')
    expect(second).not.toMatch(ARRIVAL)

    // Several documents, then one turn: all are named once…
    await upload('Supplier agreement', 'Signed with the dairy in August.')
    await upload('Brand guidelines', 'Ravenswood green, and the serif.')
    await upload('Q3 positioning note', 'We sell to independent restaurants.')
    const bulk = await takeTurn(sessionId, 'I added a few things.')
    expect(bulk).toContain('3 documents')
    for (const title of ['Supplier agreement', 'Brand guidelines', 'Q3 positioning note']) {
      expect(bulk).toContain(title)
    }
    // …and none on the next.
    const quiet = await takeTurn(sessionId, 'And now?')
    expect(quiet).not.toMatch(ARRIVAL)

    // A BULK IMPORT WRITES MANY DOCUMENTS IN ONE INSTANT, and remembering only one
    // of them would re-announce the rest forever. Asserted on the bookmark
    // arithmetic, because an instant shared by several writes is a property of the
    // clock rather than something a test can arrange by uploading faster.
    const tie = '2026-09-01T10:00:00Z'
    const moved = advance({ at: '2026-09-01T09:00:00Z', seen: [] }, [
      { uid: 'material-a', title: 'a', updated_at: tie },
      { uid: 'material-b', title: 'b', updated_at: tie },
      { uid: 'material-c', title: 'c', updated_at: '2026-09-01T09:30:00Z' },
    ])
    expect(moved.at).toBe(tie)
    expect([...moved.seen].sort()).toEqual(['material-a', 'material-b'])

    // …and what the conversation has been told about stops being tracked once the
    // boundary passes it, so what is remembered is bounded by one instant's worth
    // of ties and never grows with the size of the client's knowledge.
    expect(
      advance(moved, [{ uid: 'material-d', title: 'd', updated_at: '2026-09-01T11:00:00Z' }]),
    ).toEqual({ at: '2026-09-01T11:00:00Z', seen: ['material-d'] })
  })
})

// ── AC-1803: an unreadable bookmark costs a sweep, never a turn ─────────────

describe('an unreadable record of what a conversation was told never costs the turn', () => {
  it('test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn', async () => {
    const { sessionId } = await conversation('bookmark')

    // ABSENT: the first turn of any conversation has no bookmark at all, and it
    // is an ordinary turn.
    const cold = await takeTurn(sessionId, 'Hello.')
    expect(cold.length).toBeGreaterThan(0)

    const store = await tickets()
    const chat = await chatTicket(sessionId)
    expect(chat).not.toBeNull()

    // CORRUPT: text that cannot be read back as a record at all.
    await store.update({ uid: chat!.uid, patch: { fields: { [CURSOR_FIELD]: 'not json' } } })
    const client = scriptedClient([says('Still here.')])
    setModelClient(client)
    const corrupt = await frames(
      await post('/api/ai/prompt', { sessionId, text: 'Carry on.' }),
    )
    // The turn RUNS AND STREAMS — no refusal, and no error surfaced to the client.
    expect(corrupt.at(-1)?.kind).toBe('done')
    expect(corrupt.filter((event) => event.kind === 'text').map((e) => e.content).join('')).toBe(
      'Still here.',
    )

    // EMPTY: the same judgement, one step further.
    await store.update({ uid: chat!.uid, patch: { fields: { [CURSOR_FIELD]: '' } } })
    const empty = await takeTurn(sessionId, 'And again.')
    expect(empty.length).toBeGreaterThan(0)

    // The worst consequence is one over-wide sweep, which re-announces a document
    // at most — never a refused conversation.
    expect(storedCursor({ fields: { [CURSOR_FIELD]: 'not json' } } as never)).toBeNull()
    expect(storedCursor({ fields: {} } as never)).toBeNull()
    expect(storedCursor(null)).toBeNull()

    // READABLE BUT PARTIAL IS ACCEPTED AT FACE VALUE — a boundary with no list of
    // what sat on it yields that boundary and an empty list, rather than being
    // discarded for the wider sweep.
    expect(
      storedCursor({
        fields: { [CURSOR_FIELD]: '{"at":"2026-09-01T10:00:00Z"}' },
      } as never),
    ).toEqual({ at: '2026-09-01T10:00:00Z', seen: [] } satisfies Cursor)
  })
})

// ── AC-1804: coverage begins where the map's ends ───────────────────────────

describe("a conversation's coverage starts where the map's coverage ends", () => {
  it('test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn', async () => {
    // THE CASE THAT WOULD OTHERWISE FALL THROUGH: a document uploaded after the
    // last rebuild and before the conversation opened belongs to neither the map
    // (which predates it) nor a start-of-conversation bookmark (which postdates
    // it), so it would be invisible to a conversation with every right to know.
    await seedSite(nextSlug('gap'))
    await upload('Described by the map', 'Already in the client map when it was built.')
    const client = await clientKnowledge()
    const built = await client.rebuildMap()
    expect(built.mode).toBe('enumerated')

    await upload('Arrived in the gap', 'Uploaded after the map was built.')

    const gap = await conversation('gap')
    const first = await takeTurn(gap.sessionId, 'Hello.')

    // The document that arrived in the gap is announced on the very first turn…
    expect(first).toContain('Arrived in the gap')
    // …and the one the map already describes is NOT announced as new. The two are
    // complementary rather than overlapping.
    expect(first).toMatch(/1 document entered this client's knowledge/)
    const notice = first.slice(first.search(ARRIVAL))
    expect(notice).not.toContain('Described by the map')
    // It is still known — it is in the map the conversation was primed with.
    expect(first).toContain('Described by the map')

    // THE SAME RULE READ AT ITS OTHER END. With no map ever built, coverage begins
    // when the conversation does: a description that covers nothing ends where the
    // conversation starts.
    tenants += 1
    tenant = `bundle27-${tenants}`
    resetAiHost()
    resetChatHost()

    const fresh = await conversation('nomap')
    expect(await (await clientKnowledge()).publishedMap()).toBeNull()
    const cold = await takeTurn(fresh.sessionId, 'Hello.')
    expect(cold).not.toMatch(ARRIVAL)

    await upload('Uploaded after we started', 'Nothing described this before.')
    const next = await takeTurn(fresh.sessionId, 'Just added something.')
    expect(next).toContain('Uploaded after we started')
  })
})

// ── AC-1805: a resumed conversation covers the gap by itself ────────────────

describe("a resumed conversation's first turn back reports what arrived while away", () => {
  it('test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served', async () => {
    const { slug, sessionId } = await conversation('resume')
    await takeTurn(sessionId, 'Hello.')

    await upload('Supplier agreement', 'Signed with the dairy in August.')

    // EVERYTHING HELD IN MEMORY IS DROPPED — which is what a reload, an eviction
    // and a redeploy all look like from here. What survives is what was persisted:
    // the conversation's ticket, and the bookmark on it.
    resetAiHost()
    resetChatHost()
    const reopened = await post('/api/ai/session', { slug })
    expect(reopened.status).toBe(200)

    // THERE IS NO SEPARATE "WHILE YOU WERE AWAY" REPORT, and none is needed: the
    // ordinary per-turn notice sweeps from where the conversation was left, so the
    // gap is covered by the mechanism that was already there.
    const back = await takeTurn(sessionId, 'I am back.')
    expect(back).toContain('Supplier agreement')
    expect(back).toMatch(ARRIVAL)
  })
})

// ── AC-1806: a conversation is never announced to itself ────────────────────

describe('a conversation is never announced to itself', () => {
  it('test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus', async () => {
    // The conversation's own record is written by the very sweep that would report
    // it — the bookmark lives on it, and is written the moment a turn begins — so
    // a sweep that treated conversations as arrivals would announce the
    // conversation to itself on every turn, forever.
    const { sessionId } = await conversation('selfref')
    await takeTurn(sessionId, 'Hello.')

    const chat = await chatTicket(sessionId)
    expect(chat).not.toBeNull()

    const second = await takeTurn(sessionId, 'Second turn.')
    // No notice at all, and the conversation is not named as arrived material.
    expect(second).not.toMatch(ARRIVAL)
    expect(second).not.toContain(`"${sessionId}"`)
    expect(second).not.toContain(`"${chat!.uid}"`)

    // AND IT IS STILL A MEMBER OF THE CLIENT'S KNOWLEDGE. The exclusion is the
    // arrival notice's alone: conversations remain in the corpus, remain indexed,
    // and remain described by the map.
    const corpus = (await (await clientKnowledge()).corpus()) as Ticket[]
    expect(corpus.map((ticket) => ticket.uid)).toContain(chat!.uid)
  })
})

// ── AC-1807: the notice is last in the turn's context ───────────────────────

describe("the arrival notice is last in a turn's context", () => {
  it('test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change', async () => {
    const { slug, sessionId } = await conversation('placement')
    await publishProjectMap(
      '# Awareness map: project\n\n## Brand and positioning\n\nWhat this client sounds like.\n',
    )
    await takeTurn(sessionId, 'Hello.')

    // BOTH SIGNALS SINCE THE PREVIOUS TURN. The client edited their own site — a
    // write through the store port, which is the only thing the host compares —
    // and uploaded a document. The two ride the same channel and this is the case
    // that pins their order relative to each other.
    const sites = await storeFor(workerEnv())
    await sites.appendChange(slug, {
      actor: 'client',
      op: 'copy.set',
      page: 'home',
      summary: 'the client rewrote the headline',
    })
    await upload('Ravenswood positioning note', 'We sell to independent restaurants.')

    const context = await takeTurn(sessionId, 'What changed?')

    const landscape = context.indexOf('# What exists')
    const purpose = context.indexOf('You look after a website for someone who is not technical')
    const mechanism = context.indexOf('# How to search')
    const siteChanged = context.indexOf('Your user has changed this site since your last turn')
    const notice = context.search(ARRIVAL)

    expect(siteChanged).toBeGreaterThanOrEqual(0)
    expect(notice).toBeGreaterThanOrEqual(0)

    // ORDER IS A COST DECISION HERE, NOT A PRESENTATION ONE. The maps and the
    // manual are identical from turn to turn and the notice is not, so the
    // volatile material sits last and the stable prefix in front of it can be
    // reused for the life of the conversation.
    expect(notice).toBeGreaterThan(landscape)
    expect(notice).toBeGreaterThan(purpose)
    expect(notice).toBeGreaterThan(mechanism)
    expect(notice).toBeGreaterThan(siteChanged)

    // WITH NOTHING FOLLOWING IT.
    expect(context.trimEnd().endsWith('Search for anything you need from them.')).toBe(true)

    // A further turn, with only an arrival, and it is still last.
    await upload('Winter menu', 'Six courses, from November.')
    const again = await takeTurn(sessionId, 'And this one?')
    expect(again).toContain('Winter menu')
    expect(again).not.toContain('Your user has changed this site since your last turn')
    expect(again.trimEnd().endsWith('Search for anything you need from them.')).toBe(true)
  })
})

// ── AC-1808: arrivals are the client's knowledge alone ──────────────────────

describe("arrivals are the client's knowledge alone, and no client knowledge still takes turns", () => {
  it('test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs', async () => {
    // NO CLIENT KNOWLEDGE AT ALL IS AN ORDINARY STATE. Without an embedding model
    // the tenant's half cannot be opened — the shipped half needs none — so this
    // is a conversation with exactly one knowledge base, and it is a working one.
    const shippedOnly = await conversation('shipped', { ai: false })
    const first = await takeTurn(shippedOnly.sessionId, 'Hello.', { ai: false })

    // THE PRIMING AND THE GRANT NAME THAT KNOWLEDGE BASE ALONE. A conversation is
    // never told it can search a corpus that would answer nothing.
    expect(first).toContain(`Knowledge bases you can search: ${SYSTEM_KB}.`)
    expect(first).not.toContain(`${PROJECT_KB}, ${SYSTEM_KB}`)
    expect(first).toContain(SHIPPED_TERRITORY)

    // AND NO ARRIVAL NOTICE EVER APPEARS. A `material` written into the client's
    // store would be announced to any conversation that had opened their corpus;
    // this one did not, so there is nothing to sweep and nothing to report.
    await upload('Ravenswood positioning note', 'We sell to independent restaurants.')
    const second = await takeTurn(shippedOnly.sessionId, 'Anything new?', { ai: false })
    expect(second).not.toMatch(ARRIVAL)
    expect(second).not.toContain('Ravenswood positioning note')

    // THE CONVERSE, on a second tenant: with the client's knowledge open, arrivals
    // to it are announced as usual — while the shipped corpus, which is a release
    // artefact identical for every client and changed only by upgrading, is never
    // announced at all.
    tenants += 1
    tenant = `bundle27-${tenants}`
    resetAiHost()
    resetChatHost()

    const withClient = await conversation('client')
    await takeTurn(withClient.sessionId, 'Hello.')
    await upload('Winter menu', 'Six courses, from November.')
    const announced = await takeTurn(withClient.sessionId, 'Take a look.')
    expect(announced).toContain('Winter menu')

    // The shipped document is reachable — it is in the map this conversation was
    // primed with — but it is never reported as arrived material.
    expect(announced).toContain(SHIPPED_TERRITORY)
    const notice = announced.slice(announced.search(ARRIVAL))
    expect(notice).not.toContain(SHIPPED_TITLE)
  })
})
