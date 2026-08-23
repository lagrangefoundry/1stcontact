import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * REQ-149 — a Worker's TYPE program may not reach the filesystem either.
 *
 * WHY THIS IS NOT THE REQ-146 GUARD AGAIN. That one walks RUNTIME imports and
 * deliberately skips type-only ones, because they are erased before a bundler
 * sees them — following them would report a filesystem dependency the Worker
 * does not have. It is right about the bundle, and it is silent about the thing
 * that actually broke here.
 *
 * A type-only import is erased before the BUNDLER and not before `tsc`.
 * `apps/control-app/tsconfig.json` declares `types: ["@cloudflare/workers-types"]`
 * and no node types, so a type-only reach into a module that imports `node:fs`
 * puts `node:fs` in a Worker's type program. `render.ts` did exactly that: it
 * imported `LoadedSite` from `loadSite.ts`, which only RE-EXPORTS it while
 * importing `node:path` and the filesystem helpers. The type it wanted is
 * declared in `assemble.ts`, which reaches nothing.
 *
 * The symptom was five `Cannot find name 'node:fs'` errors that no test caught
 * and `bin/build` failed on — so the build was broken while the suite was green,
 * which is the gap this closes.
 *
 * THE WALK FOLLOWS EVERY IMPORT, type-only included, because that is precisely
 * what `tsc` does.
 */

const REPO = path.resolve(__dirname, '..')

/**
 * Modules that reach `node:fs` or `node:path`, directly or otherwise.
 *
 * Listed rather than detected, because detection would have to walk the very
 * graph under test and would agree with it by construction. These are the
 * file-backed halves of the store, named in their own headers as the parts a
 * Worker must never reach (REQ-142).
 */
const NODE_ONLY = [
  'tools/generate/src/store/fsutil.ts',
  'tools/generate/src/store/paths.ts',
  'tools/generate/src/store/loadSite.ts',
  'tools/generate/src/store/fs-store.ts',
  'tools/generate/src/store/history.ts',
  'tools/generate/src/store/base.ts',
  'tools/generate/src/store/journal.ts',
  'tools/generate/src/store/index.ts',
  'tools/generate/src/cli/commands.ts',
].map((rel) => path.join(REPO, rel))

/** Source with comments removed, so prose cannot trip an assertion. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function resolveSpec(fromFile: string, spec: string): string | null {
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

/** Every module `tsc` would pull in from `entry` — type-only edges included. */
function typeProgramOf(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = withoutComments(fs.readFileSync(file, 'utf8'))
    const edges: string[] = []
    for (const match of source.matchAll(
      /\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g,
    )) {
      const next = resolveSpec(file, match[1])
      if (next) edges.push(next)
    }
    seen.set(file, edges)
    queue.push(...edges)
  }
  return seen
}

/** The shortest import chain from `entry` to `target`, for a legible failure. */
function chainTo(graph: Map<string, string[]>, entry: string, target: string): string[] {
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
      return chain.map((f) => path.relative(REPO, f))
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

describe('REQ-149 — the Worker type program stays off the filesystem', () => {
  it('test_UAT_FC_REQ-149_control_app_type_program_reaches_no_node_only_module', () => {
    const entry = path.join(REPO, 'apps/control-app/src/index.ts')
    const graph = typeProgramOf(entry)

    const reached = NODE_ONLY.filter((f) => graph.has(f))
    const detail = reached.map((f) => chainTo(graph, entry, f).join('\n    → ')).join('\n\n  ')
    expect(reached.map((f) => path.relative(REPO, f)), detail).toEqual([])
  })

  it('test_UAT_FC_REQ-149_the_walk_would_notice_if_the_seam_were_undone', () => {
    // THE GUARD ON THE GUARD. A walk that followed no edges, or a comment
    // stripper that ate the file, would satisfy the assertion above while
    // proving nothing. So: the walk must reach modules known to be on the
    // Worker's path, and must follow a TYPE-ONLY edge — the kind the REQ-146
    // runtime walk deliberately skips, and the only kind that broke this.
    const entry = path.join(REPO, 'apps/control-app/src/index.ts')
    const graph = typeProgramOf(entry)

    for (const rel of [
      'apps/control-app/src/router.ts',
      'tools/generate/src/render/render.ts',
      'tools/generate/src/store/assemble.ts',
      'tools/generate/src/publish/publish.ts',
    ]) {
      expect(graph.has(path.join(REPO, rel)), `walk never reached ${rel}`).toBe(true)
    }

    // `render.ts` imports `LoadedSite` from `assemble` with `import type`, so a
    // walker that skipped type-only edges would not have this one.
    const render = path.join(REPO, 'tools/generate/src/render/render.ts')
    expect(graph.get(render)).toContain(path.join(REPO, 'tools/generate/src/store/assemble.ts'))
  })
})
