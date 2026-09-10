/**
 * A Worker's TYPE program, walked — the instrument behind AC-1426 (and behind
 * the REQ-149 free-coded UATs that preceded it).
 *
 * WHY THIS IS NOT THE RUNTIME-IMPORT GUARD AGAIN. That guard walks runtime
 * imports and deliberately skips type-only ones, because they are erased before
 * a bundler sees them — following them would report a filesystem dependency the
 * shipped bundle does not have. It is right about the bundle, and structurally
 * blind to the thing that actually breaks the build.
 *
 * A type-only import is erased before the BUNDLER and not before `tsc`.
 * `apps/control-app/tsconfig.json` declares `types: ["@cloudflare/workers-types"]`
 * and no node types, so a type-only reach into a module that imports `node:fs`
 * puts `node:fs` in a Worker's type program. `render.ts` did exactly that: it
 * imported `LoadedSite` from `loadSite.ts`, which only RE-EXPORTS it while
 * importing `node:path` and the filesystem helpers. The type it wanted is
 * declared in `assemble.ts`, which reaches nothing. The symptom was five
 * `Cannot find name 'node:fs'` errors that no test caught and `bin/build` failed
 * on — the build broken while the suite was green.
 *
 * WHY IT LIVES HERE. Two UAT files ask this question — the AC-numbered
 * reconciliation UAT and the free-coded REQ-149 pair it superseded — and until
 * now each carried its own copy of the module list and the walk. Two copies of
 * the list means the next file-backed store module added to one goes stale in
 * the other, which is the one-authoritative-location rule this repo enforces
 * elsewhere. One definition site, as `wrangler-toml.ts` already is for the TOML
 * reader.
 *
 * WHAT IT IS NOT. This is an INSTRUMENT, not production code. The build prints
 * no import chain and nothing in `bin/`, `tools/`, `apps/` or `packages/`
 * composes one: the build's refusal is `tsc --noEmit` naming the module it
 * cannot type. The chain is what turns that module name into the specifier to
 * change. Being the instrument, it must be shown capable of failing — every
 * caller is expected to assert its non-vacuity (that it reaches modules known to
 * be on the Worker's path, and follows at least one type-only edge) rather than
 * assume it.
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Modules that reach `node:fs` or `node:path`, directly or otherwise —
 * repo-relative, so a caller can resolve them against whichever root it walks.
 *
 * Listed rather than detected, because detection would have to walk the very
 * graph under test and would agree with it by construction. These are the
 * file-backed halves of the store, named in their own headers as the parts a
 * Worker must never reach (REQ-142).
 */
export const FILESYSTEM_BOUND = [
  'tools/generate/src/store/fsutil.ts',
  'tools/generate/src/store/paths.ts',
  'tools/generate/src/store/loadSite.ts',
  'tools/generate/src/store/fs-store.ts',
  'tools/generate/src/store/history.ts',
  'tools/generate/src/store/base.ts',
  'tools/generate/src/store/journal.ts',
  'tools/generate/src/store/index.ts',
  'tools/generate/src/cli/commands.ts',
]

/** `FILESYSTEM_BOUND` resolved against a repository root. */
export function filesystemBoundIn(root: string): string[] {
  return FILESYSTEM_BOUND.map((rel) => path.join(root, rel))
}

/** Source with comments removed, so prose cannot trip the walk. */
export function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** A relative specifier resolved to the file `tsc` would read, or null. */
export function resolveSpec(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const base = path.resolve(path.dirname(fromFile), spec)
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.js`,
    path.join(base, 'index.ts'),
    base.replace(/\.js$/, '.ts'),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

/**
 * Every module the TYPECHECKER would pull in from `entry` — type-only edges
 * included, because that is precisely what `tsc` does and precisely what a
 * bundle-level guard cannot see.
 */
export function typeProgramOf(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = withoutComments(fs.readFileSync(file, 'utf8'))
    const edges: string[] = []
    for (const match of source.matchAll(/\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g)) {
      const next = resolveSpec(file, match[1])
      if (next) edges.push(next)
    }
    seen.set(file, edges)
    queue.push(...edges)
  }
  return seen
}

/**
 * The SHORTEST import chain from `entry` to `target` — the specifier to change,
 * rather than a list of unresolved names. Paths are reported relative to `root`.
 */
export function chainTo(
  graph: Map<string, string[]>,
  entry: string,
  target: string,
  root: string,
): string[] {
  const previous = new Map<string, string>()
  const queue = [entry]
  const visited = new Set([entry])
  while (queue.length > 0) {
    const file = queue.shift() as string
    if (file === target) {
      const chain = [file]
      let at = file
      while (previous.has(at)) {
        at = previous.get(at) as string
        chain.unshift(at)
      }
      return chain.map((f) => path.relative(root, f))
    }
    for (const next of graph.get(file) ?? []) {
      if (visited.has(next)) continue
      visited.add(next)
      previous.set(next, file)
      queue.push(next)
    }
  }
  return []
}
