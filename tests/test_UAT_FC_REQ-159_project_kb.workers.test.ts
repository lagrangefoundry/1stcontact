import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DescriberNotConfiguredError,
  ENUMERATE_BUDGET_CHARS,
  PROJECT_KB,
  ProjectKnowledge,
  TRANSCRIPT_INDEX_CHARS,
  enumeratedLandscape,
  indexPrefix,
  projectKb,
  projectKnowledgeFor,
  r2IndexSource,
  uninformativeTitle,
} from '../apps/control-app/src/knowledge'
import type { ProjectKnowledgeEnv } from '../apps/control-app/src/knowledge'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * REQ-159 — **the project knowledge base, in workerd**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database and a real R2 bucket, through the same `projectKnowledgeFor` the
 * Worker itself would call, over the real shared knowledge component
 * — the corpus is resolved by its `resolveCorpus`, the index built by its
 * `buildIndex`, the map assembled by its `buildAwareness`. Nothing here
 * reimplements any of that in order to assert it.
 *
 * ONE DOUBLE, AND IT IS THE MODEL. `tests/support/stub-embedder.ts` explains at
 * length why: the embedder is the component's declared model seam, none of the
 * claims below is about embedding quality, and miniflare has no local Workers AI
 * to reach anyway. The index residency, the tenancy, the triggers and the floor
 * are all real.
 *
 * THE FOUR CLAIMS, in the order they matter:
 *
 * 1. THE CORPUS IS THE TENANT'S, AND ONLY THE TENANT'S. Asserted, not assumed:
 *    a second account with its own store and its own index prefix searches the
 *    same query and finds nothing.
 * 2. THE INDEX IS A CHANGE-FEED CONSUMER. A new document is searchable without a
 *    full rebuild, and re-running the indexer embeds nothing already embedded.
 *    The embedder counts its own calls, so that is measured rather than inferred.
 * 3. TWO CLOCKS, TWO TRIGGERS. A transcript past the character threshold becomes
 *    searchable AND leaves the map alone; a `material` write refreshes the index
 *    inline and hands the rebuild to the deferral seam. Both halves of each, and
 *    the second is proved with a describer that blocks — so "does not block the
 *    turn" is an ordering assertion rather than a hope about timing.
 * 4. THE FLOOR IS A BUDGET, AND THE LISTING SAYS IT IS COMPLETE.
 */

const APPLIED = applySchema()

function knowledgeEnv(): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }
}

/**
 * A project KB for `tenantId`, embedder stubbed and deferral collected.
 *
 * `defer` collects rather than fires, because what the trigger tests assert is
 * *that the rebuild was handed to the scheduler* — the Worker's `ctx.waitUntil`
 * in production — rather than awaited in the caller's own promise chain.
 */
