import type { StoreContext } from './paths'
import { draftBasePath } from './paths'
import { pathExists, readJson, writeJson } from './fsutil'

/**
 * The draft's lineage pointer: which published revision the current `draft/`
 * descends from. `new` leaves it null; `checkout <rev>` sets it to that rev;
 * `publish` sets it to the revision just created. It feeds `basedOn` in the
 * history log, which is what makes a forward-only rollback (`checkout` an old
 * revision, then `publish`) self-documenting (DOC-12 §4).
 *
 * Stored at the site root, never inside `draft/`, so it never enters a snapshot.
 */
export interface DraftBase {
  basedOn: number | null
}

export function readDraftBase(ctx: StoreContext, slug: string): DraftBase {
  const p = draftBasePath(ctx, slug)
  if (!pathExists(p)) return { basedOn: null }
  return readJson<DraftBase>(p)
}

export function writeDraftBase(ctx: StoreContext, slug: string, basedOn: number | null): void {
  writeJson(draftBasePath(ctx, slug), { basedOn })
}
