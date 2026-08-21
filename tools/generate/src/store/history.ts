import type { StoreContext } from './paths'
import { historyPath } from './paths'
import type { RevisionEntry } from './revision-model'
import { pathExists, readJson, writeJson } from './fsutil'

/**
 * `history.json` (DOC-12 §4) — the filesystem adapter's revision log.
 *
 * An append-only, forward-only record. The live revision is always the highest
 * id, so there is no pointer to keep in sync; {@link liveRevisionOf} derives it.
 *
 * ADAPTER-INTERNAL SINCE REQ-149. This is where `fsSiteStore` keeps its log, and
 * the only place that reads or writes the file. The VOCABULARY — what a revision
 * entry is, what a change set is, how the two are compared — moved to
 * `revision-model.ts`, which reaches no filesystem, so the Worker's adapter and
 * this one share the model rather than each carrying a copy of it.
 */

export interface History {
  revisions: RevisionEntry[]
}

/** Read `history.json`, or an empty history when the site has never published. */
export function readHistory(ctx: StoreContext, slug: string): History {
  const p = historyPath(ctx, slug)
  if (!pathExists(p)) return { revisions: [] }
  return readJson<History>(p)
}

/** Append a revision entry and persist. Returns the updated history. */
export function appendHistory(ctx: StoreContext, slug: string, entry: RevisionEntry): History {
  const history = readHistory(ctx, slug)
  history.revisions.push(entry)
  writeJson(historyPath(ctx, slug), history)
  return history
}
