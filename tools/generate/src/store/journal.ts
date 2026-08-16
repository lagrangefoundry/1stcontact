import { journalPath } from './paths'
import type { StoreContext } from './paths'
import { pathExists, readJson, writeJson } from './fsutil'
import type { ChangeSlice, JournalFile, JournalRecord } from './journal-model'
import { emptyJournal, nextJournal, normalizeJournal, sliceSince } from './journal-model'

/**
 * The draft change journal (REQ-131, DOC-33 §7.9 / §13), on the filesystem.
 *
 * WHAT PROBLEM THIS SOLVES. The page editor lets the operator change copy,
 * images and parameters on the draft at any moment, including between two turns
 * of the assistant's conversation. So the assistant's picture of a page is
 * STALE BY DEFAULT, and before this there was no cheap way for it to find out:
 * the only correct move was to re-read the page, which on a real page is 73
 * segments (DOC-28 §6.3) and is not affordable defensively on every turn. The
 * consequence of not doing it is worse than a wasted call — the assistant
 * "improves" a section the operator has just reworded and silently reverts them.
 *
 * THE MECHANISM IS A COUNTER, NOT A DIFF. Every mutating write appends one
 * record and increments a monotone per-site counter, and every mutating write
 * RETURNS the counter it produced. A caller's baseline therefore advances as it
 * writes, so any gap between its baseline and the current counter is by
 * construction somebody else's work — which is why nothing here has to filter by
 * actor to answer "did anything change under me". The actor is recorded because
 * it is useful to say WHO, never because the comparison depends on it.
 *
 * RECORDS ARE SELF-DESCRIBING, BECAUSE ADDRESSES ARE NOT DURABLE. An L1 address
 * is render-scoped by design (DOC-28 §5.2): a path of child indices valid only
 * for the render that produced it. A record saying "set_l1 at 0.2.1" is
 * worthless once structure has moved, so every record carries a human-readable
 * label and, where the change is textual, the before and after text — bounded,
 * so one enormous paste cannot make the journal expensive to read.
 *
 * THIS IS NOT A REVISION. No revision id, no `history.json` entry, no
 * participation in publish or checkout. DOC-12 principle 3 is forward-only and
 * immutable; §5.1's preview snapshots are the standing precedent for an artifact
 * that is deliberately not a revision.
 *
 * WHERE IT LIVES, AND WHY IT IS NOT COMMITTED. Beside the site it describes, as
 * `.journal.json` at the site root — the same place `.draft-base.json` sits, and
 * for the same reason: never inside `draft/`, so it can never be captured by a
 * snapshot or perturb byte-identity. It is GITIGNORED. A journal of every copy
 * edit would churn the tracked tree on every keystroke-settle, and it does not
 * need to survive a clone: losing it degrades a caller to a full read (see
 * {@link ChangeSlice.truncated}), which is the same fallback an over-old
 * baseline already takes. Correctness never depends on the journal existing.
 *
 * THE ARITHMETIC IS NOT HERE (REQ-142). What counter a record gets, and what the
 * window can still speak for, live in {@link ./journal-model} — shared with the
 * in-memory adapter, so the two cannot come to disagree about the one number the
 * whole mechanism rests on. This module is the `.journal.json` binding and
 * nothing else.
 */

export type { EditActor, JournalRecord, ChangeSlice, JournalFile } from './journal-model'
export { clip, JOURNAL_TEXT_LIMIT, JOURNAL_WINDOW } from './journal-model'

/** Read the journal, or an empty one. Never throws — see `normalizeJournal`. */
export function readJournal(ctx: StoreContext, slug: string): JournalFile {
  const file = journalPath(ctx, slug)
  if (!pathExists(file)) return emptyJournal()
  try {
    return normalizeJournal(readJson<unknown>(file))
  } catch {
    return emptyJournal()
  }
}

/** The site's current change count. Zero for a site nothing has been written to. */
export function draftCounter(ctx: StoreContext, slug: string): number {
  return readJournal(ctx, slug).counter
}

/**
 * Append one record and return the counter it produced.
 *
 * Called AFTER the write it describes has landed, which is what makes "a refused
 * write appends nothing" true without a transaction: every write on this surface
 * validates the whole resulting definition before touching disk and throws on
 * refusal, so a call that reaches here is a call that has already succeeded.
 *
 * Journalling never fails a write. A store that cannot take the record leaves
 * the counter where it was, and the caller sees a stale count rather than a
 * failed edit — a journal is not worth losing an operator's work over.
 */
export function appendChange(
  ctx: StoreContext,
  slug: string,
  entry: Omit<JournalRecord, 'at' | 'ts'> & { ts?: string },
): number {
  const journal = readJournal(ctx, slug)
  const next = nextJournal(journal, entry)
  try {
    writeJson(journalPath(ctx, slug), next)
  } catch {
    return journal.counter
  }
  return next.counter
}

/** Every change after `since`, plus where the counter stands now. */
export function changesSince(ctx: StoreContext, slug: string, since?: number): ChangeSlice {
  return sliceSince(readJournal(ctx, slug), since)
}