async function openKb(
  tenantId: string,
  opts: { enumerateBudget?: number; transcriptChars?: number } = {},
): Promise<{
  kb: ProjectKnowledge
  embedder: ReturnType<typeof stubEmbedder>
  deferred: Array<Promise<unknown>>
}> {
  const embedder = stubEmbedder()
  const deferred: Array<Promise<unknown>> = []
  const kb = await projectKnowledgeFor(knowledgeEnv(), { businessId: tenantId }, {
    embedder,
    defer: (work) => {
      deferred.push(work)
    },
    ...opts,
  })
  return { kb, embedder, deferred }
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
): Promise<Ticket> {
  const { ticket } = await store.create({
    type: 'material',
    title,
    fields: material(),
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

beforeAll(async () => {
  await APPLIED
})

describe('REQ-159 — the declaration', () => {
  it('UAT_FC_REQ-159 the project KB is parsed from the declaration, not paraphrased', () => {
    // The rule `kb.ts` records: editing the declared corpus predicate must change
    // what the KB selects. A KB hand-constructed in code would pass a test that
    // asserted the same literals twice, so this reads the shipped file.
    const kb = projectKb()
    expect(kb.name).toBe(PROJECT_KB)
    expect([...kb.corpus.types].sort()).toEqual(['brief', 'chat', 'material', 'reference'])
    // No `source`: it reads the project store — the tenant's own — which is what
    // makes it the other half of the system KB rather than a second shipped one.
    expect(kb.source).toBe('project')
    // `derived`, so the awareness pipeline may rebuild it. `authored` would refuse.
    expect(kb.landscape).toBe('derived')
    // Tenant-wide, NOT site-scoped: two sites belonging to one client share what
    // has been learned about that client ([[DOC-10]] §4.3). A `fields.placed_on`
    // term here would be a silent narrowing of exactly that.
    expect([...kb.corpus.terms.keys()]).toEqual([])
  })

  it('UAT_FC_REQ-159 the index is tenant-partitioned by key, and lives outside every servable prefix', () => {
    expect(indexPrefix('acme')).toBe(`kb/acme/${PROJECT_KB}/index/`)
    expect(indexPrefix('acme', PROJECT_KB, 'chunks')).toBe(`kb/acme/${PROJECT_KB}/chunks/`)
    // Two accounts cannot collide, and neither can name the other's prefix.
    expect(indexPrefix('acme')).not.toBe(indexPrefix('acme-2'))
    // `t/<tenant>/blob/` is the only prefix the component's blob store composes,
    // so no attachment key can address the index and the index addresses none.
    expect(indexPrefix('acme').startsWith('t/')).toBe(false)
  })
})

describe('REQ-159 — the corpus is the tenant’s', () => {
  const A = 'req159-tenant-a'
  const B = 'req159-tenant-b'

  it('UAT_FC_REQ-159 a search scoped to one tenant returns nothing belonging to another', async () => {
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

    const mine = await a.kb.search('postpartum meal service county')
    expect(mine.map((hit) => hit.title)).toContain('Positioning note')

    // The barrier, asserted rather than assumed. B ran the identical query
    // against its own store and its own index and cannot see A's document —
    // not as a low-ranked hit, not at all.
    const theirs = await b.kb.search('postpartum meal service county')
    expect(theirs.map((hit) => hit.title)).not.toContain('Positioning note')

    // And the vectors are partitioned too, which is the second half of the
    // barrier: isolating rows while sharing an index would leak a body snippet.
    expect(await keysUnder(env.BLOBS as R2Bucket, indexPrefix(A))).not.toHaveLength(0)
    for (const key of await keysUnder(env.BLOBS as R2Bucket, indexPrefix(B))) {
      expect(key.startsWith(indexPrefix(B))).toBe(true)
    }
  })

  it('UAT_FC_REQ-159 the index is in R2, never in the bundle', async () => {
    // [[REQ-158]] puts the system index in the Worker bundle. That decision does
    // not transfer: this corpus is tenant data, differs per tenant and is written
    // continuously. Same `IndexSource` seam, other implementation — and the proof
    // is that real bytes are sitting in a real bucket under this tenant's prefix.
    const keys = await keysUnder(env.BLOBS as R2Bucket, indexPrefix(A))
    expect(keys).toContain(`${indexPrefix(A)}embeddings.bin`)
    expect(keys).toContain(`${indexPrefix(A)}metadata.json`)
    expect(keys).toContain(`${indexPrefix(A)}manifest.json`)
    expect(keys).toContain(`${indexPrefix(A)}model_info.json`)
    // And nothing was written to the bucket the public internet is served from.
    expect(await keysUnder(env.SITES as R2Bucket, 'kb/')).toEqual([])
  })
})

describe('REQ-159 — the index is incremental', () => {
  const T = 'req159-incremental'

  it('UAT_FC_REQ-159 a new document is searchable without a full rebuild, and an unchanged one is not re-embedded', async () => {
    const { kb, embedder } = await openKb(T)
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')

    const first = await kb.refreshIndex()
    expect(first.documents).toBe(2)
    expect(first.embedded).toBe(2)
    const afterFirst = embedder.calls

    // The claim: adding one document costs one embedding, not two. This is what
    // "there is no reindex operation in normal running" actually means — the
    // manifest records `uid -> updated_at` and an unmoved timestamp keeps its
    // vector.
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')
    const second = await kb.refreshIndex()
    expect(second.documents).toBe(3)
    expect(second.embedded).toBe(1)
    expect(second.kept).toBe(2)

    // And it is searchable immediately, off that incremental pass alone.
    const hits = await kb.search('freezer meals delivered weekly')
    expect(hits.map((hit) => hit.title)).toContain('Postpartum menu')

    // Idempotent: re-running the indexer over an unchanged corpus embeds nothing.
    const callsBefore = embedder.calls
    const third = await kb.refreshIndex()
    expect(third.embedded).toBe(0)
    expect(third.kept).toBe(3)
    // The document index embedded nothing; the chunk index is the only remaining
    // caller, so the counter proves the document pass really did skip all three.
    expect(embedder.calls - callsBefore).toBeLessThan(afterFirst)
  })
})

describe('REQ-159 — two clocks, two triggers', () => {
  const T = 'req159-triggers'

  it('UAT_FC_REQ-159 a transcript is indexed in batches and NEVER rebuilds the map', async () => {
    const { kb } = await openKb(T)
    const { ticket } = await kb.store.create({
      type: 'chat',
      title: 'Kitchen fit-out conversation',
      fields: { session_id: 'sess-req159-1' },
      body: 'We agreed the hero should lead with the postpartum service, not catering.',
    })

    // Below the threshold: nothing happens. A turn's worth of growth must not
    // re-embed a whole conversation.
    const small = await kb.onTranscriptGrew(ticket.uid, TRANSCRIPT_INDEX_CHARS - 1)
    expect(small.indexed).toBe(false)
    expect(small.index).toBeNull()

    // Past it: indexed, and searchable. Search over transcripts is what answers
    // what the live context cannot — earlier turns, and other sessions.
    const grown = await kb.onTranscriptGrew(ticket.uid, TRANSCRIPT_INDEX_CHARS + 500)
    expect(grown.indexed).toBe(true)
    const hits = await kb.search('hero lead postpartum service not catering')
    expect(hits.map((hit) => hit.title)).toContain('Kitchen fit-out conversation')

    // THE OTHER HALF, AND IT IS THE POINT OF THE TICKET: no map was rebuilt. The
    // territory "conversations with this client" is stable from the first turn
    // and its description never usefully changes, so paying an LLM describe call
    // per turn would be the expensive clock driven by the fast one.
    expect(await kb.publishedMap()).toBeNull()

    // The cursor advanced, so the next turn does not re-index the same growth.
    const again = await kb.onTranscriptGrew(ticket.uid, TRANSCRIPT_INDEX_CHARS + 600)
    expect(again.indexed).toBe(false)
    expect((await kb.transcriptCursors())[ticket.uid]).toBe(TRANSCRIPT_INDEX_CHARS + 500)
  })

  it('UAT_FC_REQ-159 a material write indexes inline and defers the rebuild', async () => {
    // Budget 0 forces the clustered path, so the rebuild costs a describe call —
    // which is what makes "deferred" observable rather than merely fast.
    const { kb, deferred } = await openKb('req159-defer', { enumerateBudget: 0 })
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Positioning note', 'Only postpartum meal service in the county.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')

    let release = (): void => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    let described = 0
    const describe = async (): Promise<string> => {
      described += 1
      await barrier
      return 'Positioning and brand\n\nWhat this client sells and how they say it.'
    }

    const { index, rebuild } = await kb.onMaterialWritten({ describe })

    // ORDERING, NOT TIMING. `onMaterialWritten` has already returned while the
    // describer is still blocked, so the turn did not pay for the map. The
    // document is nevertheless indexed and searchable right now — which is the
    // decomposition the two clocks buy: search needs only the index.
    expect(index.documents).toBe(3)
    expect(await kb.publishedMap()).toBeNull()
    const hits = await kb.search('palette oxblood bone')
    expect(hits.map((hit) => hit.title)).toContain('Brand guidelines')

    // The rebuild went to the deferral seam — `ctx.waitUntil` in the Worker —
    // rather than into the caller's own promise chain.
    expect(deferred).toHaveLength(1)
    expect(deferred[0]).toBe(rebuild)

    // And it is genuinely in flight while all of the above ran: the describer has
    // been reached and is blocked on the barrier. Without this the assertions
    // above would also hold for a rebuild that never started, which is a
    // different bug wearing the same shape.
    for (let i = 0; described === 0 && i < 100; i++) await Promise.resolve()
    expect(described).toBeGreaterThan(0)
    expect(await kb.publishedMap()).toBeNull()

    release()
    const built = await rebuild
    expect(built.mode).toBe('clustered')
    const map = await kb.publishedMap()
    expect(map).not.toBeNull()
    expect(map!.body).toContain('Awareness map')
    // Recycled in place: the uid the rebuild reported is the ticket that exists.
    expect(map!.uid).toBe(built.uid)
  })
})

describe('REQ-159 — the floor', () => {
  const T = 'req159-floor'

  it('UAT_FC_REQ-159 below the floor the landscape enumerates, and says it is complete', async () => {
    const { kb } = await openKb(T)
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.')

    const built = await kb.landscape()
    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(2)

    // Every document is named — that is what "complete" means, and it is the
    // property a summary would lose.
    expect(built.body).toContain('Brand guidelines')
    expect(built.body).toContain('Postpartum menu')

    // AND IT SAYS SO. A short list read as "knowledge here is thin" produces very
    // different behaviour in front of a new client than the same list read as
    // "you know everything there is".
    expect(built.body).toMatch(/complete listing/i)
    expect(built.body).toMatch(/everything there is/i)

    // Nothing is bolded. The component reads a bolded term in a landscape as a
    // VALIDATED search access point — one shown to retrieve the territory it
    // appears in — and a listing has no territories and validated nothing. An
    // unearned promise in the component's own vocabulary is worse than silence.
    expect(built.body).not.toContain('**')

    // No describer was supplied and none was needed: the common case for a new
    // tenant costs no model call at all.
    expect(await kb.rebuildMap()).toMatchObject({ mode: 'enumerated' })
  })

  it('UAT_FC_REQ-159 the threshold is a character budget, not a document count', () => {
    const kb = projectKb()
    const wide = Array.from({ length: 4 }, (_, i) => ({
      uid: `material-${i}`,
      type: 'material',
      title: `A deliberately long document title number ${i} `.repeat(6),
      body: '',
      fields: { kind: 'document' },
    })) as unknown as Ticket[]
    // Four documents — well under "about a dozen" — but the listing does not fit,
    // which is the case a count-based floor would get wrong.
    expect(wide.length).toBeLessThan(12)
    expect(enumeratedLandscape(wide, kb).entryChars).toBeGreaterThan(ENUMERATE_BUDGET_CHARS)
  })

  it('UAT_FC_REQ-159 an uninformative title falls back to an excerpt, and a real one does not', () => {
    // [[DOC-38]] §6 gives every project-KB entry an AI-written title over an
    // AI-written body, so titles carry the listing. The fallback is the narrow
    // exception [[DOC-39]] §7 allows, not a default for every entry.
    expect(uninformativeTitle('Notes.pdf')).toBe(true)
    expect(uninformativeTitle('')).toBe(true)
    expect(uninformativeTitle('Brand guidelines 2024')).toBe(false)

    const kb = projectKb()
    const body = enumeratedLandscape(
      [
        {
          uid: 'material-1',
          type: 'material',
          title: 'IMG_4821.jpg',
          body: 'The kitchen at dusk, copper pans on the wall.',
          fields: { kind: 'image' },
        },
        {
          uid: 'material-2',
          type: 'material',
          title: 'Brand guidelines 2024',
          body: 'The palette is oxblood and bone.',
          fields: { kind: 'document' },
        },
      ] as unknown as Ticket[],
      kb,
    ).body
    expect(body).toContain('The kitchen at dusk')
    // The informative one is not padded with its own body — that would be
    // conveying content, which is not the listing's job.
    expect(body).not.toContain('oxblood')
  })

  it('UAT_FC_REQ-159 above the floor with no describer it refuses, and leaves the previous map standing', async () => {
    const { kb } = await openKb('req159-nodescriber', { enumerateBudget: 0 })
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await kb.refreshIndex()

    // The describe step is the one part of the pipeline a model must do. A Worker
    // has no describer of its own — the bridge's lives behind a Node-only entry
    // point — so it says which seam is missing rather than writing a mechanical
    // paragraph that only restates what is rendered beside it.
    await expect(kb.landscape()).rejects.toBeInstanceOf(DescriberNotConfiguredError)
    expect(await kb.publishedMap()).toBeNull()
  })
})

describe('REQ-159 — the index source', () => {
  it('UAT_FC_REQ-159 an absent index reads as null rather than throwing', async () => {
    // "There is no index yet" is the ordinary state every first build starts
    // from, and the port says so with `null`. A throw here would make the first
    // upload on a fresh tenant an error.
    const source = r2IndexSource(env.BLOBS as R2Bucket, 'kb/req159-empty/project/index/')
    expect(await source.readBytes('embeddings.bin')).toBeNull()
    expect(await source.readText('metadata.json')).toBeNull()

    await source.writeText('metadata.json', '[]')
    await source.writeBytes('embeddings.bin', new Uint8Array([1, 2, 3]))
    expect(await source.readText('metadata.json')).toBe('[]')
    expect([...(await source.readBytes('embeddings.bin'))!]).toEqual([1, 2, 3])
  })
})
