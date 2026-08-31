import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  buildKb,
  configPath,
  corpusDir,
  corpusDocument,
  exportCorpus,
  kbStatus,
  optedIn,
  readDocTickets,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * REQ-123 — **the system knowledge base, end to end**.
 *
 * The KB build has exactly two external boundaries, an embedding model and a
 * describing model, and those are the only two things doubled here (see
 * `fixtures/kb-stub-model.mjs`). Everything else is real: a real corpus on disk,
 * the real `DocDirStore`, the real index and chunk builds, the real cosine
 * search, the real ranker, the real clustering and access-point validation.
 *
 * So what these UATs establish is not "the code runs" but the properties the
 * feature is *for*: that a document exported from the ticket store is findable by
 * asking for it in words, that the map describes the corpus it was built from,
 * and that a rebuild does not silently re-embed a corpus that has not changed.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** How many `doc` tickets have opted into the system KB, per the store itself. */
function optedInTicketCount(): number {
  return readDocTickets().filter(optedIn).length
}

/**
 * A corpus small enough to reason about, with three clearly separate subjects.
 *
 * Written by hand rather than exported, because a search assertion needs a
 * corpus whose right answer is known. The export path is exercised against the
 * REAL ticket store in its own suite below — the two need different corpora for
 * different reasons and sharing one would weaken both.
 */
const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
fields:
  system_kb: true
---
# Carousel behaviour module

The carousel module rotates slides. Autoplay, loop and interval are behavioural
config. Slide appearance is not config: a slide is an L1 subtree bound into a
slot, so the carousel ships no stylesheet of its own.
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
fields:
  system_kb: true
---
# Storage and revisions

A site's draft lives on disk. Publishing snapshots the draft into a numbered
revision, appends to the history log, and renders the published output. A
revision is immutable once written.
`,
  'DOC-C.md': `---
id: DOC-C
type: doc
title: Typography and colour palette
fields:
  system_kb: true
---
# Typography and colour palette

