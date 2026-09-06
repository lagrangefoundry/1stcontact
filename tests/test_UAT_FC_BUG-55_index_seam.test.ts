import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  bindKb,
  configPath,
  corpusDir,
  openKnowledgeRuntime,
  resolveEmbedder,
  SHIPPED_SOURCE,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { assertIndexSeam, checkIndexSeam } from '../tools/generate/src/cli/shared-store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * BUG-55 — **the index seam, keyed by source name**.
 *
 * Upstream REQ-112 made it one index per source rather than one index per host,
 * and this repository went on passing the singular `source:` it had passed
 * before. `indexFor` refuses a KB whose source it holds no index for, so every
 * read path — `1c kb build`'s awareness map, the chat session's search, the
 * document reads behind both — failed or emptied.
 *
 * TWO PROPERTIES, AND THEY ARE NOT THE SAME PROPERTY. The first is that a search
 * resolves at all. The second is that a hit can then be READ, which travels a
 * different route: `KnowledgeRuntime.open` seeds its document snapshot from the
 * indexes it was given, and a runtime handed none places no uid and refuses
 * every read as `not_in_corpus` — silently, with no error anywhere. A fix that
 * repaired only the first would leave the second exactly as broken and look
 * finished.
 *
 * The embedding model is the one boundary doubled here; everything else is real.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

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
config, and the interval is what makes slides advance on their own.
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
fields:
  system_kb: true
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and appends to the
history log. A revision is immutable once written.
`,
}

function seedCorpus(root: string): void {
  const dir = corpusDir(root)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
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

describe('BUG-55 — search is called with indexes, not source', () => {
  let root: string

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'bug55-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    seedCorpus(root)

    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(
      /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
    )
    const binding = await bindKb(root)
    const embedder = await resolveEmbedder()
    // Both indexes, because the runtime opens over both and the chunk half is
    // keyed the same way the document half is.
    await lib.buildIndex(
      binding.store,
      binding.kbs,
      nodeIndexSource(path.join(corpusDir(root), 'index')),
      { embedder, sources: binding.sources },
    )
    await lib.buildChunkIndex(
      binding.store,
      binding.kbs,
      nodeIndexSource(path.join(corpusDir(root), 'chunks')),
      { embedder, sources: binding.sources },
    )
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-55_a_hit_can_be_searched_and_then_read', async () => {
    // THE ACCEPTANCE CRITERION IN ONE TEST. Opened through the repository's own
    // opener rather than by hand, because the opener is what was wrong: a test
    // that constructed the runtime itself would prove the component works and
    // say nothing about whether this repository calls it correctly.
    const runtime = await openKnowledgeRuntime(root)
    expect(runtime).not.toBeNull()

    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const hits = await lib.search('what makes the slides advance on their own', {
      indexes: runtime!.indexes,
      store: runtime!.store,
      kbs: runtime!.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: runtime!.embedder,
      sources: runtime!.sources,
    })

    // SEARCHED. Before the fix this threw `KnowledgeConfigError` — the KB reads
    // from a source the host has no index for — rather than returning nothing,
    // because upstream refuses instead of degrading.
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].uid).toBe('DOC-A')

    // AND THEN READ, which is the half that failed silently. The snapshot is
    // seeded from the indexes, so it is empty exactly when they are missing, and
    // an empty snapshot places no uid — every read refused as `not_in_corpus`,
    // which reads as "the corpus does not contain this" rather than as a break.
    const documents = runtime!.documents as Map<string, string[]>
    expect(documents.size).toBeGreaterThan(0)
    expect(documents.get(String(hits[0].uid))).toContain(SYSTEM_KB)
  })

  it('test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source', async () => {
    // The key is the name the KB's DECLARATION resolves to, not the KB's own
    // name — for the system KB those differ (`system` reads from `shipped`), and
    // for the project KB the declaration names nothing at all and resolves to
    // `DEFAULT_SOURCE`. Getting this wrong is not a near miss: `indexFor` has no
    // default entry to fall back on, deliberately, so a mis-keyed index is
    // refused rather than quietly contributing an empty ranking.
    const runtime = await openKnowledgeRuntime(root)
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))

    expect(Object.keys(runtime!.indexes)).toEqual([SHIPPED_SOURCE])
    expect(Object.keys(runtime!.chunkIndexes)).toEqual([SHIPPED_SOURCE])

    // The document and chunk maps are keyed alike, and both alike with the
    // corpus stores — one name answering all three questions is the whole of
    // REQ-112, and the property that makes a single `source:` insufficient.
    expect(Object.keys(runtime!.sources)).toEqual([SHIPPED_SOURCE])

    // And the seam itself agrees: the KB the repository declares resolves,
    // against the map the repository builds, to the index it built.
    const kb = (runtime!.kbs as Map<string, { source: string }>).get(SYSTEM_KB)
    expect(kb!.source).toBe(SHIPPED_SOURCE)
    expect(lib.indexFor(kb, runtime!.indexes)).toBe(runtime!.indexes[SHIPPED_SOURCE])
  })

  it('test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree', async () => {
    // THE CRITERION THIS BUG EXISTS BECAUSE OF. The seam moved out of band, the
    // repository went on calling the old shape, and nothing anywhere said so —
    // not `pnpm install`, which cannot see a store no lockfile records, and not
    // the shared-store preflight, which asked only whether the directory
    // resolved. So the check has to be about SHAPE, not presence.

    // Against the store as installed: the component takes what this repo calls
    // it with. This is the assertion that would have gone red on the day the
    // component landed, and it costs a pure function call to make.
    expect(await checkIndexSeam()).toEqual({ ok: true })
    await expect(assertIndexSeam()).resolves.toBeUndefined()

    // And against a component that has moved: the probe is injectable so the
    // incompatible case can be driven without uninstalling anything. A component
    // on the pre-REQ-112 signature has no `indexFor` at all; one on a third
    // signature refuses the map. Both arrive here the same way, which is right —
    // the operator does the same thing about either.
    const moved = async () => {
      throw new Error('the knowledge component exports no `indexFor`')
    }
    const report = await checkIndexSeam({ probe: moved })
    expect(report.ok).toBe(false)
    expect(report.detail).toContain('indexFor')

    // AND IT SAYS WHAT TO DO. A preflight that failed without naming the remedy
    // would send an operator to the lockfile, which is the one place that cannot
    // explain it.
    await expect(assertIndexSeam({ probe: moved })).rejects.toThrow(/indexes/)
    await expect(assertIndexSeam({ probe: moved })).rejects.toMatchObject({
      code: 'ENVIRONMENT',
    })
  })
})
