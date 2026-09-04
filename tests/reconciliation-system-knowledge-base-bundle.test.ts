import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  awarenessDocument,
  bindKb,
  corpusDir,
  ensureConfig,
  exportCorpus,
  kbBundle,
  resolveEmbedder,
} from '../tools/generate/src/cli/kb'
import * as kb from '../tools/generate/src/cli/kb'
import * as kbModel from '../tools/generate/src/cli/kb-model'
import { SHIPPED_SOURCE, SYSTEM_KB } from '../tools/generate/src/cli/kb-model'
import { kbLine, writeKbModule } from '../tools/generate/src/cli/assets'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  bundleStore,
  systemKb,
  systemKnowledge,
  type SystemKbBundle,
} from '../apps/control-app/src/system-knowledge'

/**
 * Reconciliation UATs for story-c4f329d3 — **the knowledge base packed to
 * travel** (AC-1514, AC-1515, AC-1516).
 *
 * THE THREE CRITERIA THIS FILE OWNS are the ones the REQ-158 reconciliation pass
 * added to the story, and they are all about the same seam: the built tree is a
 * directory on a disk, and the runtime that most needs it has none. The sibling
 * files (`…-system-knowledge-base.test.ts`, `…-corpus-integrity.test.ts`) cover
 * the pipeline that produces the tree; this one covers what happens when that
 * tree is turned into a value and read back on the other side.
 *
 * Each criterion is specified against a SILENT failure, and every assertion here
 * is written against that failure rather than against the happy path:
 *
 *   AC-1514  a corpus that travels without its stamps is a *differently dated*
 *            corpus from the index it was built against — nothing errors, the
 *            two halves simply disagree about how recent every document is, and
 *            recency is one of the ranker's own inputs. Likewise a vector payload
 *            put through a text round trip still loads and no longer means
 *            anything.
 *   AC-1515  a module written only when a KB existed leaves the Worker's static
 *            import unresolvable on a fresh checkout — a missing capability
 *            turned into a build that does not compile. And degrading gracefully
 *            is not the same as saying nothing: an assistant shipped with no
 *            knowledge looks exactly like one that has it, until it answers badly
 *            weeks later in front of a client.
 *   AC-1516  a corpus indexed under one document type and searched under another
 *            does not error. It returns nothing — which is indistinguishable from
 *            a corpus that was never built, from either side, at any point.
 *
 * WHAT IS STOOD IN FOR, AND WHY ONLY THAT. Two external boundaries, doubled at
 * the seams production already ships: the embedding model
 * (`LAGRANGE_KM_EMBEDDER`) and the describing model (`LAGRANGE_KM_DESCRIBER`),
 * both pointed at `tests/fixtures/kb-stub-model.mjs`; and the ticket store, which
 * the export reaches as an `xgd` subprocess and which is replaced on `PATH` by a
 * shim printing a controlled listing. Everything else is real — the real export,
 * the real `DocDirStore`, the real index and chunk builds, the real clustering,
 * the real `kbBundle` read-back, the real `writeKbModule`, and the Worker's own
 * `systemKnowledge` opening the result.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')

// ── the controlled ticket store ──────────────────────────────────────────────

/** A `doc` ticket in the shape `xgd ticket list --view --json` returns. */
interface StoreTicket {
  uid: string
  id: string
  title: string
  body: string
  created_at: string | null
  updated_at: string | null
  fields: Record<string, unknown> | null
}

function ticket(id: string, title: string, body: string): StoreTicket {
  return {
    uid: `doc-${id.toLowerCase()}`,
    id,
    title,
    body,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields: { doc_kind: 'system_kb' },
  }
}

/**
 * Put an `xgd` that answers with `tickets` at the front of `PATH`.
 *
 * The export reads the store through the ticketing CLI as a subprocess, so the
 * subprocess is where it is stood in for — the export's own code path is
 * untouched, down to the JSON it has to parse.
 */
function installStubStore(tickets: StoreTicket[]): () => void {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-store-'))
  const payload = path.join(dir, 'tickets.json')
  writeFileSync(payload, JSON.stringify({ items: tickets }), 'utf8')
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\nprocess.stdout.write(require('node:fs').readFileSync(${JSON.stringify(payload)}, 'utf8'))\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return () => {
    if (previous === undefined) delete process.env.PATH
    else process.env.PATH = previous
    rmSync(dir, { recursive: true, force: true })
  }
}

async function withStore<T>(tickets: StoreTicket[], fn: () => Promise<T> | T): Promise<T> {
  const restore = installStubStore(tickets)
  try {
    return await fn()
  } finally {
    restore()
  }
}

