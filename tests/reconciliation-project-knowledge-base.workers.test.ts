import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  AiNotConfiguredError,
  PROJECT_KB,
  indexPrefix,
  projectKb,
  projectKnowledgeFor,
  r2IndexSource,
} from '../apps/control-app/src/knowledge'
import type { ProjectKnowledge, ProjectKnowledgeEnv } from '../apps/control-app/src/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import {
  AWARENESS_REPORT_KIND,
  AWARENESS_REPORT_TYPE,
  KB_FIELD,
} from '../apps/control-app/src/generated/knowledge'
import { ATTACHMENT_TYPE } from '../apps/control-app/src/generated/ticketing'
import { KB as BUNDLED_SYSTEM_KB } from '../apps/control-app/src/generated/kb.js'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * story-bb91191c — **the client's own knowledge**, in workerd.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd through the same
 * `projectKnowledgeFor` the deployed Worker calls, against a real D1 database and
 * two real R2 buckets — the private material store and the one the public
 * internet is served from. The corpus is resolved by the knowledge component's
 * own `resolveCorpus`, the index built by its `buildIndex`, the map published by
 * its `publishAwarenessReport`. Nothing below reimplements any of that in order
 * to assert it.
 *
 * ONE DOUBLE, AND IT IS THE MODEL. `tests/support/stub-embedder.ts` records why
 * at length: the embedder is the component's declared model seam, none of the
 * claims here is about embedding quality, and miniflare has no local Workers AI
 * to reach. The tenancy, the residency, the incrementality and the landscape are
 * all real.
 *
 * Two buckets are bound deliberately. AC-1520's claim is that a client's index
 * lands in one store and never the other, and a suite with only the private
 * bucket bound could not tell a correct placement from a store that was not
 * there to check.
 *
 * The declaration half of this story — which host offers which knowledge base,
 * and that one file describes both — is proved on the node side, in
 * `reconciliation-project-knowledge-declaration.test.ts` (AC-1522, AC-1523).
 */

const APPLIED = applySchema()

function knowledgeEnv(tenantId: string): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
  }
}

/** A project KB bound to `tenantId`, with the model seam stubbed and counted. */
async function openKb(tenantId: string): Promise<{
  kb: ProjectKnowledge
  embedder: ReturnType<typeof stubEmbedder>
}> {
  const embedder = stubEmbedder()
  const kb = await projectKnowledgeFor(knowledgeEnv(tenantId), { embedder })
  return { kb, embedder }
}

/** The rights and provenance record [[DOC-38]] §9 requires, stated once. */
function material(over: Record<string, unknown> = {}) {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

async function addMaterial(
  store: TicketStore,
  title: string,
  body: string,
  fields: Record<string, unknown> = {},
): Promise<Ticket> {
  const { ticket } = await store.create({
    type: 'material',
    title,
    fields: material(fields),
    body,
  })
  return ticket
}

/** Every key an object store holds under a prefix. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor, limit: 1000 })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** The four artefacts an index is made of, as the component names them. */
const INDEX_ARTEFACTS = ['embeddings.bin', 'metadata.json', 'manifest.json', 'model_info.json']

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text)

beforeAll(async () => {
  await APPLIED
})

// ── AC-1518: the corpus is the client's own four kinds, across all their sites ──

