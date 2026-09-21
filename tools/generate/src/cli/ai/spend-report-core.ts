/**
 * [[REQ-293]] — a tenant's spend, in the two units a person can act on.
 *
 * WHAT THIS IS FOR. `turn_spend` (REQ-292) holds one row per measured turn, in
 * tokens and in micros. Neither is sellable: a client will not learn what a
 * cached prefix is, and "1,481,920 cache-read tokens" is not a thing anybody can
 * agree to pay for. What they do understand is **four hours of AI consulting a
 * month**, which is the unit EPIC-20 says this product will be priced and capped
 * in. This module turns the rows into that — **engaged hours, settled cost, and
 * cost per engaged hour** — and splits all three by role and by model.
 *
 * THE SPLIT IS THE LOAD-BEARING PART, NOT A NICETY. It is what makes a
 * delegation experiment readable: whether moving construction to a cheaper model
 * actually moved the money or merely moved it to the other side of the same
 * bill. The same split by backend-and-model is what makes a second provider
 * comparable the day one arrives.
 *
 * IT READS NOTHING AND IMPORTS NOTHING. Every function here takes its facts as
 * arguments — {@link engagedMs} takes `(startedAt, ended_at)` pairs, not a
 * table — which is the one design decision the ticket states outright. Turn
 * boundaries survive in two places: the meter, for every session since it
 * landed, and the R2 audit ledger, for the 1,100 tool calls that predate it. A
 * function that read `turn_spend` itself could answer for one of them, and the
 * retrospective would have to be written a second time and would drift from
 * this one the first time the cap moved.
 *
 * NOT A SECOND SPEND VOCABULARY. `spend-core.ts` owns what a turn IS — the
 * counters, the price key, the settled cost — and this owns what a PERIOD of
 * them adds up to. It deliberately does not import that file: a report is
 * assembled from stored rows, which are already priced, and re-deriving a cost
 * here would be a second answer to a question the meter settled at write time.
 */

/**
 * How long the clock keeps running after a turn ends, before silence is treated
 * as the client having gone away.
 *
 * FIVE MINUTES, CHOSEN FROM MEASUREMENT RATHER THAN TASTE. On the heaviest
 * measured day of the Lagrange Foundry build — 38 turns over 6.68 hours elapsed
 * — the MEDIAN inter-turn gap was 4.2 minutes, so a two-minute cap stops the
 * clock during ordinary thinking and undercounts real work, while ten minutes
 * bills multitasking as consulting. The same day reads as 1.58 h of machine time
 * alone, 2.67 h at two minutes, **3.69 h at five**, 4.64 h at ten, and 6.68 h of
 * raw wall clock.
 *
 * AND IT IS MEASURABLE SERVER-SIDE WITH NO ASSUMPTION ABOUT THE CLIENT, which
 * is the property that makes it billable: a browser tab reports nothing
 * trustworthy about whether somebody is looking at it, and a meter that ran on
 * typing speed could be gamed by typing slowly.
 */
export const ENGAGED_GAP_CAP_MS = 5 * 60 * 1000

/** Milliseconds in an hour — the only unit conversion in this file. */
const HOUR_MS = 60 * 60 * 1000

/**
 * A turn, as far as the clock is concerned: when it started and when it ended.
 *
 * THE WHOLE ARGUMENT OF {@link engagedMs}, and deliberately no more than that.
 * A `turn_spend` row satisfies it, and so does a pair of timestamps recovered
 * from the audit ledger's tool calls — which is what lets one implementation
 * answer for a session that predates the meter and for one taken this morning.
 */
export interface TurnBoundary {
  /** When the client's message arrived, ISO-8601. */
  startedAt: string
  /** When the last thing the turn did finished, ISO-8601. */
  endedAt: string
}

/** A turn as the REPORT reads it: the clock, plus who and what and what it cost. */
export interface SpendTurn extends TurnBoundary {
  /**
   * The conversation this turn belongs to.
   *
   * THE GAP IS MEASURED WITHIN A SESSION AND NEVER ACROSS ONE. Two sessions are
   * two engagements — possibly two people, possibly the same person on two
   * days — and a clock that ran from the end of one into the start of the next
   * would bill the interval between two conversations as though somebody had
   * been sitting through it.
   */
  session: string
  /** Which role took it (`consultant`, `settings`) — one half of the split. */
  role: string
  /** Which model ran it — the other half. */
  model: string
  /**
   * What it cost in micros, or `null` where the price table did not name its
   * `(backend, model)`.
   *
   * NULL TRAVELS ALL THE WAY UP AS A COUNT rather than being silently read as
   * zero. See {@link SpendTotals.unpricedTurns}.
   */
  costMicros: number | null
}