// ── the corpus the build is driven over ──────────────────────────────────────

/** The fact that exists nowhere but one planted document, in nobody's title. */
const PLANTED = 'A Ravensblack ledger entry is kept for eleven days and then discarded.'

const CORPUS: StoreTicket[] = [
  ticket(
    'DOC-A',
    'Carousel behaviour module',
    `# Carousel behaviour module

## Rotation
The slides rotate automatically on a fixed interval, looping back to the first
slide once the last one has been shown.`,
  ),
  ticket(
    'DOC-B',
    'Storage and revisions',
    `# Storage and revisions

## Publishing
Publishing snapshots the draft into a numbered revision and appends it to the
history log.`,
  ),
  ticket(
    'DOC-C',
    'Retention and disposal',
    `# Retention and disposal

## Retention
${PLANTED}`,
  ),
  ticket(
    'DOC-D',
    'Magic link sign in',
    `# Magic link sign in

## Issuing
A single-use token is mailed to a verified mailbox; there is no password
anywhere in the flow.`,
  ),
]

/** Every `.md` in the built corpus — the documents and the map beside them. */
function corpusMarkdown(root: string): string[] {
  return readdirSync(corpusDir(root))
    .filter((name) => name.endsWith('.md'))
    .sort()
}

/**
 * A built knowledge base under `root`, through the release path's own steps.
 *
 * Declaration, export, document index, passage index, map — the order
 * {@link kb.buildKb} runs them in, calling the same functions it calls, with the
 * embedding model stood in for at the seam the build already reads
 * (`LAGRANGE_KM_EMBEDDER`). The corpus, the store, the KB binding, both index
 * builds and the map's frontmatter are the real thing.
 *
 * THE MAP'S PROSE IS NOT CLUSTERED HERE, and that is a scope decision rather than
 * a shortcut: what these three criteria are about is the built tree becoming a
 * value and being read back on the other side, so the map matters to them only as
 * a file in the corpus that has to travel with its own stamp. Clustering it is
 * AC-1303's subject and is asserted there, over a corpus tuned for it.
 */
async function buildFixtureKb(root: string): Promise<void> {
  ensureConfig(root)
  await withStore(CORPUS, () => exportCorpus(root))

  const lib = (await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))) as Record<
    string,
    Untyped
  >
  const { nodeIndexSource } = (await import(
    /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
  )) as { nodeIndexSource: (dir: string) => unknown }

  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  const opts = { embedder, sources: binding.sources }
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(corpusDir(root), 'index')), opts)
  await lib.buildChunkIndex(
    binding.store,
    binding.kbs,
    nodeIndexSource(path.join(corpusDir(root), 'chunks')),
    opts,
  )

  writeFileSync(
    path.join(corpusDir(root), 'awareness.md'),
    awarenessDocument(
      '## Retention and disposal\n\nHow long things are kept. Start at **DOC-C**.\n\n' +
        '## Composition and storage\n\nComponents, drafts and revisions. Start at **DOC-A**.\n',
      SYSTEM_KB,
    ),
    'utf8',
  )
}

