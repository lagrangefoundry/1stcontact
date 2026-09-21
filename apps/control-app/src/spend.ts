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
