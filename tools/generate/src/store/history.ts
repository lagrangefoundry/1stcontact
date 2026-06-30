import type { StoreContext } from './paths'
import { historyPath } from './paths'
import { pathExists, readJson, writeJson } from './fsutil'

/**
 * The publish history (`history.json`, DOC-12 §4): an append-only, forward-only
 * log of revisions. The live revision is always the highest id (`live = latest`),
 * so there is no separate pointer to keep in sync.
 */

/** A whole-snapshot file-change list (`diffSnapshots` output). */
export interface ChangeSet {
  added: string[]
  modified: string[]
  removed: string[]
}

/** One published revision's metadata. */
export interface RevisionEntry {
  /** Monotonic revision id; matches the `revisions/NNNN/` directory. */
  id: number
  /** ISO-8601 timestamp the revision was published. */
  publishedAt: string
  /** Operator-supplied publish message. */
  message: string
  /** Identifier of who published, or null. */
  by: string | null
  /** The revision this one descends from (set when checked out from history). */
  basedOn: number | null
  /** Files changed versus the previous live revision. */
  changes: ChangeSet
}

export interface History {
  revisions: RevisionEntry[]
}

/** Read `history.json`, or an empty history when the site has never published. */
export function readHistory(ctx: StoreContext, slug: string): History {
  const p = historyPath(ctx, slug)
  if (!pathExists(p)) return { revisions: [] }
  return readJson<History>(p)
}

/** The live (highest) revision id, or null when nothing has been published. */
export function liveRevision(history: History): number | null {
  if (history.revisions.length === 0) return null
  return history.revisions.reduce((max, r) => Math.max(max, r.id), 0)
}

/** Append a revision entry and persist. Returns the updated history. */
export function appendHistory(ctx: StoreContext, slug: string, entry: RevisionEntry): History {
  const history = readHistory(ctx, slug)
  history.revisions.push(entry)
  writeJson(historyPath(ctx, slug), history)
  return history
}