/** The shared components are untyped JavaScript; the boundary is named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

// ── one release build, read back three ways ──────────────────────────────────

describe('story-c4f329d3 — the built knowledge base, packed to travel', () => {
  /** A checkout whose `kb/` holds a real, fully built knowledge base. */
  let checkout: string
  let root: string
  /** The same checkout shape with nothing ever built — a fresh clone. */
  let bare: string
  let lib: Record<string, Untyped>

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB
    checkout = mkdtempSync(path.join(tmpdir(), 'kb-checkout-'))
    bare = mkdtempSync(path.join(tmpdir(), 'kb-bare-'))
    root = path.join(checkout, 'kb')
    await buildFixtureKb(root)

    // DISTINCT LAST-CHANGED TIMES, one per document — the input AC-1514's stamp
    // assertion needs. A build writes every file in the same second, so a bundle
    // that carried one shared default would be indistinguishable from one that
    // carried each file's own stamp unless the files genuinely differ.
    const files = corpusMarkdown(root)
    files.forEach((name, i) => {
      const when = new Date(Date.UTC(2026, 0, 2 + i, 0, 0, 0))
      utimesSync(path.join(corpusDir(root), name), when, when)
    })

    lib = (await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))) as Record<string, Untyped>
  }, 180_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(checkout, { recursive: true, force: true })
    rmSync(bare, { recursive: true, force: true })
  })

  it('test_UAT_AC1514_the_bundle_carries_both_indexes_the_corpus_and_each_documents_own_stamp', async () => {
    // THE GUARD ON EVERY ASSERTION BELOW. Most of them are of the form "the
    // bundle matches the tree", which an empty tree would satisfy exactly as
    // well. So the tree is pinned first: the four exported documents and the map
    // beside them.
    expect(corpusMarkdown(root)).toEqual(
      [...CORPUS.map((t) => `${t.id}.md`), 'awareness.md'].sort(),
    )

    const bundle = await kbBundle(root)
    expect(bundle).not.toBeNull()

    // BOTH INDEXES, FILE FOR FILE, UNDER THE INDEX'S OWN NAMES. Asserted against
    // upstream's `INDEX_FILES` rather than against a list spelled here, because
    // the criterion is that an index which grows another sidecar travels without
    // anything on this side being told about it — a hand-written list would keep
    // passing while quietly dropping the new file.
    const names = (lib.INDEX_FILES as string[]).slice().sort()
    expect(Object.keys(bundle!.index).sort()).toEqual(names)
    expect(Object.keys(bundle!.chunks).sort()).toEqual(names)
    // Separate artefacts, not two modes of one: the passage index is built over
    // sections and is a different payload from the document index.
    expect(bundle!.chunks[lib.EMBEDDINGS_FILE as string]).not.toBe(
      bundle!.index[lib.EMBEDDINGS_FILE as string],
    )

    // THE VECTORS SURVIVE THE TRIP, byte for byte. The payload on disk and the
    // payload in the module are the same bytes — decoded from the module rather
    // than compared as strings, which is the only form of this assertion that
    // could fail if the encoding changed.
    for (const [sub, carried] of [
      ['index', bundle!.index],
      ['chunks', bundle!.chunks],
    ] as const) {
      const onDisk = readFileSync(
        path.join(corpusDir(root), sub, lib.EMBEDDINGS_FILE as string),
      )
      const decoded = Buffer.from(carried[lib.EMBEDDINGS_FILE as string], 'base64')
      expect(decoded.equals(onDisk), sub).toBe(true)
      expect(decoded.length, sub).toBeGreaterThan(0)

      // AND THE GUARD ON THAT GUARD. The failure this encoding exists to prevent
      // is a text round trip that silently replaces every invalid byte sequence,
      // leaving an index that still loads and no longer means anything. Proving
      // the payload is not valid UTF-8 is what makes the equality above a real
      // claim rather than one a text round trip would satisfy too.
      expect(Buffer.from(onDisk.toString('utf8'), 'utf8').equals(onDisk), sub).toBe(false)
    }

    // THE CORPUS TEXT IS CARRIED WHOLE — every markdown file in the tree, with
    // its bytes, and nothing that is not markdown (the index sidecars sit inside
    // the corpus directory and must not arrive as documents of their own).
    expect(Object.keys(bundle!.docs).sort()).toEqual(corpusMarkdown(root))
    for (const name of corpusMarkdown(root)) {
      expect(bundle!.docs[name].text, name).toBe(
        readFileSync(path.join(corpusDir(root), name), 'utf8'),
      )
    }

    // EVERY DOCUMENT CARRIES ITS OWN LAST-CHANGED TIME. Each file was given a
    // distinct mtime above; each entry must carry the stamp of ITS file — not one
    // value repeated across the corpus, and not `bundleDocReader`'s epoch default.
    const stamps = new Set<string>()
    for (const name of corpusMarkdown(root)) {
      const own = statSync(path.join(corpusDir(root), name)).mtime.toISOString()
      expect(bundle!.docs[name].updated_at, name).toBe(own)
      expect(bundle!.docs[name].updated_at, name).not.toBe('1970-01-01T00:00:00Z')
      stamps.add(bundle!.docs[name].updated_at)
    }
    expect(stamps.size).toBe(corpusMarkdown(root).length)
  })

  it('test_UAT_AC1515_the_module_is_written_whether_or_not_a_kb_exists_and_an_absent_one_is_loud', async () => {
    // ── the fresh checkout: nothing built, and the module written anyway ──
    //
    // `apps/control-app/src/generated/` is not in version control, so `kb.js`
    // does not exist until the asset build writes one. Writing it only when a KB
    // existed would leave the Worker's static `import { KB } from
    // './generated/kb.js'` unresolvable on any checkout that had never run
    // `1c kb build` — a missing capability turned into a build that cannot
    // compile.
    const emptyGenerated = mkdtempSync(path.join(tmpdir(), 'kb-gen-empty-'))
    const builtGenerated = mkdtempSync(path.join(tmpdir(), 'kb-gen-built-'))
    try {
      expect(existsSync(path.join(bare, 'kb'))).toBe(false)
      const absent = await writeKbModule(emptyGenerated, bare)
      expect(absent.built).toBe(false)

      const emptyModule = path.join(emptyGenerated, 'kb.js')
      expect(existsSync(emptyModule)).toBe(true)
      // The declaration travels with it, or the Worker's typecheck has nothing to
      // resolve the import against.
      expect(existsSync(path.join(emptyGenerated, 'kb.d.ts'))).toBe(true)
      // AND IT RESOLVES. The absent case is a VALUE rather than an absent export:
      // `KB === null` is what lets the Worker degrade to no knowledge tools rather
      // than to a boot failure, and it is what the runtime opener branches on.
      const loaded = (await import(/* @vite-ignore */ pathToFileURL(emptyModule).href)) as {
        KB: unknown
      }
      expect(loaded.KB).toBeNull()

      // Reading an unbuilt knowledge base back yields absence rather than
      // throwing — the same degradation, at the layer below the module.
      expect(await kbBundle(path.join(bare, 'kb'))).toBeNull()

      // ── the built checkout: the same call, the other outcome ──
      const built = await writeKbModule(builtGenerated, checkout)
      expect(built.built).toBe(true)
      expect(built.documents).toBe(corpusMarkdown(root).length)
      expect(built.bytes).toBeGreaterThan(0)

      // ── and the two report renderings, from those two real reports ──
      //
      // DEGRADING GRACEFULLY AND SAYING NOTHING ARE DIFFERENT THINGS. The absent
      // line names the knowledge base as not built, says what shipping that way
      // costs, and names the command that fixes it — at the moment an operator
      // could still act on it.
      const absentLine = kbLine(absent)
      expect(absentLine).toMatch(/NOT BUILT/)
      expect(absentLine).toMatch(/no system knowledge/i)
      expect(absentLine).toContain('1c kb build')

      // The built line is the ordinary one: how many documents it carries and how
      // large it is. No shouting, so the shouting keeps meaning something.
      const builtLine = kbLine(built)
      expect(builtLine).not.toMatch(/NOT BUILT/)
      expect(builtLine).toContain(String(built.documents))
      expect(builtLine).toMatch(/KB/)

      // DISTINGUISHABLE BY READING THE REPORT ALONE, which is the whole point of
      // putting it in front of the operator rather than in a log line.
      expect(absentLine).not.toBe(builtLine)
    } finally {
      rmSync(emptyGenerated, { recursive: true, force: true })
      rmSync(builtGenerated, { recursive: true, force: true })
    }
  })

  it('test_UAT_AC1516_one_declaration_of_name_source_and_corpus_type_serves_both_halves', async () => {
    // ── ONE DECLARATION SITE, NO SECOND LITERAL ──
    //
    // The whole criterion is that the two halves are made incapable of
    // disagreeing rather than expected not to. So: exactly one module in either
    // half declares each of the three values, and it is the one that carries
    // nothing else.
    const sources = tsSources([
      path.join(repoRoot, 'tools', 'generate', 'src'),
      path.join(repoRoot, 'apps', 'control-app', 'src'),
    ])
    for (const name of ['SYSTEM_KB', 'SHIPPED_SOURCE', 'CORPUS_TYPE']) {
      const declaring = sources.filter((file) =>
        new RegExp(`^\\s*(?:export\\s+)?const\\s+${name}\\s*=`, 'm').test(readFileSync(file, 'utf8')),
      )
      expect(declaring.map((f) => path.relative(repoRoot, f)), name).toEqual([
        'tools/generate/src/cli/kb-model.ts',
      ])
    }

    // Both halves reach that one declaration, and reach the SAME values — the
    // build's re-export and the Worker's import are the same bindings.
    expect(kb.SYSTEM_KB).toBe(kbModel.SYSTEM_KB)
    expect(kb.SHIPPED_SOURCE).toBe(kbModel.SHIPPED_SOURCE)
    expect(kb.CORPUS_TYPE).toBe(kbModel.CORPUS_TYPE)

    // ── THE SAME VALUES ON BOTH SIDES OF THE PIPELINE ──
    //
    // The build binds its KB from the declaration it scaffolded; the Worker binds
    // its KB from the declaration committed to this repository. A drift between
    // the two would produce an empty result set rather than an error.
    const binding = await bindKb(root)
    const searched = systemKb()
    expect(binding.kb.name).toBe(SYSTEM_KB)
    expect(searched.name).toBe(SYSTEM_KB)
    expect(binding.kb.source).toBe(SHIPPED_SOURCE)
    expect(searched.source).toBe(SHIPPED_SOURCE)
    expect(Object.keys(binding.sources)).toEqual([SHIPPED_SOURCE])

    // ── END TO END, WHERE IT MATTERS ──
    //
    // Built through the release path, packed into the importable artefact, and
    // opened by the Worker's own opener — which is where the two halves meet. If
    // the name had drifted, `systemKb()` would throw naming what IS declared; if
    // the source had, the KB would resolve against a store that has never heard
    // of these uids.
    const bundle = (await kbBundle(root)) as SystemKbBundle | null
    expect(bundle).not.toBeNull()

    const embedder = (
      (await import(/* @vite-ignore */ pathToFileURL(STUB).href)) as {
        createEmbedder: () => unknown
      }
    ).createEmbedder()
    const runtime = await systemKnowledge({}, { bundle, embedder })
    expect(runtime).not.toBeNull()

    // THE PLANTED DOCUMENT COMES BACK, resolved through the searching half's own
    // store — the same `resolveCorpus` the search runs before it ranks anything,
    // over `bundleStore`, whose predicate is the one `CORPUS_TYPE` supplies. This
    // is the exact point the criterion is about: a corpus indexed under one
    // document type and searched under another resolves to nothing here, and
    // nothing is what an unbuilt knowledge base returns.
    const resolved = (await lib.resolveCorpus(bundleStore(bundle!), searched)) as Array<{
      uid: string
    }>
    expect(resolved.map((doc) => doc.uid).sort()).toEqual(CORPUS.map((t) => t.id).sort())
    expect(JSON.stringify(resolved)).toContain(PLANTED)

    // ── AND THE SEARCHING HALF STILL REACHES NO FILESYSTEM ──
    //
    // The shared declaration exists because the two halves CANNOT share the
    // module that builds a corpus: that one reaches a disk and this one is held
    // to reaching none. If the extraction had been done by importing `kb.ts`
    // instead, this is the assertion that would have caught it.
    const graph = reachableFrom(path.join(repoRoot, 'apps', 'control-app', 'src', 'system-knowledge.ts'))
    expect(graph.size).toBeGreaterThan(1)
    expect([...graph.keys()].map((f) => path.relative(repoRoot, f))).toContain(
      'tools/generate/src/cli/kb-model.ts',
    )
    for (const [file, source] of graph) {
      expect(
        withoutComments(source).match(/from\s+['"]node:(?:fs|path|os|child_process)['"]/),
        path.relative(repoRoot, file),
      ).toBeNull()
    }
  })
})

