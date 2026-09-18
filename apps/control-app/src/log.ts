/**
 * The raw server-side event store — every invocation, whether or not a person is
 * behind it ([[REQ-235]] §2, [[EPIC-1]] §15).
 *
 * WHAT THIS IS. A sink, a store, a retention band and two readers. The RECORD is
 * not invented here: `@lagrangefoundry/logging` owns severity, bound context,
 * redaction, bounds and the dimension set, and exports `RECORD_FIELDS` as data
 * precisely so a store can be built against it without re-deriving it.
 * [[EPIC-1]] §15's division is adopted verbatim — *"EPIC-1 owns the record;
 * REQ-235 owns the store and its retention; EPIC-8 and REQ-235 own their own
 * readers"* — and this module is the second and third of those three.
 *
 * WHY IT IS NOT `contact_events`. That table is one row per milestone in a
 * PERSON's history: permanent, refused `UPDATE` at the database, read by the
 * customer, reached by erasure. This is one row per invocation, mostly anonymous,
 * pruned on a band, read by an operator. `contact_events.contact_id` is NOT NULL
 * and therefore structurally cannot hold the majority of what arrives here. The
 * two meet at one seam and one only — `activity.ts` folds these rows into one
 * summary row per session — and that seam is an aggregation, not a view.
 *
 * WHY D1 RATHER THAN ANALYTICS ENGINE. Three verified reasons, recorded in
 * `0018_activity_log.sql` beside the schema they decided: AE is adaptively
 * sampled at volume (which would make every inferred session boundary a guess),
 * its three-month retention is not configurable (so it cannot hold the
 * warn/error band at 180 days), and its reads cost four times its writes for a
 * layer whose whole purpose is being read on a schedule.
 *
 * THE MARK IS THE SINK'S AND NEVER A CALL SITE'S ([[DOC-54]] R2). A probe
 * produces invocations like any other caller, so its records must be marked —
 * and *"no call site supplies the flag"* is the rule that makes that reliable.
 * The mark rides {@link RequestLog}, which is constructed once per invocation
 * where the run is known, so every record that invocation writes is marked
 * without a single `logger.info(...)` growing a parameter.
 */

import { KINDS, consoleSink, createLogger, fanout } from './generated/logging'
import { newId } from '../../../tools/generate/src/store/ids'
import { realOnly, type Scope } from './scope'

/** What this module needs from the environment: a database, and nothing else. */
export interface LogEnv {
  DB: D1Database
  /**
   * The verbosity floor, as a level name. Absent or unrecognised is `info`,
   * which is the package's own fail-closed default: a policy lookup that fails
   * must not turn the most expensive setting on for everybody.
   */
  LOG_LEVEL?: string
}

/**
 * Where each of the package's `RECORD_FIELDS` lands.
 *
 * DERIVED FROM THE EXPORT AND CHECKED AGAINST IT, rather than a hand-kept list
 * that happens to agree today. A UAT asserts every `RECORD_FIELDS` entry appears
 * here, so a dimension added upstream fails a test rather than being silently
 * dropped — which is the failure [[EPIC-1]] §37 calls irreversible, because a
 * dimension the record never carried cannot be recovered afterwards at any cost.
 *
 * AND A FIELD WITH NO COLUMN STILL TRAVELS. {@link rowFor} folds anything
 * unmapped into `data`, so the worst case of an upstream addition is a value
 * that is present but not indexable — never a value that is gone.
 */
export const COLUMN_OF: Record<string, string> = {
  ts: 'ts',
  trace_id: 'trace_id',
  business: 'business',
  kind: 'kind',
  level: 'level',
  event: 'event',
  route: 'route',
  method: 'method',
  status: 'status',
  outcome: 'outcome',
  actor: 'actor',
  duration_ms: 'duration_ms',
}

/** The columns an insert writes, in one order, spelled once. */
const INSERT_COLUMNS = [
  ...Object.values(COLUMN_OF),
  'data',
  'synthetic',
  'run_id',
] as const

