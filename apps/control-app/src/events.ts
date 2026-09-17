/**
 * A contact's history — the immutable spine every interaction hangs off
 * ([[REQ-195]], [[DOC-44]] §4.1).
 *
 * WHAT AN EVENT IS. A fact of the form *this happened, to this contact, at this
 * time*. It is written once and never rewritten. Anything that CHANGES is state
 * and lives somewhere else — which is not a stylistic preference but the whole
 * reason this table earns its keep. A message's delivery outcome moves (queued,
 * sent, delivered, or bounced), so the message is a record with mutable state
 * ([[REQ-198]]) and the events are `email.sent`, `email.delivered`,
 * `email.bounced`: three rows, not one row rewritten three times. Written the
 * other way round, the timeline silently loses the bounce the moment a retry
 * succeeds.
 *
 * WHY A TABLE AND NOT A `source` COLUMN. [[DOC-44]] §4.1 settled that the
 * pipeline stage over-claims unless we record where a contact came from, and a
 * column fails on the example that motivated it: somebody who joined the mailing
 * list and LATER booked a consultation has two entry facts and a column keeps
 * one. Provenance is {@link provenanceOf} — the earliest row — and there is no
 * column duplicating it, because two representations of one fact is one of them
 * being wrong.
 *
 * THERE IS NO UPDATE AND NO DELETE IN THIS MODULE, and the database says the
 * same thing louder: `contact_events_are_immutable` refuses an `UPDATE` outright
 * ([[DOC-45]] §7 — an invariant the code maintains is an invariant that
 * eventually is not maintained). A correction is an appended event that
 * supersedes, never an edit of the row that was wrong. DELETE is deliberately
 * left reachable, because erasure ([[DOC-37]]) has to reach these rows and the
 * event spine is exactly where a "we deleted them but kept the history" mistake
 * would hide.
 *
 * THE BUSINESS IS DERIVED FROM THE CONTACT AND IS NEVER SUPPLIED. Every insert
 * is `INSERT ... SELECT ... FROM users`, so an event cannot be filed under a
 * business its contact does not belong to — the isolation is a property of the
 * statement rather than of every caller remembering to pass the right value.
 * Reads then scope by that same column and a caller in one business learns
 * nothing about a contact in another: an id from elsewhere reads as an empty
 * history, which is what an id that never existed reads as.
 */

import { newId } from '../../../tools/generate/src/store/ids'
import { realOnly, type Scope } from './scope'

/**
 * What this module needs from the environment: a database, and nothing else.
 *
 * DECLARED HERE RATHER THAN IMPORTED FROM `identity.ts`, and that is a cycle
 * this file exists on the safe side of. `identity.ts` and `people.ts` both write
 * events, so importing `IdentityEnv` back from `identity.ts` would make the two
 * modules import each other — which ESM tolerates until the day an import is
 * evaluated at module scope rather than inside a function, and then fails as an
 * undefined binding at boot. `IdentityEnv` is assignable to this, so every
 * existing caller passes what it already holds.
 *
 * The narrower type is also the honest one: an event is a row, and this module
 * has no business with R2, the tenant var, or the break-glass list.
 */
export interface EventEnv {
  DB: D1Database
}

/**
 * One thing that happened, as every reader wants it.
 *
 * `occurredAt` AND `recordedAt` ARE BOTH HERE because they genuinely differ. An
 * imported contact's mailing-list signup happened before we knew of it and a
 * bounce webhook arrives after the bounce; collapsed into one column an import
 * reads as a flood of activity today, which is the reading a timeline exists to
 * prevent. The timeline orders by the first and the second is the audit fact.
 *
 * `detail` IS A DECODED BAG AND NOT THE STORED STRING, so no caller has to
 * remember to parse it — and a row whose JSON is unreadable comes back as `{}`
 * rather than throwing, because a timeline that refuses to render because one
 * historical row is malformed is worse than one that renders it with no extras.
 */
export interface ContactEvent {
  id: string
  contactId: string
  /** Which business's timeline this belongs to — always the contact's own. */
  businessId: string
  /** A dotted string: `contact.created`, `email.sent`, `list.joined`, … */
  kind: string
  occurredAt: string
  recordedAt: string
  /** The detail record this event points at, when there is one. Else null. */
  ref: string | null
  detail: Record<string, unknown>
  /**
   * Manufactured traffic produced this ([[DOC-54]], [[REQ-267]]).
   *
   * REPORTED RATHER THAN FILTERED OUT HERE. A read that asked for the gutter
   * asked on purpose and needs to be able to tell the two apart on the row; a
   * read that did not never sees one at all, because {@link eventsOf} excludes
   * them in SQL. Both halves are needed: filtering without reporting would make
   * the one surface that may look at test data unable to label it.
   */
  synthetic: boolean
  /** Which probe run produced it, when one did. Null on every real row. */
  runId: string | null
  /**
   * Where to resume from, to read the events BEFORE this one ([[REQ-267]] §8).
   *
   * ON THE ROW AND NOT ON A PAGE WRAPPER. The cursor is a property of an event —
   * *this position in the ordering* — so carrying it here lets a reader page by
   * handing back the last row it holds, and leaves every existing caller's
   * return type exactly as it was. A `{events, nextCursor}` envelope would have
   * been the same information in a shape that breaks every call site to add it.
   *
   * OPAQUE, AND THE ONLY THING A CALLER DOES WITH IT IS HAND IT BACK. It encodes
   * the query's own ordering — `occurred_at` and the row id that breaks its ties
   * — and nothing outside this module parses it.
   */
  cursor: string
}

