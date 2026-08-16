/**
 * The draft change journal's *model* — its records, its window arithmetic, and
 * nothing that knows where a journal is kept (REQ-142).
 *
 * WHY IT IS SPLIT OUT. The journal used to be one module that both defined a
 * record and wrote it to `.journal.json`. That made it unreachable from a
 * Worker: the counter is part of the edit surface's contract (every write
 * returns the count it produced), so a store that cannot journal cannot serve
 * `edit.ts` at all, and a journal that can only be a file forces `node:fs` into
 * the one module the port exists to keep free of it.
 *
 * So the arithmetic lives here and the *storage* lives in an adapter. Both
 * adapters share these functions rather than each re-deriving "what counter does
 * this record get" — the filesystem one through {@link ./journal}, the in-memory
 * one directly. The counter's monotonicity and the window's truncation rule are
 * therefore properties of one implementation, not of two that agree today.
 *
 * The rationale for the journal itself — why a counter and not a diff, why
 * records are self-describing, why it is not a revision — is in {@link ./journal},
 * which is still where a reader should start.
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
  /** The address it was recorded against — for orientation only. */
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

/** What {@link sliceSince} answers with. */
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

/** The journal as an adapter holds it: a counter and a bounded record window. */
export interface JournalFile {
  version: 1
  /** The monotone counter. Never decreases, and is NOT `records.length`. */
  counter: number
  records: JournalRecord[]
}

/** A journal for a site nothing has been written to. */
export function emptyJournal(): JournalFile {
  return { version: 1, counter: 0, records: [] }
}

/**
 * Coerce whatever an adapter read back into a journal.
 *
 * Deliberately total. A malformed journal reads as an empty one rather than
 * throwing, because the journal is an optimisation over re-reading: a corrupt
 * one must degrade to "I cannot tell you what changed" and never to "your edit
 * failed".
 */
export function normalizeJournal(raw: unknown): JournalFile {
  if (raw === null || typeof raw !== 'object') return emptyJournal()
  const partial = raw as Partial<JournalFile>
  return {
    version: 1,
    counter: typeof partial.counter === 'number' ? partial.counter : 0,
    records: Array.isArray(partial.records) ? partial.records : [],
  }
}

/** Cut a value to the record limit, marking that it was cut. */
export function clip(text: string): string {
  return text.length > JOURNAL_TEXT_LIMIT ? `${text.slice(0, JOURNAL_TEXT_LIMIT - 1)}…` : text
}

/**
 * The journal one record on from `journal` — the counter it produced and the
 * window it leaves behind. Pure: the caller decides whether to persist it.
 */
export function nextJournal(
  journal: JournalFile,
  entry: Omit<JournalRecord, 'at' | 'ts'> & { ts?: string },
): JournalFile {
  const at = journal.counter + 1
  const record: JournalRecord = { ...entry, at, ts: entry.ts ?? new Date().toISOString() }
  return { version: 1, counter: at, records: [...journal.records, record].slice(-JOURNAL_WINDOW) }
}

/**
 * Every change after `since`, plus where the counter stands now.
 *
 * `since` omitted means "everything retained", which is bounded by the window
 * and by each record's own text limit. `since` at the current counter is the
 * cheap "nothing happened" answer: an empty list, not an error.
 */
export function sliceSince(journal: JournalFile, since?: number): ChangeSlice {
  const from =
    typeof since === 'number' && Number.isFinite(since) ? Math.max(0, Math.trunc(since)) : 0
  const changes = journal.records.filter((r) => r.at > from)
  // The oldest counter the window can still speak for. With no records at all
  // that is "the next write", which is why an untouched site reports nothing
  // truncated while a site whose records have aged out reports that it has.
  const earliest = journal.records.length ? journal.records[0].at : journal.counter + 1
  return { since: from, now: journal.counter, truncated: earliest > from + 1, changes }
}
