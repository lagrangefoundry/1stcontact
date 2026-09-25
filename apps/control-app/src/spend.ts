/**
 * [[REQ-292]] — the turn meter, against D1.
 *
 * THE WORKER'S HALF OF `RecordTurnSpend`. `spend-core.ts` owns the record, the
 * price table and the arithmetic; this owns the row. The two never learn each
 * other's vocabulary — the host does not know there is a table, and this does
 * not know how a cost was arrived at — which is the same division `chatLedger`
 * and `LedgerDeps` already have, and is what lets the `1c` CLI keep no meter at
 * all without a branch anywhere above it.
 *
 * BOUND TO ONE TENANT AT CONSTRUCTION, and that is the whole of the scoping.
 * `router.ts` resolves the business before the host is built and holds it for
 * the life of the cached host, so the tenant is stamped here rather than
 * travelling on every record — a crossing is then impossible by construction
 * rather than prevented by a check somebody has to keep writing. It is the same
 * reason `chatLedger(tickets, sessionIdFor(site))` binds a session id.
 *
 * ONE STATEMENT, NO READ. A turn's spend is known in full at the moment it is
 * written and is never revised, so there is nothing to fold, nothing to compare
 * and no round trip before the insert. That matters because this runs inside the
 * `finally` the route holds open with `ctx.waitUntil` after the client has
 * already gone: what it costs is what the isolate is kept alive for.
 */

import {
  attributedSpend,
  COUNTER_KEYS,
  type AttributedSpend,
  type RecordTurnSpend,
  type TurnSpendRecord,
} from '../../../tools/generate/src/cli/ai/spend-core'
import {
  spendReport,
  type SpendReport,
  type SpendTurn,
} from '../../../tools/generate/src/cli/ai/spend-report-core'

/** What this module needs from the environment: a database, and nothing else. */
export interface SpendEnv {
  DB: D1Database
}

/**
 * The columns an insert writes, in one order, spelled once.
 *
 * THE FOUR COUNTER COLUMNS COME FROM {@link COUNTER_KEYS} rather than being
 * re-typed here, so the column set and the record's own keys cannot come apart:
 * a counter added upstream (and therefore to `COUNTER_KEYS`, which a UAT holds
 * to the library's `USAGE_KEYS`) becomes a column with no name, which fails
 * loudly at the first insert instead of silently dropping a dimension. That is
 * `log.ts`'s `COLUMN_OF` discipline, applied to a smaller set.
 */
const INSERT_COLUMNS = [
  'turn_id',
  'tenant_id',
  'session_id',
  'started_at',
  'ended_at',
  'role',
  'backend',
  'model',
  'outcome',
  'requests',
  ...COUNTER_KEYS,
  'attributed',
  'cost_micros',
] as const

/** One record as bind values, in {@link INSERT_COLUMNS} order. */
export function rowFor(tenantId: string, record: TurnSpendRecord): unknown[] {
  return [
    record.turn,
    tenantId,
    record.session,
    record.startedAt,
    record.endedAt,
    record.role,
    record.backend,
    record.model,
    record.outcome,
    record.requests,
    ...COUNTER_KEYS.map((key) => record.usage[key]),
    // NULL AND NOT `'[]'` for a turn that delegated nothing. An empty array in
    // the column would read as "asked and found none", which is a different
    // claim from "this deployment has no delegation" — and only one of them is
    // true here.
    record.attributed === null ? null : JSON.stringify(record.attributed),
    record.costMicros,
  ]
}

