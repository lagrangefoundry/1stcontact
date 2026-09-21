import { describe, expect, it } from 'vitest'
import {
  ENGAGED_GAP_CAP_MS,
  engagedMs,
  spendReport,
  type SpendTurn,
  type TurnBoundary,
} from '../tools/generate/src/cli/ai/spend-report-core'

/**
 * [[REQ-293]] — **engaged hours, and the arithmetic that turns a meter into a
 * bill.**
 *
 * WHAT THIS IS ABOUT. Token cost is not sellable. A client will not learn what a
 * cached prefix is; they understand *four hours of AI consulting a month*, which
 * is the unit EPIC-20 says this product will be priced and capped in. So the
 * meter's rows have to become two numbers a person can act on — how long they
 * were engaged, and what it cost — and a third that EPIC-20's whole finding
 * rests on: what an engaged hour actually costs, which on the measured day
 * varied twenty-fold within one evening.
 *
 * WHAT MAKES THIS EVIDENCE. Every case here drives the SHIPPED functions —
 * `engagedMs` and `spendReport`, the same two the Worker's route calls — and
 * asserts on the figures a reader would be shown, in milliseconds that can be
 * checked by hand against the stamps above them. There is nothing to mock: the
 * ticket's central design decision is that this arithmetic reads no table and
 * takes its facts as arguments, so the real thing is directly callable.
 *
 * AND THAT DECISION IS ITSELF ASSERTED, in the last case. Turn boundaries
 * survive in two places — the meter, for every session since it landed, and the
 * R2 audit ledger, for the 1,100 tool calls that predate it — and the ticket's
 * claim is that ONE implementation answers for both. A second implementation
 * for the retrospective would drift from this one the first time the cap moved.
 */

/** Midnight of an arbitrary day; every stamp below is an offset from it. */
const BASE = Date.parse('2026-09-20T12:00:00.000Z')

/** A stamp `seconds` after {@link BASE}, ISO-8601 as the meter stores it. */
const at = (seconds: number): string => new Date(BASE + seconds * 1000).toISOString()

/** A turn, spelled as briefly as the assertions need it. */
function turn(over: Partial<SpendTurn> & TurnBoundary): SpendTurn {
  return {
    session: 'session-1',
    role: 'consultant',
    model: 'claude-opus-5',
    costMicros: null,
    ...over,
  }
}

const MINUTE = 60 * 1000