/**
 * The gutter's two facts about an invocation ([[REQ-268]], [[DOC-54]] §2.2).
 *
 * A PRESENT `runId` IS THE MARK; there is no separate boolean. `Scope` makes the
 * same choice for the same reason: a synthetic row with no run id is precisely
 * the row [[DOC-54]] §2.9 says nothing downstream can ever find again — the
 * sweep can see it and collection by run cannot.
 */
export interface GutterMark {
  runId?: string | null
}

/** One record as it goes to the database. */
interface LogRow {
  values: unknown[]
}

/**
 * A package record, plus the invocation's mark, as bind values.
 *
 * ANYTHING NOT IN {@link COLUMN_OF} GOES INTO `data`, including a `RECORD_FIELDS`
 * entry this store has no column for. The record's own `data` is already
 * sanitised by the package — the walk that replaces a value at a sensitive key
 * name at any depth — and merging into it here adds only fields the package
 * itself promoted, which are dimensions rather than payload.
 */
export function rowFor(record: Record<string, unknown>, mark: GutterMark = {}): LogRow {
  const extra: Record<string, unknown> = { ...((record.data as Record<string, unknown>) ?? {}) }
  for (const [field, value] of Object.entries(record)) {
    if (field === 'data' || value === undefined) continue
    if (COLUMN_OF[field] === undefined) extra[field] = value
  }
  const runId = (mark.runId ?? '').trim()
  const values: unknown[] = Object.keys(COLUMN_OF).map((field) => record[field] ?? null)
  values.push(
    Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
    runId === '' ? 0 : 1,
    runId === '' ? null : runId,
  )
  return { values }
}

/** The statement that writes one record. A builder, so a drain can batch. */
export function logRecordInsert(
  env: LogEnv,
  record: Record<string, unknown>,
  mark: GutterMark = {},
): D1PreparedStatement {
  const { values } = rowFor(record, mark)
  return env.DB.prepare(
    `INSERT INTO log_records (${INSERT_COLUMNS.join(', ')}) ` +
      `VALUES (${INSERT_COLUMNS.map(() => '?').join(', ')})`,
  ).bind(...values)
}

/**
 * How many records one invocation may buffer before it stops keeping them.
 *
 * A CEILING AND NOT A FAILURE. Logging may not fail a request ([[EPIC-1]],
 * REQ-157 B7), so a runaway loop that emits ten thousand records must cost a
 * bounded amount of memory and one bounded batch — not an exception, and not an
 * unbounded write. What is dropped is the tail, and the drop is itself reported
 * as a record, because a silently truncated log is worse than a short one.
 */
export const MAX_BUFFERED_RECORDS = 200

/**
 * The D1 sink — buffer now, one batch later.
 *
 * WHY IT BUFFERS AT ALL. A sink's `write` is synchronous by contract and a D1
 * write is not, so the only honest shapes are "hold and flush" or "fire a
 * floating promise per record". The second costs one round trip per call site
 * and loses ordering; this costs one batch per invocation.
 *
 * WHY THE MARK IS READ AT DRAIN AND NOT AT CONSTRUCTION. The run behind a
 * request is known after its body has been read, and the records written before
 * that point belong to the same invocation and must carry the same mark.
 */
export function d1LogSink(env: LogEnv, mark: GutterMark) {
  const pending: Record<string, unknown>[] = []
  let dropped = 0
  return {
    write(record: Record<string, unknown>): void {
      if (pending.length >= MAX_BUFFERED_RECORDS) {
        dropped += 1
        return
      }
      pending.push(record)
    },
    flush(): void {
      // The synchronous half of the contract has nothing to do: the batch is a
      // promise, and `drain` is what a host with an execution context awaits.
    },
    async drain(): Promise<number> {
      if (dropped > 0) {
        const lost = dropped
        dropped = 0
        pending.push({
          ts: Date.now(),
          kind: KINDS.APP,
          level: 'warn',
          event: 'log.truncated',
          data: { dropped: lost, ceiling: MAX_BUFFERED_RECORDS },
        })
      }
      if (pending.length === 0) return 0
      const batch = pending.splice(0, pending.length)
      await env.DB.batch(batch.map((record) => logRecordInsert(env, record, mark)))
      return batch.length
    },
  }
}

