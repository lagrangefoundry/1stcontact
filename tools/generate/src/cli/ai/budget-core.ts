/**
 * [[REQ-296]] — the turn's context budget: the ceiling, the gauge and the guard.
 *
 * WHAT WAS WRONG. A turn could grow without limit and nothing could see it
 * coming. `recentExchanges` bounds growth ACROSS turns and deliberately declines
 * to bound one — it keeps at least one whole exchange whatever its size, because
 * a cut inside one orphans a `tool_result` and the API rejects that. The only
 * bound INSIDE a turn is `MAX_TOOL_ITERATIONS = 50`, which is a count and cannot
 * tell a 200-byte tool result from a 200-kilobyte one. Nothing compacts on the
 * API path: `_compactionDue` is false unless the backend declares the
 * `compaction` capability and only the Claude Code adapter does. So overflow
 * arrived as a provider error mid-turn, after the tokens were spent, with the
 * turn's work unlanded.
 *
 * WHAT THIS MODULE IS. Two halves of one rule, plus the number the rule is
 * written against:
 *
 *   - {@link budgetCeiling} — how much of the model's window one request may
 *     carry before this host stops sending.
 *   - {@link guardTurn} — the in-turn half. It wraps a backend's `promptStream`
 *     and ends the turn between two requests rather than letting the second one
 *     be refused by the provider.
 *   - {@link budgetStopNotice} — what the client is told when either half fires.
 *
 * The PRE-TURN half is not here: it belongs where the durable figure is, which is
 * `host-core.ts`'s own turn loop (a manager rebuilt per request on the Worker has
 * no measurement of the previous turn, and the host does — see
 * `session-occupancy.ts`).
 *
 * MEASURED OCCUPANCY, NEVER A CHARACTER PROXY. Every figure here comes off the
 * provider's own `usage` counters through upstream's `occupancyTokens`, which
 * sums the three input-side counters — cache reads count in full, because a
 * cached prefix is cheaper and not smaller. This module has no tokeniser and does
 * not want one: the number that matters is the one the API counted.
 *
 * NO FILESYSTEM AND NO LIBRARY IMPORT, for `host-core.ts`'s reason: both hosts
 * load this, so the AI library arrives as a parameter and nothing here names a
 * runtime.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The library's stream vocabulary, matched and — here — PRODUCED.
 *
 * These were three constants in `host-core.ts`, which matches `tool_activity`
 * and projects the other two in `tailSession`. They live here now because this is
 * the module that EMITS them: the guard has to close a turn with a terminal event
 * of its own, and `doneEvent` / `textEvent` are not on the library's package
 * door — only the shapes are, and they are three string kinds on a plain object.
 * One definition site, imported by the host rather than restated there.
 */
export const TEXT = 'text'
export const DONE = 'done'
export const TOOL_ACTIVITY = 'tool_activity'

/** One event as the library's `promptStream` yields it. */
export interface StreamEvent {
  kind: string
  content: string
  meta?: Record<string, unknown>
}

/**
 * What fraction of the room a request has this host is willing to fill.
 *
 * ONE NUMBER, IN ONE PLACE, and a constant rather than a document for
 * {@link MAX_PRIMING_CHARS}'s reason: it is host policy about this host's own
 * loop, not a setting the framework owns a seam for. `backends.json` could not
 * hold it anyway — that file's keys are the framework's schema and an unknown one
 * is rejected at start-up.
 *
 * 0.9 OF THE ROOM, NOT OF THE WINDOW, and the difference is load-bearing — see
 * {@link requestRoom}. What the remaining tenth buys is the growth between the
 * measurement and the request it is used to judge: the next request carries
 * everything the measured one did, plus this iteration's tool results. On the
 * consultant's 1M window that is ~93k tokens of slack; on a 200k worker, ~16k.
 *
 * SO IT IS NOT A PROOF, and saying so is the honest version of what this ticket
 * delivers. A single tool result larger than the slack can still overflow the
 * request that carries it, because tool output is unbounded in the live stream
 * (only the PERSISTED copy is capped). What the guard removes is the failure that
 * was certain — fifty iterations walking off the end of the window — not every
 * failure that is possible.
 */