describe('story-bb91191c — what the client’s knowledge is made of', () => {
  it('test_UAT_AC1518_the_corpus_is_the_clients_four_record_kinds_and_is_client_wide', async () => {
    const { kb } = await openKb('story-bb91191c-corpus')
    const store = kb.store

    // One of each of the four kinds [[DOC-38]] §8 names — and the three that can
    // carry a site are deliberately spread across two sites and none at all.
    const chat = await store.create({
      type: 'chat',
      title: 'Kitchen fit-out conversation',
      fields: { session_id: 'sess-bb91191c-1' },
      body: 'We agreed the hero should lead with the postpartum service.',
    })
    const uploaded = await addMaterial(
      store,
      'Brand guidelines',
      'The palette is oxblood and bone.',
      { site_slug: 'site-a' },
    )
    const captured = await store.create({
      type: 'reference',
      title: 'A competitor’s menu page',
      fields: material({
        origin: 'captured',
        kind: 'capture',
        source_url: 'https://example.invalid/menu',
        rights: 'third_party',
        republishable: false,
        site_slug: 'site-b',
      }),
      body: 'Their menu leads with price, not provenance.',
    })
    const brief = await store.create({
      type: 'brief',
      title: 'What we decided',
      fields: { site_slug: 'site-a' },
      body: 'Warm, calm, and never clinical. Bookings above the fold.',
    })
    // A member with no site at all — tenant-wide material, belonging to the
    // client rather than to any one of their sites.
    const unattached = await addMaterial(store, 'Postpartum menu', 'Ten freezer meals, weekly.')

    // A record of a kind OUTSIDE the four, belonging to the same client. An
    // attachment is the honest choice: it is created by the ordinary upload path,
    // it hangs off a member, and it is emphatically not a corpus member itself.
    const { attachment } = await store.attach({
      uid: uploaded.uid,
      bytes: bytesOf('%PDF-1.7 the bytes behind the brand guidelines\n'),
      filename: 'brand.pdf',
    })
    expect(attachment.type).toBe(ATTACHMENT_TYPE)

    const corpus = await kb.corpus()
    const uids = corpus.map((ticket) => ticket.uid).sort()

    // Exactly the four kinds, and every one of them regardless of which site it
    // hangs off — site A, site B, and no site at all are equally members.
    expect(uids).toEqual(
      [chat.ticket.uid, uploaded.uid, captured.ticket.uid, brief.ticket.uid, unattached.uid].sort(),
    )
    expect([...new Set(corpus.map((ticket) => ticket.type))].sort()).toEqual([
      'brief',
      'chat',
      'material',
      'reference',
    ])
    // And the fifth kind is not there.
    expect(uids).not.toContain(attachment.uid)

    // MEMBERSHIP IS THE KIND OF RECORD IT IS, not a marker carried on the record:
    // the declared predicate is a type term and nothing else, so no member had to
    // opt in and none could opt out.
    const declared = projectKb()
    expect([...declared.corpus.types].sort()).toEqual(['brief', 'chat', 'material', 'reference'])
    expect([...declared.corpus.terms.keys()]).toEqual([])

    // NO SITE TERM PARTICIPATES, so the corpus does not change with the site in
    // play — there is nowhere for one to be supplied and nothing that reads one.
    const again = await kb.corpus()
    expect(again.map((ticket) => ticket.uid).sort()).toEqual(uids)

    // Drawn from the client's own records rather than any shipped document set:
    // the KB names no source, so it reads the tenant's own store.
    expect(declared.source).toBe('project')
  })
})

// ── AC-1519: one client's search reaches their own records only ──────────────

describe('story-bb91191c — the account is a hard barrier', () => {
  it('test_UAT_AC1519_a_search_reaches_only_the_account_its_handle_was_opened_for', async () => {
    const a = await openKb('story-bb91191c-account-a')
    const b = await openKb('story-bb91191c-account-b')

    const distinctive = await addMaterial(
      a.kb.store,
      'Positioning note',
      'We are the only postpartum meal service in Kirkcudbrightshire.',
    )
    await addMaterial(b.kb.store, 'Someone else entirely', 'A competitor deck about ball bearings.')
    await a.kb.refreshIndex()
    await b.kb.refreshIndex()

    const query = 'postpartum meal service Kirkcudbrightshire'

    const mine = await a.kb.search(query)
    expect(mine.map((hit) => hit.uid)).toContain(distinctive.uid)

    // THE BARRIER. B ran the identical query against its own handle and sees
    // none of A's record — not as a low-ranked hit, not at all — and no text
    // taken from it, including the excerpt shown beside a result.
    const theirs = await b.kb.search(query, { topK: 50 })
    expect(theirs.map((hit) => hit.uid)).not.toContain(distinctive.uid)
    expect(theirs.map((hit) => hit.title)).not.toContain('Positioning note')
    for (const hit of theirs) {
      expect(hit.body_snippet).not.toMatch(/postpartum/i)
      expect(hit.body_snippet).not.toMatch(/Kirkcudbrightshire/i)
    }

    // THE SCOPING IS THE HANDLE, NOT AN ARGUMENT. There is no parameter on the
    // search entry point by which a caller could name another account, so an
    // attempt to supply one is inert rather than effective: B's search still
    // returns B's knowledge.
    const smuggled = await b.kb.search(query, {
      tenant: 'story-bb91191c-account-a',
      account: 'story-bb91191c-account-a',
      store: a.kb.store,
      source: a.kb.index,
      topK: 50,
    } as never)
    expect(smuggled.map((hit) => hit.uid)).not.toContain(distinctive.uid)
  })
})

