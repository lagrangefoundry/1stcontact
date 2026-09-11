import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  configPath,
  corpusDir,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * Reconciliation UATs for story-c4f329d3 — **the fourth artefact**: the built
 * knowledge base packed as an importable module, for a runtime that has no
 * filesystem (AC-1647, AC-1648, AC-1649).
 *
 * WHY THIS IS A SEPARATE FILE FROM `reconciliation-system-knowledge-base.test.ts`.
 * The three criteria here are about an artefact the *application* build emits —
 * `1c assets`, reading whatever `1c kb build` last left behind — not about the
 * knowledge-base pipeline itself. The pipeline's own report is explicitly
 * unchanged by them (AC-1291 asserts it names no packed-module figure), so the
 * two sets of criteria are asserted at two different commands and share nothing
 * but a fixture shape.
 *
 * WHAT IS STOOD IN FOR, AND WHY ONLY THAT. One double, and it is the embedding
 * model — `LAGRANGE_KM_EMBEDDER`, the seam `resolveEmbedder` already reads
 * (`tests/fixtures/kb-stub-model.mjs`). Nothing asserted below is about
 * embedding quality. The corpus resolution, both index builds, the bundle read,
 * the module emission and the report line are all the real thing, and the module
 * is emitted by the same function `1c assets` calls.
 *
 * WHY THE TWO ENTRY POINTS ARE REACHED DYNAMICALLY. A static import of a symbol
 * a checkout does not carry is a *typecheck* failure, which takes the whole
 * build down and says nothing useful about which criterion is unmet. Resolved at
 * run time, a checkout missing the implementation fails these three tests — by
 * name, with the reason — and leaves every other suite reporting for itself.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** The document index and the passage index, as they sit under the corpus. */
const INDEX_DIR = 'index'
const CHUNKS_DIR = 'chunks'

/** The generated map's filename, which is in the corpus directory but not of it. */
const AWARENESS_FILE = 'awareness.md'

// ── the artefact under test, reached by name ─────────────────────────────────

/** The packed knowledge base, as values a runtime with no filesystem can hold. */
interface PackedKb {
  /** The document index — the vectors and every sidecar written beside them. */
  index: Record<string, string>
  /** The passage index, the same shape. Two artefacts, not two modes of one. */
  chunks: Record<string, string>
  /** The corpus text, keyed by the filename a citation resolves to. */
  docs: Record<string, { text: string; updated_at: string }>
}

/** What the application build's knowledge-base step reports about what it wrote. */
interface PackReport {
  built: boolean
  documents: number
  bytes: number
}

type ReadPacked = (root?: string) => Promise<PackedKb | null>
type WritePacked = (generatedDir: string, repoRoot: string) => Promise<PackReport>
type PackLine = (report: PackReport) => string

type Exports = Record<string, unknown>

/**
 * One export of a module, or a failure that says which criterion cannot be met.
 *
 * The message names the artefact rather than the symbol alone, because the
 * failure it reports is not "a rename went unnoticed" — it is "this checkout
 * does not carry the packing at all", and an operator reading a test log needs
 * to be told which of those two they are looking at.
 */
function exported<T>(module: Exports, name: string, where: string): T {
  const value = module[name]
  if (typeof value !== 'function') {
    throw new Error(
      `\`${name}\` is not exported by ${where}. This checkout does not carry the ` +
        `packing of the built knowledge base as an importable module, so the ` +
        `criterion cannot be satisfied against it.`,
    )
  }
  return value as unknown as T
}

async function kbExports(): Promise<Exports> {
  return (await import('../tools/generate/src/cli/kb')) as unknown as Exports
}

async function assetExports(): Promise<Exports> {
  return (await import('../tools/generate/src/cli/assets')) as unknown as Exports
}

// ── what the deployable actually imports out of the generated shim ───────────

/** The deployable's own source, which is the only authority on what it reaches for. */
const CONTROL_APP_SRC = path.resolve('apps/control-app/src')

/** The generated directory is the shim's output, not a consumer of it. */
const GENERATED_DIR = 'generated'

/**
 * Every `import { … } from '…/generated/knowledge'` name in a tree of TypeScript.
 *
 * READ FROM SOURCE RATHER THAN LISTED, which is the whole point. A second
 * hand-maintained roster beside `KNOWLEDGE_EXPORTS` would drift from it in
 * exactly the way the first one drifted from the importers — the failure this
 * guards against is a list going stale, so the guard cannot itself be a list.
 *
 * `X as Y` yields `X`: the alias is the local name, and the shim must declare
 * the name upstream exports (`search`, not `kmSearch`).
 */
function knowledgeImports(dir: string): Set<string> {
  const found = new Set<string>()
  const block = /import\s*\{([^}]*)\}\s*from\s*'(?:\.\.?\/)+generated\/knowledge(?:\.js)?'/g

  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = path.join(at, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== GENERATED_DIR) walk(full)
        continue
      }
      if (!entry.name.endsWith('.ts')) continue
      const source = readFileSync(full, 'utf8')
      for (const match of source.matchAll(block)) {
        for (const clause of match[1].split(',')) {
          const name = clause.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
          if (name) found.add(name)
        }
      }
    }
  }

  walk(dir)
  return found
}