export const TURN_BUDGET_FRACTION = 0.9

/**
 * How much of a model's context window one REQUEST may occupy.
 *
 * The window less the reply's ceiling, because the two share it: the provider
 * refuses a request whose input plus `max_tokens` exceeds the window, so a guard
 * written against the window alone would pass a request the API then rejects.
 * With `claude-haiku-4-5`'s 200k window and this project's 32k worker ceiling
 * that is a sixth of the window, which is not a rounding error.
 *
 * Zero when either figure is unknown or nonsensical, which {@link budgetCeiling}
 * reads as "do not guard" rather than as "no room".
 */
export function requestRoom(window: number, maxTokens: number): number {
  const w = Math.trunc(Number(window) || 0)
  const m = Math.trunc(Number(maxTokens) || 0)
  if (w <= 0) return 0
  return Math.max(0, w - Math.max(0, m))
}

/**
 * The measured occupancy at which this host stops sending, or `0` for no guard.
 *
 * ZERO IS "UNGUARDABLE", NOT "FULL". A backend that declares no context window
 * reads as zero (upstream's own rule: *"zero means not known, never empty"*), and
 * a session on it must run exactly as it did before this ticket rather than be
 * refused on the strength of a denominator nobody has. That is the same judgement
 * the gauge makes when it declines to invent a proportion.
 */
export function budgetCeiling(
  window: number,
  maxTokens: number,
  fraction: number = TURN_BUDGET_FRACTION,
): number {
  const room = requestRoom(window, maxTokens)
  if (room <= 0) return 0
  return Math.floor(room * fraction)
}

/** The ceiling a backend instance is guarded against. */
export function backendCeiling(backend: Untyped, fraction: number = TURN_BUDGET_FRACTION): number {
  return budgetCeiling(backend?.contextWindow, backend?.maxTokens, fraction)
}

/**
 * Whether a measured occupancy has reached the point of refusal.
 *
 * `>=`, not `>`: the ceiling is the last figure this host is willing to have
 * sent, and the request being judged is the NEXT one, which is strictly larger
 * than the measurement.
 */
export function overBudget(occupancy: number, ceiling: number): boolean {
  return ceiling > 0 && Math.trunc(Number(occupancy) || 0) >= ceiling
}

/**
 * The occupancy of the most recent request in a list of `usage` records.
 *
 * THE LAST ONE, NEVER THEIR SUM, which is upstream's `turnOccupancy` rule applied
 * to a list the host is holding for its own reasons: each request in a turn
 * carries more context than the one before, so summing would report a context
 * several times larger than was ever resident.
 */
export function lastOccupancy(lib: Untyped, records: readonly unknown[]): number {
  if (!records || records.length === 0) return 0
  return Math.trunc(Number(lib.occupancyTokens(records[records.length - 1])) || 0)
}

/** Digits grouped for a reader: `842_000` as `842,000`. */
function grouped(value: number): string {
  return Math.trunc(value).toLocaleString('en-US')
}

/**
 * What the client is told when a turn is stopped for want of room.
 *
 * ADDRESSED TO THE CLIENT AND NOT TO THE MODEL, which is why the words are here
 * rather than in `priming.json`. That file holds every word a SESSION is told by
 * hand; this is the host speaking in the session's place, at the one moment the
 * session cannot speak for itself.
 *
 * IT NAMES WHAT SURVIVES, because a sentence that only says "full" leaves the
 * client with nothing to do. The engagement record — the standing note and the
 * decisions ([[REQ-283]]) — is on the conversation's own ticket and is read back
 * into the first turn of the next one, so a fresh conversation resumes from what
 * was settled rather than from nothing.
 */
