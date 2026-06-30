import type { StoreContext } from './paths'
import { draftDir, padRevision, revisionDir, revisionsDir } from './paths'
import { copyDir, listDirs, pathExists } from './fsutil'

/** The next revision id = (highest existing `revisions/NNNN/` dir) + 1. */
export function nextRevisionId(ctx: StoreContext, slug: string): number {
  const ids = listDirs(revisionsDir(ctx, slug))
    .map((name) => Number(name))
    .filter((n) => Number.isInteger(n) && n > 0)
  const max = ids.length === 0 ? 0 : Math.max(...ids)
  return max + 1
}

export interface Snapshot {
  id: number
  dir: string
}

/**
 * Copy `draft/` into the next zero-padded revision directory as a complete byte
 * copy (DOC-12 §3). Forward-only: the new revision is the highest id and
 * therefore the live one. The snapshot captures only the draft tree — site
 * metadata and assets included — so it is byte-identical to the draft it froze.
 */
export function snapshot(ctx: StoreContext, slug: string): Snapshot {
  const src = draftDir(ctx, slug)
  if (!pathExists(src)) {
    throw new Error(`Cannot snapshot: no draft at ${src}`)
  }
  const id = nextRevisionId(ctx, slug)
  const dir = revisionDir(ctx, slug, id)
  copyDir(src, dir)
  return { id, dir }
}

/** The revision id encoded by a `revisions/NNNN/` directory name. */
export function revisionIdFromName(name: string): number {
  return Number(name)
}

export { padRevision }
