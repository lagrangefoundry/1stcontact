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
  COUNTER_KEYS,
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
  const where = ['tenant_id = ?']
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
