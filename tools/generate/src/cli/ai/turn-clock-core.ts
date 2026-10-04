/**
 * [[BUG-168]] — how long a conversation turn may run, and what it says when it
 * runs out.
 *
 * TWO HALVES OF ONE DECISION. {@link TURN_TIMEOUT_SECONDS} is the ceiling, and
 * `turn-clock.json` gives the reason for its value. {@link narrateExhaustion} is
 * what happens at that ceiling, because any ceiling can be reached. The library
 * no longer throws at its clock (framework REQ-181). It ends the round with
 * `exhausted` and says which budget ran out, and it counts that as a completed
 * turn. That fixed the thrown error, but the turn still ended without saying
 * anything. The reply just stopped after its last tool call, and the turn's
 * work, a delegated worker's report above all, went unmentioned. The next turn
 * could not see it either: the transcript a turn reads back is prose, and tool
 * results are not in it. So the next turn opened by re-reading the change
 * record to find out what its own previous turn had done, which is the
 * expensive direction.
 *
 * NO FILESYSTEM AND NO LIBRARY IMPORT, for `budget-core.ts`'s reason: both hosts
 * load this.
 */

import turnClockDocument from './turn-clock.json'
import { DONE, TEXT, TOOL_ACTIVITY, type StreamEvent } from './budget-core'

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The wall clock one consultant or settings turn is given, in seconds. */
export const TURN_TIMEOUT_SECONDS: number = turnClockDocument.turn_timeout_seconds

/** The delegation surface's tool, as the model calls it. */
export const DELEGATE_TOOL = 'Delegate'

/** How much of one worker's summary the account quotes. */
const SUMMARY_CAP = 400

/**
 * The markers the library's Toolbox wraps third-party text in
 * (`toolbox/provenance.js`). They are not exported from the package, and the
 * manual the model reads defines them, so the spelling is fixed.
 */
const UNTRUSTED_OPEN = '<<<untrusted>>>'
const UNTRUSTED_CLOSE = '<<</untrusted>>>'

/**
 * A `Delegate` call's result, out of its output, or `null`.
 *
 * The Toolbox renders results as JSON text and fences the delegation result as
 * untrusted: the worker is a model that read site and third-party text, so its
 * words are data. Either shape is read. Anything that does not parse gives
 * `null`, because making up a result would be worse than leaving it out.
 */
export function delegationResult(output: unknown): { result: Record<string, unknown>; untrusted: boolean } | null {
  let result = output
  let untrusted = false
  if (typeof result === 'string') {
    let body = result.trim()
    if (body.startsWith(UNTRUSTED_OPEN) && body.endsWith(UNTRUSTED_CLOSE)) {
      untrusted = true
      body = body.slice(UNTRUSTED_OPEN.length, -UNTRUSTED_CLOSE.length)
    }
    try {
      result = JSON.parse(body)
    } catch {
      return null
    }
  }
  return typeof result === 'object' && result !== null ? { result: result as Record<string, unknown>, untrusted } : null
}

/**
 * What a worker reported, out of a `Delegate` call's output, or `null`.
 *
 * THE FENCE TRAVELS WITH THE QUOTE. The account is recorded as the assistant's
 * own prose, and quoting a fenced summary there without its markers would pass
 * text the Toolbox marked as data off as the consultant's own words to the next
 * turn. That would get around the Toolbox's provenance marking. So an untrusted
 * result is quoted still fenced.
 */
function workerSummary(output: unknown): { text: string; untrusted: boolean } | null {
  const parsed = delegationResult(output)
  if (!parsed) return null
  const { untrusted } = parsed
  const summary = parsed.result.summary
  if (typeof summary !== 'string' || summary.trim() === '') return null
  const flat = summary.replace(/\s+/g, ' ').trim()
  const text = flat.length > SUMMARY_CAP ? `${flat.slice(0, SUMMARY_CAP - 1)}…` : flat
  return { text, untrusted }
}

