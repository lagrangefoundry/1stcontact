import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  COUNTER_KEYS,
  RATE_OF,
  costMicros,
  measured,
  priceDocument,
  ratesFor,
  turnSpendRecord,
  type TurnCounters,
} from '../tools/generate/src/cli/ai/spend-core'
import { PROJECT_BACKEND, backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { makeFsSite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import { metered, says, scriptedClient } from './support/scripted-model-client'

/**
 * [[REQ-292]] — **what a token costs, and the two things that must not drift.**
 *
 * THE OTHER HALF OF THE METER. The workers suite proves the wiring: a turn taken
 * through the real route leaves one row in D1 carrying the counters the adapter
 * reported. This is the half that decides what those counters are WORTH, and it
 * is separate because every claim here is arithmetic over a document — it needs
 * no database, no Worker and no conversation, and a suite that could only assert
 * it end to end would be asserting the wiring twice.
 *
 * THREE CLAIMS, AND THEY ARE ALL ABOUT DRIFT rather than about a number:
 *
 *   1. the four counters this repository prices are the four the LIBRARY
 *      reports, so a counter added upstream fails here instead of being dropped;
 *   2. the model this project is CONFIGURED to run has rates, so changing
 *      `backends.json` without touching `prices.json` fails here instead of
 *      producing months of unpriced turns;
 *   3. each counter is priced at its OWN rate and each backend from its OWN
 *      entry, which is what a single input rate and a model-keyed table
 *      respectively could not do.
 *
 * NOTHING HERE PINS A PRICE. Rates are configuration — correcting one is an edit
 * to `prices.json` and nothing else, and a test that hard-coded $15 would turn
 * every repricing into a red suite. What is pinned is the SHAPE and the
 * arithmetic over it.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The model in force — what `backends.json` says and what a request carries. */
const MODEL = backendsDocument.claude.model

/** A usage block with one counter set, for asking what that counter costs. */
function only(key: (typeof COUNTER_KEYS)[number], tokens: number): TurnCounters {
  return Object.fromEntries(
    COUNTER_KEYS.map((k) => [k, k === key ? tokens : 0]),
  ) as TurnCounters
}

const MILLION = 1_000_000

describe('REQ-292 — the price table', () => {
  it('test_UAT_FC_REQ-292_the_counters_priced_here_are_the_counters_the_library_reports', async () => {
    // CLAIM 1 — the drift guard, and the reason `spend-core.ts` is allowed to
    // restate the counter names at all. It must: the library is resolved at
    // runtime and typed `any`, so a column set and a rate map cannot be derived
    // from it statically. What can be done is to hold the restatement to the
    // original, here, where a divergence is a failing test rather than a
    // dimension silently dropped on the floor — the failure [[EPIC-1]] §37 calls
    // irreversible, because a counter the record never carried cannot be
    // recovered afterwards at any cost.
    const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
    expect([...COUNTER_KEYS]).toEqual([...lib.USAGE_KEYS])

    // …AND EVERY ONE OF THEM IS PRICED. A counter with no rate would be billed
    // at nothing, which is the same lie as a zero cost wearing a different hat.
    for (const key of COUNTER_KEYS) expect(typeof RATE_OF[key]).toBe('string')
  })

  it('test_UAT_FC_REQ-292_the_model_this_project_runs_has_rates', async () => {
    // CLAIM 2, and it is the failure most likely to actually happen: somebody
    // changes the model in `backends.json` — which is exactly what that file
    // exists to make easy — and the turns go on being measured and stop being
    // priced. Nothing else in the system would notice, because an unpriced row
    // is a legitimate state.
    const rates = ratesFor(PROJECT_BACKEND, MODEL)
    expect(rates, `prices.json names no rates for ${PROJECT_BACKEND}/${MODEL}`).not.toBeNull()

    // EVERY ENTRY IN THE DOCUMENT IS COMPLETE, checked over the whole table
    // rather than over the one entry above: a second model added with three
    // rates would price three counters and silently omit the fourth, and
    // `ratesFor` refuses the entry wholesale rather than part-pricing a turn.
    const table = priceDocument as unknown as Record<string, unknown>
    const providers = Object.keys(table).filter((k) => k !== 'about')
    expect(providers.length).toBeGreaterThan(0)
    for (const provider of providers) {
      const models = Object.keys(table[provider] as Record<string, unknown>)
      expect(models.length).toBeGreaterThan(0)
      for (const model of models) {
        const entry = ratesFor(provider, model)
        expect(entry, `${provider}/${model} is not fully priced`).not.toBeNull()
        for (const rate of Object.values(entry!)) {
          expect(Number.isFinite(rate)).toBe(true)
          expect(rate).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('test_UAT_FC_REQ-292_each_counter_is_priced_at_its_own_rate', async () => {
    // CLAIM 3's first half, and the argument for four rates rather than one.
    //
    // THE UNIT IS ASSERTED, NOT ASSUMED. Rates are dollars per million tokens
    // and a micro is a millionth of a dollar, so a million tokens on a counter
    // must cost exactly that counter's dollar figure expressed in micros. That
    // is the whole of the conversion, and getting it wrong by a factor of a
    // million is the kind of error that reads as plausible on a dashboard.
    const rates = ratesFor(PROJECT_BACKEND, MODEL)!
    for (const key of COUNTER_KEYS) {
      expect(costMicros(only(key, MILLION), PROJECT_BACKEND, MODEL)).toBe(
        Math.round(rates[RATE_OF[key]] * MILLION),
      )
    }

    // AND THE RATES REALLY DIFFER, so the four multiplications above are four
    // different answers rather than one repeated. Output and cached input are
    // the pair that matters: a table that priced them alike would be a table
    // nobody needed.
    const perCounter = COUNTER_KEYS.map((key) => costMicros(only(key, MILLION), PROJECT_BACKEND, MODEL))
    expect(new Set(perCounter).size).toBeGreaterThan(1)

    // THE THING ONE INPUT RATE CANNOT SAY. Move a fixed number of tokens off the
    // full-price input side and onto the cached side and the turn gets cheaper.
    // Under a single input rate those two usages cost exactly the same, and the
    // entire saving REQ-143/144 went to the trouble of producing would be
    // invisible in the figure this product bills from.
    const uncached = costMicros(only('input_tokens', 100_000), PROJECT_BACKEND, MODEL)!
    const cached = costMicros(only('cache_read_input_tokens', 100_000), PROJECT_BACKEND, MODEL)!
    expect(cached).toBeLessThan(uncached)
  })

  it('test_UAT_FC_REQ-292_a_second_backend_is_priced_from_its_own_entry', async () => {
    // CLAIM 3's second half — AC6, and the reason the table is keyed by
    // `(backend, model)` rather than by model alone. This product must be able
    // to acquire a second provider, and a table keyed by model would have to be
    // REWRITTEN rather than extended on the day it does.
    const usage = only('input_tokens', MILLION)
    const ours = costMicros(usage, PROJECT_BACKEND, MODEL)
    const theirs = costMicros(usage, 'chatgpt', 'gpt-4o')
    expect(ours).not.toBeNull()
    expect(theirs).not.toBeNull()
    // The same tokens, two providers, two prices — each read from its own entry.
    expect(theirs).not.toBe(ours)
    expect(theirs).toBe(Math.round(ratesFor('chatgpt', 'gpt-4o')!.input * MILLION))

    // A MODEL IS NOT PRICED ACROSS PROVIDERS. Asking one backend for another's
    // model is not a near miss to be resolved leniently: it is a caller that has
    // lost track of who ran the turn, and answering it would price that turn
    // wrong rather than leave it unpriced.
    expect(ratesFor('chatgpt', MODEL)).toBeNull()
    expect(ratesFor(PROJECT_BACKEND, 'gpt-4o')).toBeNull()
  })

  it('test_UAT_FC_REQ-292_an_unpriced_pair_is_still_measured', async () => {
    // A `(backend, model)` the table does not name is the state this product
    // lands in the moment it runs anything new. The turn is still recorded, with
    // its four counters intact, and its cost left NULL — *measured but not
    // priced*, which the counters make recoverable later. A zero would claim the
    // turn was free, and nothing downstream could ever tell the two apart.
    const spend = {
      usage: { input_tokens: 10, output_tokens: 2 },
      requests: [{ input_tokens: 10, output_tokens: 2 }],
    }
    const record = turnSpendRecord(spend, {
      session: 's',
      turn: 't',
      startedAt: 'a',
      endedAt: 'b',
      role: 'consultant',
      backend: 'claude',
      model: 'a-model-nobody-has-priced',
      outcome: 'complete',
    })
    expect(record).not.toBeNull()
    expect(record!.usage.input_tokens).toBe(10)
    expect(record!.costMicros).toBeNull()

    // AND A TURN THAT DELEGATED NOTHING SAYS `null`, NOT `[]`. This product
    // composes no delegation surface, so "there is no such thing here" and
    // "asked and found none" are different claims and only the first is true.
    expect(record!.attributed).toBeNull()
    // …while a turn that did keeps the entry whole rather than folded into the
    // counters above it: an attributed entry names its own backend and role, so
    // merging it would price a worker's tokens at this row's model.
    const worker = [{ session: 'w', role: 'researcher', backend: 'claude', usage: {} }]
    const delegated = turnSpendRecord({ ...spend, attributed: worker }, facts())
    expect(delegated!.attributed).toEqual(worker)
  })

  it('test_UAT_FC_REQ-292_a_turn_that_measured_nothing_is_not_a_turn_that_was_free', async () => {
    // AC5's rule, where it is actually decided. All-zero is what an empty or
    // unreadable `usage` block folds to — so a record must not exist for it, and
    // the decision belongs here rather than at each call site, or every future
    // host would have to restate it.
    expect(turnSpendRecord({}, facts())).toBeNull()
    expect(turnSpendRecord({ usage: {} }, facts())).toBeNull()
    expect(turnSpendRecord({ usage: { input_tokens: 0, output_tokens: 0 } }, facts())).toBeNull()
    // …and one counter is enough to make it a measurement.
    expect(turnSpendRecord({ usage: { cache_read_input_tokens: 1 } }, facts())).not.toBeNull()

    expect(measured(only('input_tokens', 0))).toBe(false)
    expect(measured(only('cache_creation_input_tokens', 1))).toBe(true)
  })
})

function facts() {
  return {
    session: 's',
    turn: 't',
    startedAt: 'a',
    endedAt: 'b',
    role: 'consultant',
    backend: 'claude',
    model: MODEL,
    outcome: 'complete',
  }
}

/**
 * AC7 — a host with no meter takes the turn.
 *
 * THE `1c` CLI'S PERMANENT STATE, and the property that makes the meter a port
 * rather than a table. A local builder edits a directory on somebody's machine:
 * there is no tenant, no database and nothing to bill, so it supplies no
 * `recordTurnSpend` at all — and must behave in every respect as it did before
 * this existed. Absent is ordinary, exactly as it is for a missing browser, a
 * missing renderer and a missing ledger.
 *
 * DRIVEN THROUGH `host.ts`, which is the Node runtime as it really ships:
 * nothing here nulls a wire to construct the case, because nothing here has to.
 */
describe('REQ-292 — a host with no meter', () => {
  let site: SiteFixture

  beforeEach(() => {
    site = makeFsSite()
    rmSync(sessionsDir({ cwd: site.cwd! }), { recursive: true, force: true })
    resetAiHost()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    rmSync(site.cwd!, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-292_a_host_with_no_meter_still_completes_a_turn', async () => {
    // The model reports spend — so this is not a turn that dodged the meter by
    // having nothing to record. It has something to record and nowhere to put
    // it, which is the case that must cost the operator nothing.
    setModelClient(
      scriptedClient([
        metered(
          { input_tokens: 4200, output_tokens: 130, cache_read_input_tokens: 900 },
          says('Your site looks fine.'),
        ),
      ]),
    )

    const opts = { cwd: site.cwd! }
    const { sessionId } = await openSession(site.slug, opts)
    const events: { kind: string; content: string }[] = []
    for await (const event of streamPrompt(sessionId, 'How does it look?', opts)) {
      events.push(event)
    }

    // The turn is whole: the prose arrived and it closed exactly once.
    expect(events.map((e) => e.content).join('')).toContain('Your site looks fine.')
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
  })
})
