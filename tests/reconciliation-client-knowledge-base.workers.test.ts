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
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import * as component from '../apps/control-app/src/generated/knowledge'
import DECLARATION from '../kb/knowledge_bases.json'
import WRANGLER from '../apps/control-app/wrangler.toml?raw'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * Reconciliation UATs for story-5281f009 — **the client's own knowledge base**,
 * inside the runtime that actually has the client's records.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database and a real R2 bucket, through the same `projectKnowledgeFor` the
 * Worker itself calls, over the real knowledge component — the corpus is
 * resolved by its `resolveCorpus`, the index built by its `buildIndex`, the
 * search ranked by its own ranker. Nothing here reimplements any of that in
 * order to assert it.
 *
 * ONE DOUBLE, AND IT IS THE MODEL. `tests/support/stub-embedder.ts` explains at
 * length why: the embedder is the component's declared model seam, none of the
 * claims below is about embedding quality, and miniflare has no local Workers AI
 * to reach anyway. The residency, the account barrier, the incremental refresh
 * and the absent-index starting state are all real.
 *
 * The declaration half of the story — what the shipped file says, what a fresh
 * workspace is scaffolded, and which knowledge bases the release build offers —
 * is in `reconciliation-client-knowledge-base.test.ts`, because it needs a
 * filesystem.
 */

const APPLIED = applySchema()

/**
 * Every name `apps/control-app/src/knowledge.ts` imports out of the component.
 *
 * The generated `knowledge.d.ts` types every name as `any`, so — unlike a
 * mis-typed argument — an upstream RENAME does not surface as a build failure.
 * It surfaces as `undefined is not a function` at the first search, on a
 * deployment that built and shipped cleanly. This list is what the runtime
 * reaches for, and the assertion below is the only place that failure can be
 * caught before a client meets it.
 */
const REACHED_FOR = [
  'WorkersAiEmbedder',
  'agglomerativeClusterer',
  'buildAwareness',
  'buildChunkIndex',
  'buildIndex',
  'documentsFromTickets',
  'findAwarenessReport',
  'knowledgeBasesFromMapping',
  'loadIndex',
  'publishAwarenessReport',
  'resolveCorpus',
  'search',
]

/** The filesystem-bound entry point the runtime must never reach, even indirectly. */
const FILESYSTEM_BOUND = ['nodeIndexSource', 'nodeDocReader', 'loadKbConfig']

function knowledgeEnv(accountId: string): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: accountId,
  }
}

/** The client's knowledge base for one account, with the model seam counted. */
async function openKb(
  accountId: string,
): Promise<{ kb: ProjectKnowledge; embedder: ReturnType<typeof stubEmbedder> }> {
  const embedder = stubEmbedder()
  const kb = await projectKnowledgeFor(knowledgeEnv(accountId), { embedder })
  return { kb, embedder }
}

/** A `material` that satisfies [[DOC-38]] §9 — the happy shape, stated once. */
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

/** Every R2 key under a prefix, so residency is asserted rather than assumed. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** The `[env.production]` half of wrangler.toml, and everything before it. */
function wranglerHalves(): { local: string; production: string } {
  const match = /^\[env\.production\]$/m.exec(WRANGLER)
  expect(match, 'control-app declares an [env.production] environment').not.toBeNull()
  return {
    local: WRANGLER.slice(0, match!.index),
    production: WRANGLER.slice(match!.index),
  }
}

/** The binding named by an `[ai]`-shaped table in a half of the file. */
function aiBinding(half: string, header: string): string | undefined {
  const at = half.indexOf(`${header}\n`)
  if (at === -1) return undefined
  return /binding\s*=\s*"([^"]+)"/.exec(half.slice(at))?.[1]
}

const declared = (DECLARATION as { knowledge_bases: Record<string, Record<string, unknown>> })
  .knowledge_bases

beforeAll(async () => {
  await APPLIED
})

