import { describe, expect, it } from 'vitest'
import {
  SpendMeter,
  attributedSpend,
  costMicros,
  countersOf,
  priceDocument,
  ratesFor,
  turnSpendRecord,
} from '../tools/generate/src/cli/ai/spend-core'
import { PROJECT_BACKEND, backendsDocument } from '../tools/generate/src/cli/ai/backends'

/**
 * [[BUG-242]] — **a cache write is priced at the rate of the lifetime it was
 * written with.**
 *
 * `prices.json` named one `cache_write` rate, the five-minute one (1.25x input),
 * while every request this product sends asks for the one-hour cache (2x input).
 * Every write was metered at 62.5% of its bill. These are the claims that close it:
 *
 *   1. the lifetime the wire asks for is the one the meter prices at — both read
 *      `cacheTtlOf` (the sibling `.workers` suite, through the real route);
 *   2. a turn on a backend asking for the hour settles its writes at 2x input, and
 *      one asking for five minutes at 1.25x;
 *   3. a delegated builder's writes are priced at its own model's hour rate;
 *   4. a usage record that splits its writes by lifetime is priced part by part.
 */

const MODEL = backendsDocument.claude.model
const BUILDER = 'claude_builder'
const BUILDER_MODEL = backendsDocument.claude_builder.model

function facts() {
  return {
    session: 's',
    turn: 't',
    startedAt: 'a',
    endedAt: 'b',
    role: 'consultant',
    backend: PROJECT_BACKEND,
    model: MODEL,
    outcome: 'complete',
  }
}

describe('BUG-242 — a write is priced at the lifetime it was written with', () => {
  it('test_UAT_FC_BUG-242_every_anthropic_entry_names_both_write_rates_at_the_published_multiples', () => {
    // The provider bills a five-minute write at 1.25x input and an hour's at 2x.
    // A rate copied off the pricing page wrong is the error this ticket is.
    const table = priceDocument as unknown as Record<string, Record<string, unknown>>
    for (const backend of Object.keys(table).filter((k) => k.startsWith('claude'))) {
      for (const model of Object.keys(table[backend])) {
        const rates = ratesFor(backend, model)!
        expect(rates, `${backend}/${model}`).not.toBeNull()
        expect(rates.cache_write_5m, `${backend}/${model} 5m`).toBeCloseTo(rates.input * 1.25, 10)
        expect(rates.cache_write_1h, `${backend}/${model} 1h`).toBeCloseTo(rates.input * 2, 10)
      }
    }
  })

  it('test_UAT_FC_BUG-242_a_turn_asking_for_the_hour_settles_writes_at_twice_input', () => {
    const rates = ratesFor(PROJECT_BACKEND, MODEL)!
    const usage = { input_tokens: 1000, output_tokens: 50, cache_creation_input_tokens: 10_000 }
    const record = turnSpendRecord({ usage, requests: [usage] }, facts())
    expect(record!.costMicros).toBe(
      Math.round(1000 * rates.input + 50 * rates.output + 10_000 * rates.input * 2),
    )
  })

  it('test_UAT_FC_BUG-242_a_turn_asking_for_five_minutes_settles_writes_at_one_and_a_quarter_input', () => {
    const rates = ratesFor(PROJECT_BACKEND, MODEL)!
    const usage = countersOf({ input_tokens: 1000, cache_creation_input_tokens: 10_000 })
    // `''` is the API's own default lifetime: five minutes.
    expect(costMicros(usage, PROJECT_BACKEND, MODEL, '')).toBe(
      Math.round(1000 * rates.input + 10_000 * rates.input * 1.25),
    )
    expect(costMicros(usage, PROJECT_BACKEND, MODEL, '5m')).toBe(costMicros(usage, PROJECT_BACKEND, MODEL, ''))
  })

  it('test_UAT_FC_BUG-242_a_delegated_builder_entry_is_priced_at_its_models_hour_rate', () => {
    const rates = ratesFor(BUILDER, BUILDER_MODEL)!
    const [entry] = attributedSpend([
      { session: 'w', role: 'builder', backend: BUILDER, usage: { cache_creation_input_tokens: 1_000_000 } },
    ])
    expect(entry.model).toBe(BUILDER_MODEL)
    expect(entry.costMicros).toBe(Math.round(rates.input * 2 * 1_000_000))
    expect(entry.costMicros).toBe(Math.round(rates.cache_write_1h * 1_000_000))
  })

  it('test_UAT_FC_BUG-242_a_usage_record_that_splits_its_writes_prices_each_part_at_its_own_rate', () => {
    const rates = ratesFor(PROJECT_BACKEND, MODEL)!
    const raw = {
      input_tokens: 0,
      cache_creation_input_tokens: 3500,
      cache_creation: { ephemeral_5m_input_tokens: 1000, ephemeral_1h_input_tokens: 2000 },
    }
    // 500 of the total the split does not account for: priced at the requested hour.
    const expected = Math.round(1000 * rates.cache_write_5m + 2000 * rates.cache_write_1h + 500 * rates.cache_write_1h)

    expect(costMicros(countersOf(raw), PROJECT_BACKEND, MODEL)).toBe(expected)
    // The split is read wherever the raw record is: the settled row…
    expect(turnSpendRecord({ usage: raw, requests: [raw] }, facts())!.costMicros).toBe(expected)
    // …the live per-message ceiling…
    const meter = new SpendMeter(0)
    meter.charge(PROJECT_BACKEND, [raw])
    expect(meter.micros).toBe(expected)
    // …and a delegated entry.
    const [entry] = attributedSpend([{ backend: PROJECT_BACKEND, usage: raw }])
    expect(entry.costMicros).toBe(expected)

    // The split refines a counter, it is not one: the stored columns are unchanged.
    expect(countersOf(raw).cache_creation_input_tokens).toBe(3500)
    // A split of zeros says nothing, so it prices at the requested lifetime.
    expect(
      countersOf({ ...raw, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 } })
        .cache_creation,
    ).toBeUndefined()
  })
})
