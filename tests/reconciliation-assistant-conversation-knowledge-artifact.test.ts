import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * **The corpus the deployed assistant searches travels in the artifact**
 * (story-a58a0974 — AC-1517, the half a passing turn cannot establish).
 *
 * The other half of AC-1517 — that the knowledge operations and the priming that
 * describes them arrive together or not at all — is a claim about a running turn
 * and lives next door in
 * `reconciliation-assistant-conversation-knowledge-deployed.workers.test.ts`.
 * This file holds the claim that a turn is deliberately excluded as evidence for.
 *
 * WHY, PRECISELY. Under the deployed runtime's `nodejs_compat` setting `node:fs`
 * RESOLVES and hands back a per-instance scratch disk: writes succeed and reads
 * come back. A corpus, a document index or a section index read from a file would
 * therefore PASS a functional test on this runtime and be empty in production, on
 * a machine whose disk carries nothing anybody exported. The only thing that
 * discriminates is the absence of the import, so that is what is asserted — and,
 * as with AC-1406 next door, the walk is proved to discriminate before it is
 * trusted.
 *
 * The walk deliberately mirrors `reconciliation-assistant-conversation-artifact`'s
 * rather than importing it: that file's subject is the conversation's own storage
 * tiers and this one's is the knowledge path, and a shared helper would make one
 * criterion's guard deletable by the other's maintenance.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const workerSrc = path.join(repoRoot, 'apps', 'control-app', 'src')
const workerEntry = path.join(workerSrc, 'index.ts')
/** The deployed knowledge path's own entry: the peer of the filesystem opener. */
const knowledgeEntry = path.join(workerSrc, 'system-knowledge.ts')
/** The three values `1c assets` inlines, as the module the Worker imports. */
const kbModule = path.join(workerSrc, 'generated', 'kb.js')

// ── the import walk ──────────────────────────────────────────────────────────

/** Source with block and line comments removed, so prose cannot trip an assertion. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Is this import erased at compile time, and therefore absent from the artifact?
 *
 * The accuracy of the walk rests on this: `system-knowledge.ts` reaches its own
 * bundle type through `import type`, and following an erased edge would report a
 * dependency the artifact does not have — which is the fastest way to get a guard
 * like this deleted for crying wolf.
 */
