import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  configPath,
  corpusDir,
  kbBundle,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { kbLine, writeKbModule } from '../tools/generate/src/cli/assets'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * REQ-158 — **the system KB, packed for a runtime with no filesystem**.
 *
 * The companion `…_system_kb.workers.test.ts` proves the assistant answers from
 * a document and names it. This file holds the half of the ticket that a passing
 * conversation cannot establish, because each claim is about the ARTEFACT the
 * build emits rather than about a running session:
 *
 * 1. THE BUNDLE IS THE SAME KB, EXPRESSED AS VALUES. Both indexes and the corpus
 *    text, carried whole — and the document stamps carried with them, because a
 *    corpus dated differently from the index it was built against disagrees with
 *    the ranker silently rather than loudly.
 * 2. THE MODULE IS WRITTEN UNCONDITIONALLY. `src/generated/` is gitignored, so a
 *    module written only when a KB exists would make the Worker's static import
 *    fail to RESOLVE on any checkout that had never run `1c kb build` — turning
 *    a missing capability into a build that does not compile.
 * 3. AND A MISSING KB IS LOUD. Degrading gracefully and saying nothing are
 *    different things: an assistant shipped with no knowledge tools looks exactly
 *    like one that has them until it answers badly, weeks later, in front of a
 *    client.
 *
 * ONE DOUBLE, AND IT IS THE MODEL. The embedder — `resolveEmbedder` honours
 * `LAGRANGE_KM_EMBEDDER`, which is how REQ-123's suite builds a fixture KB
 * without a credential. Nothing asserted here is about embedding quality; the
 * corpus resolution, both index builds and the bundle read are the real thing.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** Two documents and a map — the smallest thing that is genuinely a built KB. */
const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
---
# Carousel behaviour module

The carousel rotates slides. Autoplay and interval are behavioural config.
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and renders the output.
`,
}

/** A KB root with a corpus, a declaration, both indexes and a map. */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        system: {
          description: 'Test system knowledge.',
          corpus: {},
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
  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(
    /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
  )
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'index')), {
    embedder,
    sources: binding.sources,
  })
  await lib.buildChunkIndex(
    binding.store,
    binding.kbs,
    nodeIndexSource(path.join(dir, 'chunks')),
    { embedder, sources: binding.sources },
  )
  writeFileSync(
    path.join(dir, 'awareness.md'),
    awarenessDocument('## Behaviour modules\n\nCarousels and forms. Start at DOC-A.\n', SYSTEM_KB),
    'utf8',
  )
}

describe('REQ-158 — the built KB becomes a bundle', () => {
  let root: string

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-bundle-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    await buildFixtureKb(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-158_the_bundle_carries_both_indexes_and_the_corpus', async () => {
    const bundle = await kbBundle(root)
    expect(bundle).not.toBeNull()

    // BOTH INDEXES, not one. A build that emitted only the document index would
    // leave the KB technically present and practically useless: a whole design
    // document is far too coarse a unit to hand back as a hit, which is what the
    // chunk index exists to fix.
    expect(bundle!.index['embeddings.bin'].length).toBeGreaterThan(0)
    expect(bundle!.index['metadata.json']).toContain('DOC-A')
    expect(bundle!.chunks['embeddings.bin'].length).toBeGreaterThan(0)

    // The vectors travel as base64 — a JS module cannot hold raw bytes, and a
    // UTF-8 round trip would replace every invalid sequence and corrupt the index
    // into one that still loads.
    expect(bundle!.index['embeddings.bin']).toMatch(/^[A-Za-z0-9+/]+=*$/)

    // The corpus itself, so the Worker has documents to return as well as
    // vectors to rank — and the map, so a cold session can be primed with one.
    expect(Object.keys(bundle!.docs).sort()).toEqual(['DOC-A.md', 'DOC-B.md', 'awareness.md'])
    expect(bundle!.docs['DOC-A.md'].text).toContain('Autoplay and interval')

    // Nothing but markdown: the index sidecars sit inside the corpus directory
    // and must not arrive as documents of their own.
    for (const name of Object.keys(bundle!.docs)) expect(name.endsWith('.md')).toBe(true)
  })

  it('test_UAT_FC_REQ-158_every_document_carries_its_own_stamp', async () => {
    const bundle = await kbBundle(root)
    // THE FAILURE THIS PREVENTS IS SILENT. `bundleDocReader` stamps everything
    // `EPOCH` when it is not told otherwise, while the build's own reader takes
    // each file's mtime. A bundle without stamps would therefore hand the Worker
    // a corpus dated 1970 while the index was built against one dated today —
    // no error, just two halves disagreeing about recency, which is the ranker's
    // own input.
    for (const [name, doc] of Object.entries(bundle!.docs)) {
      expect(doc.updated_at, name).not.toBe('1970-01-01T00:00:00Z')
      expect(Date.parse(doc.updated_at), name).toBeGreaterThan(0)
    }
  })

  it('test_UAT_FC_REQ-158_an_unbuilt_kb_is_null_rather_than_an_error', async () => {
    // The ordinary state of a fresh checkout, and a degradation rather than a
    // failure: an operator who has never run `1c kb build` gets an assistant that
    // knows its tools and not the design documents.
    const empty = mkdtempSync(path.join(tmpdir(), 'kb-none-'))
    try {
      expect(await kbBundle(empty)).toBeNull()
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }
  })
})

describe('REQ-158 — the emitted module', () => {
  it('test_UAT_FC_REQ-158_the_module_is_written_even_when_the_kb_is_unbuilt', async () => {
    // `apps/control-app/src/generated/` is gitignored, so this file does not
    // exist until `1c assets` runs. Writing it only when a KB existed would make
    // the Worker's static `import { KB } from './generated/kb.js'` fail to
    // RESOLVE on a machine that had never built one — a missing capability
    // turned into a build that does not compile.
    const out = mkdtempSync(path.join(tmpdir(), 'kb-emit-'))
    const repo = mkdtempSync(path.join(tmpdir(), 'kb-repo-'))
    try {
      const report = await writeKbModule(out, repo)
      expect(report.built).toBe(false)

      const file = path.join(out, 'kb.js')
      expect(existsSync(file)).toBe(true)
      // The absent case is a VALUE, not an absent export: `KB === null` is what
      // lets the Worker degrade to no knowledge tools rather than to a boot
      // failure, and it is what the runtime opener actually branches on.
      expect(readFileSync(file, 'utf8')).toContain('export const KB = null')
      // The declaration travels with it, or the Worker's typecheck has nothing
      // to resolve the import against.
      expect(existsSync(path.join(out, 'kb.d.ts'))).toBe(true)
    } finally {
      rmSync(out, { recursive: true, force: true })
      rmSync(repo, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-158_a_missing_kb_is_loud_and_a_built_one_is_counted', () => {
    // GRACEFUL AND SILENT ARE DIFFERENT THINGS. The Worker is meant to survive an
    // unbuilt KB; the operator is not meant to find out about it from a client.
    // This is the one line of the asset report that shouts, and it shouts at the
    // moment the operator could still fix it.
    const absent = kbLine({ built: false, documents: 0, bytes: 64 })
    expect(absent).toMatch(/NOT BUILT/)
    expect(absent).toContain('1c kb build')

    // And when it is built the line is ordinary — no shouting, so the shouting
    // keeps meaning something.
    const present = kbLine({ built: true, documents: 37, bytes: 512 * 1024 })
    expect(present).not.toMatch(/NOT BUILT/)
    expect(present).toContain('37')
  })
})