/** The statement that writes one record. A builder, so a caller could batch. */
export function turnSpendInsert(
  env: SpendEnv,
  tenantId: string,
  record: TurnSpendRecord,
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO turn_spend (${INSERT_COLUMNS.join(', ')}) ` +
      `VALUES (${INSERT_COLUMNS.map(() => '?').join(', ')})`,
  ).bind(...rowFor(tenantId, record))
}

/**
 * The port, bound to one tenant's meter.
 *
 * IT MAY THROW, and the host swallows. That is deliberate rather than sloppy on
 * either side: this is the layer that knows a write failed and is entitled to
 * say so to anything that awaits it, and the host is the layer that knows a
 * meter is not worth a conversation. Swallowing here would leave no way for a
 * test — or a future caller with an execution context of its own — to tell a
 * write that landed from one that did not.
 */
export function d1TurnSpend(env: SpendEnv, tenantId: string): RecordTurnSpend {
  return async (record: TurnSpendRecord): Promise<void> => {
    await turnSpendInsert(env, tenantId, record).run()
  }
}

/**
 * [[REQ-293]] — THE READ THE METER EXISTS FOR: one tenant's period.
 *
 * THE SAME MODULE AS THE WRITE, and not a second one. There is one table and
 * one shape of row; a reader that lived elsewhere would restate the column names
 * a second time and could disagree with the writer about them without anything
 * failing. `spend-report-core.ts` is the half that is genuinely separate —
 * arithmetic that must run wherever the numbers are wanted, including over an
 * audit ledger this file knows nothing about.
 *
 * THE PERIOD RANGES OVER `started_at`, which is what the index leads with after
 * `tenant_id` — so a month's report is one range scan of one tenant's rows and
 * never a table sweep. A turn is in the period it BEGAN in: a conversation that
 * crosses midnight belongs to the day somebody sat down, which is the only
 * reading under which two adjacent periods neither double-count a turn nor drop
 * one.
 */

/**
 * A period, half-open: `from` inclusive, `to` exclusive.
 *
 * HALF-OPEN SO ADJACENT PERIODS TILE. With both ends inclusive, a turn that
 * started exactly at midnight is in both January and February and the year does
 * not add up to the sum of its months.
 *
 * EITHER END MAY BE ABSENT, and absent means unbounded — the whole record in
 * that direction. The meter is retained rather than pruned (REQ-292), so "every
 * turn this tenant has ever taken" is a question it can answer, and one somebody
 * establishing a baseline will ask before they know what period to name.
 */
export interface SpendPeriod {
  /** ISO-8601, inclusive. */
  from?: string | null
  /** ISO-8601, exclusive. */
  to?: string | null
}

/**
 * The column every read of this table is scoped by, spelled once.
 *
 * A CONSTANT RATHER THAN A LITERAL IN THREE PREDICATES ([[REQ-180]] §3). The
 * schema's word for a business is `tenant`, and it stays — renaming the column
 * would buy a migration for nothing, since it appears in R2 keys and in every
 * store handle. What §3 forbids is that word reaching a READER, and a bare
 * quoted predicate fragment is a sentence as far as any reader (or guard) can
 * tell. Spelled once, as an identifier, it is what it actually is: internal
 * vocabulary, which §3 explicitly keeps.
 */
const SCOPE_COLUMN = 'tenant_id'

/** The columns the report reads. The counters are not among them — see below. */
const REPORT_COLUMNS = 'session_id, started_at, ended_at, role, model, cost_micros'

/** One row as the report's own vocabulary. */
interface SpendRow {
  session_id: string
  started_at: string
  ended_at: string
  role: string
  model: string
  cost_micros: number | null
}

/**
 * One tenant's measured turns over a period, oldest first.
 *
 * THE FOUR COUNTERS ARE NOT SELECTED. This report is in hours and dollars; the
 * counters answer a different question — *would a cheaper provider have served
 * this* — which needs a replay harness rather than a sum, and EPIC-20 leaves it
 * out deliberately. Reading them here would move bytes nobody looks at on every
 * report.
 *
 * ORDERED BY SESSION THEN TIME because that is the order the clock is computed
 * in, so the grouping downstream walks a list that is already in its own order.
 * The arithmetic does not DEPEND on it — {@link spendReport} groups and sorts
 * for itself, since an audit replay arrives in another order entirely — but a
 * read that hands over a sorted list costs nothing extra and makes the rows
 * legible to anybody who logs them.
 */
export async function tenantSpendTurns(
  env: SpendEnv,
  tenantId: string,
  period: SpendPeriod = {},
): Promise<SpendTurn[]> {
  const where = [`${SCOPE_COLUMN} = ?`]
  const binds: unknown[] = [tenantId]
  if (period.from) {
    where.push('started_at >= ?')
    binds.push(period.from)
  }
  if (period.to) {
    where.push('started_at < ?')
    binds.push(period.to)
  }
  const result = await env.DB.prepare(
    `SELECT ${REPORT_COLUMNS} FROM turn_spend WHERE ${where.join(' AND ')} ` +
      'ORDER BY session_id, started_at',
  )
    .bind(...binds)
    .all<SpendRow>()
  return (result.results ?? []).map((row) => ({
    session: row.session_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    role: row.role,
    model: row.model,
    costMicros: row.cost_micros === null || row.cost_micros === undefined ? null : row.cost_micros,
  }))
}

/**
 * The report itself: what a tenant's period cost, in hours and in dollars.
 *
 * TWO CALLS AND NOT ONE, so the rows are reachable on their own. The arithmetic
 * is the part that has to be identical between the meter and an audit replay,
 * and it is only identical if it can be handed turn boundaries from either.
 */
export async function tenantSpendReport(
  env: SpendEnv,
  tenantId: string,
  period: SpendPeriod = {},
): Promise<SpendReport> {
  return spendReport(await tenantSpendTurns(env, tenantId, period))
}

/**
 * [[REQ-297]] — THE THREE READS THE OPERATOR CONSOLE'S TENANT-COST CONTROL
 * RENDERS, and every one of them is REQ-293's report over a narrower set of the
 * same rows.
 *
 * NO SECOND OPINION, WHICH IS THE CONDITION AND ALSO THE DESIGN. Not one figure
 * below is computed here: {@link spendReport} is called with a subset of the
 * turns it would have been called with anyway, so a league row IS that tenant's
 * report, and a day's row IS the report for a one-day period. Anything this file
 * added — a total assembled from partial sums, a rate divided a second time —
 * would be a number an operator could see disagree with the one route that is
 * supposed to be authoritative about it.
 *
 * IN THE SAME MODULE AS THE WRITE, for the reason the period read already gives:
 * there is one table and one shape of row, and a reader that lived elsewhere
 * would restate the column names a second time.
 */

/** One tenant's line in the league — who, and what their period came to. */
export interface TenantSpendRow {
  /** The business id, which is what every other route names a tenant by. */
  business: string
  /**
   * Its human label, or `null` where no `tenants` row answers.
   *
   * LEFT-JOINED RATHER THAN REQUIRED. A meter row outlives the business it was
   * measured for — the table is retained rather than pruned — and a spend that
   * vanished from the league because its tenant was deactivated would be money
   * the console stopped reporting for the one reason it must not.
   */
  name: string | null
  /** REQ-293's report for this tenant and this period. Nothing else. */
  report: SpendReport
}

/**
 * Every tenant with a measured turn in the period, and what it cost them.
 *
 * A FAN-OUT OF SCOPED READS, NOT ONE UNSCOPED SWEEP, and `0019_turn_spend.sql`
 * is where that choice is argued: `idx_turn_spend_tenant` leads with `tenant_id`
 * because *"every legitimate read of a meter is scoped to whose meter it is"*.
 * The console's question is still per tenant; what is new is that it asks every
 * tenant and sorts the answers. So the enumeration is one pass for the distinct
 * ids in the window and each tenant's period is then the same range scan the
 * index was shaped for — rather than a single `GROUP BY` over the whole table,
 * which would be the unscoped read that note declines to make cheap.
 *
 * ORDERED BY SETTLED COST, MOST EXPENSIVE FIRST, and the tie-breaks are the
 * interesting part. `costMicros` is `null` for a tenant whose every turn was
 * unpriced — nothing, never zero — and null is not a position on a scale of
 * money, so those tenants sort AFTER every tenant that has one rather than at
 * the bottom as though they were free. Among themselves, and between two tenants
 * that genuinely cost the same, engaged time decides and then the id does, so
 * the order is total and a reload does not reshuffle the table.
 *
 * A TENANT WITH NOTHING IN THE WINDOW IS NOT IN THE LIST. It is not a zero row:
 * the enumeration only sees tenants that have rows, which is the record's own
 * rule arriving for free rather than being re-applied.
 */
export async function tenantSpendLeague(
  env: SpendEnv,
  period: SpendPeriod = {},
): Promise<TenantSpendRow[]> {
  const where: string[] = []
  const binds: unknown[] = []
  if (period.from) {
    where.push('s.started_at >= ?')
    binds.push(period.from)
  }
  if (period.to) {
    where.push('s.started_at < ?')
    binds.push(period.to)
  }
  const found = await env.DB.prepare(
    'SELECT DISTINCT s.tenant_id AS tenant_id, t.name AS name FROM turn_spend s ' +
      'LEFT JOIN tenants t ON t.id = s.tenant_id ' +
      // AN UNBOUNDED PERIOD HAS NO CLAUSE AT ALL, rather than a `1 = 1` standing
      // in for one. Both ends absent is the legitimate "everything ever
      // measured" read ([[REQ-293]]), and it should look like the question it is.
      `${where.length === 0 ? '' : `WHERE ${where.join(' AND ')} `}` +
      'ORDER BY s.tenant_id',
  )
    .bind(...binds)
    .all<{ tenant_id: string; name: string | null }>()

  // ONE AT A TIME RATHER THAN `Promise.all`. A Worker is bounded in how many
  // subrequests it may make, and a console read is a person looking at a table
  // rather than a request on a hot path — so the shape that cannot fall over as
  // the tenant list grows is preferred over the one that is briefly faster
  // while it is small.
  const rows: TenantSpendRow[] = []
  for (const tenant of found.results ?? []) {
    rows.push({
      business: tenant.tenant_id,
      name: tenant.name ?? null,
      report: await tenantSpendReport(env, tenant.tenant_id, period),
    })
  }
  rows.sort(byCostDescending)
  return rows
}

/** Most expensive first; unpriced last; then hours, then the id. See above. */
function byCostDescending(a: TenantSpendRow, b: TenantSpendRow): number {
  const left = a.report.costMicros
  const right = b.report.costMicros
  if (left !== right) {
    if (left === null) return 1
    if (right === null) return -1
    return right - left
  }
  const hours = (b.report.engagedMs ?? 0) - (a.report.engagedMs ?? 0)
  if (hours !== 0) return hours
  return a.business < b.business ? -1 : a.business > b.business ? 1 : 0
}

/** One day of a tenant's window, as the report for that day's own period. */
export interface TenantSpendDay {
  /** The UTC calendar day, `YYYY-MM-DD`. */
  day: string
  /** REQ-293's report over the turns that BEGAN that day. */
  report: SpendReport
}

/**
 * A tenant's period, day by day — what makes a spike attributable to a session
 * rather than to a month.
 *
 * ONE READ, NOT ONE PER DAY. The rows are fetched once for the whole window and
 * bucketed here, and the result is identical to asking
 * `tenantSpendReport(env, tenant, {from: day, to: day + 1})` thirty times: the
 * period ranges over `started_at`, so a day's bucket holds exactly the rows that
 * query would have selected, and {@link spendReport} groups by session for
 * itself. Thirty round trips to a database to get the same answer is a cost with
 * nothing on the other side of it.
 *
 * A TURN IS IN THE DAY IT BEGAN, which is the period rule one scale down. A
 * conversation crossing midnight belongs to the day somebody sat down, and it is
 * the only reading under which adjacent days neither double-count a turn nor drop
 * one — the same argument the half-open period makes, for the same reason.
 *
 * AND THE ENGAGED CLOCK IS THE DAY'S OWN. A turn that is the last of its day
 * gets no forward gap here, exactly as it would get none from a one-day period
 * asked for directly — so a day's figure is the answer the authoritative route
 * gives for that day, which is what condition 7 asks for, rather than a slice of
 * the window's that happens to sum more tidily.
 *
 * DAYS WITH NO MEASURED TURNS ARE ABSENT, not zero rows. The rule the record
 * keeps, one layer out again: an empty Sunday is a day nobody worked, and a
 * `$0.00` beside it would claim a day of free consulting.
 */
export async function tenantSpendDays(
  env: SpendEnv,
  tenantId: string,
  period: SpendPeriod = {},
): Promise<TenantSpendDay[]> {
  const turns = await tenantSpendTurns(env, tenantId, period)
  const buckets = new Map<string, SpendTurn[]>()
  for (const turn of turns) {
    const day = dayOf(turn.startedAt)
    const found = buckets.get(day)
    if (found) found.push(turn)
    else buckets.set(day, [turn])
  }
  return [...buckets.keys()]
    .sort()
    .map((day) => ({ day, report: spendReport(buckets.get(day) as SpendTurn[]) }))
}

/**
 * A stamp's UTC calendar day.
 *
 * NORMALISED THROUGH `Date` RATHER THAN SLICED OFF THE STRING, because the
 * column is ISO-8601 text and an offset form (`…T23:30:00+02:00`) is a legal one
 * whose first ten characters name the wrong day. A stamp nothing can parse keeps
 * its own prefix — it is still one row's worth of money and dropping it would be
 * the one thing worse than filing it under an odd heading.
 */
function dayOf(iso: string): string {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : iso.slice(0, 10)
}

/** What one tenant handed off to its workers, priced against the workers' rates. */
export interface DelegatedSpend {
  /** How many delegations are in this window. Zero never reaches a caller. */
  entries: number
  /** What they cost in micros, or `null` where none of them was priced. */
  costMicros: number | null
  /**
   * How many entries had no price — a backend `backends.json` no longer binds to
   * a model, or a `(backend, model)` `prices.json` does not name.
   *
   * REPORTED RATHER THAN ABSORBED, exactly as a report's own `unpricedTurns`
   * is: a figure assembled from the priced remainder is a FLOOR, and this is what
   * says so.
   */
  unpricedEntries: number
  /**
   * The same, split by the model the worker ran on — which is the half of this
   * that answers *did construction actually move to the cheap model*.
   */
  byModel: Record<string, { backend: string; entries: number; costMicros: number | null }>
}

/**
 * What a tenant's turns caused ELSEWHERE over the period, or `null`.
 *
 * `null` AND NOT AN EMPTY REPORT for a tenant that delegated nothing, and the
 * distinction is the ticket's condition 5. This deployment ships delegation off
 * ([[REQ-295]]), so *no delegated spend* is the ordinary state and a `$0.00`
 * beside every tenant would read as a measurement — "we handed off work and it
 * was free" — rather than as the absence it is. Nothing, never zero, at the one
 * place a reader is most likely to mistake the two.
 *
 * IT IS THE OTHER HALF OF A PAIR AND IS NEVER ADDED TO THE FIRST. A caller's true
 * total is its own `usage` PLUS this, and a console that showed one number would
 * under-report every delegating turn in the flattering direction — a delegation
 * that moved no work would look like one that worked. So this comes back beside
 * the report rather than folded into it, and the surface renders two labelled
 * figures.
 *
 * ONLY THE ROWS THAT HAVE ONE ARE READ. `attributed` is NULL for a turn that
 * delegated nothing, which is almost all of them, so the predicate is what keeps
 * this from being a scan of the window's whole text.
 */
export async function tenantDelegatedSpend(
  env: SpendEnv,
  tenantId: string,
  period: SpendPeriod = {},
): Promise<DelegatedSpend | null> {
  const where = [`${SCOPE_COLUMN} = ?`, 'attributed IS NOT NULL']
  const binds: unknown[] = [tenantId]
  if (period.from) {
    where.push('started_at >= ?')
    binds.push(period.from)
  }
  if (period.to) {
    where.push('started_at < ?')
    binds.push(period.to)
  }
  const result = await env.DB.prepare(
    `SELECT attributed FROM turn_spend WHERE ${where.join(' AND ')} ORDER BY started_at`,
  )
    .bind(...binds)
    .all<{ attributed: string | null }>()

  const entries: AttributedSpend[] = []
  for (const row of result.results ?? []) {
    if (row.attributed === null || row.attributed === undefined) continue
    // A COLUMN THAT DOES NOT PARSE IS A ROW WITH NO READABLE DELEGATION, not a
    // failed report. The value is the framework's structure written verbatim and
    // this module does not own its schema; taking the whole console down over one
    // of them would be the wrong trade against a meter that is billed from.
    let parsed: unknown = null
    try {
      parsed = JSON.parse(row.attributed)
    } catch {
      continue
    }
    entries.push(...attributedSpend(parsed))
  }
  if (entries.length === 0) return null

  const byModel: DelegatedSpend['byModel'] = {}
  let priced = 0
  let micros = 0
  let unpriced = 0
  for (const entry of entries) {
    // THE MODEL IS THE KEY AND THE BACKEND RIDES ALONG. A reader asking whether
    // the cheap model was used is asking about the model; the backend is how the
    // price was keyed and is what makes the figure checkable against
    // `prices.json`. An entry whose backend binds no model is grouped under a
    // named blank rather than under `''`, so it is legible as the gap it is.
    const key = entry.model === '' ? `${entry.backend || 'unknown'} (no model configured)` : entry.model
    const slice = byModel[key] ?? { backend: entry.backend, entries: 0, costMicros: null }
    slice.entries += 1
    if (entry.costMicros === null) unpriced += 1
    else {
      priced += 1
      micros += entry.costMicros
      slice.costMicros = (slice.costMicros ?? 0) + entry.costMicros
    }
    byModel[key] = slice
  }

  return {
    entries: entries.length,
    costMicros: priced === 0 ? null : micros,
    unpricedEntries: unpriced,
    byModel,
  }
}

/**
 * What each of a handful of named turns cost in total, keyed by turn id
 * ([[REQ-320]]).
 *
 * THE QUESTION THIS ANSWERS, and why it is not {@link tenantSpendTurns}. That one
 * reports a PERIOD for an invoice, oldest first, and says nothing about any one
 * turn. The console's turn table is a list of specific turns the operator is
 * looking at right now, arriving from `turn_log` — a different table, which knows
 * when a turn began and how it ended and nothing whatsoever about money. So this
 * is the join: the ids come from the ledger, the figures come from the meter.
 *
 * THE FIGURE IS THE TURN'S TOTAL — ITS OWN SPEND PLUS WHAT IT HANDED OFF. A turn
 * that delegated a sweep of site writes to a worker cost what the worker cost,
 * and a column showing only the caller's half would make exactly the expensive
 * turns look cheap. {@link attributedSpend} prices each delegated entry at its
 * OWN backend's rates, which is the whole reason the stored `attributed` list is
 * kept whole rather than folded into this row's four counters.
 *
 * AND IT IS A TOTAL OR IT IS NOTHING. `null` means *not measured* and is returned
 * for a turn with no row, for a row whose own `cost_micros` is NULL because
 * `prices.json` named no rate for its pair, and for a row with a delegated entry
 * this reader cannot price. A partial sum presented as a total would understate
 * in the flattering direction, which is the one direction a meter must not err
 * in; the pane beside this one can label an unpriced remainder with a sentence,
 * and a single cell cannot.
 *
 * SCOPED BY TENANT AS WELL AS BY ID, though `turn_id` is the primary key and
 * would be enough to find the row. The scope is what makes a mistake upstream
 * unable to price one business's turn against another's meter, which is
 * {@link SCOPE_COLUMN}'s reason applied to a read that did not strictly need it.
 *
 * NO ROWS ASKED FOR IS NO STATEMENT RUN. A business with no turns must not send
 * `IN ()` to the database.
 */
export async function tenantTurnCosts(
  env: SpendEnv,
  tenantId: string,
  turnIds: readonly string[],
): Promise<Record<string, number | null>> {
  const totals: Record<string, number | null> = {}
  if (turnIds.length === 0) return totals
  const result = await env.DB.prepare(
    `SELECT turn_id, cost_micros, attributed FROM turn_spend WHERE ${SCOPE_COLUMN} = ?` +
      ` AND turn_id IN (${turnIds.map(() => '?').join(', ')})`,
  )
    .bind(tenantId, ...turnIds)
    .all<{ turn_id: string; cost_micros: number | null; attributed: string | null }>()
  for (const row of result.results ?? []) {
    totals[row.turn_id] = totalOf(row.cost_micros, row.attributed)
  }
  return totals
}

/**
 * One row's own cost plus its delegated entries', or `null` where any part of
 * that sum is unknown.
 *
 * A COLUMN THAT DOES NOT PARSE IS AN UNMEASURED TURN and not a failed read, on
 * {@link tenantDelegatedSpend}'s reasoning: the value is the framework's
 * structure written verbatim and this module does not own its schema. Where that
 * one drops the entry and reports how many it dropped, this one has a single cell
 * to answer in and says *not measured* — because the alternative is a figure that
 * silently omits the delegation the operator is trying to see.
 *
 * AN ENTRY {@link attributedSpend} DROPPED COUNTS AGAINST THE TOTAL, which is why
 * the lengths are compared rather than the returned list simply summed. That
 * function leaves out an entry with no usage at all, because an entry with no
 * usage is not a delegation that cost nothing — it is one this reader cannot
 * account for, and the same judgement applied to the sum makes it absent rather
 * than short.
 */
function totalOf(own: number | null, attributed: string | null): number | null {
  if (own === null || own === undefined) return null
  if (attributed === null || attributed === undefined) return own
  let parsed: unknown = null
  try {
    parsed = JSON.parse(attributed)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null
  const entries = attributedSpend(parsed)
  if (entries.length !== parsed.length) return null
  let micros = own
  for (const entry of entries) {
    if (entry.costMicros === null) return null
    micros += entry.costMicros
  }
  return micros
}