function isTypeOnlyImport(statement: string): boolean {
  if (/^(?:import|export)\s+type\s/.test(statement)) return true
  const named = statement.match(/\{([\s\S]*?)\}/)
  if (!named || /^import\s+(?:[A-Za-z_$][\w$]*\s*,|\*\s+as)/.test(statement)) return false
  const specifiers = named[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  return specifiers.length > 0 && specifiers.every((s) => /^type\s/.test(s))
}

/**
 * Follow RUNTIME imports from an entry file and return every module reached.
 *
 * Static rather than a bundler run, for the reason AC-1406's walk states: the
 * property is "no module on this path names the filesystem", which is a fact
 * about the source. Absolute specifiers are followed too, because the knowledge
 * component is resolved at build time and re-exported by absolute path — stopping
 * at that edge would leave the ranker, the index reader and the corpus store
 * unwalked, which is most of what this criterion is about.
 */
function reachableFrom(entry: string): Map<string, string> {
  const seen = new Map<string, string>()
  const resolve = (fromFile: string, spec: string): string | null => {
    if (!spec.startsWith('.') && !spec.startsWith('/')) return null
    const base = spec.startsWith('/') ? spec : path.resolve(path.dirname(fromFile), spec)
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.js`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.js'),
      base.replace(/\.js$/, '.ts'),
    ]) {
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
    for (const match of withoutComments(source).matchAll(
      /\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g,
    )) {
      if (isTypeOnlyImport(match[0])) continue
      const next = resolve(file, match[1])
      if (next) queue.push(next)
    }
  }
  return seen
}

/** The filesystem itself, named as a module specifier. */
const FS_MODULE = /['"](node:(?:fs|os|child_process)[^'"]*)['"]/g
/**
 * …and the disk-backed rungs of the knowledge component: the index source that
 * reads a directory, and the corpus store that walks one. Either arriving on this
 * path is the failure the criterion is about — a corpus found on a disk rather
 * than carried in the release.
 */
const FS_KNOWLEDGE_MODULE = /['"][^'"]*\/(?:node|fs-store|fsutil|node_defaults)(?:\.[jt]s)?['"]/g
/** …or named as a value binding, which is how one arrives without a specifier. */
const FS_KNOWLEDGE_BINDING = /\b(?:nodeIndexSource|DocDirReader|fileDocReader|readdirSync)\b/g

/**
 * Every offence in the graph, by file.
 *
 * The two rules have different reach, for the reason AC-1406's guard states.
 * `ownRoot` is the code this repository writes and is answerable for; there,
 * naming the filesystem AT ALL is the offence, because the module would be in the
 * artifact whether or not the branch runs. The knowledge component is a release
 * artifact consumed whole, so what is judged there is which RUNG this repository
 * reaches — its Node rung must not be on the path — and not whether its prose
 * mentions a disk.
 */
function filesystemOffenders(graph: Map<string, string>, ownRoot = repoRoot): string[] {
  const offenders: string[] = []
  for (const [file, source] of graph) {
    const code = withoutComments(source)
    const rel = path.relative(repoRoot, file)
    const own = !path.relative(ownRoot, file).startsWith('..')
    for (const m of code.matchAll(FS_KNOWLEDGE_MODULE)) offenders.push(`${rel} → ${m[0]}`)
    if (!own) continue
    for (const m of code.matchAll(FS_MODULE)) offenders.push(`${rel} → ${m[1]}`)
    for (const m of code.matchAll(FS_KNOWLEDGE_BINDING)) offenders.push(`${rel} → ${m[0]}`)
  }
  return offenders
}

/** A throwaway module tree, for planting an offender the walk must catch. */
function plant(files: Record<string, string>): { root: string; entry: string; dispose(): void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'ac1517-plant-'))
  for (const [name, source] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), source)
  }
  return {
    root: dir,
    entry: path.join(dir, 'entry.ts'),
    dispose: () => rmSync(dir, { recursive: true, force: true }),
  }
}

// ── AC-1517 — the corpus is in the artifact, and nothing on the path is a file ─

describe('the deployed assistant reaches the corpus from its own release artifact', () => {
  it('test_UAT_AC1517_the_deployed_knowledge_path_carries_the_corpus_as_values_and_reaches_no_file', () => {
    // THE KNOWLEDGE PATH IS ACTUALLY IN THE DEPLOYED ARTIFACT. Asserted first,
    // because every claim below is about that path and an artifact that never
    // reached it would satisfy them all by having nothing to check.
    const artifact = reachableFrom(workerEntry)
    const inArtifact = [...artifact.keys()]
    expect(inArtifact, 'the Worker does not reach the system knowledge base at all').toContain(
      knowledgeEntry,
    )
    expect(inArtifact).toContain(kbModule)

    // THE GUARD ON THE GUARD. Every assertion below is "this set is empty", and a
    // walker that followed no edges — or a comment-stripper that ate the file —
    // would satisfy all of them while checking nothing.
    const graph = reachableFrom(knowledgeEntry)
    const reached = [...graph.keys()].map((f) => path.relative(repoRoot, f))
    for (const expected of [
      'apps/control-app/src/generated/kb.js',
      'apps/control-app/src/generated/knowledge.js',
      'apps/control-app/src/generated/ai-knowledge.js',
      'apps/control-app/src/generated/ticketing.js',
      'tools/generate/src/cli/kb-model.ts',
    ]) {
      expect(reached, `walk did not reach ${expected}`).toContain(expected)
    }
    expect(withoutComments("// node:fs\nimport fs from 'node:fs'")).toContain("from 'node:fs'")

    // …AND IT REALLY LEFT THIS REPOSITORY. The ranker and the index reader are the
    // component's, not ours, so a walk that stopped at the generated re-export
    // would be asserting emptiness over the easy half.
    const outsideRepo = [...graph.keys()].filter((f) =>
      path.relative(repoRoot, f).startsWith('..'),
    )
    expect(outsideRepo.length, 'the walk never left the repository').toBeGreaterThan(3)

    // PLANTED, in turn, so the discriminator is proved to discriminate.
    const bareFs = plant({ 'entry.ts': "import fs from 'node:fs'\nexport const x = fs" })
    try {
      expect(filesystemOffenders(reachableFrom(bareFs.entry), bareFs.root)).not.toEqual([])
    } finally {
      bareFs.dispose()
    }

    // A corpus or an index arriving from a directory, reached transitively and
    // named the way a real one would be — the offence is the disk-backed index
    // source arriving, not the word `fs` at the entry point.
    const fileBackedIndex = plant({
      'entry.ts': "import { open } from './lib'\nexport const runtime = open()",
      'lib.ts':
        "import { nodeIndexSource } from './node'\nexport const open = () => nodeIndexSource('./corpus/index')",
      'node.ts': 'export const nodeIndexSource = (dir) => ({ dir })',
    })
    try {
      const offenders = filesystemOffenders(
        reachableFrom(fileBackedIndex.entry),
        fileBackedIndex.root,
      )
      expect(offenders.join('\n')).toMatch(/nodeIndexSource/)
      expect(offenders.join('\n')).toMatch(/\/node/)
    } finally {
      fileBackedIndex.dispose()
    }

    // A tree with neither must come back clean, or "not empty" would mean nothing.
    const innocent = plant({ 'entry.ts': 'export const x = 1' })
    try {
      expect(filesystemOffenders(reachableFrom(innocent.entry), innocent.root)).toEqual([])
    } finally {
      innocent.dispose()
    }

    // THE CRITERION, first half. Nothing on the path from a conversation to a
    // ranked hit reaches a file — neither to find a document nor to rank one.
    expect(graph.size).toBeGreaterThan(5)
    expect(filesystemOffenders(graph)).toEqual([])

    // THE CRITERION, second half. The corpus, the document index and the section
    // index all travel INSIDE the artifact as values: the module the Worker
    // statically imports is a literal and imports nothing itself, so there is no
    // machine outside the deployment whose disk the answer depends on.
    expect(existsSync(kbModule), 'run `1c assets` — the KB module is a build artifact').toBe(
      true,
    )
    const emitted = readFileSync(kbModule, 'utf8')
    expect(withoutComments(emitted)).not.toMatch(/\bfrom\s+['"]|\brequire\s*\(/)
    expect(emitted).toMatch(/^export const KB = (?:\{|null)/m)

    // With a corpus built into this release, all three halves are present and are
    // values rather than addresses — the index and the section index as inlined
    // base64, the corpus as inlined text.
    expect(emitted, 'run `1c kb build` — this release carries no corpus').toMatch(
      /^export const KB = \{/m,
    )
    const bundle = JSON.parse(
      emitted.slice(emitted.indexOf('{'), emitted.lastIndexOf('}') + 1),
    ) as {
      index: Record<string, string>
      chunks: Record<string, string>
      docs: Record<string, { text: string; updated_at: string }>
    }
    for (const half of [bundle.index, bundle.chunks]) {
      expect(Object.keys(half)).toContain('embeddings.bin')
      expect(typeof half['embeddings.bin']).toBe('string')
      expect(half['embeddings.bin'].length).toBeGreaterThan(0)
    }
    const documents = Object.keys(bundle.docs)
    expect(documents.length).toBeGreaterThan(0)
    for (const name of documents) {
      expect(typeof bundle.docs[name].text, name).toBe('string')
      // A path would be an address to resolve; this is the document itself.
      expect(bundle.docs[name].text.length, name).toBeGreaterThan(0)
    }
  })
})