/**
 * One invocation's logging, from its first line to its last write.
 *
 * WHAT IT BINDS AND WHY IT IS MUTABLE. `business` and `actor` are not known when
 * a request arrives — the gate, the session lookup and the scope resolver all
 * run first — but a record written before they resolve still belongs to the same
 * invocation and still wants them. So the bindings are a value this object holds
 * and {@link RequestLog.logger} re-binds from on every call, rather than a base
 * frozen into one `Logger` at construction.
 *
 * `trace_id` IS MINTED HERE AND IS THE SESSION LINKAGE [[EPIC-1]] §41.5 ASKS
 * FOR. One per invocation, `newId`'s shape like every other key this system
 * mints, so nothing has to agree with a second id format.
 */
export interface RequestLog {
  readonly traceId: string
  /** A logger with everything known so far bound onto it. */
  logger(): { debug: LogFn; info: LogFn; warn: LogFn; error: LogFn }
  /** Bind what has since been resolved. Later calls win, field by field. */
  bind(fields: { business?: string | null; actor?: string | null; runId?: string | null }): void
  /** The one record per invocation that says how it went. */
  finish(status: number): void
  /** Write what was buffered. */
  drain(): Promise<void>
}

type LogFn = (event: string, payload?: Record<string, unknown>) => unknown

/**
 * Begin logging an invocation.
 *
 * THE CONSOLE SINK IS NOT A FALLBACK, IT IS THE SECOND SINK. Workers Logs reads
 * severity off the console channel, and it is the channel the deployment already
 * has enabled — so the console record is what an operator reads while the store
 * is being built, and what they still read when the store is down. `fanout`
 * guarantees a sink that throws neither reaches the caller nor stops the one
 * after it, which is exactly the property "logging cannot fail a request"
 * requires of two sinks rather than one.
 */
export function beginRequest(
  env: LogEnv,
  request: { method: string; url: string },
  options: { now?: () => number; traceId?: string } = {},
): RequestLog {
  const now = options.now ?? Date.now
  const traceId = options.traceId ?? newId('trace')
  const mark: GutterMark = {}
  const sink = d1LogSink(env, mark)
  const root = createLogger({
    sink: fanout([consoleSink(), sink]),
    level: env.LOG_LEVEL,
    now,
  })
  const startedAt = now()
  let route: string | null = null
  try {
    route = new URL(request.url).pathname
  } catch {
    // A URL that will not parse is not worth failing an invocation over; the
    // record simply carries no route, which is what an absent dimension means.
  }
  const bound: Record<string, unknown> = { trace_id: traceId, route, method: request.method }

  return {
    traceId,
    logger: () => root.child(bound),
    bind(fields) {
      if (fields.business !== undefined) bound.business = fields.business ?? undefined
      if (fields.actor !== undefined) bound.actor = fields.actor ?? undefined
      if (fields.runId !== undefined) mark.runId = fields.runId
    },
    finish(status) {
      /*
       * ONE RECORD PER INVOCATION, AT `info`, AND IT IS THE ONE SESSION
       * INFERENCE ACTUALLY READS. Everything else in this store is a call site
       * choosing to say something; this is the fact that the person was here,
       * and it is emitted whether or not any call site said anything at all.
       *
       * `duration_ms` IS THE PLATFORM'S MEASURE AND NOT A DERIVED ONE — it is the
       * only entry in the package's `MEASURES`, so a rollup tier that sums it
       * has something to sum.
       *
       * IT IS `kind=app` AND NOT `kind=access`. An access record is one the
       * EDGE produces, per invocation, including the ones that threw — a Tail
       * Worker's job ([[EPIC-1]] §41.1), richer than this and explicitly out of
       * scope here. Claiming the name for a record written from inside the
       * handler would make the two indistinguishable in the one store both will
       * eventually write to.
       */
      root.child(bound).info('request', { status, duration_ms: now() - startedAt })
    },
    /**
     * AWAITED INLINE AND NOT HANDED TO `ctx.waitUntil`, which was the first
     * shape and is the wrong one here for two reasons.
     *
     * DETERMINISM. A record that is written only when the platform feels like
     * keeping the isolate alive is a log with holes in exactly the invocations
     * that were cut short — which are the ones somebody is reading the log to
     * understand. Awaiting costs one batched write on the response path and
     * makes "the record exists" true of every caller, including the several
     * dozen suites that drive this handler directly and hold no context at all.
     *
     * AND IT LEAVES `ctx` MEANING WHAT IT MEANT. `waitUntil` is a shared
     * register the routes that genuinely outlive their response already use
     * ([[BUG-46]]'s turn drain); adding one registration per invocation would
     * make "what did this route hand the runtime" a question with two answers,
     * and one of them would be bookkeeping.
     *
     * IT NEVER THROWS. The store being unavailable is not an outage and is not
     * this request's problem — the console sink already carried every one of
     * these records, which is precisely the case `fanout` keeps it for.
     */
    async drain() {
      try {
        await sink.drain()
      } catch {
        // See above.
      }
    },
  }
}