// ── the fixture knowledge base ───────────────────────────────────────────────

/**
 * Two documents on two clearly separate subjects, plus a map.
 *
 * The smallest thing that is genuinely a *built* knowledge base: fewer than two
 * documents and the corpus assertions pass vacuously, and without the map the
 * criterion's "includes the generated awareness map" has nothing to observe.
 */
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

/**
 * A knowledge-base root holding a corpus, a declaration, both indexes and a map.
 *
 * The map is written LAST, after both index passes, because that is the order
 * the real build uses and the order the artefact's own coherence depends on: a
 * map clustered from a corpus that already contained the previous build's map
 * would fill the knowledge base with descriptions of its own descriptions.
 */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
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
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, INDEX_DIR)), {
    embedder,
    sources: binding.sources,
  })
  await lib.buildChunkIndex(
    binding.store,
    binding.kbs,
    nodeIndexSource(path.join(dir, CHUNKS_DIR)),
    { embedder, sources: binding.sources },
  )
  writeFileSync(
    path.join(dir, AWARENESS_FILE),
    awarenessDocument('## Behaviour modules\n\nCarousels and forms. Start at DOC-A.\n', SYSTEM_KB),
    'utf8',
  )
}

// ── AC-1647: the packed module is the same knowledge base, as values ─────────

describe('story-c4f329d3 — the built knowledge base, packed', () => {
  /** A checkout-shaped tree: `<repo>/kb` is what the application build reads. */
  let repo: string
  let kbDir: string

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    repo = mkdtempSync(path.join(tmpdir(), 'kb-packed-repo-'))
    kbDir = path.join(repo, 'kb')
    await buildFixtureKb(kbDir)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(repo, { recursive: true, force: true })
  })

  it('test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp', async () => {
    const readPacked = exported<ReadPacked>(await kbExports(), 'kbBundle', 'the knowledge-base CLI module')
    const packed = await readPacked(kbDir)
    expect(packed).not.toBeNull()
    const kb = packed as PackedKb

    // BOTH INDEXES, each whole. One without the other would leave the knowledge
    // base technically present and practically useless: a whole design document
    // is far too coarse a unit to hand back as an answer, which is exactly what
    // the passage index exists to fix.
    expect(kb.index['embeddings.bin'].length).toBeGreaterThan(0)
    expect(kb.chunks['embeddings.bin'].length).toBeGreaterThan(0)
    // …and the sidecars travel with the vectors, naming a document that was
    // actually indexed rather than arriving as an empty shell.
    expect(kb.index['metadata.json']).toContain('DOC-A')

    // The vectors travel in a TEXT ENCODING that survives a module intact. A
    // character round trip replaces every invalid byte sequence and corrupts the
    // index into one that still loads — no error, just worse answers.
    expect(kb.index['embeddings.bin']).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(kb.chunks['embeddings.bin']).toMatch(/^[A-Za-z0-9+/]+=*$/)

    // The corpus itself, keyed by the filename a citation resolves to, and
    // including the generated map so a cold session can be primed as well as
    // answered.
    expect(Object.keys(kb.docs).sort()).toEqual([...Object.keys(CORPUS), AWARENESS_FILE].sort())
    expect(kb.docs['DOC-A.md'].text).toContain('Autoplay and interval')

    // NOTHING BUT DOCUMENTS. The index files sit inside the corpus directory on
    // disk; they must not arrive as documents of their own.
    for (const name of Object.keys(kb.docs)) expect(name.endsWith('.md')).toBe(true)

    // EVERY DOCUMENT CARRIES ITS OWN STAMP, not a shared default. The failure
    // this prevents is silent: a bundled reader stamps everything with the epoch
    // unless told otherwise, while the build's own reader takes each file's
    // modification time — so a stamp-free packing hands the runtime a corpus
    // dated 1970 against an index built against one dated today. Nothing errors;
    // the two halves simply disagree about recency, which is the ranker's input.
    for (const [name, doc] of Object.entries(kb.docs)) {
      expect(doc.updated_at, name).not.toBe('1970-01-01T00:00:00Z')
      expect(Date.parse(doc.updated_at), name).toBeGreaterThan(0)
    }
  }, 120_000)

  it('test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted', async () => {
    // Degrading gracefully and saying nothing are different things. The runtime
    // is meant to survive a knowledge base that was never built; the operator is
    // not meant to find that out from a client, weeks later.
    const assets = await assetExports()
    const writePacked = exported<WritePacked>(assets, 'writeKbModule', 'the asset-build module')
    const line = exported<PackLine>(assets, 'kbLine', 'the asset-build module')

    // NOTHING PACKED — the one line in this report allowed to shout, produced
    // from a real run of the build step against a checkout with no knowledge
    // base rather than from a hand-built report.
    const bare = mkdtempSync(path.join(tmpdir(), 'kb-packed-bare-'))
    const bareOut = mkdtempSync(path.join(tmpdir(), 'kb-packed-bare-out-'))
    try {
      const absent = line(await writePacked(bareOut, bare))
      expect(absent).toMatch(/NOT BUILT/)
      expect(absent).toMatch(/no system knowledge/i)
      // Named, so the line is an instruction rather than a report of loss.
      expect(absent).toContain('1c kb build')
    } finally {
      rmSync(bare, { recursive: true, force: true })
      rmSync(bareOut, { recursive: true, force: true })
    }

    // SOMETHING PACKED — ordinary register: how many documents and how large,
    // and NO warning marker at all, so the shouting keeps meaning something when
    // it does appear.
    const out = mkdtempSync(path.join(tmpdir(), 'kb-packed-out-'))
    try {
      const report = await writePacked(out, repo)
      expect(report.built).toBe(true)
      expect(report.documents).toBe(Object.keys(CORPUS).length + 1)

      const present = line(report)
      expect(present).not.toMatch(/NOT BUILT/)
      expect(present).not.toContain('***')
      expect(present).toContain(String(report.documents))
      expect(present).toMatch(/KB/)
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  }, 120_000)
})