/** What a writer says happened. */
export interface EventSpec {
  contactId: string
  kind: string
  /**
   * When it HAPPENED. Defaults to now, which is right for anything this system
   * did itself and wrong for anything imported — so an importer passes the real
   * time and the row keeps both.
   */
  occurredAt?: string
  ref?: string | null
  detail?: Record<string, unknown>
  /**
   * This event was produced by manufactured traffic ([[REQ-267]] §7).
   *
   * THE IN-FLIGHT MARK, AND IT IS THE EXCEPTION RATHER THAN THE RULE.
   * [[DOC-54]] R2's rule is *in-flight mark where there is one, parent's mark
   * where there is not, never a default of false* — and for almost everything
   * that writes here the parent is the whole answer, which is why the statement
   * below derives it from `users` and why no ordinary caller passes this.
   *
   * WHAT NEEDS IT IS A SYNTHETIC MESSAGE FROM A REAL CONTACT'S ADDRESS. A probe
   * mailing in as somebody who genuinely is a contact would otherwise write a
   * REAL event onto a real person's timeline, because the parent row says so —
   * which is exactly the customer-visible pollution the gutter exists to
   * prevent. The mark is taken as a floor, never as an override: a synthetic
   * contact's events are synthetic whatever the traffic says.
   */
  synthetic?: boolean
  /** The run that produced it. Ignored unless {@link synthetic} is set. */
  runId?: string | null
}

/** Refused because the contact is not in this business, or does not exist. */
export class UnknownContactError extends Error {
  constructor() {
    super('No such contact in this business.')
  }
}

/**
 * The statement that writes one event, as a statement rather than a call.
 *
 * A BUILDER SO IT CAN GO IN A BATCH, on {@link userEmailInsert}'s precedent. The
 * acts that emit events are acts that write other rows in the same breath — the
 * invite writes a person, their address and the two events that say so — and an
 * event recorded by a separate round trip is an event that can be missing from a
 * history whose subject exists. One batch or neither.
 *
 * `INSERT ... SELECT ... FROM users`, WHICH IS WHERE `business_id` COMES FROM.
 * The caller names a contact and the contact's own row decides which timeline
 * the event lands on, so the two can never disagree. Supplying a `businessId`
 * narrows further — write nothing unless the contact is in THAT business — which
 * is what makes {@link recordEvent} a scope check as well as a write.
 *
 * NOTHING IS WRITTEN FOR A CONTACT THAT DOES NOT MATCH, and no error is raised
 * by SQLite either: `INSERT ... SELECT` over an empty select is a no-op. Callers
 * that care read `meta.changes`, which is what {@link recordEvent} does.
 *
 * THE KEY MAY BE SUPPLIED, so a caller that has to find the row again can mint
 * it first. {@link recordEvent} does exactly that: reading back "the last row
 * written for this contact" would be a guess that two concurrent writers make
 * differently, and the id is the only handle that cannot be raced.
 */
export function contactEventInsert(
  env: EventEnv,
  spec: EventSpec & { id?: string; businessId?: string; now?: string },
): D1PreparedStatement {
  const now = spec.now ?? new Date().toISOString()
  const scoped = spec.businessId !== undefined
  const where = scoped ? 'WHERE u.id = ? AND u.tenant_id = ?' : 'WHERE u.id = ?'
  // THE MARK RIDES THE SAME `SELECT` THE BUSINESS DOES ([[DOC-54]] §2.4,
  // [[REQ-267]] §7). `business_id` is read off the contact's own row precisely
  // so the two can never disagree, and `synthetic` is the same fact about a
  // different axis — which is what answers R2's hardest case, an async
  // continuation with no request context, with a pattern this statement already
  // had. A caller cannot supply the business and cannot clear the mark.
  //
  // THE IN-FLIGHT MARK IS A FLOOR AND NOT AN OVERRIDE — `MAX`, not the
  // parameter. A synthetic contact's events are synthetic whatever the traffic
  // claims, and synthetic traffic's events are synthetic whoever it claims to
  // be; the only way to write a real row is for both to be real.
  const statement = env.DB.prepare(
    'INSERT INTO contact_events (id, contact_id, business_id, kind, occurred_at, ' +
      'recorded_at, ref, detail, synthetic, run_id) ' +
      'SELECT ?, u.id, u.tenant_id, ?, ?, ?, ?, ?, MAX(u.synthetic, ?), ' +
      `COALESCE(u.run_id, ?) FROM users u ${where}`,
  )
  const synthetic = spec.synthetic ? 1 : 0
  const values: unknown[] = [
    spec.id ?? newId('evt'),
    spec.kind,
    spec.occurredAt ?? now,
    now,
    spec.ref ?? null,
    JSON.stringify(spec.detail ?? {}),
    synthetic,
    synthetic === 1 ? (spec.runId ?? null) : null,
    spec.contactId,
  ]
  if (scoped) values.push(spec.businessId)
  return statement.bind(...values)
}