/**
 * The three numbers, for a period or for one slice of it.
 *
 * EVERY FIGURE IS NULLABLE AND NULL IS NOT ZERO — the record's own "nothing,
 * never zero" rule (REQ-292), applied one layer out. A period with no measured
 * turns in it has no hours and no cost; reporting `0 h` and `$0.00` would claim
 * a month of free consulting rather than a month nobody worked.
 */
export interface SpendTotals {
  /** How many measured turns are in this slice. Zero is an honest count. */
  turns: number
  /**
   * Engaged time in milliseconds — the exact figure, summed per turn.
   *
   * KEPT BESIDE THE HOURS RATHER THAN ONLY THE HOURS, because the hours are
   * rounded for a reader and this is not: a caller adding slices together, or
   * comparing a month against a cap, must not accumulate two decimal places of
   * rounding error per row.
   */
  engagedMs: number | null
  /** The same figure in the unit the product is sold in, to two decimals. */
  engagedHours: number | null
  /**
   * Settled cost in micros, summed over the turns that were priced — or `null`
   * where none of them were.
   */
  costMicros: number | null
  /**
   * How many turns in this slice had no price.
   *
   * REPORTED RATHER THAN ABSORBED. A `(backend, model)` the price table does
   * not name still leaves a measured row with a NULL cost (REQ-292), and a
   * report that quietly summed the rest would present a FLOOR as a total. The
   * count is what tells a reader that the figure beside it is short, and by how
   * many turns — which is also the alarm that says `prices.json` has fallen
   * behind `backends.json`.
   */
  unpricedTurns: number
  /**
   * Micros per engaged hour — the number EPIC-20 says is not stable.
   *
   * `null` WHERE THERE IS NOTHING TO DIVIDE — no priced turns, or no engaged
   * time at all. A rate computed from an unpriced period would be zero, and a
   * rate computed from zero hours would be infinite; neither is a reading.
   */
  costPerEngagedHourMicros: number | null
}

/**
 * One tenant's period: the totals, and the same totals split two ways.
 *
 * TWO SPLITS AND NOT A CROSS PRODUCT. Role answers *what kind of work was this*
 * and model answers *what did we run it on*, and the two questions are asked
 * separately because a `role x model` grid over a month of turns is a table
 * nobody reads and, at this size, one mostly full of empty cells. Each split's
 * slices sum to the total, which is the property condition 5 turns on.
 */
export interface SpendReport extends SpendTotals {
  /** By the role that took the turn. */
  byRole: Record<string, SpendTotals>
  /** By the model that ran it. */
  byModel: Record<string, SpendTotals>
}

