/**
 * Session inference — turning a person's raw records into one readable row on
 * their timeline ([[REQ-235]] §3, §4).
 *
 * WHAT A SESSION IS. An INFERRED INTERVAL, not a thing anybody declares. It
 * opens on the first record from an identified actor and closes after
 * {@link SESSION_TIMEOUT_MS} of silence. Nothing signs in to a session and
 * nothing signs out of one: a closed laptop sends nothing, and a sign-out is not
 * the only way a person stops being here.
 *
 * THE RULE IS STATED ONCE, HERE, AND THAT IS THE POINT. A second answer to *is
 * this the same session* is a second answer to every number on the timeline, and
 * the two would agree until somebody changed one of them.
 *
 * WHY THE ROW IS WRITTEN AFTER THE FACT RATHER THAN OPENED LIVE AND REVISED.
 * `contact_events` refuses `UPDATE` at the database, deliberately — an event
 * edited in place leaves a timeline that reads perfectly and is untrue. So a
 * summary is composed once, at close, which is exactly what `occurred_at` and
 * `recorded_at` being separate columns are for: the session happened then, we
 * learned of it now.
 *
 * ELAPSED TIME IS DERIVED ON READ AND NEVER STORED AS A MEASUREMENT. Every
 * interval here is a lower bound — a person reading a page sends nothing — so
 * `detail` carries the stamps that are FACTS (first record on this surface, last
 * record on this surface) and no `duration_ms`. Storing one would present a
 * floor as a fact, which is the same error sampling would have made one layer
 * down and the reason this store is not Analytics Engine.
 *
 * NO DERIVED JUDGEMENT ABOUT A PERSON GOES IN `detail` ([[CHAT-53]]). No churn
 * score, no "struggling" flag, no engagement grade. The row records what
 * happened; a conclusion about somebody is not a fact about them, and a business
 * reading its own contacts' timelines is the last place one belongs.
 */

import { contactEventInsert, type EventEnv } from './events'
import type { LogEnv, StoredRecord } from './log'
import { SESSION_RECORDED } from './builder/contact-events.js'

/**
 * The cron expression the closer runs on, spelled once ([[REQ-235]] §3).
 *
 * IT MUST AGREE WITH `wrangler.toml`, AND A UAT PINS THE TWO TOGETHER. The
 * scheduled handler branches on it — this tick runs the closer and skips the
 * daily sweeps — so a literal that had drifted from the deployment would mean
 * either three table sweeps every ten minutes or a timeline that never updates,
 * and neither would fail anything visibly.
 *
 * IT LIVES HERE AND NOT BESIDE THE HANDLER THAT READS IT, which is not a matter
 * of taste: workerd validates every NAMED export of a Worker's entry module as a
 * handler or an entrypoint class, so a plain string exported from `index.ts` is
 * a runtime that refuses to start — *"Incorrect type for map entry: the provided
 * value is not of type 'function or ExportedHandler'"*. The constant belongs
 * with the closer anyway; the entry module is where it is consumed.
 */
export const ACTIVITY_CRON = '*/10 * * * *'

/**
 * How long a person may be silent before the session is treated as over.
 *
 * HALF AN HOUR, AND IT IS A JUDGEMENT ABOUT THIS PRODUCT RATHER THAN A
 * CONVENTION. The builder is a reading surface as much as a working one: an
 * operator opens a page, thinks about it, talks to somebody, and comes back — so
 * a boundary of a few minutes would cut one afternoon into a dozen rows that
 * each say nothing. [[EPIC-11]]'s own originating example is the measure of it,
 * *"16:23-17:28 … Site tab (13 mins) Marketing tab (23 mins)"*: a signal at
 * 16:36 and nothing until 16:59 is one person on one tab, and a timeout under
 * twenty-three minutes would report it as two visits.
 *
 * WHAT IT COSTS IS LAG, AND THE BUDGET IS THE CRON. A session is summarised
 * between this and this-plus-the-cron-interval after it ends — thirty to forty
 * minutes — which is the difference between a timeline that is current enough to
 * act on and the eighteen hours a daily sweep would have given.
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

/**
 * How far back the closer will look for work.
 *
 * A BOUND ON THE SCAN AND NOT ON CORRECTNESS. It exists so one missed cron run,
 * or a deployment that was down for a day, does not turn the next tick into a
 * full-table walk. It is comfortably inside the `info` horizon (30 days), which
 * is the constraint [[EPIC-1]] §41.5 actually imposes on this seam: *"the raw
 * window outlives the inference schedule"*.
 */