export function budgetStopNotice(occupancy: number, window: number): string {
  const room = window > 0 ? ` of its ${grouped(window)}-token context window` : ''
  return (
    `I have stopped here rather than risk losing this turn's work: this ` +
    `conversation now carries ${grouped(occupancy)} tokens${room}, and the next ` +
    `request would not fit. What we have settled is written down — start a new ` +
    `conversation and I will pick it up from the record.`
  )
}

/** The reason a guarded turn's terminal event names. */
export const BUDGET_STOP_REASON = 'context_budget'

/**
 * The terminal meta a client sees for a turn stopped for want of room, or `null`
 * where this turn was not one.
 *
 * NAMED AT THE HOST, BECAUSE THE MANAGER CANNOT CARRY IT. {@link budgetDoneEvent}
 * puts `stop_reason` on the ADAPTER's terminal event, and the manager does not
 * forward it: it reads `interrupted`, `occupancy_tokens` and the spend keys off
 * that meta and emits a terminal event of its own. That is the right shape for
 * upstream — an adapter's private vocabulary is not the session model's — and it
 * means the reason has to be re-stated above the manager for the client to read
 * one.
 *
 * DERIVED FROM THE SAME TWO NUMBERS THE GUARD FIRES ON, never guessed: a turn the
 * manager closed `aborted` whose last measured request was at or over the ceiling
 * is this guard's stop and cannot be anything else.
 *
 * AND THE OCCUPANCY IS RE-MEASURED FROM `requests`, which is the list the manager
 * DOES forward — it folds the adapter's spend onto its terminal event, and the
 * per-request usage records ride that fold. `occupancy_tokens` is read first for
 * the caller that has the adapter's own meta in hand; the fold is what makes this
 * work above the manager, which is where the client's event comes from. Either
 * way it is {@link lastOccupancy}: the last record, never their sum.
 *
 * ONE REASON FOR BOTH HALVES. The pre-turn refusal names the same
 * {@link BUDGET_STOP_REASON} directly, so a client reads one outcome whichever
 * moment the guard fired at — which is what it wants, because the distinction is
 * ours and not its.
 */
export function budgetStopMeta(
  lib: Untyped,
  meta: Record<string, unknown> | undefined,
  ceiling: number,
): Record<string, unknown> | null {
  if (!meta || meta.status !== 'aborted') return null
  const requests = Array.isArray(meta.requests) ? (meta.requests as unknown[]) : []
  const occupancy =
    Math.trunc(Number(meta.occupancy_tokens) || 0) || lastOccupancy(lib, requests)
  if (!overBudget(occupancy, ceiling)) return null
  return { ...meta, stop_reason: BUDGET_STOP_REASON, occupancy_tokens: occupancy }
}

/**
 * The terminal event a stopped turn ends on.
 *
 * `interrupted` SO THE MANAGER CLOSES IT `aborted`, which is the honest status:
 * the turn neither finished its work nor broke. It is also what makes the next
 * turn's [[BUG-121]] signal fire, so the session is told its previous turn was cut
 * short instead of having to infer it.
 *
 * THE SPEND RIDES IT ([[REQ-292]]), and that is the whole reason the guard closes
 * the turn properly instead of the host walking away from the stream. The manager
 * reads `{usage, requests}` off the backend's own terminal event and puts them on
 * its `turn_end` record and on the terminal event the host meters from; a turn
 * abandoned mid-generation produces none of that, and the requests already sent
 * are then accounted for nowhere. A turn that was cut off is exactly the turn
 * whose cost someone will ask about.
 */
export function budgetDoneEvent(
  lib: Untyped,
  records: readonly unknown[],
  occupancy: number,
): StreamEvent {
  return {
    kind: DONE,
    content: '',
    meta: {
      interrupted: true,
      stop_reason: BUDGET_STOP_REASON,
      ...lib.turnUsage([...records]),
      ...(occupancy > 0 ? { occupancy_tokens: occupancy } : {}),
    },
  }
}