Text colour is picked from the site palette. Font size, weight and measure are
typed axes on an L1 text leaf rather than free-form CSS.
`,
}

function seedCorpus(root: string): void {
  const dir = corpusDir(root)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  // A real declaration, carrying the same opt-in predicate the scaffold writes —
  // the fixture has to exercise the corpus the build actually resolves, not a
  // looser one that would pass whatever the predicate said.
  writeFileSync(
    configPath(root),
    JSON.stringify({
        knowledge_bases: {
          system: {
            description: 'Test system knowledge.',
            corpus: { type: ['doc'], 'fields.system_kb': true },
            landscape: 'authored',
            source: 'shipped',
          },
        },
      }),
    'utf8',
  )
  for (const [name, text] of Object.entries(CORPUS)) {
    writeFileSync(path.join(dir, name), text, 'utf8')
  }
}

describe('REQ-123 — the system knowledge base', () => {
  let root: string
  let built: Awaited<ReturnType<typeof buildKb>>

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB

    // The whole release build, minus the export step — this suite supplies its
    // own corpus, so it drives the pipeline directly rather than through
    // `buildKb`, which would go to the ticket store for documents.
    seedCorpus(root)
    built = await buildIndexesAndMap(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-123_a_document_is_found_by_asking_for_it_in_words', async () => {
    // The point of the whole feature: an agent that does not know a document's
    // id, filename or title can still reach it by describing what it wants.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)

    const hits = await lib.search('how do slides rotate automatically', {
      source: nodeIndexSource(path.join(corpusDir(root), 'index')),
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: await resolveEmbedder(),
      sources: binding.sources,
    })

    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].uid).toBe('DOC-A')
  })

  it('test_UAT_FC_REQ-123_chunk_search_returns_the_passage_not_the_whole_document', async () => {
    // A design document is far too coarse a unit to hand back as a hit. Chunk
    // search is what makes a large corpus answerable, so it must return a
    // SECTION of a document and say which document it came from.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)

    const hits = await lib.searchChunks('text colour picked from the palette', {
      source: nodeIndexSource(path.join(corpusDir(root), 'chunks')),
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: await resolveEmbedder(),
      sources: binding.sources,
    })

    expect(hits.length).toBeGreaterThan(0)
    // The chunk's uid carries its parent, so a citation resolves to a document.
    expect(String(hits[0].uid)).toContain('DOC-C')
  })

  it('test_UAT_FC_REQ-123_the_map_is_generated_from_the_corpus_and_names_its_territories', () => {
    // Generated, never hand-authored (REQ-123 decision 3). The evidence that it
    // was built FROM this corpus is that the describer saw corpus vocabulary —
    // a map assembled from constants would pass a mere existence check.
    const map = readFileSync(path.join(corpusDir(root), 'awareness.md'), 'utf8')

    expect(built.territories).toBeGreaterThanOrEqual(2)
    expect(map).toContain('This territory covers')
    expect(map.toLowerCase()).toMatch(/carousel|palette|revision/)
  })

  it('test_UAT_FC_REQ-123_the_map_is_a_ticket_the_report_lookup_finds', async () => {
    // The frontmatter is what makes the file a ticket rather than prose: priming
    // finds the map through the ordinary `(type, kind, kb)` report lookup, with
    // no second file-shaped path that only a shipped KB would use.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const binding = await bindKb(root)

    const report = await lib.findAwarenessReport(binding.store, SYSTEM_KB)
    expect(report).not.toBeNull()
    expect(report.fields.kind).toBe('awareness_report')
    expect(report.fields.kb).toBe(SYSTEM_KB)
  })

  it('test_UAT_FC_REQ-123_the_map_is_kept_out_of_the_corpus_it_describes', async () => {
    // Otherwise every rebuild clusters the previous build's map, and the KB
    // slowly fills with descriptions of its own descriptions.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const binding = await bindKb(root)

    const corpus = await lib.resolveCorpus(binding.store, binding.kb)
    const uids = corpus.map((t: { uid: string }) => t.uid)
    expect(uids.sort()).toEqual(['DOC-A', 'DOC-B', 'DOC-C'])
    expect(uids).not.toContain('awareness')
  })

  it('test_UAT_FC_REQ-123_an_unchanged_corpus_is_not_re_embedded', async () => {
    // The index is incremental against the file stamp. A rebuild that re-embedded
    // an untouched corpus would cost real money per build and would tell the
    // ranker every document had just changed.
    const again = await buildIndexesAndMap(root, { mapToo: false })
    expect(again.documents).toBe(3)
    expect(again.embedded).toBe(0)
  }, 120_000)

  it('test_UAT_FC_REQ-123_status_reports_what_is_built', () => {
    const status = kbStatus(root)
    expect(status).toMatchObject({ corpus: 3, index: true, chunks: true, map: true })
  })
})

/**
 * The index, chunk and map steps over a corpus that is already on disk.
 *
 * Mirrors `buildKb`'s body, minus the export — this suite brings its own corpus.
 * Kept here rather than exported from `kb.ts` as a test seam, because production
 * has no caller for "build over a corpus somebody else wrote".
 */
async function buildIndexesAndMap(
  root: string,
  { mapToo = true }: { mapToo?: boolean } = {},
): Promise<{ documents: number; embedded: number; chunks: number; territories: number }> {
  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()

  const indexSource = nodeIndexSource(path.join(corpusDir(root), 'index'))
  const stats = await lib.buildIndex(binding.store, binding.kbs, indexSource, {
    embedder,
    sources: binding.sources,
  })
  const chunkSource = nodeIndexSource(path.join(corpusDir(root), 'chunks'))
  const chunkStats = await lib.buildChunkIndex(binding.store, binding.kbs, chunkSource, {
    embedder,
    sources: binding.sources,
  })

  let territories = 0
  if (mapToo) {
    const { embeddings, metadata } = await lib.loadIndex(indexSource)
    const vectors = new Map(metadata.map((row: { uid: string }, i: number) => [row.uid, embeddings[i]]))
    const docs = lib.documentsFromTickets(await lib.resolveCorpus(binding.store, binding.kb), vectors)
    const { createDescriber } = await import(/* @vite-ignore */ `file://${STUB}`)
    const describer = createDescriber()
    const report = await lib.buildAwareness(
      docs,
      new lib.KnowledgeBase({ ...binding.kb, landscape: lib.DERIVED }),
      {
        describe: describer.describe,
        search: async (query: string) => {
          const hits = await lib.search(query, {
            source: indexSource,
            store: binding.store,
            kbs: binding.kbs,
            kb: SYSTEM_KB,
            topK: 5,
            embedder,
            sources: binding.sources,
          })
          return hits.map((hit: { uid: string }) => hit.uid)
        },
        clusterer: lib.agglomerativeClusterer({ nClusters: 2, maxDistance: Infinity }),
        describer: describer.name,
      },
    )
    writeFileSync(
      path.join(corpusDir(root), 'awareness.md'),
      awarenessDocument(report.body, SYSTEM_KB),
      'utf8',
    )
    territories = report.territories.length
  }

  return {
    documents: stats.total,
    embedded: stats.added,
    chunks: chunkStats.chunks,
    territories,
  }
}