export const CLOSER_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000

/** How many actors one run will close for, and how many records it reads each. */
export const CLOSER_ACTOR_LIMIT = 200
const CLOSER_RECORD_LIMIT = 5000

/** One stretch on one surface, as `detail` carries it. */
export interface SurfaceInterval {
  /** Which surface the builder said it was on — `site`, `library`, … */
  surface: string
  /** The first record we have from this stretch, ISO. */
  from: string
  /**
   * When the stretch ended, ISO — the moment the NEXT surface began, or the end
   * of the session for the last one. Not this stretch's own last signal, which
   * for a tab somebody sat on is the moment they opened it. The gap between the
   * two stamps is the reader's arithmetic.
   */
  to: string
}

/** One inferred session, before it becomes a row. */
export interface InferredSession {
  actor: string
  startedAt: string
  endedAt: string
  /** How many raw records fell inside it — the density behind the interval. */
  events: number
  surfaces: SurfaceInterval[]
  /** Every record in it was manufactured traffic, so the summary is too. */
  synthetic: boolean
  /** The run that produced it, when it was a probe's. */
  runId: string | null
}

/**
 * Cut one actor's records into sessions.
 *
 * A PURE FUNCTION OVER A SORTED LIST, deliberately separated from the database
 * so the rule can be asserted at both edges of the boundary without a fixture.
 * `records` must be ascending by `ts`; that is the ordering the query produces
 * and the ordering the gap test means.
 *
 * SURFACE ATTRIBUTION COMES FROM `kind=client` RECORDS ONLY. A server route is
 * a URL an API call happened to use, and folding those into "which tab were they
 * on" would report `/api/sites` as a surface. What the builder SAYS it is
 * showing is the only statement about a tab anybody has — which is why §5's
 * signal exists at all, and why a session with no client records is summarised
 * honestly as an interval with no surface breakdown rather than a guess.
 */
export function inferSessions(
  records: StoredRecord[],
  options: { timeoutMs?: number } = {},
): InferredSession[] {
  const timeout = options.timeoutMs ?? SESSION_TIMEOUT_MS
  const sessions: InferredSession[] = []
  let current: { first: number; last: number; rows: StoredRecord[] } | null = null

  const close = () => {
    if (current) sessions.push(summarise(current.rows, current.first, current.last))
    current = null
  }

  for (const record of records) {
    if (current !== null && record.ts - current.last > timeout) close()
    if (current === null) current = { first: record.ts, last: record.ts, rows: [] }
    current.last = record.ts
    current.rows.push(record)
  }
  close()
  return sessions
}