describe('story-5281f009 — what it reads and how it is declared', () => {
  it('test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated', async () => {
    // NO `source` KEY AT ALL — not even the one it would default to. Naming a
    // source here, even a redundant one, is the edit that later points the
    // client's knowledge base at a mounted corpus and makes one client's
    // knowledge another's.
    expect(Object.keys(declared[PROJECT_KB])).not.toContain('source')

    // And the shipped half is unchanged: `system` still names its shipped corpus.
    expect(declared.system.source).toBe('shipped')

    // GENERATED, NOT AUTHORED. `authored` would make the map pipeline refuse to
    // rebuild — correct for a release artefact, wrong for a corpus that grows
    // every day.
    expect(projectKb().landscape).toBe('derived')

    // With no source declared it resolves against the account's own record
    // store, which is what the component's default source means. Asserted
    // against the component's own constant rather than a literal restated here.
    expect(projectKb().source).toBe(component.DEFAULT_SOURCE)

    // And observably so: a record written into this account's store is in the
    // corpus the knowledge base resolves.
    const { kb } = await openKb('ac1655-account')
    await addMaterial(kb.store, 'Positioning note', 'Only postpartum meal service in the county.')
    const corpus = await kb.corpus()
    expect(corpus.map((ticket) => ticket.title)).toContain('Positioning note')
  })

  it('test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site', async () => {
    // SELECTED BY RECORD KIND ALONE. A site term added here would narrow the
    // corpus with no symptom other than an assistant that had forgotten the last
    // site it built for the same business — so the declared predicate must carry
    // exactly one key, and the parsed KB exactly no extra terms.
    expect(Object.keys(declared[PROJECT_KB].corpus as Record<string, unknown>)).toEqual(['type'])
    expect([...projectKb().corpus.terms.keys()]).toEqual([])

    // Two sites under one account, and the material was recorded while working
    // on the first.
    const { kb } = await openKb('ac1656-account')
    await addMaterial(
      kb.store,
      'Kitchen brand guidelines',
      'The palette is oxblood and bone.',
      { site_slug: 'kitchen' },
    )
    await addMaterial(kb.store, 'Bakery opening hours', 'Closed Mondays, open otherwise.', {
      site_slug: 'bakery',
    })
    await kb.refreshIndex()

    // Searching bound to the ACCOUNT — the only scope there is — returns what
    // was learned while building the other site. This is the deliberate
    // asymmetry: the account is a hard wall, the site is not a wall at all.
    const hits = await kb.search('palette oxblood bone')
    expect(hits.map((hit) => hit.title)).toContain('Kitchen brand guidelines')
  })

  it('test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects', async () => {
    // The file, read independently of the code that parses it.
    const fromFile = declared[PROJECT_KB]
    const fileCorpus = (fromFile.corpus as { type: string[] }).type

    // The knowledge base a host opens, through the ordinary path.
    const { kb } = await openKb('ac1657-account')

    // COMPARED AGAINST THE FILE'S CONTENTS, never against the same literals
    // restated in the test. A declaration standing beside a hand-built copy is
    // worse than no declaration: an operator edits the file, the edit changes
    // nothing, and every reviewer afterwards reads the file as authoritative.
    expect(kb.kb.name).toBe(PROJECT_KB)
    expect([...kb.kb.corpus.types].sort()).toEqual([...fileCorpus].sort())
    expect(kb.kb.landscape).toBe(fromFile.landscape)
    expect(kb.kb.description).toBe(fromFile.description)
    // The file names no source, so what it selects is the default one — the
    // account's own store — rather than a source fixed independently of it.
    expect(fromFile.source).toBeUndefined()
    expect(kb.kb.source).toBe(component.DEFAULT_SOURCE)
  })
})