/* ── Retention ───────────────────────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * How long a record lives, by severity ([[EPIC-1]] §40).
 *
 * WRITTEN IN SEVERITY AND NOT IN CATEGORY, which is the whole reason the package
 * carries a `level` axis distinct from `kind`: "warn versus error" is not
 * expressible as a category, and retention is written in exactly that
 * distinction.
 */
export const LEVEL_HORIZON_MS: Record<string, number> = {
  debug: 7 * DAY_MS,
  info: 30 * DAY_MS,
  warn: 180 * DAY_MS,
  error: 180 * DAY_MS,
}

/**
 * Where `kind` overrides `level`.
 *
 * `client` IS A BROWSER'S CLAIM AND IS KEPT ONLY UNTIL IT HAS BEEN USED. It is
 * re-stamped server-side and never trusted ([[REQ-235]] §5), and its one reader
 * is session inference, which runs within the hour. The durable artifact is the
 * `contact_events` row the inference writes — [[REQ-235]] §0's answer to
 * [[EPIC-1]]'s open Q14.1 — so holding the raw claim for a month would be paying
 * a month's storage for a fact that stopped being the truth after ten minutes.
 *
 * AN OVERRIDE NEVER RAISES A HORIZON. A `warn` is a `warn` whoever produced it,
 * so the band's floor stands and only the cheap end moves.
 */
const KIND_HORIZON_MS: Record<string, Record<string, number>> = {
  [KINDS.CLIENT]: { debug: DAY_MS, info: 7 * DAY_MS },
}

/**
 * How long a record of this `(kind, level)` is kept, in milliseconds.
 *
 * A FUNCTION OF BOTH, AND NOT ONE NUMBER. A `debug` record and a `warn` record
 * written in the same millisecond are pruned on different days, which is what
 * makes it reasonable to leave debug call sites in the code after an
 * investigation instead of deleting them.
 */
export function horizonMs(kind: string, level: string): number {
  return KIND_HORIZON_MS[kind]?.[level] ?? LEVEL_HORIZON_MS[level] ?? LEVEL_HORIZON_MS.info
}

/** What one prune took, and how far it reached. */
export interface PruneReport {
  deleted: number
  prunedThrough: number
}

/**
 * Delete everything past its horizon, and remember how far that reached.
 *
 * THE FLOOR IS WRITTEN FROM WHAT WAS ACTUALLY DELETED, read before the delete
 * rather than assumed after it. Anything else would be a second opinion about
 * which rows went — and the floor's whole job is to be the one statement a
 * reader can trust about where the history stops being complete.
 *
 * ONE PASS PER BAND, because the horizons differ and SQLite has no way to say
 * "older than a value that depends on two of your columns" without a CASE that
 * would have to restate the table above. Four bands, one statement each,
 * re-derived from {@link LEVEL_HORIZON_MS} rather than written out.
 */
