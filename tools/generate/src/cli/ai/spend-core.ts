/**
 * [[REQ-292]] — what a turn cost, as a record a host can keep.
 *
 * WHAT WAS WRONG. Nothing upstream. `ClaudeAPIBackend` counts every request's
 * four token counters (REQ-143), `turnUsage` folds the turn's requests,
 * `turnSpend` puts `{usage, requests}` on the terminal `done` event, and
 * `SessionManager` writes the same figures into the junction's `turn_end`
 * record. But this project's junction is `memoryJunctions()` and dies with the
 * isolate, and nothing here ever read the terminal event for anything but the
 * turn's outcome. The measurement existed, in RAM, for the life of one isolate,
 * and was then dropped — which is why three passes of cost analysis over one
 * session produced $252, $55 and $107.
 *
 * THIS FILE IS THE VOCABULARY AND THE ARITHMETIC, and nothing else. It does not
 * know where a record goes: {@link RecordTurnSpend} is a port on `HostDeps`, the
 * Worker implements it against D1 and the `1c` CLI declines, exactly as
 * `LedgerDeps` and `FidelityDeps` already work. Absent is ordinary rather than
 * an error — a deployment with nowhere to put a meter reading still takes the
 * turn.
 *
 * RUNTIME-AGNOSTIC, FOR `backends.ts`'S REASON. `host-core.ts` is the half a
 * Worker loads (REQ-146), so the price table arrives as a bundled document and
 * never through `node:fs`. Both hosts must also AGREE: a rate only the CLI could
 * read would mean the same turn priced two ways depending on which machine took
 * it, which is the divergence REQ-146 split the host to prevent.
 *
 * WHY THE COUNTER NAMES ARE RESTATED HERE rather than read off the library's own
 * `USAGE_KEYS`. This module is imported statically and the library is resolved at
 * runtime as `any`, so a static list is the only shape a column set and a rate
 * map can take. It is DERIVED AND CHECKED rather than merely agreeing today —
 * `log.ts`'s `COLUMN_OF` makes the same trade for the same reason, and a UAT
 * asserts {@link COUNTER_KEYS} equals `lib.USAGE_KEYS` so a counter added
 * upstream fails a test instead of being silently dropped on the floor.
 */

import priceDocument from './prices.json'
import { modelOfBackend } from './backends'

/**
 * The four counters a request is billed from, in one order, spelled once.
 *
 * The Anthropic names, used for every provider, because they are the four
 * questions worth asking of any cached endpoint: what was paid at full price,
 * what came back, what was read from cache, and what was written to it. That is
 * the framework's `USAGE_KEYS` verbatim, and a UAT holds the two to it.
 *
 * `input_tokens` EXCLUDES BOTH CACHE FIGURES on Anthropic's wire, so the three
 * input counters partition the request rather than overlapping — which is what
 * makes summing all four against four rates correct rather than double-counting.
 */
export const COUNTER_KEYS = [
  'input_tokens',
  'output_tokens',
  'cache_read_input_tokens',
  'cache_creation_input_tokens',
] as const

export type CounterKey = (typeof COUNTER_KEYS)[number]

/** One turn's four counters, summed across the requests it made. */
export type TurnCounters = Record<CounterKey, number>

/**
 * Which rate in `prices.json` prices which counter.
 *
 * TWO VOCABULARIES ON PURPOSE. The counter names are the PROVIDER'S and are not
 * ours to shorten; the rate names are the PRICE TABLE'S, and a pricing page says
 * "cache read", not "cache_read_input_tokens". This map is the one place the two
 * meet, so neither has to be spelled in the other's terms anywhere else.
 */
export const RATE_OF: Record<CounterKey, string> = {
  input_tokens: 'input',
  output_tokens: 'output',
  cache_read_input_tokens: 'cache_read',
  cache_creation_input_tokens: 'cache_write',
}

/** The price table as loaded — exported so a UAT can assert against the document. */
export { priceDocument }

/** One entry's four rates, in US dollars per million tokens. */
export type Rates = Record<string, number>

/**
 * One turn's spend, as a host hands it to whatever keeps it.
 *
 * NO TENANT FIELD, deliberately, and it is the one departure from the column
 * list the ticket names that is worth stating. An implementation of
 * {@link RecordTurnSpend} is BOUND to one tenant when it is built — `router.ts`
 * has the scope in hand and nothing below it does — so the tenant is stamped by
 * the implementation rather than travelling on every record. That makes a
 * crossing impossible by construction instead of by a check somebody has to
 * keep writing, which is the same reason
 * `chatLedger` binds a session id rather than taking one per call. The stored
 * ROW still carries `tenant_id`; it is simply not the host's to supply.
 */