// ── the import walk ──────────────────────────────────────────────────────────

/** Every `.ts` under `dirs`, with `generated/` skipped. */
function tsSources(dirs: string[]): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      // `generated/` is `1c assets`' own output — one-line re-exports carrying an
      // absolute path, regenerated per checkout and never committed.
      if (entry.isDirectory()) {
        if (entry.name !== 'generated' && entry.name !== 'node_modules') walk(full)
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        out.push(full)
      }
    }
  }
  for (const dir of dirs) walk(dir)
  return out.sort()
}

/**
 * Follow runtime imports from an entry file and return every module reached.
 *
 * A static walk rather than a bundler run, for the reason
 * `test_UAT_FC_REQ-146_worker_ai_boundary` gives: the property under test is "no
 * module on this path names the filesystem", which is a fact about the source,
 * and a `node:fs` import that survives tree-shaking is exactly as fatal as one
 * that does not. `generated/` is not followed — those files are `1c assets`'
 * re-exports of the shared component's Worker-safe root, and `kb.js` is a
 * megabyte of inlined data with no imports in it at all.
 */
function reachableFrom(entry: string): Map<string, string> {
  const seen = new Map<string, string>()
  const resolve = (fromFile: string, spec: string): string | null => {
    if (!spec.startsWith('.')) return null
    const base = path.resolve(path.dirname(fromFile), spec)
    if (base.includes(`${path.sep}generated${path.sep}`)) return null
    for (const candidate of [base, `${base}.ts`, base.replace(/\.js$/, '.ts')]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    }
    return null
  }

  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = readFileSync(file, 'utf8')
    seen.set(file, source)
    if (file.endsWith('.json')) continue
    for (const match of withoutComments(source).matchAll(
      /\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g,
    )) {
      // Type-only statements are erased before a bundler sees them, so following
      // them would report a dependency the Worker does not have.
      if (/^(?:import|export)\s+type\s/.test(match[0])) continue
      const next = resolve(file, match[1])
      if (next) queue.push(next)
    }
  }
  return seen
}

/** Source with block and line comments removed, so prose cannot trip a match. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}
