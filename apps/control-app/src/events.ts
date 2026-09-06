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
import type { Scope } from './scope'

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
  const statement = env.DB.prepare(
    'INSERT INTO contact_events (id, contact_id, business_id, kind, occurred_at, ' +
      'recorded_at, ref, detail) ' +
      `SELECT ?, u.id, u.tenant_id, ?, ?, ?, ?, ? FROM users u ${where}`,
  )
  const values: unknown[] = [
    spec.id ?? newId('evt'),
    spec.kind,
    spec.occurredAt ?? now,
    now,
    spec.ref ?? null,
    JSON.stringify(spec.detail ?? {}),
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
  }
}

const EVENT_COLUMNS =
  'id, contact_id, business_id, kind, occurred_at, recorded_at, ref, detail'

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
 */
export async function eventsOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
  limit: number = TIMELINE_LIMIT,
): Promise<ContactEvent[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${EVENT_COLUMNS} FROM contact_events ` +
      'WHERE business_id = ? AND contact_id = ? ' +
      'ORDER BY occurred_at DESC, rowid DESC LIMIT ?',
  )
    .bind(scope.businessId, contactId, limit)
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
      'WHERE business_id = ? AND contact_id = ? ' +
      'ORDER BY occurred_at ASC, rowid ASC LIMIT 1',
  )
    .bind(scope.businessId, contactId)
    .first<EventRow>()
  return row ? toEvent(row) : null
}