/** A timestamp as milliseconds, or `null` where it does not parse. */
function at(iso: string): number | null {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Each turn's engaged time in milliseconds, aligned to the array it was given.
 *
 * THE DEFINITION, AND WHY IT IS THIS ONE. A turn's engaged time is its own
 * duration — the client's message to the last thing the turn did — PLUS the gap
 * until the next turn, capped at {@link ENGAGED_GAP_CAP_MS}. The clock pauses
 * after five minutes of silence and resumes when they come back, which is how
 * every time tracker a consultant has ever billed from works.
 *
 * THE GAP IS CREDITED FORWARD — to the turn BEFORE it, not the one after. That
 * gap is the client reading what this turn produced and deciding what to ask
 * next, so it belongs to the turn whose answer they were reading, and the split
 * by model is only truthful if it is attributed that way. It also means the
 * boundary case falls on the LAST turn of a session rather than the first: a
 * turn with nothing after it contributes only its own duration, because there
 * is no interval to cap and the alternative — assuming five more minutes — bills
 * for time nobody has yet been observed to spend. Either direction gives the
 * same TOTAL; only the attribution differs, and only one of them is honest.
 *
 * NOTHING BEFORE A SESSION'S FIRST TURN IS EVER COUNTED. The silence before
 * somebody starts talking is not engagement, so the clock begins at the first
 * message and not at the moment a tab was opened.
 *
 * COMPUTED AT READ, FROM THE TWO STAMPS THE ROW ALREADY HOLDS, and this is the
 * reason it is not a column. The next turn does not exist when the current one
 * ends, so a stored figure would need a retroactive update on every turn — a
 * write that can fail, against a meter that is billed from. Derived, it cannot
 * drift, it costs nothing, and it re-reads correctly the day the cap changes.
 *
 * ORDER IS NOT ASSUMED. The caller may hand these over in any order — a D1 read
 * orders by session then time, an audit replay by object key — so they are
 * sorted here and the answer comes back aligned to the INPUT, which is what lets
 * a caller keep its own row beside its own figure.
 *
 * ONE SESSION'S TURNS. Feeding two sessions to one call would measure the gap
 * between them; {@link spendReport} groups first for exactly that reason.
 */
export function engagedMs(turns: readonly TurnBoundary[]): number[] {
  const order = turns.map((_, index) => index)
  order.sort((a, b) => (at(turns[a].startedAt) ?? 0) - (at(turns[b].startedAt) ?? 0))
  const out = new Array<number>(turns.length).fill(0)
  for (let i = 0; i < order.length; i += 1) {
    const turn = turns[order[i]]
    const started = at(turn.startedAt)
    const ended = at(turn.endedAt)
    if (started === null || ended === null) continue
    // NEGATIVE IS CLAMPED RATHER THAN TRUSTED. A row whose `ended_at` precedes
    // its `started_at`, or two turns of one session that overlap, are both
    // states the database does not forbid — and a negative contribution would
    // SUBTRACT from a bill.
    const own = Math.max(0, ended - started)
    const next = i + 1 < order.length ? at(turns[order[i + 1]].startedAt) : null
    const gap = next === null ? 0 : Math.min(ENGAGED_GAP_CAP_MS, Math.max(0, next - ended))
    out[order[i]] = own + gap
  }
  return out
}

/** What a slice accumulates before it is finished into {@link SpendTotals}. */
interface Accumulator {
  turns: number
  ms: number
  micros: number
  priced: number
  unpriced: number
}

const empty = (): Accumulator => ({ turns: 0, ms: 0, micros: 0, priced: 0, unpriced: 0 })

function add(into: Accumulator, ms: number, costMicros: number | null): void {
  into.turns += 1
  into.ms += ms
  if (costMicros === null) into.unpriced += 1
  else {
    into.priced += 1
    into.micros += costMicros
  }
}

/** Two decimals, which is the precision the hours are quoted and sold in. */
function hours(ms: number): number {
  return Math.round((ms / HOUR_MS) * 100) / 100
}

/**
 * An accumulator as the report reads it.
 *
 * THE EMPTY CASE IS DECIDED HERE, ONCE, so every figure in the document obeys
 * the same rule rather than each caller remembering it: no turns means no hours
 * and no cost — `null`, and never `0`.
 */
function totals(acc: Accumulator): SpendTotals {
  if (acc.turns === 0) {
    return {
      turns: 0,
      engagedMs: null,
      engagedHours: null,
      costMicros: null,
      unpricedTurns: 0,
      costPerEngagedHourMicros: null,
    }
  }
  const costMicros = acc.priced === 0 ? null : acc.micros
  return {
    turns: acc.turns,
    engagedMs: acc.ms,
    engagedHours: hours(acc.ms),
    costMicros,
    unpricedTurns: acc.unpriced,
    costPerEngagedHourMicros:
      costMicros === null || acc.ms === 0 ? null : Math.round((costMicros * HOUR_MS) / acc.ms),
  }
}

function sliceOf(map: Map<string, Accumulator>, key: string): Accumulator {
  const found = map.get(key)
  if (found) return found
  const made = empty()
  map.set(key, made)
  return made
}

function finish(map: Map<string, Accumulator>): Record<string, SpendTotals> {
  const out: Record<string, SpendTotals> = {}
  for (const [key, acc] of map) out[key] = totals(acc)
  return out
}

/**
 * A period's turns as the report a tenant is shown.
 *
 * EACH TURN'S ENGAGED TIME IS COMPUTED ONCE AND SPENT THREE TIMES — into the
 * total, into its role and into its model. That is what makes condition 5 a
 * property of the arithmetic rather than a thing to test for: two turns of one
 * session on different models land in different model slices, and the slices
 * still sum to the total, because there is exactly one interval per turn and
 * every slice is a partition of the same set.
 *
 * GROUPED BY SESSION BEFORE THE CLOCK RUNS. The gap is an interval WITHIN a
 * conversation; two sessions interleaved in time are two engagements, and
 * measuring across them would bill the time between two clients as one.
 */
export function spendReport(turns: readonly SpendTurn[]): SpendReport {
  const bySession = new Map<string, number[]>()
  for (let i = 0; i < turns.length; i += 1) {
    const found = bySession.get(turns[i].session)
    if (found) found.push(i)
    else bySession.set(turns[i].session, [i])
  }

  const whole = empty()
  const byRole = new Map<string, Accumulator>()
  const byModel = new Map<string, Accumulator>()

  for (const indices of bySession.values()) {
    const engaged = engagedMs(indices.map((i) => turns[i]))
    for (let k = 0; k < indices.length; k += 1) {
      const turn = turns[indices[k]]
      add(whole, engaged[k], turn.costMicros)
      add(sliceOf(byRole, turn.role), engaged[k], turn.costMicros)
      add(sliceOf(byModel, turn.model), engaged[k], turn.costMicros)
    }
  }

  return { ...totals(whole), byRole: finish(byRole), byModel: finish(byModel) }
}
