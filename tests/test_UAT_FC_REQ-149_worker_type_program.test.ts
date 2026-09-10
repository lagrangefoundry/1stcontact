import path from 'node:path'
import { describe, expect, it } from 'vitest'
// The walk and the module list live in ONE place, shared with the AC-numbered
// reconciliation UAT that supersedes these two: two copies of the list means the
// next file-backed store module added to one goes stale in the other.
import { chainTo, filesystemBoundIn, typeProgramOf } from './support/type-program'

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


describe('REQ-149 — the Worker type program stays off the filesystem', () => {
  it('test_UAT_FC_REQ-149_control_app_type_program_reaches_no_node_only_module', () => {
    const entry = path.join(REPO, 'apps/control-app/src/index.ts')
    const graph = typeProgramOf(entry)

    const reached = filesystemBoundIn(REPO).filter((f) => graph.has(f))
    const detail = reached.map((f) => chainTo(graph, entry, f, REPO).join('\n    → ')).join('\n\n  ')
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