// ── AC-1520: the index is private, per account, and unservable ───────────────

describe('story-bb91191c — where the derived index lives', () => {
  it('test_UAT_AC1520_the_index_is_private_partitioned_by_account_and_outside_every_servable_prefix', async () => {
    const A = 'story-bb91191c-residency-a'
    const B = 'story-bb91191c-residency-b'
    const a = await openKb(A)
    const b = await openKb(B)

    const carrier = await addMaterial(a.kb.store, 'Brand guidelines', 'Oxblood and bone.')
    const { attachment } = await a.kb.store.attach({
      uid: carrier.uid,
      bytes: bytesOf('%PDF-1.7 confidential\n'),
      filename: 'brand.pdf',
    })
    await addMaterial(b.kb.store, 'Someone else entirely', 'Ball bearings, in bulk.')
    await a.kb.refreshIndex()
    await b.kb.refreshIndex()

    // IN THE PRIVATE STORE, UNDER THIS ONE ACCOUNT'S PATH.
    const mine = await keysUnder(env.BLOBS as R2Bucket, indexPrefix(A))
    for (const artefact of INDEX_ARTEFACTS) {
      expect(mine).toContain(`${indexPrefix(A)}${artefact}`)
    }
    expect(mine.every((key) => key.startsWith(indexPrefix(A)))).toBe(true)

    // ABSENT FROM THE STORE THE PUBLIC INTERNET IS SERVED FROM, so nothing can
    // request an index artefact by URL.
    expect(await keysUnder(env.SITES as R2Bucket, 'kb/')).toEqual([])
    expect(await keysUnder(env.SITES as R2Bucket, indexPrefix(A))).toEqual([])
    expect(await keysUnder(env.SITES as R2Bucket, indexPrefix(B))).toEqual([])

    // OUTSIDE THE KEY SPACE ATTACHMENTS ARE ADDRESSED IN. The attachment's own
    // key is read off the real object the upload wrote rather than assumed —
    // deliberately without asserting HOW it is composed, which is a different
    // story's claim — so what is compared here is the two key spaces themselves:
    // no attachment address can name an index artefact and no index key can name
    // an attachment.
    const attachmentPrefix = `t/${A}/blob/`
    const attached = await keysUnder(env.BLOBS as R2Bucket, attachmentPrefix)
    expect(attached).toHaveLength(1)
    expect(await (env.BLOBS as R2Bucket).get(attached[0])).not.toBeNull()
    expect(attachment.type).toBe(ATTACHMENT_TYPE)
    expect(indexPrefix(A).startsWith(attachmentPrefix)).toBe(false)
    expect(attachmentPrefix.startsWith(indexPrefix(A))).toBe(false)
    for (const key of mine) expect(key.startsWith(attachmentPrefix)).toBe(false)
    for (const key of attached) expect(key.startsWith(indexPrefix(A))).toBe(false)

    // TWO ACCOUNTS DO NOT COLLIDE, and neither path is a prefix of the other —
    // the property a bare `kb/<tenant>` join would lose the moment one account id
    // extended another.
    const theirs = await keysUnder(env.BLOBS as R2Bucket, indexPrefix(B))
    expect(theirs).not.toHaveLength(0)
    expect(indexPrefix(A)).not.toBe(indexPrefix(B))
    expect(indexPrefix(A).startsWith(indexPrefix(B))).toBe(false)
    expect(indexPrefix(B).startsWith(indexPrefix(A))).toBe(false)
    for (const key of mine) expect(theirs).not.toContain(key)

    // AND IT IS NEVER CARRIED INSIDE THE RELEASED APPLICATION ARTEFACT. The
    // bundle holds the shipped design-document corpus and nothing keyed to a
    // client — that decision is [[REQ-158]]'s and deliberately does not transfer.
    const bundle = BUNDLED_SYSTEM_KB as { index?: Record<string, string> } | null
    for (const key of Object.keys(bundle?.index ?? {})) {
      expect(key.startsWith('kb/')).toBe(false)
      expect(key).not.toContain(A)
      expect(key).not.toContain(B)
    }
  })
})