export interface TurnSpendRecord {
  /** The conversation this turn belongs to. */
  session: string
  /**
   * This turn.
   *
   * MINTED BY THE HOST, because the framework's own turn id is not on the wire:
   * it is stamped onto the junction's `turn_start` / `turn_end` records and never
   * reaches the stream vocabulary `streamPrompt` consumes. An opaque id from the
   * system's one minter is what makes the row addressable and, as the table's
   * primary key, is what makes "exactly one row per turn" a property of the
   * database rather than of the caller.
   */
  turn: string
  /** When the host began the turn, ISO-8601. */
  startedAt: string
  /** When its `finally` ran, ISO-8601 — so a long turn is visible as one. */
  endedAt: string
  /** The role that took it (`consultant`, `settings`). */
  role: string
  /** Which adapter family ran — `claude` here, and the first half of the price key. */
  backend: string
  /** Which model it was configured with — the second half of the price key. */
  model: string
  /** `complete` / `aborted` / `error`, as the turn's own terminal event reported. */
  outcome: string
  /**
   * Model round trips. A turn with N tool calls is N+1, which is the growth this
   * exists to make visible — an aggregate would hide it.
   */
  requests: number
  /** The four counters, summed over those requests. */
  usage: TurnCounters
  /**
   * Spend this turn caused ELSEWHERE — a delegated worker's requests — or `null`.
   *
   * KEPT WHOLE AND NOT FLATTENED INTO THE FOUR COUNTERS ABOVE. An attributed
   * entry names its own backend and its own role, so folding it in would price a
   * worker's tokens at THIS row's `(backend, model)` — precisely the error the
   * two-level price key exists to prevent. Stored as the framework's own
   * structure so a later reader can price each entry against its own rates.
   *
   * `null` RATHER THAN AN EMPTY LIST for a turn that delegated nothing, because
   * this product composes no delegation surface at all: every turn it takes is
   * its own. An empty array would read as "asked and found none", which is a
   * different claim from "there is no such thing here".
   *
   * WHERE IT COMES FROM, stated because it is the one field upstream does not
   * hand over yet. `SessionManager` puts `attributed` on the junction's
   * `turn_end` record and folds it in `usage()`; it does NOT put it on the
   * terminal `done` event. Nor would `turnSpend` carry it if it did — that
   * function's job is to say which of the meta's keys are spend, and this is
   * not the turn's own. So the host lifts it off the raw meta and merges it in,
   * which is the place it would naturally arrive, and it is `null` until either
   * delegation is composed here or that event starts carrying it.
   */
  attributed: unknown[] | null
  /**
   * What it cost, in millionths of a US dollar, settled at write time — or
   * `null` where the price table does not name this `(backend, model)`.
   *
   * BOTH THIS AND THE RAW COUNTERS, not either. Raw, so a past period can be
   * re-priced against another model or another provider; settled, so a bill does
   * not move underneath somebody the day a rate is corrected.
   */
  costMicros: number | null
}

/**
 * The port: where a turn's spend goes.
 *
 * Deliberately one verb and no storage vocabulary, so a host that keeps its
 * meter somewhere other than D1 implements the same thing and `host-core.ts`
 * never learns the difference.
 *
 * IT MUST NOT FAIL THE TURN. The host calls this from the `finally` that also
 * closes the pending-prompt record, and a meter that took the conversation down
 * with it would have made things worse than having none — so the host swallows,
 * and an implementation is free to throw.
 */
export type RecordTurnSpend = (record: TurnSpendRecord) => Promise<void>

/** Read a counter off a reported `usage` block; anything unreadable is zero. */
function counter(usage: unknown, key: CounterKey): number {
  const value = (usage as Record<string, unknown> | null | undefined)?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0
}

/**
 * A reported `usage` block as the four counters, with missing entries read as
 * zero — a partial block is a smaller measurement, never a reason to throw.
 */
export function countersOf(usage: unknown): TurnCounters {
  return Object.fromEntries(COUNTER_KEYS.map((key) => [key, counter(usage, key)])) as TurnCounters
}

/**
 * Whether a set of counters is a MEASUREMENT at all.
 *
 * All-zero is what an empty or unreadable `usage` block folds to, and recording
 * it would claim a turn that cost nothing. The framework states the rule for its
 * own terminal event — *nothing, never zero* — and this is the same rule applied
 * one layer out, where it decides whether a row exists.
 */
export function measured(usage: TurnCounters): boolean {
  return COUNTER_KEYS.some((key) => usage[key] > 0)
}

/**
 * The four rates for one `(backend, model)`, or `null` where the table names no
 * such pair.
 *
 * NULL IS ORDINARY. A model configured before its rates were added is still
 * measured and still recorded; it is simply not priced. The counters are what
 * make that recoverable afterwards.
 */
export function ratesFor(backend: string, model: string): Rates | null {
  const table = priceDocument as unknown as Record<string, unknown>
  const provider = table[backend]
  if (!provider || typeof provider !== 'object') return null
  const rates = (provider as Record<string, unknown>)[model]
  if (!rates || typeof rates !== 'object') return null
  const out: Rates = {}
  for (const key of COUNTER_KEYS) {
    const rate = (rates as Record<string, unknown>)[RATE_OF[key]]
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return null
    out[RATE_OF[key]] = rate
  }
  return out
}