/**
 * The same backend, with its tool loop held to {@link backendCeiling}.
 *
 * WHERE THE CHECK GOES, AND WHY THERE. A tool-activity event is the one moment
 * the host can be certain a request has completed AND another is about to be
 * sent: the loop records the assistant message and goes round again precisely
 * when a tool ran. So the reading taken there is "what the last request carried",
 * and the request it is used to judge is the next one, which is strictly larger.
 *
 * STOPPING IS ABANDONING THE INNER GENERATOR, deliberately, and it is what makes
 * the refusal real rather than cosmetic. `interrupt(ref)` would not do: the
 * loop polls cancellation between DELTAS, so a cancelled turn still builds and
 * SENDS the next request and learns it was too large from the provider — which is
 * the failure being removed. Returning the inner generator stops it between two
 * requests, before the oversized one exists.
 *
 * WHAT THAT COSTS, stated because it is a real consequence and not a detail: the
 * iteration in flight never reaches `wire.record`, so the assistant's tool call
 * and its results do not join the backend's segment state. They are dropped
 * TOGETHER, which is the invariant that matters — an orphaned `tool_result` is
 * what the API rejects — and the next turn on a warm segment then carries two
 * consecutive `user` messages, which the provider accepts. Any tool calls of that
 * same iteration this host had not yet reached are never run, which is the right
 * direction for a turn being stopped for want of room.
 *
 * A PROXY RATHER THAN A SUBCLASS OR A WRAPPER OBJECT. The adapter is loaded at
 * runtime out of the shared store, so there is no class here to extend at module
 * scope; and a hand-written wrapper would have to mirror the whole backend port —
 * `startSegment`, `resume`, `interrupt`, `usage`, `capabilities`, `contextWindow`
 * — and would silently stop forwarding the day upstream adds to it. This forwards
 * everything and overrides one method.
 *
 * IT GUARDS `promptStream` AND NOTHING ELSE, which covers every turn this system
 * runs: `SessionManager.prompt` is `collect(manager.promptStream(...))` and the
 * manager reaches its backend only through `promptStream`, so both the
 * consultant's streamed turns and a delegated worker's whole-turn call arrive
 * here. The adapter's own `prompt` is the one door past it, and nothing calls it.
 */
export function guardTurn(
  lib: Untyped,
  backend: Untyped,
  { fraction = TURN_BUDGET_FRACTION }: { fraction?: number } = {},
): Untyped {
  async function* guarded(
    ref: string,
    content: unknown,
    opts: Record<string, unknown> = {},
  ): AsyncGenerator<StreamEvent> {
    const ceiling = backendCeiling(backend, fraction)
    // The segment's ledger holds every request ever sent on it, so this turn's
    // share is what arrives after this mark. Without it the guard would judge a
    // long conversation by a figure from a turn that has already ended, and the
    // spend on the terminal event would claim the whole segment.
    const before = ceiling > 0 ? backend.usage(ref).length : 0
    const events = backend.promptStream(ref, content, opts) as AsyncGenerator<StreamEvent>
    if (ceiling <= 0) {
      yield* events
      return
    }
    for await (const event of events) {
      yield event
      if (event.kind !== TOOL_ACTIVITY) continue
      const mine = backend.usage(ref).slice(before)
      const occupancy = lastOccupancy(lib, mine)
      if (!overBudget(occupancy, ceiling)) continue
      // The sentence first, so the client is told why the reply stops where it
      // does; the terminal event second, carrying what the turn spent getting
      // there. Then the inner loop is finalised, which is what guarantees the
      // next request is never built.
      yield { kind: TEXT, content: `\n\n${budgetStopNotice(occupancy, backend.contextWindow)}` }
      yield budgetDoneEvent(lib, mine, occupancy)
      await events.return(undefined as never)
      return
    }
  }

  return new Proxy(backend, {
    get(target: Untyped, property: string | symbol): unknown {
      if (property === 'promptStream') return guarded
      const value = Reflect.get(target, property, target)
      // Bound to the TARGET, not to the proxy: the adapter keeps its segment
      // state in its own maps and none of it expects to be reached through this.
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