/** One hand-off, as a line of the account. */
function handOffLine(output: unknown): string {
  const summary = workerSummary(output)
  if (!summary) return '- handed off work'
  const quoted = summary.untrusted
    ? `${UNTRUSTED_OPEN} ${summary.text} ${UNTRUSTED_CLOSE}`
    : summary.text
  return `- handed off work, and the worker reported: ${quoted}`
}

/**
 * The paragraph a turn that ran out of budget ends on.
 *
 * WRITTEN TO TWO READERS AT ONCE, the client and the next turn, because it is
 * one piece of text in the transcript. The first sentence is for the client:
 * what happened, and that nothing is lost. The list is for both of them. It
 * says what the turn did, which is the part neither of them could otherwise
 * see. It is taken from the tool calls the turn actually ran, never from what
 * the model meant to do.
 *
 * Hand-offs are listed one by one with the worker's own summary, because those
 * are the long, expensive runs whose results the turn never got to relay. Every
 * other tool is only counted. Each of those calls is small and the change
 * record already holds their detail; the count is enough to show there is more
 * to find.
 */
export function exhaustionNotice(
  by: string,
  timeoutSeconds: number,
  activity: readonly { name: string; output: unknown }[],
): string {
  const limit =
    by === 'time'
      ? `its ${Math.round(timeoutSeconds / 60)}-minute time limit`
      : 'its limit on tool calls'
  const lines = [
    `_This reply reached ${limit} before I could finish it. What I did is saved._`,
  ]
  const handOffs = activity.filter((a) => a.name === DELEGATE_TOOL)
  const others = new Map<string, number>()
  for (const a of activity) {
    if (a.name !== DELEGATE_TOOL) others.set(a.name, (others.get(a.name) ?? 0) + 1)
  }
  if (handOffs.length > 0 || others.size > 0) {
    lines.push('', 'Before stopping, this reply:')
    for (const handOff of handOffs) lines.push(handOffLine(handOff.output))
    if (others.size > 0) {
      const counted = [...others].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
      lines.push(`- also ran ${counted.join(', ')}`)
    }
  }
  lines.push('', 'Ask me to carry on and I will pick up from here.')
  return lines.join('\n')
}

/**
 * The same backend, ending an exhausted turn with {@link exhaustionNotice}.
 *
 * INSIDE THE BACKEND'S STREAM AND AHEAD OF ITS TERMINAL EVENT, and that
 * position is the whole point. The manager records any text a backend yields as
 * the assistant's own words. So the paragraph goes live to the client, stays in
 * the transcript on reload, and is part of the conversation the next turn reads
 * back. A notice added above the manager would reach the client and nobody else.
 *
 * WRAPPED ONLY ON THE CALLER'S BACKENDS, the consultant's and the settings
 * assistant's. A worker's prose never reaches a client, and its exhaustion
 * already comes back to its caller as the delegation's own `exhausted` outcome.
 *
 * A PROXY, for `guardTurn`'s reason: the adapter is loaded at runtime and its
 * port is wider than one method. It is the INNER wrapper, so `guardTurn`'s own
 * stop (which the adapter never reports as exhausted) passes through untouched.
 */
export function narrateExhaustion(backend: Untyped): Untyped {
  async function* narrated(
    ref: string,
    content: unknown,
    opts: Record<string, unknown> = {},
  ): AsyncGenerator<StreamEvent> {
    const activity: { name: string; output: unknown }[] = []
    for await (const event of backend.promptStream(ref, content, opts) as AsyncGenerator<StreamEvent>) {
      if (event.kind === TOOL_ACTIVITY && typeof event.meta?.name === 'string') {
        activity.push({ name: event.meta.name, output: event.meta.output })
      }
      if (event.kind === DONE && event.meta?.exhausted === true) {
        const timeout = Number(opts.timeout) || TURN_TIMEOUT_SECONDS
        const by = String(event.meta.exhausted_by ?? '')
        yield { kind: TEXT, content: `\n\n${exhaustionNotice(by, timeout, activity)}` }
      }
      yield event
    }
  }

  return new Proxy(backend, {
    get(target: Untyped, property: string | symbol): unknown {
      if (property === 'promptStream') return narrated
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
