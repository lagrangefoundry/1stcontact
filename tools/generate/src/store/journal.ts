import { journalPath } from './paths'
import type { StoreContext } from './paths'
import { pathExists, readJson, writeJson } from './fsutil'

/**
 * The draft change journal (REQ-131, DOC-33 §7.9 / §13).
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
 */

/** Who made a change. Recorded for the answer, never for the comparison. */
export type EditActor = 'ai' | 'client' | 'cli'

/** One entry in the journal, as it is stored and as it is read back. */
export interface JournalRecord {
  /** The counter this write produced. Strictly increasing across the site. */
  at: number
  /** When it landed, ISO-8601. */
  ts: string
  actor: EditActor
  /** The operation that produced it, e.g. `copy.set`, `l1.set`, `palette.set`. */
  op: string
  /** The page it happened on, when it happened on one. */
  page?: string
  /** The address it was recorded against — for orientation only; see the note above. */
  path?: string
  module?: string
  slot?: string
  /** A human-readable identity for the thing that changed. */
  label?: string
  /** The text before, when the change was textual. Bounded. */
  before?: string
  /** The text after, when the change was textual. Bounded. */
  after?: string
  /** One line describing what happened, in the same words the command reports. */
  summary: string
}

/** What {@link changesSince} answers with. */
export interface ChangeSlice {
  /** The counter that was asked about. */
  since: number
  /** The site's counter now. Equal to `since` when nothing has happened. */
  now: number
  /**
   * True when the window no longer reaches back to `since`, so `changes` is not
   * the whole story and the caller should re-read what it cares about instead.
   */
  truncated: boolean
  changes: JournalRecord[]
}

/**
 * How many records are retained.
 *
 * Sized so that a whole consultation session (DOC-33's 4–5 hours) never
 * truncates in practice: the measured page carries 73 segments, so 500 records
 * is several complete rewrites of a page plus everything else a session does.
 * Truncation is a graceful degradation rather than a failure, so the number is
 * chosen to make it rare, not to make it impossible.
 */
export const JOURNAL_WINDOW = 500

/** How much of a text value a record carries before it is cut. */
export const JOURNAL_TEXT_LIMIT = 300

interface JournalFile {
  version: 1
  /** The monotone counter. Never decreases, and is NOT `records.length`. */
  counter: number
  records: JournalRecord[]
}

const EMPTY: JournalFile = { version: 1, counter: 0, records: [] }

/**
 * Read the journal, or an empty one.
 *
 * A malformed or unreadable file reads as empty rather than throwing: the
 * journal is an optimisation over re-reading, and a corrupt one must degrade to
 * "I cannot tell you what changed" and never to "your edit failed".
 */
function read(ctx: StoreContext, slug: string): JournalFile {
  const file = journalPath(ctx, slug)
  if (!pathExists(file)) return { ...EMPTY, records: [] }
  try {
    const raw = readJson<Partial<JournalFile>>(file)
    return {
      version: 1,
      counter: typeof raw.counter === 'number' ? raw.counter : 0,
      records: Array.isArray(raw.records) ? raw.records : [],
    }
  } catch {
    return { ...EMPTY, records: [] }
  }
}

/** Cut a value to the record limit, marking that it was cut. */
export function clip(text: string): string {
  return text.length > JOURNAL_TEXT_LIMIT ? `${text.slice(0, JOURNAL_TEXT_LIMIT - 1)}…` : text
}

/** The site's current change count. Zero for a site nothing has been written to. */
export function draftCounter(ctx: StoreContext, slug: string): number {
  return read(ctx, slug).counter
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
  const journal = read(ctx, slug)
  const at = journal.counter + 1
  const record: JournalRecord = { ...entry, at, ts: entry.ts ?? new Date().toISOString() }
  const records = [...journal.records, record].slice(-JOURNAL_WINDOW)
  try {
    writeJson(journalPath(ctx, slug), { version: 1, counter: at, records })
  } catch {
    return journal.counter
  }
  return at
}

/**
 * Every change after `since`, plus where the counter stands now.
 *
 * `since` omitted means "everything retained", which is bounded by the window
 * and by each record's own text limit. `since` at the current counter is the
 * cheap "nothing happened" answer: an empty list, not an error.
 */
export function changesSince(
  ctx: StoreContext,
  slug: string,
  since?: number,
): ChangeSlice {
  const journal = read(ctx, slug)
  const from = typeof since === 'number' && Number.isFinite(since) ? Math.max(0, Math.trunc(since)) : 0
  const changes = journal.records.filter((r) => r.at > from)
  // The oldest counter the window can still speak for. With no records at all
  // that is "the next write", which is why an untouched site reports nothing
  // truncated while a site whose records have aged out reports that it has.
  const earliest = journal.records.length ? journal.records[0].at : journal.counter + 1
  return { since: from, now: journal.counter, truncated: earliest > from + 1, changes }
}
