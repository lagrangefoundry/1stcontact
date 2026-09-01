/**
 * {@link ReferenceStore} over the operator's `storage/references/` tree
 * ([[DOC-13]] §4) — REQ-155.
 *
 * THIS IS THE ONLY MODULE IN THE PORT'S WORLD THAT IMPORTS `node:fs`, and it is
 * imported by the CLI rather than by `capture/bundle.ts`. That is the whole
 * shape, and it is the one `fs-store.ts` already follows: if this module ever
 * appears in a Worker's import graph, the seam has been undone.
 *
 * BEHAVIOUR IS CARRIED FORWARD, NOT IMPROVED. Every verb writes what
 * `capture/bundle.ts` wrote inline before the port existed — same directory
 * layout, same file names, same recursive `mkdir` before each write. In
 * particular a bundle write is a SEQUENCE of `writeFileSync` calls and is not
 * atomic: a crash midway leaves the bundle half-written, exactly as it did
 * before. REQ-155's correctness claim is that nothing changed, so improving it
 * here would have made the claim uncheckable.
 *
 * PATHS LIVE HERE AND NOWHERE ELSE. {@link bundleDir} and
 * {@link ladderScreenshotPath} hand back filesystem locations, which is a
 * legitimate thing for a filesystem adapter to do and an illegitimate thing for
 * the port to do (see `reference-store.ts`). `1c diff --ref` needs a path
 * because it feeds one to the image layer, and `--ref` is polymorphic —
 * a bundle directory OR a loose PNG — which is a *command-line argument*
 * resolution the CLI performs above the port, not a question a store can answer.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  bundleNameFor,
  ladderMember,
  type ReferenceBundle,
  type ReferenceStore,
} from './reference-store'

/** `storage/references/<name>/` under `cwd` — where a named bundle lives on disk. */
export function bundleDir(cwd: string, name: string): string {
  return path.join(cwd, 'storage', 'references', ...name.split('/'))
}

/**
 * `storage/references/<host>/<path>/` for a capture ([[DOC-13]] §4).
 *
 * Kept as its own function, composed of the two halves it always was, because
 * this is the signature the operator's mental model and the existing UATs both
 * hold: a capture goes *there*.
 */
export function bundleDirFor(cwd: string, capture: { host: string; path: string }): string {
  return bundleDir(cwd, bundleNameFor(capture))
}

/** REQ-61 — the per-width reference screenshot's path (`screenshot-<width>.png`). */
export function ladderScreenshotPath(dir: string, width: number): string {
  return path.join(dir, ladderMember(width))
}

/**
 * A bundle handle on one directory, whatever it is called.
 *
 * THIS IS WHAT MAKES `--ref <dir>` KEEP WORKING (AC6). Every reproduction verb
 * takes a directory the operator typed, which may be anywhere — a scratch copy,
 * a fixture under a temp dir, a bundle checked out beside the repo — and is not
 * necessarily under `storage/references/` at all. So the filesystem adapter can
 * open a bundle at an arbitrary location, and its `name` is that location. That
 * is not the "directory the caller happened to choose" the port warns about:
 * the name a *capture* gets is still derived from its URL ({@link bundleNameFor}),
 * and this is the read side of an argument the operator already holds.
 */
export function fsReferenceBundle(dir: string): ReferenceBundle {
  const memberPath = (member: string): string => path.join(dir, ...member.split('/'))

  return {
    name: dir,

    async read(member) {
      const src = memberPath(member)
      if (!existsSync(src)) return null
      return new Uint8Array(readFileSync(src))
    },

    async write(member, bytes) {
      const dest = memberPath(member)
      mkdirSync(path.dirname(dest), { recursive: true })
      writeFileSync(dest, bytes)
    },

    async list(prefix) {
      if (!existsSync(dir)) return []
      const out: string[] = []
      const walk = (rel: string): void => {
        const abs = rel ? path.join(dir, ...rel.split('/')) : dir
        for (const entry of readdirSync(abs)) {
          const key = rel ? `${rel}/${entry}` : entry
          if (statSync(path.join(abs, entry)).isDirectory()) walk(key)
          else out.push(key)
        }
      }
      walk('')
      out.sort()
      return prefix ? out.filter((key) => key.startsWith(prefix)) : out
    },
  }
}

/**
 * The operator's reference store, rooted at `cwd`.
 *
 * No tenant, and none pretended: this serves one operator against a git-ignored
 * tree on their own disk. Tenancy is the R2 adapter's — `r2ReferenceStore` —
 * where there is a registry to check a tenant against and a barrier that means
 * something. A `forTenant` here that always said yes would be a barrier in name
 * only, which is worse than its absence.
 */
export function fsReferenceStore(cwd: string): ReferenceStore {
  const root = path.join(cwd, 'storage', 'references')

  return {
    bundle(name) {
      const handle = fsReferenceBundle(bundleDir(cwd, name))
      return { ...handle, name }
    },

    async list() {
      if (!existsSync(root)) return []
      const out: string[] = []
      for (const host of readdirSync(root)) {
        const hostDir = path.join(root, host)
        if (!statSync(hostDir).isDirectory()) continue
        for (const slug of readdirSync(hostDir)) {
          if (statSync(path.join(hostDir, slug)).isDirectory()) out.push(`${host}/${slug}`)
        }
      }
      return out.sort()
    },
  }
}