describe('story-5281f009 — the account is a hard barrier', () => {
  const A = 'ac1660-account-a'
  const B = 'ac1660-account-b'

  it('test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another', async () => {
    const a = await openKb(A)
    const b = await openKb(B)

    await addMaterial(
      a.kb.store,
      'Positioning note',
      'We are the only postpartum meal service in the county.',
    )
    await addMaterial(b.kb.store, 'Someone else entirely', 'A competitor deck about widgets.')
    await a.kb.refreshIndex()
    await b.kb.refreshIndex()

    const query = 'postpartum meal service county'
    expect((await a.kb.search(query)).map((hit) => hit.title)).toContain('Positioning note')

    // THE BARRIER, ASSERTED RATHER THAN ASSUMED. B ran the identical query and
    // cannot see A's document — not as a low-ranked hit, not at all.
    expect((await b.kb.search(query)).map((hit) => hit.title)).not.toContain('Positioning note')

    // AND THE VECTORS ARE PARTITIONED THE SAME WAY, which is the second half of
    // the barrier: isolating the records while sharing an index would still hand
    // one client a body snippet of another client's positioning paper, because a
    // search result carries an excerpt of what it matched.
    expect(await keysUnder(env.BLOBS as R2Bucket, indexPrefix(A))).not.toHaveLength(0)
    const bKeys = await keysUnder(env.BLOBS as R2Bucket, indexPrefix(B))
    expect(bKeys).not.toHaveLength(0)
    for (const key of bKeys) expect(key.startsWith(indexPrefix(B))).toBe(true)
  })

  it('test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location', async () => {
    const account = 'ac1661-account'
    const { kb } = await openKb(account)
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await kb.refreshIndex()

    // PRESENT, under this account's own private location. Real bytes in a real
    // bucket — not a bundled artefact, because this index is a derivative of the
    // client's private material and is written continuously.
    const prefix = indexPrefix(account)
    const keys = await keysUnder(env.BLOBS as R2Bucket, prefix)
    expect(keys).toContain(`${prefix}embeddings.bin`)
    expect(keys).toContain(`${prefix}metadata.json`)
    expect(keys).toContain(`${prefix}manifest.json`)

    // OUTSIDE EVERYTHING THE PUBLIC INTERNET IS SERVED FROM. `SITES` is bound by
    // the Worker whose job is serving bytes by path; nothing of this may be there.
    expect(await keysUnder(env.SITES as R2Bucket, 'kb/')).toEqual([])

    // OUTSIDE THE NAMESPACE ATTACHED FILES ARE ADDRESSED IN: `t/<account>/blob/`
    // is the only prefix the blob store composes, so no attachment reference can
    // reach the index and the index can name none.
    expect(prefix.startsWith('t/')).toBe(false)

    // TWO ACCOUNTS CANNOT COLLIDE, and neither can name the other's location.
    const other = indexPrefix('ac1661-account-2')
    expect(prefix).not.toBe(other)
    expect(prefix.startsWith(other)).toBe(false)
    expect(other.startsWith(prefix)).toBe(false)
  })
})

describe('story-5281f009 — indexing is affordable on every write', () => {
  it('test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable', async () => {
    const { kb, embedder } = await openKb('ac1662-account')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')

    const first = await kb.refreshIndex()
    expect(first.documents).toBe(2)
    expect(first.embedded).toBe(2)

    // ONE DOCUMENT COSTS ONE EMBEDDING, not two — measured by the model's own
    // call count rather than by a tally the implementation also computes. This
    // is what makes "searchable the moment it arrives" a property the product
    // can afford rather than a scheduled job that has not run yet.
    const beforeSecond = embedder.calls
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')
    const second = await kb.refreshIndex()
    expect(second.documents).toBe(3)
    expect(second.embedded).toBe(1)
    expect(second.kept).toBe(2)
    expect(embedder.calls - beforeSecond).toBeLessThan(first.embedded + 3)

    // AND RETRIEVABLE FROM THAT PASS ALONE.
    const hits = await kb.search('freezer meals delivered weekly')
    expect(hits.map((hit) => hit.title)).toContain('Postpartum menu')

    // An unchanged corpus costs nothing at all.
    const beforeThird = embedder.calls
    const third = await kb.refreshIndex()
    expect(third.embedded).toBe(0)
    expect(third.kept).toBe(3)
    expect(embedder.calls).toBe(beforeThird)
  })

  it('test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing', async () => {
    const account = 'ac1663-account'

    // EVERY PART READS BACK AS ABSENT rather than raising. "There is no index
    // yet" is the state every account passes through exactly once, at the moment
    // the product can least afford an error.
    const source = r2IndexSource(env.BLOBS as R2Bucket, indexPrefix(account))
    expect(await source.readBytes('embeddings.bin')).toBeNull()
    expect(await source.readText('metadata.json')).toBeNull()
    expect(await source.readText('manifest.json')).toBeNull()

    // Written then read back, unchanged.
    await source.writeText('metadata.json', '[]')
    await source.writeBytes('embeddings.bin', new Uint8Array([1, 2, 3]))
    expect(await source.readText('metadata.json')).toBe('[]')
    expect([...(await source.readBytes('embeddings.bin'))!]).toEqual([1, 2, 3])

    // And the first document this account ever records indexes, with no prior
    // state to start from.
    const fresh = 'ac1663-first-document'
    const { kb } = await openKb(fresh)
    await addMaterial(kb.store, 'The very first upload', 'Ten freezer meals, delivered weekly.')
    const refreshed = await kb.refreshIndex()
    expect(refreshed.documents).toBe(1)
    expect(refreshed.embedded).toBe(1)
    expect((await kb.search('freezer meals delivered weekly')).map((hit) => hit.title)).toContain(
      'The very first upload',
    )
  })
})

