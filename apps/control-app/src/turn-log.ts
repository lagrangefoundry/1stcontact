/**
 * [[REQ-306]] — the turn ledger: that a turn BEGAN, recorded where the turn
 * cannot reach it.
 *
 * THE FAILURE THIS MODULE EXISTS FOR. `streamTurn` hands back its `Response`
 * before `start()` runs, so the status line has gone out before any work begins.
 * An isolate killed mid-stream — `exceededMemory` is what happened, but a
 * CPU-time overrun, an eviction, or a limit nobody has met yet all produce the
 * identical shape — leaves the client a 200 with an empty body and no terminal
 * frame, and leaves the operator nothing whatsoever. The `catch` that renders a
 * readable error never runs. The `finally` that flushes the audit dies with it.
 * Every record this system keeps of a turn — the audit, the meter's row, the
 * pending record's close — is written by code that runs AFTER the model call, so
 * an uncatchable death is invisible by construction.
 *
 * SO THE ROW IS OPENED BEFORE THE STREAM AND CLOSED AFTER IT, and the whole
 * mechanism is that asymmetry. {@link openTurn} is awaited by the ROUTE, before
 * the `Response` exists; {@link closeTurn} runs in the same `finally` that
 * flushes the audit. A row that is still open is the record of a turn whose
 * isolate did not survive to write its own ending — which is the one fact
 * nothing inside that isolate could ever have recorded.
 *
 * IT MUST NEVER COST A TURN. Every function here swallows its own failure and
 * says so in its return value, on `previousTurn`'s reasoning in `host-core.ts`:
 * this is a safety net, and a net that fails the thing it was protecting has
 * made matters worse than having none. A ledger that cannot be written costs an
 * operator a record; refusing the turn would cost the customer their answer.
 */

import { newId } from '../../../tools/generate/src/store/ids'

/** What this module needs from the environment: a database, and nothing else. */
export interface TurnLogEnv {
  DB: D1Database
}

/**
 * The three words a closed turn can end with — `TurnOutcome` in `host-core.ts`.
 *
 * NOT A SECOND VOCABULARY. `turn_spend.outcome` and `pending_turn.status`
 * already carry exactly these, so the three records of one turn read side by
 * side with no translation. Restating the union rather than importing it keeps
 * this module free of the host's type graph; a UAT holds the two together.
 */
export type TurnLogOutcome = 'complete' | 'aborted' | 'error'

/**
 * How long a turn may be open before an unfinished row is read as a death.
 *
 * A CEILING RATHER THAN A PREDICTION, in `DNS_SUPPRESSION_MS`'s sense. Turns run
 * a tool loop and can be genuinely long, so this is not "how long a turn takes";
 * it is the point past which *still running* stops being a credible explanation
 * for a row nobody closed. Too low and an operator is shown live turns as
 * corpses; too high and a site that is failing every turn takes an extra
 * quarter-hour to become visible. Fifteen minutes is comfortably past the
 * longest turn this product has taken and comfortably inside the window in which
 * somebody is still wondering why the builder stopped answering.
 *
 * ONE READER OWNS IT, WHICH IS WHY IT IS HERE AND NOT IN A PREDICATE. "Open" is
 * a fact about a row; "lost" is a judgement about an open row, and a judgement
 * spelled at each call site is a judgement that will differ between two of them.
 */
export const TURN_LOST_AFTER_MS = 15 * 60 * 1000

/**
 * A turn's entry in the ledger, or `null` where there is none to close.
 *
 * NULL IS AN ORDINARY STATE AND NOT A FAILURE. A deployment with no database,
 * and an open that could not be written, both produce it — and both must leave
 * the turn behaving exactly as it did before this module existed. The close is
 * then a no-op, which is what stops every caller having to ask whether it has
 * a ledger.
 */
export interface OpenTurn {
  readonly id: string
  readonly close: (outcome: TurnLogOutcome, detail?: string | null) => Promise<void>
}

/** One row, as the operator surface reads it. */
export interface TurnLogRow {
  turn: string
  session: string
  startedAt: string
  endedAt: string | null
  outcome: TurnLogOutcome | null
  detail: string | null
}

/**
 * Open a turn's row, and hand back the means to close it.
 *
 * THE CALLER AWAITS THIS BEFORE IT RETURNS A `Response`, and that ordering is
 * the entire guarantee. Awaited inside the stream it would be one more thing the
 * dying isolate failed to do.
 *
 * ONE STATEMENT, NO READ. The row is a fact about a moment that has already
 * happened, so there is nothing to fold and nothing to compare — which matters
 * because this runs on the critical path of a turn the customer is waiting for.
 *
 * A FAILED OPEN IS `null` AND NOT A THROW. See the header: the turn proceeds
 * unrecorded rather than not at all.
 */