// ── AC-1521: keeping the index current costs only what changed ───────────────

describe('story-bb91191c — freshness costs only what changed', () => {
  it('test_UAT_AC1521_an_incremental_pass_embeds_only_the_new_record_and_makes_it_searchable', async () => {
    const { kb, embedder } = await openKb('story-bb91191c-incremental')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')

    // N previously unindexed records cost N document embeddings.
    const first = await kb.refreshIndex()
    expect(first.documents).toBe(2)
    expect(first.embedded).toBe(2)
    const firstPassCost = embedder.calls
    expect(firstPassCost).toBeGreaterThanOrEqual(2)

    // One more record, and one more embedding — the other two are retained. This
    // is what "there is no reindex everything step in normal running" means.
    const beforeSecond = embedder.calls
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')
    const second = await kb.refreshIndex()
    expect(second.documents).toBe(3)
    expect(second.embedded).toBe(1)
    expect(second.kept).toBe(2)
    // Read from the counter on the embedding step itself, not from the tally the
    // refresh reports about its own work: the whole pass cost strictly less than
    // the first one did, which a full rebuild could not.
    const secondPassCost = embedder.calls - beforeSecond
    expect(secondPassCost).toBeGreaterThan(0)
    expect(secondPassCost).toBeLessThan(firstPassCost)

    // And the new record is searchable off that incremental pass alone.
    const hits = await kb.search('freezer meals delivered weekly')
    expect(hits.map((hit) => hit.title)).toContain('Postpartum menu')

    // Nothing changed: no document embeddings at all, every record still present.
    const beforeThird = embedder.calls
    const third = await kb.refreshIndex()
    expect(third.documents).toBe(3)
    expect(third.embedded).toBe(0)
    expect(third.kept).toBe(3)
    expect(embedder.calls - beforeThird).toBe(0)
  })
})

// ── AC-1524: the landscape is publishable from the first build, and recycled ──

describe('story-bb91191c — the client’s landscape', () => {
  it('test_UAT_AC1524_the_landscape_publishes_from_the_first_build_into_one_recycled_record', async () => {
    const { kb } = await openKb('story-bb91191c-landscape')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')

    /** Every landscape record this client's store holds for this KB. */
    const published = async (): Promise<Ticket[]> => {
      const { tickets } = await kb.store.list({ type: AWARENESS_REPORT_TYPE, limit: 'all' })
      return tickets.filter((ticket) => ticket.fields[KB_FIELD] === PROJECT_KB)
    }

    // BEFORE ANY BUILD: absence, reported as absence rather than as a failure.
    expect(await kb.publishedMap()).toBeNull()
    expect(await published()).toHaveLength(0)

    // The first build publishes — and the record it publishes as is one this
    // client's own store accepts, rather than being refused as an undeclared kind.
    const built = await kb.rebuildMap()
    expect(built.documents).toBe(1)
    const map = await kb.publishedMap()
    expect(map).not.toBeNull()
    expect(map!.uid).toBe(built.uid)
    expect(map!.type).toBe(AWARENESS_REPORT_TYPE)
    expect(map!.fields.kind).toBe(AWARENESS_REPORT_KIND)
    expect(map!.fields[KB_FIELD]).toBe(PROJECT_KB)
    expect(map!.body).toContain('Brand guidelines')
    expect(await published()).toHaveLength(1)

    // A second build after the corpus has changed replaces the body wholesale and
    // reuses the same record, so anything holding a reference to the landscape
    // keeps pointing at the current one.
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')
    const rebuilt = await kb.rebuildMap()
    expect(rebuilt.documents).toBe(2)
    expect(rebuilt.uid).toBe(built.uid)

    const after = await published()
    expect(after).toHaveLength(1)
    expect(after[0].uid).toBe(built.uid)
    expect(after[0].body).toContain('Postpartum menu')
    expect(after[0].body).toContain('Brand guidelines')
    expect(after[0].body).not.toBe(map!.body)
  })
})