interface EventRow {
  id: string
  contact_id: string
  business_id: string
  kind: string
  occurred_at: string
  recorded_at: string
  ref: string | null
  detail: string
  synthetic: number
  run_id: string | null
  /** SQLite's own row id — the tie break, and half the cursor. */
  rowid: number
}

function toEvent(row: EventRow): ContactEvent {
  let detail: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(row.detail || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      detail = parsed as Record<string, unknown>
    }
  } catch {
    // A history that refuses to render because one old row's bag is malformed
    // is worse than one that renders it without extras. The fact — kind, when,
    // and who — is in the columns and survives regardless.
  }
  return {
    id: row.id,
    contactId: row.contact_id,
    businessId: row.business_id,
    kind: row.kind,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    ref: row.ref,
    detail,
    synthetic: row.synthetic === 1,
    runId: row.run_id,
    cursor: encodeCursor(row.occurred_at, row.rowid),
  }
}

/**
 * The cursor's two halves, joined by a character neither can contain.
 *
 * AN ISO STAMP AND A ROW ID, WHICH IS THE QUERY'S OWN ORDERING AND NOT A SECOND
 * ONE ([[REQ-267]] §8). `ORDER BY occurred_at DESC, rowid DESC` is what
 * {@link eventsOf} has always done and what the index supports; a cursor built
 * from anything else would page in an order the query does not produce, and the
 * symptom is a row appearing on two pages or on neither.
 *
 * A NEWLINE IS THE SEPARATOR because an ISO stamp cannot hold one and a row id
 * is digits — so the split is unambiguous without escaping.
 */
function encodeCursor(occurredAt: string, rowid: number): string {
  return `${occurredAt}\n${rowid}`
}

/** The two halves back, or null for anything that is not one of ours. */
function decodeCursor(cursor: string): { at: string; rowid: number } | null {
  const newline = cursor.indexOf('\n')
  if (newline <= 0) return null
  const rowid = Number(cursor.slice(newline + 1))
  if (!Number.isSafeInteger(rowid)) return null
  return { at: cursor.slice(0, newline), rowid }
}

const EVENT_COLUMNS =
  'id, contact_id, business_id, kind, occurred_at, recorded_at, ref, detail, ' +
  'synthetic, run_id, rowid'

/**
 * Record one event, now.
 *
 * THE SCOPE IS A REFUSAL AND NOT A LABEL. It is passed to the statement as a
 * constraint on the contact, so a caller in one business cannot file an event
 * against a contact in another even holding its id — and is told the same thing
 * it would be told about an id that never existed, which is what stops this
 * becoming an existence oracle across the barrier.
 */
export async function recordEvent(
  env: EventEnv,
  scope: Scope,
  spec: EventSpec,
): Promise<ContactEvent> {
  const id = newId('evt')
  const written = await contactEventInsert(env, {
    ...spec,
    id,
    businessId: scope.businessId,
  }).run()
  if (!written.meta?.changes) throw new UnknownContactError()

  // READ BACK RATHER THAN RECONSTRUCTED, and BY THE KEY THIS CALL MINTED. The
  // row carries stamps the caller did not supply, so a return value assembled
  // here from the spec would be a second, plausible answer that has never been
  // near the database — and "the most recent row for this contact" would be the
  // wrong row under any concurrency at all.
  const row = await env.DB.prepare(`SELECT ${EVENT_COLUMNS} FROM contact_events WHERE id = ?`)
    .bind(id)
    .first<EventRow>()
  if (!row) throw new UnknownContactError()
  return toEvent(row)
}

/**
 * How many events a timeline carries before it is cut.
 *
 * A CAP AND NOT A PAGE, deliberately: the detail pane is a history and not an
 * archive, and paging it would be a control nobody has asked for over data
 * nobody has enough of. What the cap must not do is silently redefine
 * provenance, which is why {@link provenanceOf} is its own query rather than the
 * last element of this list.
 */