export async function pruneRecords(
  env: LogEnv,
  options: { now?: number } = {},
): Promise<PruneReport> {
  const now = options.now ?? Date.now()
  const bands = new Map<string, number>()
  for (const [level, ms] of Object.entries(LEVEL_HORIZON_MS)) bands.set(`|${level}`, ms)
  for (const [kind, levels] of Object.entries(KIND_HORIZON_MS)) {
    for (const [level, ms] of Object.entries(levels)) bands.set(`${kind}|${level}`, ms)
  }

  let deleted = 0
  let reached = 0
  for (const [key, ms] of bands) {
    const [kind, level] = key.split('|')
    const cutoff = now - ms
    const where =
      kind === ''
        ? 'level = ? AND ts < ?' + kindExclusion(level)
        : 'kind = ? AND level = ? AND ts < ?'
    const values = kind === '' ? [level, cutoff] : [kind, level, cutoff]
    const high = await env.DB.prepare(`SELECT MAX(seq) AS high FROM log_records WHERE ${where}`)
      .bind(...values)
      .first<{ high: number | null }>()
    if (high?.high == null) continue
    const run = await env.DB.prepare(`DELETE FROM log_records WHERE ${where}`)
      .bind(...values)
      .run()
    deleted += run.meta?.changes ?? 0
    reached = Math.max(reached, high.high)
  }

  if (reached > 0) {
    await env.DB.prepare(
      'UPDATE log_floor SET pruned_through = MAX(pruned_through, ?) WHERE id = 1',
    )
      .bind(reached)
      .run()
  }
  return { deleted, prunedThrough: await prunedThrough(env) }
}

/**
 * The `AND kind <> ?` clauses a level's default band needs.
 *
 * A DEFAULT BAND IS "EVERY KIND THAT HAS NOT OVERRIDDEN THIS LEVEL", and saying
 * so explicitly is what keeps the two passes from both claiming the same row —
 * which would delete a `client` record on the default horizon whichever pass ran
 * first, making the override decorative.
 */
function kindExclusion(level: string): string {
  const overridden = Object.entries(KIND_HORIZON_MS)
    .filter(([, levels]) => levels[level] !== undefined)
    .map(([kind]) => `'${kind}'`)
  return overridden.length === 0 ? '' : ` AND kind NOT IN (${overridden.join(', ')})`
}

/** How far pruning has reached. Zero on a store nothing has been taken from. */
export async function prunedThrough(env: LogEnv): Promise<number> {
  const row = await env.DB.prepare('SELECT pruned_through FROM log_floor WHERE id = 1').first<{
    pruned_through: number
  }>()
  return row?.pruned_through ?? 0
}

/* ── Readers ─────────────────────────────────────────────────────────────── */

/** One stored record, as a reader wants it. */
export interface StoredRecord {
  seq: number
  ts: number
  traceId: string | null
  business: string | null
  kind: string
  level: string
  event: string
  route: string | null
  method: string | null
  status: number | null
  outcome: string | null
  actor: string | null
  durationMs: number | null
  data: Record<string, unknown>
  synthetic: boolean
  runId: string | null
}

/** A page of the log, and whether the cursor that asked for it still means anything. */
export interface RecordPage {
  records: StoredRecord[]
  /** Hand this back to read the next page. */
  cursor: number
  /**
   * The window this cursor named has been pruned, so the caller must start again.
   *
   * SAID RATHER THAN PAPERED OVER. A partial history that looks complete is the
   * one answer a log must never give, which is the whole reason `log_floor`
   * exists — the same contract `ticket_change_floor` states for the ticket
   * store's own change log.
   */
  reset: boolean
}

interface RecordRow {
  seq: number
  ts: number
  trace_id: string | null
  business: string | null
  kind: string
  level: string
  event: string
  route: string | null
  method: string | null
  status: number | null
  outcome: string | null
  actor: string | null
  duration_ms: number | null
  data: string | null
  synthetic: number
  run_id: string | null
}

const RECORD_COLUMNS = INSERT_COLUMNS.join(', ')