// ── AC-1525: a never-indexed account is an ordinary starting state ───────────

describe('story-bb91191c — a client who has never been indexed', () => {
  it('test_UAT_AC1525_a_never_indexed_account_reads_as_absent_and_the_first_pass_builds_from_nothing', async () => {
    const FRESH = 'story-bb91191c-first-index'
    const EMPTY = 'story-bb91191c-no-corpus'

    // WITH NO INDEX YET STORED, asking the index storage for its artefacts reads
    // back as absent — not as an error. A throw here would make the first upload
    // on a new account the first thing that account ever saw fail.
    const source = r2IndexSource(env.BLOBS as R2Bucket, indexPrefix(FRESH))
    for (const artefact of INDEX_ARTEFACTS) {
      expect(await source.readBytes(artefact)).toBeNull()
      expect(await source.readText(artefact)).toBeNull()
    }

    const { kb } = await openKb(FRESH)
    expect(await kb.transcriptCursors()).toEqual({})

    // The first indexing pass over a small corpus succeeds and builds from
    // nothing — every record is new, and every record is searchable afterwards.
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')
    const first = await kb.refreshIndex()
    expect(first.documents).toBe(2)
    expect(first.embedded).toBe(2)
    expect(first.kept).toBe(0)

    // And an account holding no corpus members at all indexes successfully to an
    // empty result, rather than refusing to index nothing.
    const barren = await openKb(EMPTY)
    expect(await barren.kb.corpus()).toEqual([])
    const nothing = await barren.kb.refreshIndex()
    expect(nothing.documents).toBe(0)
    expect(nothing.embedded).toBe(0)

    // The records the first pass built from nothing are searchable afterwards.
    const hits = await kb.search('freezer meals delivered weekly')
    expect(hits.map((hit) => hit.title)).toContain('Postpartum menu')
  })
})

// ── AC-1526: a host missing what the KB needs refuses by name ────────────────

describe('story-bb91191c — an unconfigured host refuses rather than searching to nothing', () => {
  it('test_UAT_AC1526_a_missing_binding_is_a_named_refusal_and_a_new_client_is_an_empty_result', async () => {
    const TENANT = 'story-bb91191c-unconfigured'

    // NO EMBEDDING CAPABILITY CONFIGURED. Opening refuses immediately, names the
    // capability, says nothing can be indexed or searched without it, and names
    // BOTH places it must be declared — a named environment inherits neither.
    const noAi = projectKnowledgeFor(knowledgeEnv(TENANT))
    await expect(noAi).rejects.toBeInstanceOf(AiNotConfiguredError)
    const aiError = await noAi.catch((error: Error) => error)
    expect(aiError.message).toMatch(/AI binding/i)
    expect(aiError.message).toMatch(/indexed or searched/i)
    expect(aiError.message).toContain('[ai]')
    expect(aiError.message).toContain('[env.production.ai]')

    // NO PRIVATE STORE AVAILABLE FOR THE INDEX. It says the index has nowhere to
    // live and names the store it needs, rather than failing later on an
    // undefined value. The store is injected precisely so the refusal that fires
    // is the index's own and not the ticket store's.
    const store = await ticketStoreFor(knowledgeEnv(TENANT))
    const noBlobs = projectKnowledgeFor(
      { DB: env.DB as D1Database, TENANT_ID: TENANT },
      { store, embedder: stubEmbedder() },
    )
    await expect(noBlobs).rejects.toThrow(/BLOBS/)
    const blobsError = await noBlobs.catch((error: Error) => error)
    expect(blobsError.message).toMatch(/index/i)
    expect(blobsError.message).toMatch(/vectors live|nowhere/i)

    // AND THE TWO SITUATIONS ARE NOT CONFUSABLE. On a correctly configured host,
    // an account that has simply given us nothing yet OPENS, and searches to an
    // empty result rather than to an error.
    const { kb } = await openKb(TENANT)
    expect(await kb.corpus()).toEqual([])
    await kb.refreshIndex()
    expect(await kb.search('anything at all')).toEqual([])
  })
})