export const TIMELINE_LIMIT = 100

/** What a reader asks for beyond the contact itself ([[REQ-267]] §8). */
export interface TimelineWindow {
  /** How many rows this page holds. Defaults to {@link TIMELINE_LIMIT}. */
  limit?: number
  /**
   * Resume before this row — a {@link ContactEvent.cursor} from the page above.
   *
   * A VALUE THIS MODULE MINTED, OR NOTHING. An unparseable cursor reads as
   * absent rather than as an error: the caller gets the first page, which is the
   * answer a reader who has lost their place actually wants, and no timeline
   * refuses to render because a URL was hand-edited.
   */
  before?: string | null
}

/**
 * One contact's history, newest first.
 *
 * ONE SEQUENCE, INBOUND AND OUTBOUND TOGETHER. A reply is `email.received` and a
 * message we sent is `email.sent`, and they sort into one ordering rather than
 * two lists a reader has to interleave by eye. Nothing here knows the difference
 * between a kind it has seen and a kind it has not, which is what lets a new one
 * appear without this function being edited.
 *
 * ORDERED BY `occurred_at`, NOT `recorded_at`. The sequence a reader wants is
 * the sequence of events, not the sequence of our learning about them —
 * otherwise an imported signup from March sorts above this morning's invite. The
 * row id breaks a tie, so two events stamped in the same millisecond keep the
 * order they were written in rather than swapping between reads.
 *
 * AND IT PAGES NOW ([[REQ-267]] §8). {@link TIMELINE_LIMIT} was a cap and not a
 * page on a stated assumption — *"data nobody has enough of"* — that inbound
 * mail falsifies: every message in both directions lands on the spine, and a
 * campaign writes an event per recipient. What the cap would then mean is that
 * the hundredth row is where a contact's history appears to BEGIN, silently.
 *
 * THE CURSOR IS THE QUERY'S OWN ORDERING AND NOT A SECOND ONE. `(occurred_at,
 * rowid)` is what the `ORDER BY` above already uses and what the index already
 * supports, so paging costs no new index and cannot disagree with the order a
 * single unpaged read would have produced.
 *
 * THE END OF THE HISTORY IS A SHORT PAGE, which is the ordinary convention and
 * the only one that needs no extra round trip: a full page whose successor is
 * empty costs one wasted read, and a `hasMore` flag would cost one extra read
 * on EVERY page to compute.
 *
 * AND IT EXCLUDES THE TEST GUTTER BY DEFAULT ([[DOC-54]] R3). The exclusion is
 * in the SQL and reached through {@link Scope}, so it is not something each call
 * site has to remember — see `realOnly`.
 */
export async function eventsOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
  window: TimelineWindow = {},
): Promise<ContactEvent[]> {
  const limit = window.limit ?? TIMELINE_LIMIT
  const from = window.before ? decodeCursor(window.before) : null
  // STRICTLY BEFORE THE CURSOR'S OWN ROW, in the compound ordering the `ORDER
  // BY` uses. A comparison on `occurred_at` alone would re-serve every row
  // sharing the boundary stamp — which is not a corner case, because an import
  // writes a whole history on one stamp and this cap is what an import first
  // runs into.
  const page = from
    ? ' AND (occurred_at < ? OR (occurred_at = ? AND rowid < ?))'
    : ''
  const values: unknown[] = [scope.businessId, contactId]
  if (from) values.push(from.at, from.at, from.rowid)
  values.push(limit)
  const { results } = await env.DB.prepare(
    `SELECT ${EVENT_COLUMNS} FROM contact_events ` +
      'WHERE business_id = ? AND contact_id = ?' +
      realOnly(scope) +
      page +
      ' ORDER BY occurred_at DESC, rowid DESC LIMIT ?',
  )
    .bind(...values)
    .all<EventRow>()
  return (results ?? []).map(toEvent)
}

/**
 * Where this contact came from — the earliest thing that happened to them.
 *
 * ITS OWN QUERY AND NOT THE TAIL OF {@link eventsOf}. Reading it off a capped
 * list would make provenance quietly wrong for exactly the contacts with the
 * longest histories, which are the ones an operator is most likely to ask about.
 *
 * NULL IS AN HONEST ANSWER. A contact created before this table existed, or by a
 * path that does not emit yet, has no earliest event — and inventing one from
 * `created_at` would be the `source` column arriving through the back door.
 */
export async function provenanceOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
): Promise<ContactEvent | null> {
  const row = await env.DB.prepare(
    `SELECT ${EVENT_COLUMNS} FROM contact_events ` +
      'WHERE business_id = ? AND contact_id = ?' +
      realOnly(scope) +
      ' ORDER BY occurred_at ASC, rowid ASC LIMIT 1',
  )
    .bind(scope.businessId, contactId)
    .first<EventRow>()
  return row ? toEvent(row) : null
}