/**
 * What a turn cost, in micros, or `null` where the pair is not priced.
 *
 * THE UNIT IS WHY THIS IS ONE MULTIPLICATION AND NO DIVISION. Rates are dollars
 * per MILLION tokens and a micro is a millionth of a dollar, so the two scales
 * cancel exactly: `tokens x rate` is already micros. Rounding happens once, at
 * the end, on a figure that is otherwise exact — rather than four times, on four
 * per-counter costs, which is how a per-turn error becomes a per-month one.
 */
export function costMicros(usage: TurnCounters, backend: string, model: string): number | null {
  const rates = ratesFor(backend, model)
  if (rates === null) return null
  let micros = 0
  for (const key of COUNTER_KEYS) micros += usage[key] * rates[RATE_OF[key]]
  return Math.round(micros)
}

/** Everything the host knows about the turn that is not its spend. */
export interface TurnFacts {
  session: string
  turn: string
  startedAt: string
  endedAt: string
  role: string
  backend: string
  model: string
  outcome: string
}

/**
 * Fold the library's `turnSpend(meta)` and the host's own facts into one record
 * — or `null` for a turn that measured nothing.
 *
 * THE `null` IS THE WHOLE OF "a turn that measured nothing writes no record",
 * decided here rather than at the call site, so every host gets the rule rather
 * than every host restating it. A backend that reports no usage at all — and one
 * whose turn failed before a request went out — must not be made to look free.
 *
 * `spend` is exactly what `turnSpend` returns: `{}` for a turn that reported
 * nothing, `{usage, requests}` otherwise. Anything else on the terminal meta is
 * not spend and is not read here.
 */
export function turnSpendRecord(
  spend: Record<string, unknown>,
  facts: TurnFacts,
): TurnSpendRecord | null {
  const usage = countersOf(spend.usage)
  if (!measured(usage)) return null
  const requests = Array.isArray(spend.requests) ? spend.requests.length : 0
  const attributed = Array.isArray(spend.attributed) ? (spend.attributed as unknown[]) : null
  return {
    ...facts,
    requests,
    usage,
    attributed,
    costMicros: costMicros(usage, facts.backend, facts.model),
  }
}

/**
 * One delegated worker's spend, priced ([[REQ-297]]).
 *
 * WHAT IT IS A VIEW OF. `turn_spend.attributed` holds the framework's own
 * structure verbatim — one entry per completed delegation, each
 * `{turn_id, session, role, backend, usage, requests?, cost_usd?}` — stored whole
 * and deliberately not flattened into the row's four counters, because an entry
 * names its own backend and folding it in would price a worker's tokens at the
 * CALLER's `(backend, model)`. This is the read that honours that: the same
 * {@link costMicros} that settled the turn, applied to the entry's own key.
 *
 * `model` IS RESOLVED AND NOT STORED, which is the one place this shape is weaker
 * than the row beside it. The framework's delegation surface puts a backend on
 * the entry and no model, so the binding comes from {@link modelOfBackend} —
 * `backends.json`, the document that decides it — and carries that function's
 * caveat: it is the model configured today. The alternative was to price an entry
 * at the caller's model, which is confidently wrong rather than honestly dated.
 *
 * AN UNREADABLE ENTRY IS DROPPED AND NOT GUESSED AT. `usage` is what makes an
 * entry a measurement at all ({@link measured}'s rule, one layer out), so an
 * entry with none is not a delegation that cost nothing — it is not a delegation
 * this reader can account for, and a zero would claim the first.
 */
export interface AttributedSpend {
  /** The worker's own session, so its record can be gone and read. */
  session: string
  /** Which role the worker took — the builder, today. */
  role: string
  /** Which backend name ran it — the first half of the price key. */
  backend: string
  /** What {@link modelOfBackend} binds that name to, or `''`. */
  model: string
  /** The four counters, as the entry reported them. */
  usage: TurnCounters
  /** What it cost in micros, or `null` where the pair is not priced. */
  costMicros: number | null
}

/**
 * A stored `attributed` value as priced entries — `[]` for a turn that delegated
 * nothing, which is every turn while the switch is off ([[REQ-295]]).
 *
 * IT TAKES `unknown` BECAUSE THAT IS WHAT THE COLUMN IS. The row holds the
 * framework's structure as JSON and this module does not own its schema, so every
 * field is read defensively and an entry that does not answer is left out rather
 * than defaulted into existence.
 */
export function attributedSpend(raw: unknown): AttributedSpend[] {
  if (!Array.isArray(raw)) return []
  const out: AttributedSpend[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const usage = countersOf(record.usage)
    if (!measured(usage)) continue
    const backend = typeof record.backend === 'string' ? record.backend : ''
    const model = modelOfBackend(backend)
    out.push({
      session: typeof record.session === 'string' ? record.session : '',
      role: typeof record.role === 'string' ? record.role : '',
      backend,
      model,
      usage,
      // BOTH HALVES OF THE KEY OR NOTHING. An entry whose backend resolves no
      // model has no pair to look up, and `costMicros` would answer `null` for
      // it anyway — this says so without pretending a lookup happened.
      costMicros: backend === '' || model === '' ? null : costMicros(usage, backend, model),
    })
  }
  return out
}