describe('REQ-293 — a turn is worth its own duration plus the pause after it', () => {
  /**
   * CONDITIONS 2 AND 3. The definition, and both of its boundaries, on one
   * session whose stamps can be added up by eye:
   *
   *   A  12:00:00 → 12:01:00   (1 min of work)      then 2 minutes of silence
   *   B  12:03:00 → 12:04:00   (1 min of work)      then 16 minutes of silence
   *   C  12:20:00 → 12:21:00   (1 min of work)      then nothing at all
   *
   * A keeps its two minutes because the client was reading what it produced. B
   * keeps FIVE of its sixteen and not sixteen — the clock pauses after five
   * minutes of silence and resumes when they come back, which is condition 3's
   * first half and the whole reason an hour of this is billable. C keeps none,
   * which is its second half: a turn with nothing after it has no interval to
   * cap, and assuming five more minutes would bill for time nobody has been
   * observed to spend.
   *
   * NOTHING WAS WRITTEN TO PRODUCE ANY OF IT. These are three pairs of strings.
   */
  it('test_UAT_FC_REQ-293_a_pause_is_billed_up_to_the_cap_and_no_further', () => {
    const turns: TurnBoundary[] = [
      { startedAt: at(0), endedAt: at(60) },
      { startedAt: at(180), endedAt: at(240) },
      { startedAt: at(1200), endedAt: at(1260) },
    ]

    expect(engagedMs(turns)).toEqual([60_000 + 2 * MINUTE, 60_000 + ENGAGED_GAP_CAP_MS, 60_000])
    expect(ENGAGED_GAP_CAP_MS).toBe(5 * MINUTE)
    // The session's ten billable minutes, against twenty-one of wall clock.
    expect(engagedMs(turns).reduce((a, b) => a + b, 0)).toBe(10 * MINUTE)
  })

  /**
   * THE GAP IS AN INTERVAL WITHIN A CONVERSATION, NEVER BETWEEN TWO.
   *
   * Two sessions run an hour apart. If the clock were kept per TENANT rather
   * than per session, the second session's first turn would collect a capped
   * five minutes for an hour during which its client was not there — and worse,
   * the arithmetic would depend on which other conversations happened to be in
   * the same report, so one tenant's month would change when another's did.
   *
   * ORDER IS NOT ASSUMED EITHER. The rows are handed over interleaved, as a
   * read ordered by session would never produce, and the answer comes back
   * aligned to the input.
   */
  it('test_UAT_FC_REQ-293_the_clock_never_runs_between_two_conversations', () => {
    const report = spendReport([
      turn({ session: 'a', startedAt: at(0), endedAt: at(60) }),
      turn({ session: 'b', startedAt: at(3600), endedAt: at(3660) }),
      turn({ session: 'a', startedAt: at(120), endedAt: at(180) }),
      turn({ session: 'b', startedAt: at(3720), endedAt: at(3780) }),
    ])

    // Each session: one minute of work, one minute of pause, one more minute of
    // work — three minutes each, six in all. Measured per TENANT instead, the
    // hour of silence between them would contribute a capped five and the same
    // four turns would read as eleven minutes.
    expect(report.engagedMs).toBe(6 * MINUTE)
    expect(report.turns).toBe(4)
  })

  /**
   * CONDITION 5, in the form the delegation experiment will actually read it.
   *
   * One session, two models: the expensive one takes the decision, the cheap one
   * does the construction. The split has to attribute each turn's engaged time
   * to the model that ran it — otherwise "did moving construction to a cheaper
   * model move the money" is unanswerable — AND the two slices have to still sum
   * to the total, otherwise the hours have been double-counted and the bill is
   * wrong.
   *
   * THE PAUSE BETWEEN THEM BELONGS TO THE TURN BEFORE IT. The client was reading
   * what Opus said while deciding what to ask next, so those two minutes are
   * Opus's, and the model split is only truthful if it is attributed that way.
   */
  it('test_UAT_FC_REQ-293_two_models_in_one_session_split_without_double_counting', () => {
    const report = spendReport([
      turn({
        startedAt: at(0),
        endedAt: at(60),
        model: 'claude-opus-5',
        role: 'consultant',
        costMicros: 900_000,
      }),
      turn({
        startedAt: at(180),
        endedAt: at(420),
        model: 'claude-haiku-4-5',
        role: 'builder',
        costMicros: 100_000,
      }),
    ])

    expect(report.byModel['claude-opus-5'].engagedMs).toBe(60_000 + 2 * MINUTE)
    expect(report.byModel['claude-haiku-4-5'].engagedMs).toBe(4 * MINUTE)
    expect(report.engagedMs).toBe(7 * MINUTE)
    // The slices partition the total, in both directions of the split.
    const sum = (slices: Record<string, { engagedMs: number | null }>): number =>
      Object.values(slices).reduce((a, s) => a + (s.engagedMs ?? 0), 0)
    expect(sum(report.byModel)).toBe(report.engagedMs)
    expect(sum(report.byRole)).toBe(report.engagedMs)

    // CONDITION 1's third number, per slice: what an engaged hour cost on each
    // model. $0.90 over three minutes is $18/hour; $0.10 over four is $1.50.
    expect(report.byModel['claude-opus-5'].costPerEngagedHourMicros).toBe(18_000_000)
    expect(report.byModel['claude-haiku-4-5'].costPerEngagedHourMicros).toBe(1_500_000)
    // And EPIC-20's headline figure for the period as a whole.
    expect(report.costMicros).toBe(1_000_000)
    expect(report.engagedHours).toBe(0.12)
    expect(report.costPerEngagedHourMicros).toBe(Math.round((1_000_000 * 3_600_000) / (7 * MINUTE)))
  })

  /**
   * CONDITION 4 — *nothing, never zero*, the record's own rule applied one layer
   * out.
   *
   * A period nobody worked in must not report `0 h` and `$0.00`. Those are
   * claims — that the tenant was here and that it was free — and the second one
   * is the one thing a meter must never say. The distinction survives into every
   * figure including the rate, which has nothing to divide.
   */
  it('test_UAT_FC_REQ-293_a_period_with_no_measured_turns_reports_nothing_not_zero', () => {
    const report = spendReport([])

    expect(report.turns).toBe(0)
    expect(report.engagedMs).toBeNull()
    expect(report.engagedHours).toBeNull()
    expect(report.costMicros).toBeNull()
    expect(report.costPerEngagedHourMicros).toBeNull()
    expect(report.byRole).toEqual({})
    expect(report.byModel).toEqual({})
  })

  /**
   * A TURN THE PRICE TABLE DOES NOT NAME IS COUNTED, NOT ABSORBED.
   *
   * `turn_spend` writes a measured row with a NULL cost when `prices.json` has
   * no entry for its `(backend, model)` — measured but not priced, recoverable
   * later from the counters (REQ-292). A report that silently summed the rest
   * would present a FLOOR as a total, and the reader would take it for the
   * month's spend. So the unpriced turns are counted beside the figure, which is
   * also the alarm that says the price table has fallen behind `backends.json`.
   *
   * AND WHERE NOTHING IS PRICED, THE COST IS NULL RATHER THAN ZERO — the same
   * rule as the empty period, for the same reason.
   */
  it('test_UAT_FC_REQ-293_an_unpriced_turn_is_counted_and_never_read_as_free', () => {
    const partly = spendReport([
      turn({ startedAt: at(0), endedAt: at(60), costMicros: 500_000 }),
      turn({ startedAt: at(120), endedAt: at(180), costMicros: null, model: 'model-with-no-rates' }),
    ])
    expect(partly.costMicros).toBe(500_000)
    expect(partly.unpricedTurns).toBe(1)
    expect(partly.byModel['model-with-no-rates'].costMicros).toBeNull()
    expect(partly.byModel['model-with-no-rates'].unpricedTurns).toBe(1)
    // The hours are whole even where the money is not: the turn was measured.
    expect(partly.engagedMs).toBe(3 * MINUTE)

    const none = spendReport([turn({ startedAt: at(0), endedAt: at(60), costMicros: null })])
    expect(none.turns).toBe(1)
    expect(none.engagedMs).toBe(MINUTE)
    expect(none.costMicros).toBeNull()
    expect(none.costPerEngagedHourMicros).toBeNull()
    expect(none.unpricedTurns).toBe(1)
  })

  /**
   * THE DESIGN DECISION THE TICKET STATES OUTRIGHT: the calculation is a pure
   * function of `(started_at, ended_at)` pairs and takes them as an ARGUMENT.
   *
   * WHY IT IS WORTH A CASE OF ITS OWN. Engaged time is computable exactly for
   * every session that predates the meter — the R2 audit ledger carries a
   * timestamp, a session and a role on all 1,100 tool calls run between
   * 2026-09-08 and 09-21 — and that retrospective is what gives EPIC-20 its
   * first independent check: $16.20 per engaged hour measured top-down against
   * the account's actual $166.50. A function that read `turn_spend` itself could
   * not answer it, so the retrospective would be written a second time and would
   * drift from this one the first time the cap moved.
   *
   * SO THE SAME CALL IS MADE TWICE over the same intervals expressed two ways —
   * the meter's ISO stamps, and an audit record's epoch-seconds `timestamp` plus
   * its `durationMs` — and the answers must be identical. (The audit half is
   * shaped here rather than read from R2 on purpose: a retrospective is an
   * analysis run over the ledger, never rows written into the meter, and this
   * asserts the property that makes such a run possible.)
   */
  it('test_UAT_FC_REQ-293_the_same_arithmetic_answers_from_the_audit_ledger', () => {
    const calls = [
      { timestamp: BASE / 1000, durationMs: 60_000 },
      { timestamp: BASE / 1000 + 180, durationMs: 60_000 },
      { timestamp: BASE / 1000 + 1200, durationMs: 60_000 },
    ]
    const fromAudit: TurnBoundary[] = calls.map((call) => ({
      startedAt: new Date(call.timestamp * 1000).toISOString(),
      endedAt: new Date(call.timestamp * 1000 + call.durationMs).toISOString(),
    }))
    const fromMeter: TurnBoundary[] = [
      { startedAt: at(0), endedAt: at(60) },
      { startedAt: at(180), endedAt: at(240) },
      { startedAt: at(1200), endedAt: at(1260) },
    ]

    expect(engagedMs(fromAudit)).toEqual(engagedMs(fromMeter))
    expect(engagedMs(fromAudit).reduce((a, b) => a + b, 0)).toBe(10 * MINUTE)
  })
})