/**
 * The export, against the REAL ticket store.
 *
 * Deliberately not a fixture: the thing being tested is that our documents, as
 * they actually are, survive the trip into the corpus format — and the format's
 * sharp edges (a title with a colon, a structured field, a document whose ticket
 * has been deleted) are ones only real data reliably has.
 */
describe('REQ-123 — the corpus export', () => {
  let root: string
  let first: ReturnType<typeof exportCorpus>
  let second: ReturnType<typeof exportCorpus>
  let stampBefore: number
  let stampAfter: number
  let sampled: string

  /**
   * One scenario — export, disturb, re-export — asserted from several angles.
   *
   * Structured this way because reading the ticket store takes over a minute:
   * `xgd ticket list --view` is the export's whole cost, and a suite that called
   * it once per assertion would spend four minutes proving four things about the
   * same two runs.
   */
  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-export-'))
    first = exportCorpus(root)

    sampled = readdirSync(corpusDir(root)).find((f) => f.endsWith('.md'))!
    stampBefore = statSync(path.join(corpusDir(root), sampled)).mtimeMs

    // A document whose ticket has been withdrawn since the last build.
    writeFileSync(
      path.join(corpusDir(root), 'DOC-GONE.md'),
      '---\nid: DOC-GONE\ntype: doc\ntitle: Withdrawn\n---\n# Withdrawn\n',
    )

    second = exportCorpus(root)
    stampAfter = statSync(path.join(corpusDir(root), sampled)).mtimeMs
  }, 300_000)

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('test_UAT_FC_REQ-123_every_opted_in_doc_ticket_is_exported_and_reads_back_as_a_ticket', async () => {
    // Membership is opt-in (`fields.system_kb`), and every doc carries it today —
    // so this asserts completeness against what the store says is IN the KB, not
    // against a hard-coded count that would go stale the next time a doc lands.
    expect(first.docs.length).toBeGreaterThan(0)
    expect(first.docs.length).toBe(optedInTicketCount())

    const { DocDirStore } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing'))
    const { nodeDocReader } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing', './node'))
    const store = new DocDirStore(nodeDocReader(corpusDir(root)), { type: 'doc' })
    const { tickets } = await store.query({ type: 'doc' })

    expect(tickets.length).toBe(second.docs.length)
    for (const ticket of tickets) {
      // The uid IS the filename stem, and the filename is the human id — so a
      // retitled document stays the same document and its citations still resolve.
      expect(ticket.uid).toMatch(/^[A-Z]+-\d+$/)
      expect(ticket.title).toBeTruthy()
      expect(ticket.body.length).toBeGreaterThan(0)
      // Provenance survives the trip even though the uid cannot.
      expect(ticket.fields.origin_uid).toMatch(/^doc-/)
    }
  })

  it('test_UAT_FC_REQ-123_an_unchanged_document_keeps_its_file_stamp', () => {
    // The index keys incremental work on the file stamp, so a re-export that
    // rewrote every byte-identical file would re-embed the entire corpus.
    expect(stampAfter).toBe(stampBefore)
  })

  it('test_UAT_FC_REQ-123_a_document_whose_ticket_is_gone_is_removed', () => {
    // A shipped corpus has no supersession — `DocDirStore` returns no backlinks
    // precisely because a withdrawn document is DELETED at build time. A stale
    // file left behind would stay searchable, and confidently wrong, forever.
    expect(second.removed).toContain('DOC-GONE.md')
    expect(readdirSync(corpusDir(root))).not.toContain('DOC-GONE.md')
  })

  it('test_UAT_FC_REQ-123_only_an_explicit_true_opts_a_document_in', () => {
    // The membership rule itself, asserted directly rather than through the
    // export — because every doc is opted in today, so an export-driven test
    // would have nothing to exclude and would pass vacuously.
    //
    // Strictly the boolean. A field arriving as the STRING "true" is a document
    // whose frontmatter did not parse the way its author assumed; treating it as
    // opt-in would hide that, and the failure it hides is a document silently
    // reaching a client-facing assistant.
    expect(optedIn({ fields: { system_kb: true } })).toBe(true)

    expect(optedIn({ fields: {} })).toBe(false)
    expect(optedIn({ fields: null })).toBe(false)
    expect(optedIn({})).toBe(false)
    expect(optedIn({ fields: { system_kb: false } })).toBe(false)
    expect(optedIn({ fields: { system_kb: 'true' } })).toBe(false)
    expect(optedIn({ fields: { system_kb: 1 } })).toBe(false)
  })

  it('test_UAT_FC_REQ-123_the_export_agrees_with_the_store_about_who_is_in', () => {
    // The integration half: what the export produced is exactly what the rule
    // says of the real ticket store — no document silently added, none silently
    // dropped, and nothing reported as skipped that was in fact exported.
    const tickets = readDocTickets()
    const shouldBeIn = tickets.filter(optedIn).map((t) => t.id).sort()
    const shouldBeOut = tickets.filter((t) => !optedIn(t)).map((t) => t.id).sort()

    expect(second.docs.map((d) => d.id).sort()).toEqual(shouldBeIn)
    expect(second.skipped).toEqual(shouldBeOut)

    const onDisk = readdirSync(corpusDir(root)).filter((f) => f.endsWith('.md'))
    for (const id of shouldBeOut) expect(onDisk).not.toContain(`${id}.md`)
  }, 300_000)

  it('test_UAT_FC_REQ-123_opting_a_document_out_removes_it_from_the_corpus', () => {
    // Withdrawal has to be a DELETION, not merely a stop-refreshing: a document
    // taken out of the KB must stop being searchable. It travels the same path a
    // deleted ticket does, which is why that path is shared rather than special.
    const dropped = mkdtempSync(path.join(tmpdir(), 'kb-optout-'))
    try {
      const dir = corpusDir(dropped)
      mkdirSync(dir, { recursive: true })
      writeFileSync(path.join(dir, 'DOC-WAS-IN.md'), '---\nid: DOC-WAS-IN\ntype: doc\n---\n# Was in\n')

      // Re-running the export with that document not opted in (it is not a real
      // ticket at all, which is the same thing from the corpus's point of view).
      const result = exportCorpus(dropped)

      expect(result.removed).toContain('DOC-WAS-IN.md')
      expect(readdirSync(dir)).not.toContain('DOC-WAS-IN.md')
    } finally {
      rmSync(dropped, { recursive: true, force: true })
    }
  }, 300_000)

  it('test_UAT_FC_REQ-123_the_declaration_is_what_the_build_actually_uses', async () => {
    // The declaration must be the thing in force, not a document describing what
    // the code separately hard-codes. Editing the corpus predicate has to change
    // the corpus — otherwise `knowledge_bases.json` is decoration, and a reader
    // tuning it would get no error and no effect.
    const scratch = mkdtempSync(path.join(tmpdir(), 'kb-decl-'))
    try {
      mkdirSync(corpusDir(scratch), { recursive: true })
      writeFileSync(
        configPath(scratch),
        JSON.stringify({
          knowledge_bases: {
            system: {
              description: 'Declared description, not a hard-coded one.',
              corpus: { type: ['doc'], 'fields.system_kb': true },
              landscape: 'authored',
              source: 'shipped',
              weight: 2.5,
            },
          },
        }),
        'utf8',
      )

      const binding = await bindKb(scratch)

      expect(binding.kb.prompt).toBe('Declared prompt, not a hard-coded one.')
      expect(binding.kb.weight).toBe(2.5)
      expect([...binding.kb.corpus.terms.keys()]).toContain('fields.system_kb')
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-123_a_structured_field_is_dropped_rather_than_stringified', () => {
    // `DocDirStore` reads one level of `fields`, so a mapping value has no
    // representation. `String({})` would put "[object Object]" in the corpus:
    // not the value, not an error, and indistinguishable from data.
    const doc = corpusDocument({
      uid: 'doc-1',
      id: 'DOC-99',
      title: 'Has structure',
      body: '# Has structure',
      created_at: null,
      updated_at: null,
      fields: { doc_kind: 'architecture', references: { a: 1 } },
    })
    expect(doc).toContain('doc_kind: architecture')
    expect(doc).not.toContain('[object Object]')
    expect(doc).not.toContain('references:')
  })

})