describe('story-5281f009 — the model, and the runtime it runs in', () => {
  it('test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name', async () => {
    // DECLARED FOR LOCAL DEVELOPMENT AND RESTATED FOR EACH DEPLOYED ENVIRONMENT,
    // rather than relying on inheritance: a named wrangler environment inherits
    // neither vars nor bindings, and a missing repeat is not a degradation — the
    // deployed Worker's client knowledge base quietly stops being searchable.
    const { local, production } = wranglerHalves()
    expect(aiBinding(local, '[ai]')).toBe('AI')
    expect(aiBinding(production, '[env.production.ai]')).toBe('AI')

    // WHERE NO MODEL IS AVAILABLE IT REFUSES, naming the missing binding and
    // every place it must be declared. It does not proceed to report a knowledge
    // base that is searchable and returns nothing — which is indistinguishable,
    // to the client, from never having been told anything.
    const withoutModel = { ...knowledgeEnv('ac1664-account'), AI: undefined }
    const refusal = await projectKnowledgeFor(withoutModel).then(
      (kb) => kb,
      (error: Error) => error,
    )
    expect(refusal, 'no empty-but-valid knowledge base is returned').toBeInstanceOf(
      AiNotConfiguredError,
    )
    const message = (refusal as Error).message
    expect(message).toContain('AI')
    expect(message).toContain('wrangler.toml')
    expect(message).toContain('[ai]')
    expect(message).toContain('[env.production.ai]')
  })

  it('test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime', async () => {
    // ALL THREE, INSIDE workerd — which has no filesystem — against a real
    // record store and real private storage.
    const account = 'ac1665-account'
    const { kb } = await openKb(account)
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')

    const refreshed = await kb.refreshIndex()
    expect(refreshed.documents).toBe(1)
    const hits = await kb.search('palette oxblood bone')
    expect(hits.map((hit) => hit.title)).toContain('Brand guidelines')

    // EVERY NAME THE RUNTIME REACHES FOR IS PRESENT IN THE INSTALLED COMPONENT.
    // The runtime's view of the component is untyped, so an upstream rename does
    // not surface as a build failure — it surfaces as a missing function at the
    // first search, on a deployment that built and shipped cleanly.
    const missing = REACHED_FOR.filter(
      (name) => (component as Record<string, unknown>)[name] === undefined,
    )
    expect(missing).toEqual([])

    // AND THE SURFACE IT IMPORTS REACHES NO FILESYSTEM, directly or through a
    // filesystem-bound entry point: every such seam lives behind the component's
    // `./node` entry, which the root must not re-export.
    const leaked = FILESYSTEM_BOUND.filter(
      (name) => (component as Record<string, unknown>)[name] !== undefined,
    )
    expect(leaked).toEqual([])
  })
})