// ── AC-1648: written always, and absent is a value rather than a gap ─────────

describe('story-c4f329d3 — the packed module is written on every application build', () => {
  it('test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built', async () => {
    // UNCONDITIONAL IS LOAD-BEARING, NOT TIDY. The generated directory is not in
    // version control, so a fresh checkout has no such module until a build
    // writes one, and the runtime reaches it by a STATIC import. A module
    // written only when a knowledge base existed would fail to *resolve* on any
    // checkout that had never built one — turning a missing capability into a
    // build that does not compile, which is far worse than the failure it avoids.
    const writePacked = exported<WritePacked>(
      await assetExports(),
      'writeKbModule',
      'the asset-build module',
    )

    const repo = mkdtempSync(path.join(tmpdir(), 'kb-unbuilt-repo-'))
    const generated = mkdtempSync(path.join(tmpdir(), 'kb-unbuilt-generated-'))
    try {
      const report = await writePacked(generated, repo)
      expect(report.built).toBe(false)

      const module = path.join(generated, 'kb.js')
      expect(existsSync(module)).toBe(true)
      // The absent case is a VALUE the runtime can branch on, stated explicitly
      // rather than by omitting the export — which is what lets a host with no
      // knowledge base degrade to an assistant with no knowledge tools instead
      // of to a boot failure.
      expect(readFileSync(module, 'utf8')).toContain('export const KB = null')
      // …and the type declaration is written beside it, or the deployable no
      // longer typechecks against its own generated import.
      expect(existsSync(path.join(generated, 'kb.d.ts'))).toBe(true)
    } finally {
      rmSync(repo, { recursive: true, force: true })
      rmSync(generated, { recursive: true, force: true })
    }

    // Reading an unbuilt tree DIRECTLY yields that same absence rather than an
    // error, for the same reason: an operator who has never run the build gets
    // an assistant that knows its tools and not the design documents, which is a
    // degradation and not a fault.
    const readPacked = exported<ReadPacked>(
      await kbExports(),
      'kbBundle',
      'the knowledge-base CLI module',
    )
    const empty = mkdtempSync(path.join(tmpdir(), 'kb-unbuilt-tree-'))
    try {
      await expect(readPacked(empty)).resolves.toBeNull()
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }

    // THE SAME DECLARATION CONCERN, ONE SHIM OVER — and the direction that was
    // missing. `knowledge.d.ts` is emitted from a hand-maintained list
    // (`KNOWLEDGE_EXPORTS`), and the existing assertion on it runs the *other*
    // way: every listed name must exist upstream, so a rename fails a test.
    // Nothing asserted the converse, that every name the deployable imports is
    // listed — so two names `system-knowledge.ts` imports were absent from the
    // list, the runtime `export *` resolved them happily, every suite stayed
    // green, and only `tsc --noEmit` on a config no gate ran objected. A
    // shortfall here must fail a test rather than a build nobody runs.
    const listed = (await assetExports()).KNOWLEDGE_EXPORTS
    expect(Array.isArray(listed)).toBe(true)
    const declared = new Set(listed as readonly string[])

    const reached = knowledgeImports(CONTROL_APP_SRC)
    // Guard the guard: a regex that matched nothing would assert nothing while
    // reporting green, which is the failure mode this whole file is written
    // against. The deployable demonstrably imports from the shim.
    expect(reached.size).toBeGreaterThan(0)

    const undeclared = [...reached].filter((name) => !declared.has(name)).sort()
    expect(
      undeclared,
      `apps/control-app/src imports ${undeclared.length} name(s) from ` +
        `'./generated/knowledge' that KNOWLEDGE_EXPORTS does not declare: ` +
        `${undeclared.join(', ')}. The generated .d.ts is emitted from that list, ` +
        `so the deployable will not typecheck until each is added to ` +
        `tools/generate/src/cli/assets.ts.`,
    ).toEqual([])
  }, 120_000)
})