/** One session's rows, as the row that will be written. */
function summarise(rows: StoredRecord[], first: number, last: number): InferredSession {
  const surfaces: SurfaceInterval[] = []
  for (const row of rows) {
    if (row.kind !== 'client') continue
    const surface = (row.route ?? '').trim()
    if (surface === '') continue
    const at = new Date(row.ts).toISOString()
    const open = surfaces[surfaces.length - 1]
    // A RUN OF ONE SURFACE IS ONE INTERVAL, AND RETURNING TO IT IS A SECOND.
    // "Site, Library, Site" is three stretches and reads as three, because
    // collapsing by surface would report a person who kept switching back as
    // having sat on two tabs — which is the opposite of what happened.
    if (open && open.surface === surface) {
      open.to = at
      continue
    }
    // A STRETCH RUNS UNTIL THE NEXT ONE BEGINS, which is the whole reason the
    // signal is posted on a CHANGE rather than on a timer: the only thing that
    // says how long somebody was on a tab is when they left it. Closing the
    // previous stretch here — rather than at its own last signal, which is the
    // moment it OPENED — is what makes thirteen minutes read as thirteen and
    // not as zero.
    if (open) open.to = at
    surfaces.push({ surface, from: at, to: at })
  }
  // THE LAST STRETCH RUNS TO THE END OF THE SESSION. Without this it ends at the
  // last signal the browser happened to send, which for the tab somebody was
  // still on when they walked away is the moment they opened it — reporting the
  // longest stretch of the session as its shortest.
  const tail = surfaces[surfaces.length - 1]
  if (tail) tail.to = new Date(last).toISOString()

  const synthetic = rows.length > 0 && rows.every((row) => row.synthetic)
  return {
    actor: rows[0].actor as string,
    startedAt: new Date(first).toISOString(),
    endedAt: new Date(last).toISOString(),
    events: rows.length,
    surfaces,
    synthetic,
    runId: synthetic ? (rows.find((row) => row.runId)?.runId ?? null) : null,
  }
}

/** What one closer run did. */
export interface CloseReport {
  /** Actors examined. */
  actors: number
  /** Summary rows written. */
  sessions: number
}

type ActivityEnv = LogEnv & EventEnv

/**
 * Close every session that has ended, and write one row each.
 *
 * ON A CRON, AND IT IS A NEW CALLER OF EXISTING MACHINERY. The argument for
 * closing lazily on read was that a `scheduled` handler would be the first
 * periodic job in the system; it would not — [[REQ-231]]'s session purge has run
 * daily since 2026-09-12. What remains is a scheduling question rather than an
 * architectural one, and `17 4 * * *` is the wrong answer to it: a session
 * ending at 10am would not reach the timeline until the following morning, and a
 * timeline eighteen hours behind is not the feature that was asked for. So this
 * has a second, sub-daily expression of its own.
 *
 * THE FLOOR IS THE LAST SUMMARY THIS ACTOR ALREADY HAS, read from the spine
 * rather than kept in a table of its own. The spine is permanent and refuses
 * `UPDATE`, so it is the one witness that cannot drift from what was actually
 * written — and using it makes "no second row for a closed session" a property
 * of where the floor comes from rather than a rule some other table has to stay
 * consistent with.
 *
 * THE TRAILING SESSION IS LEFT OPEN. A stretch whose last record is inside the
 * timeout may still be running, and a row written for it would be a summary of
 * half an afternoon that can never be corrected, because the spine forbids it.
 */
export async function closeSessions(
  env: ActivityEnv,
  options: { now?: number; timeoutMs?: number } = {},
): Promise<CloseReport> {
  const now = options.now ?? Date.now()
  const timeout = options.timeoutMs ?? SESSION_TIMEOUT_MS
  const since = now - CLOSER_LOOKBACK_MS

  const { results: actors } = await env.DB.prepare(
    'SELECT DISTINCT actor FROM log_records WHERE actor IS NOT NULL AND ts >= ? LIMIT ?',
  )
    .bind(since, CLOSER_ACTOR_LIMIT)
    .all<{ actor: string }>()

  const statements: D1PreparedStatement[] = []
  let written = 0
  for (const { actor } of actors ?? []) {
    const floor = await lastSummaryEnd(env, actor)
    const { results } = await env.DB.prepare(
      'SELECT seq, ts, trace_id, business, kind, level, event, route, method, status, ' +
        'outcome, actor, duration_ms, data, synthetic, run_id FROM log_records ' +
        'WHERE actor = ? AND ts > ? AND ts >= ? ORDER BY ts ASC, seq ASC LIMIT ?',
    )
      .bind(actor, floor, since, CLOSER_RECORD_LIMIT)
      .all<Record<string, unknown>>()
    const records = (results ?? []).map(asStored)
    for (const session of inferSessions(records, { timeoutMs: timeout })) {
      if (now - Date.parse(session.endedAt) <= timeout) continue
      statements.push(summaryInsert(env, session, now))
      written += 1
    }
  }
  if (statements.length > 0) await env.DB.batch(statements)
  return { actors: (actors ?? []).length, sessions: written }
}