function toRecord(row: RecordRow): StoredRecord {
  let data: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(row.data || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
    }
  } catch {
    // A log that refuses to render because one row's bag is malformed is worse
    // than one that renders it without extras — `events.ts` makes the same call
    // about the same hazard.
  }
  return {
    seq: row.seq,
    ts: row.ts,
    traceId: row.trace_id,
    business: row.business,
    kind: row.kind,
    level: row.level,
    event: row.event,
    route: row.route,
    method: row.method,
    status: row.status,
    outcome: row.outcome,
    actor: row.actor,
    durationMs: row.duration_ms,
    data,
    synthetic: row.synthetic === 1,
    runId: row.run_id,
  }
}

/** How many records a page holds unless a caller says otherwise. */
export const PAGE_LIMIT = 200

/**
 * Read the log forward from a cursor.
 *
 * THE GUTTER IS EXCLUDED BY DEFAULT, THROUGH `Scope`, and that is the whole
 * mechanism ([[DOC-54]] R3, [[REQ-268]]). Seeing manufactured traffic requires
 * asking for it by name at a call site somebody wrote on purpose; a reader that
 * says nothing gets the customer's answer. This is the read [[DOC-54]] §3 warns
 * gets forgotten — a count is not obviously a "view", and a probe inflates one
 * silently and in the flattering direction.
 *
 * `business` IS OPTIONAL BECAUSE MOST ROWS HAVE NONE. A caller that names one
 * gets that business's records; a caller that does not gets the whole log,
 * including the anonymous majority — which is the operator's question and is why
 * this store exists separately from the spine.
 */
export async function readRecords(
  env: LogEnv,
  scope: Scope,
  window: { after?: number; limit?: number; business?: string | null } = {},
): Promise<RecordPage> {
  const after = window.after ?? 0
  const limit = window.limit ?? PAGE_LIMIT
  const floor = await prunedThrough(env)
  const named = (window.business ?? '').trim()
  const values: unknown[] = [after]
  const business = named === '' ? '' : ' AND business = ?'
  if (named !== '') values.push(named)
  values.push(limit)
  const { results } = await env.DB.prepare(
    `SELECT ${RECORD_COLUMNS}, seq FROM log_records WHERE seq > ?` +
      business +
      realOnly(scope) +
      ' ORDER BY seq ASC LIMIT ?',
  )
    .bind(...values)
    .all<RecordRow>()
  const records = (results ?? []).map(toRecord)
  return {
    records,
    cursor: records.length > 0 ? records[records.length - 1].seq : after,
    // STRICTLY BELOW, so a reader whose cursor IS the floor is not told to reset:
    // it has already seen everything up to the last row pruning touched, and
    // everything after it survives.
    reset: after > 0 && after < floor,
  }
}

/** One line of the customer-visible aggregate: how many of this event, when. */
export interface EventCount {
  event: string
  count: number
}

/**
 * How many records of each event, over a window.
 *
 * THE AGGREGATE [[DOC-54]] §3 NAMES AS THE ONE THAT GETS FORGOTTEN, written here
 * on purpose so that it cannot be. It excludes manufactured traffic without the
 * caller asking, because it reaches the exclusion through `Scope` — the same
 * field every other read in this system takes, rather than a predicate threaded
 * beside it that each call site has to remember.
 */
export async function countEvents(
  env: LogEnv,
  scope: Scope,
  window: { since?: number; business?: string | null } = {},
): Promise<EventCount[]> {
  const since = window.since ?? 0
  const named = (window.business ?? '').trim()
  const values: unknown[] = [since]
  const business = named === '' ? '' : ' AND business = ?'
  if (named !== '') values.push(named)
  const { results } = await env.DB.prepare(
    'SELECT event, COUNT(*) AS n FROM log_records WHERE ts >= ?' +
      business +
      realOnly(scope) +
      ' GROUP BY event ORDER BY n DESC, event ASC',
  )
    .bind(...values)
    .all<{ event: string; n: number }>()
  return (results ?? []).map((row) => ({ event: row.event, count: row.n }))
}