export async function openTurn(
  env: TurnLogEnv | null,
  tenantId: string,
  sessionId: string,
  now: () => string = () => new Date().toISOString(),
): Promise<OpenTurn | null> {
  if (!env?.DB) return null
  const id = newId('turn')
  try {
    await env.DB.prepare(
      'INSERT INTO turn_log (turn_id, tenant_id, session_id, started_at) VALUES (?, ?, ?, ?)',
    )
      .bind(id, tenantId, sessionId, now())
      .run()
  } catch {
    // See the header: an operator loses a record, the customer keeps their turn.
    return null
  }
  return {
    id,
    close: async (outcome, detail) => {
      try {
        await env.DB.prepare(
          'UPDATE turn_log SET ended_at = ?, outcome = ?, detail = ? WHERE turn_id = ?',
        )
          // NULL AND NOT AN EMPTY STRING for a turn with nothing to explain: an
          // empty string would claim it had said something.
          .bind(now(), outcome, detail ?? null, id)
          .run()
      } catch {
        // A close that fails leaves the row open, which reads as a death that
        // did not happen. That is the safe direction: a ledger that
        // over-reports failure is investigated, and one that under-reports it
        // is trusted.
      }
    },
  }
}

/**
 * Whether an open row has been open long enough to be a death rather than a turn.
 *
 * EXPORTED, because the client-facing read and the operator surface must agree
 * about it, and a second spelling of `now - started > ceiling` is a second
 * opinion waiting to differ.
 *
 * AN UNREADABLE STAMP IS NOT LOST. A row whose `started_at` will not parse is
 * one this judgement cannot be made about, and guessing would mark a live turn.
 */
export function turnLost(row: TurnLogRow, now = Date.now()): boolean {
  if (row.endedAt !== null) return false
  const started = Date.parse(row.startedAt)
  if (!Number.isFinite(started)) return false
  return now - started > TURN_LOST_AFTER_MS
}

/**
 * How a turn ended, in one word, for a reader that does not want the row.
 *
 * `lost` IS THE FOURTH WORD AND IS DERIVED, NEVER STORED. It names the absence
 * of the other three — nothing wrote it, because by construction nothing was
 * left to write anything — so a column holding it would have to be filled in by
 * a sweeper, which is a second mechanism able to fail in the same way as the
 * first. Derived, it is true the instant it becomes true and needs nobody.
 */
export function turnState(row: TurnLogRow, now = Date.now()): TurnLogOutcome | 'lost' | 'open' {
  if (row.outcome !== null) return row.outcome
  return turnLost(row, now) ? 'lost' : 'open'
}

/** The columns every read of this table selects, spelled once. */
const ROW_COLUMNS = 'turn_id, session_id, started_at, ended_at, outcome, detail'

interface RawRow {
  turn_id: string
  session_id: string
  started_at: string
  ended_at: string | null
  outcome: string | null
  detail: string | null
}

function rowOf(raw: RawRow): TurnLogRow {
  const outcome = raw.outcome
  return {
    turn: raw.turn_id,
    session: raw.session_id,
    startedAt: raw.started_at,
    endedAt: raw.ended_at,
    // AN UNRECOGNISED WORD READS AS UNCLOSED, on `storedPending`'s judgement: a
    // value this reader cannot interpret must not be reported as if it could.
    outcome:
      outcome === 'complete' || outcome === 'aborted' || outcome === 'error' ? outcome : null,
    detail: raw.detail,
  }
}

/**
 * One tenant's most recent turns, newest first.
 *
 * NEWEST FIRST, unlike the meter's oldest-first period read, because the
 * question is *is this failing NOW* rather than *what did a month amount to* —
 * and an operator who has to scroll to the bottom to find out has been asked to
 * do the work this surface exists to do for them.
 *
 * BOUNDED BY A LIMIT AND NOT BY A PERIOD. "Failing repeatedly" is a statement
 * about consecutive turns, not about a window: a site that takes four turns a
 * week and lost all four is exactly as broken as one that lost forty in an hour,
 * and a period long enough to catch the first is long enough to bury the second.
 */
export async function tenantTurns(
  env: TurnLogEnv,
  tenantId: string,
  limit = 50,
): Promise<TurnLogRow[]> {
  const rows = await env.DB.prepare(
    `SELECT ${ROW_COLUMNS} FROM turn_log WHERE tenant_id = ? ORDER BY started_at DESC LIMIT ?`,
  )
    .bind(tenantId, limit)
    .all<RawRow>()
  return (rows.results ?? []).map(rowOf)
}