/**
 * The statement that writes one summary.
 *
 * UNSCOPED, WHICH IS THE CORRECT READING AND NOT A SHORTCUT. `contactEventInsert`
 * derives `business_id` from the contact's own row whenever no business is
 * supplied, and the closer is a platform-level sweep with no request scope to
 * name one. It also happens to be the only reading that is true: an operator is
 * a contact of 1st Contact and not of the business they are working in — *"the
 * site owner is not a contact of her own site"* ([[CHAT-53]]) — so the row lands
 * on the timeline the person actually belongs to, whichever business they spent
 * the session operating.
 *
 * THE MARK IS CARRIED, AND IT IS A FLOOR THERE TOO. A session made entirely of
 * manufactured records is a manufactured session; the statement takes `MAX` of
 * that and the contact's own mark, so a real contact's session can be marked by
 * its traffic and a synthetic contact's never reads as real.
 */
function summaryInsert(
  env: ActivityEnv,
  session: InferredSession,
  now: number,
): D1PreparedStatement {
  return contactEventInsert(env, {
    contactId: session.actor,
    kind: SESSION_RECORDED,
    occurredAt: session.startedAt,
    now: new Date(now).toISOString(),
    detail: {
      endedAt: session.endedAt,
      events: session.events,
      surfaces: session.surfaces,
    },
    synthetic: session.synthetic,
    runId: session.runId,
  })
}

/**
 * When this actor's most recent summary ended, as epoch ms. Zero when none.
 *
 * READ OFF `detail.endedAt` AND NOT OFF `occurred_at`. `occurred_at` is when the
 * session BEGAN — that is what puts the row in the right place on a timeline
 * ordered by when things happened — so using it as the floor would re-read every
 * record of the session just summarised and write the row a second time.
 */
async function lastSummaryEnd(env: ActivityEnv, actor: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT detail FROM contact_events WHERE contact_id = ? AND kind = ? ' +
      'ORDER BY occurred_at DESC, rowid DESC LIMIT 1',
  )
    .bind(actor, SESSION_RECORDED)
    .first<{ detail: string }>()
  if (!row) return 0
  try {
    const parsed = JSON.parse(row.detail || '{}') as { endedAt?: string }
    const at = Date.parse(parsed.endedAt ?? '')
    return Number.isFinite(at) ? at : 0
  } catch {
    // A malformed bag on one historical row must not stop this actor being
    // summarised forever. Zero re-reads the window, and the spine's own floor —
    // the next successful summary — closes it again.
    return 0
  }
}

/** A raw row as {@link StoredRecord}. Kept here so the closer owns one query. */
function asStored(row: Record<string, unknown>): StoredRecord {
  let data: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse((row.data as string) || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
    }
  } catch {
    // See `log.ts`'s `toRecord`: a malformed bag costs a reader its extras and
    // never the fact.
  }
  return {
    seq: row.seq as number,
    ts: row.ts as number,
    traceId: (row.trace_id as string) ?? null,
    business: (row.business as string) ?? null,
    kind: row.kind as string,
    level: row.level as string,
    event: row.event as string,
    route: (row.route as string) ?? null,
    method: (row.method as string) ?? null,
    status: (row.status as number) ?? null,
    outcome: (row.outcome as string) ?? null,
    actor: (row.actor as string) ?? null,
    durationMs: (row.duration_ms as number) ?? null,
    data,
    synthetic: row.synthetic === 1,
    runId: (row.run_id as string) ?? null,
  }
}
