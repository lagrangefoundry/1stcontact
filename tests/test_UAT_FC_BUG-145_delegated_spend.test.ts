import { describe, expect, it } from 'vitest'
import { turnSpendRecord } from '../tools/generate/src/cli/ai/spend-core'
import { PROJECT_BACKEND, backendsDocument } from '../tools/generate/src/cli/ai/backends'

/**
 * [[BUG-145]] — **a delegation is not the caller's to lose.**
 *
 * WHAT WAS WRONG. `turnSpendRecord` gated the whole row on the CALLER'S own four
 * counters, and `attributed` is a field OF that row — so a turn that handed work
 * to a worker and then died before its own terminal meta arrived discarded the
 * worker's bill along with its own absence of one. Measured on the dev
 * environment: of the eight workers that had ever run, the four that were
 * attributed were exactly the four whose caller wrote a row, and the four that
 * were lost were exactly the four whose caller wrote none. The delegation
 * surface accounts for its worker on every exit path (REQ-295); the caller's
 * meta arrives on one.
 *
 * THE HALF THAT IS ARITHMETIC, and it is here rather than in the workers suite
 * for {@link turnSpendRecord}'s own reason: the rule about when a row exists is
 * decided in one function so that every host gets it rather than every host
 * restating it, and a claim about that function needs no database, no Worker and
 * no conversation. The sibling `.workers` case proves the same rule through the
 * real route, where the turn genuinely fails.
 *
 * WHAT IS PINNED HERE:
 *
 *   1. a turn that measured nothing and delegated something IS a row;
 *   2. its cost is NULL and not `0` — the caller's own spend was not observed,
 *      and zero is the one thing a meter must never claim;
 *   3. nothing else widened: no attribution and no counters is still no row, and
 *      an EMPTY attribution is not an attribution;
 *   4. a caller that measured its own spend still keeps its own settled cost.
 */

const MODEL = backendsDocument.claude.model

/** One completed worker, in the shape the manager attributes to the caller. */
const WORKER = [
  {
    session: 'worker-builder-abc',
    role: 'builder',
    backend: 'claude_builder',
    usage: { input_tokens: 800, output_tokens: 400 },
  },
]

function facts(outcome = 'error') {
  return {
    session: 's',
    turn: 't',
    startedAt: 'a',
    endedAt: 'b',
    role: 'consultant',
    backend: PROJECT_BACKEND,
    model: MODEL,
    outcome,
  }
}

describe('BUG-145 — delegated spend outlives the turn that caused it', () => {
  it('test_UAT_FC_BUG-145_a_turn_that_measured_nothing_but_delegated_is_still_a_row', async () => {
    // THE WHOLE BUG, at the one line that had it. `{}` is what `turnSpend`
    // returns for a turn whose terminal meta never arrived — an error, an
    // abandoned stream — and the worker beside it ran to completion on a real
    // bill either way.
    const record = turnSpendRecord({ attributed: WORKER }, facts())
    expect(record).not.toBeNull()

    // The worker is named, whole and unflattened, so it can be priced against
    // its OWN backend rather than the caller's.
    expect(record!.attributed).toEqual(WORKER)

    // AND THE ROW DISCLAIMS THE CALLER'S OWN SPEND RATHER THAN CLAIMING IT WAS
    // NIL. The counters are zero because the columns are `NOT NULL` and zero is
    // the cheapest spelling of an absence the row already disclaims elsewhere —
    // `cost_micros` is NULL, which is what a reader tests, and it is NULL even
    // though this `(backend, model)` IS priced and the arithmetic over four
    // zeros would have settled at exactly `0`.
    expect(record!.costMicros).toBeNull()
    expect(record!.usage.input_tokens).toBe(0)
    expect(record!.usage.output_tokens).toBe(0)
    expect(record!.usage.cache_read_input_tokens).toBe(0)
    expect(record!.usage.cache_creation_input_tokens).toBe(0)
    // Zero requests is an honest count: none were observed.
    expect(record!.requests).toBe(0)
    // …and the turn's real end is what makes the row legible rather than
    // mysterious to whoever finds it.
    expect(record!.outcome).toBe('error')
  })

  it('test_UAT_FC_BUG-145_nothing_else_widened', async () => {
    // "NOTHING, NEVER ZERO" IS NOT REPEALED, only narrowed to the one case that
    // was wrong. A turn with neither its own measurement nor anything caused
    // elsewhere still writes no row at all.
    expect(turnSpendRecord({}, facts())).toBeNull()
    expect(turnSpendRecord({ usage: {} }, facts())).toBeNull()
    expect(turnSpendRecord({ usage: { input_tokens: 0 } }, facts())).toBeNull()

    // AND AN EMPTY ATTRIBUTION IS NOT AN ATTRIBUTION. `[]` is what a host that
    // composed the delegation surface and delegated nothing hands over — which
    // is the ordinary turn, not an exceptional one — so it must not be a reason
    // for a row to exist. This is the difference between "asked and found none"
    // and "caused measured spend elsewhere", and only the second is a fact
    // worth a row.
    expect(turnSpendRecord({ attributed: [] }, facts())).toBeNull()
    // Nor is a non-array, which is every shape the column has never held.
    expect(turnSpendRecord({ attributed: null }, facts())).toBeNull()
  })

  it('test_UAT_FC_BUG-145_a_measured_caller_still_settles_its_own_cost', async () => {
    // THE REGRESSION THE FIX COULD HAVE INTRODUCED. `cost_micros` is now NULL
    // where the caller measured nothing, and a fix that reached for that NULL
    // one branch too early would have unpriced every delegating turn — which is
    // the same instrument, broken the other way round.
    const measuredCaller = turnSpendRecord(
      {
        usage: { input_tokens: 9000, output_tokens: 200 },
        requests: [{ input_tokens: 9000, output_tokens: 200 }],
        attributed: WORKER,
      },
      facts('complete'),
    )
    expect(measuredCaller!.costMicros).not.toBeNull()
    expect(measuredCaller!.costMicros).toBeGreaterThan(0)
    expect(measuredCaller!.requests).toBe(1)
    expect(measuredCaller!.attributed).toEqual(WORKER)
  })
})