/**
 * The most recent turn of one conversation, or `null`.
 *
 * WHAT THE CLIENT'S HALF READS. A panel whose stream stopped without a terminal
 * frame asks the origin what became of the conversation, and this is the answer:
 * the last turn's own row, from a database rather than from the RAM junction the
 * dead isolate took with it.
 */
export async function latestSessionTurn(
  env: TurnLogEnv,
  tenantId: string,
  sessionId: string,
): Promise<TurnLogRow | null> {
  const raw = await env.DB.prepare(
    `SELECT ${ROW_COLUMNS} FROM turn_log WHERE tenant_id = ? AND session_id = ?` +
      ' ORDER BY started_at DESC LIMIT 1',
  )
    .bind(tenantId, sessionId)
    .first<RawRow>()
  return raw === null ? null : rowOf(raw)
}

/**
 * The health of one tenant's recent turns — the pattern, not the incidents.
 *
 * THE QUESTION THIS ANSWERS is [[REQ-306]]'s fifth requirement verbatim:
 * *repeated failures of the same kind are visible as a pattern rather than as
 * isolated customer complaints*. A tenant failed every turn for a period before
 * anyone established why, and nothing on any operator surface would have said
 * so. `consecutiveLost` is the figure that would have: it is the count from the
 * most recent turn backwards, so a site that is broken RIGHT NOW reads
 * differently from one that had a bad hour last Tuesday, even where the totals
 * are identical.
 */
export interface TurnHealth {
  /**
   * Newest first, each carrying its derived state.
   *
   * DECORATED HERE AND NOT AT THE SURFACE. `lost` is a judgement about a row,
   * and a surface that re-derived it from `endedAt` would be free to disagree
   * with the tally printed beside it.
   */
  turns: (TurnLogRow & { state: TurnLogOutcome | 'lost' | 'open' })[]
  counts: Record<TurnLogOutcome | 'lost' | 'open', number>
  /** Turns lost without interruption, counting back from the most recent. */
  consecutiveLost: number
}

export function turnHealth(rows: TurnLogRow[], now = Date.now()): TurnHealth {
  const counts = { complete: 0, aborted: 0, error: 0, lost: 0, open: 0 }
  const turns = rows.map((row) => ({ ...row, state: turnState(row, now) }))
  let consecutiveLost = 0
  let unbroken = true
  for (const { state } of turns) {
    counts[state] += 1
    // AN OPEN TURN NEITHER BREAKS THE RUN NOR EXTENDS IT. The newest row is
    // often a turn in flight, and letting it break the count would hide a site
    // that is failing from the one operator looking at it while it fails.
    if (state === 'open') continue
    if (state === 'lost' && unbroken) consecutiveLost += 1
    else unbroken = false
  }
  return { turns, counts, consecutiveLost }
}

/**
 * What the panel is told about a turn it watched stop — or `null`.
 *
 * THE DISTINCTION [[REQ-306]]'s FIRST REQUIREMENT ASKS FOR, and it is made
 * WITHOUT A CLOCK. `live` is the junction's answer to *is a turn running in this
 * conversation*; an unclosed row is the ledger's answer to *did a turn fail to
 * write its own ending*. Both true is an ordinary turn in flight. The ledger
 * saying yes while the junction says no is a CONTRADICTION that only one thing
 * produces: the isolate that opened the row is gone, taking the RAM junction
 * with it. That is exact the instant it happens, where a timeout would leave the
 * customer staring at a stopped reply for as long as the ceiling lasts.
 *
 * SO THE CEILING IS NOT USED HERE, and {@link turnLost} is not called. The
 * ceiling exists for the operator surface, which reads across many sessions from
 * an isolate that holds none of their junctions and therefore has no liveness to
 * contradict. Two readers, two pieces of evidence, one conclusion.
 *
 * AN `error` TURN IS ALSO REPORTED, even though it closed cleanly and told the
 * customer so in the stream. A panel that reloaded after it never saw the frame.
 *
 * NEVER THROWS. A conversation must open whether or not its ledger can be read.
 */
export async function sessionTurnFailure(
  env: TurnLogEnv | null,
  tenantId: string,
  sessionId: string,
  live: boolean,
): Promise<{ turn: string; at: string; state: 'lost' | 'error'; detail: string | null } | null> {
  if (!env?.DB || live) return null
  let row: TurnLogRow | null = null
  try {
    row = await latestSessionTurn(env, tenantId, sessionId)
  } catch {
    // A conversation that opens with no notice is this ticket's old behaviour,
    // which is exactly what a failed safety net should cost.
    return null
  }
  if (row === null) return null
  if (row.endedAt === null) {
    return { turn: row.turn, at: row.startedAt, state: 'lost', detail: null }
  }
  if (row.outcome !== 'error') return null
  return { turn: row.turn, at: row.startedAt, state: 'error', detail: row.detail }
}
