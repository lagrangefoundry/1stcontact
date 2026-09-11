/**
 * The ONE model double every chat-host suite installs (BUG-39).
 *
 * WHY IT LIVES HERE. The Anthropic client is the single boundary these suites
 * are allowed to fake — it is the network, and it is the seam the AI library's
 * own backend is written to have injected. Everything on this side of it (the
 * session manager, the role assembly, the tool loop, the tool handlers, the
 * `edit.ts` writes, the SSE framing) is the real thing, in every runtime.
 *
 * So the double is a TRANSCRIPTION OF A WIRE PROTOCOL, and a transcription is
 * the kind of thing that drifts. It did: the backend moved to `stream: true`,
 * the workerd suite was written afterwards and followed it, and three Node
 * suites kept handing back a finished `{content: [...]}` message that the
 * accumulator never reads — so their turns completed having seen no text and no
 * tool call, and fifteen assertions failed on the assistant's half of the turn
 * simply not existing. Four hand-maintained copies is how that happened; one is
 * the fix, because the next upstream protocol change now breaks one place.
 *
 * THE CONTRACT, precisely. `ClaudeAPIBackend._callModel` calls
 * `client.messages.create({..., stream: true})` and treats the result as an
 * ASYNC ITERABLE of raw Anthropic events. `AnthropicAccumulator` reassembles a
 * message from `content_block_start` / `content_block_delta` /
 * `content_block_stop`: text arrives as `text_delta` and is emitted to the
 * consumer as it comes, tool arguments arrive as `input_json_delta` fragments
 * and are parsed at `content_block_stop`. Anything else — most temptingly a
 * finished message — is a different contract from the one production uses, and
 * a test written against it is asserting against a fiction.
 */

/** One Anthropic system block: a run of the system prompt, maybe cached. */
export interface SystemBlock {
  type: 'text'
  text: string
  cache_control?: Record<string, unknown>
}

/** What the host sends the model — the half of a turn a test can assert on. */
export interface ModelRequest {
  /**
   * The assembled priming — a string, OR a list of blocks.
   *
   * TWO SHAPES, AND BOTH ARE PRODUCTION (BUG-63). Upstream sends one string
   * where the turn has no usable cache breakpoint, and an array of `text`
   * blocks — split at the priming's cache boundary, the earlier ones carrying
   * `cache_control` — where it has one. Which one a given turn gets is a
   * property of the tier's boundary, not of the test, so an assertion that
   * indexes into a string is asserting against whichever shape happened to
   * come back that day. Read it through {@link systemText}.
   *
   * THE REMINDER IS NO LONGER IN HERE ([[BUG-83]]). It was, and this field's
   * documentation said so, and eleven assertions across seven suites read it
   * here until they all went red at once. Upstream moved it: the reminder and
   * the volatile seed are appended to the tail of the last user MESSAGE instead,
   * so that no cache marker can land on a block guaranteed to differ next turn.
   * Same words, same point in the conversation, a different field. Read it
   * through {@link turnTailText}, or {@link sentText} when the question is
   * merely whether the model was told something.
   */
  system: string | SystemBlock[]
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
  /**
   * The two settings the backend was CONSTRUCTED with, as they reach the wire
   * (BUG-67).
   *
   * Declared here because they are the whole evidence for a configuration
   * question — "which model is this project running, and how much room does one
   * reply get" is answerable only from the request, and BUG-67 is what happens
   * when nobody looks: a 4096 ceiling nothing in the repository named, cutting
   * tool arguments mid-JSON. Optional because a double may be constructed for a
   * suite that has no interest in either.
   */
  model?: string
  max_tokens?: number
}

/**
 * The system prompt as one string, whichever shape it arrived in.
 *
 * The blocks are consecutive slices of a single assembled string — upstream
 * cuts it at the cache breakpoints and marks the prefix — so concatenating them
 * reproduces it exactly, separator and all. Nothing here is normalised beyond
 * that: a test asserting on ORDER is asserting on offsets in this string.
 */
export function systemText(req: ModelRequest): string {
  return typeof req.system === 'string' ? req.system : req.system.map((b) => b.text).join('')
}

/**
 * The per-turn tail: the last user message, where the reminder now rides.
 *
 * WHY THE WHOLE MESSAGE AND NOT THE TAIL ALONE. Upstream appends the tail to the
 * user's own text with a blank line between them, and once joined there is no
 * marker to cut on — so this returns the message and lets the assertion say what
 * it is looking for. That costs nothing: a test asking whether the reminder is
 * here is asking `toContain`, and the user's turn is a sentence the suite wrote
 * itself.
 *
 * Empty when the request has no trailing user message, which is what a caller
 * asserting ABSENCE wants: nothing found, rather than a throw that reads like a
 * different bug.
 */
export function turnTailText(req: ModelRequest): string {
  const last = req.messages[req.messages.length - 1]
  if (!last || last.role !== 'user') return ''
  return contentText(last.content)
}

/** Message content as text, whether it arrived as a string or as blocks (REQ-111). */
function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((block) =>
      block && typeof block === 'object' && typeof (block as { text?: unknown }).text === 'string'
        ? (block as { text: string }).text
        : '',
    )
    .join('\n')
}

/**
 * Everything the model was sent on this request: the priming and the per-turn tail.
 *
 * THE READER FOR "WAS THE MODEL TOLD THIS". Most assertions are about delivery
 * and not about position — that the session knows which site it is on, that it
 * was handed the change signal — and those should not have to know which field
 * upstream currently carries the reminder in, because that has now moved once
 * and may move again. A suite whose subject genuinely IS the position (where the
 * cache boundary falls, what is re-sent per turn) reads the two halves
 * separately and is meant to.
 */
export function sentText(req: ModelRequest): string {
  return [systemText(req), turnTailText(req)].filter(Boolean).join('\n\n')
}

/** One Anthropic streaming event, as the SDK emits them. */
export type WireEvent = Record<string, unknown>

/** One scripted answer: the events the model streams for a single call. */
export type ModelStep = (req: ModelRequest) => WireEvent[]

/** A client, in the shape the backend's injected `client` seam expects. */
export interface ScriptedClient {
  /** Every request the host made, in order — the recording half of the evidence. */
  seen: ModelRequest[]
  messages: { create: (req: ModelRequest) => Promise<AsyncGenerator<WireEvent>> }
}

/**
 * A client that answers with a scripted sequence of STREAMS and records
 * everything it was asked.
 *
 * The recording is half the evidence: what the model is SENT — the assembled
 * priming, the reminder, the tool schemas — is produced by the host and is
 * exactly the thing that silently rots.
 *
 * The last script step repeats, so a tool loop that runs an extra iteration
 * fails an assertion rather than hanging or crashing.
 */
export function scriptedClient(steps: ModelStep[]): ScriptedClient {
  const seen: ModelRequest[] = []
  let index = 0
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const step = steps[Math.min(index, steps.length - 1)]
        index += 1
        const events = step(req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}

/** Prose, as one text block streamed in a single delta. */
export const says =
  (text: string): ModelStep =>
  () => [
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    { type: 'content_block_stop', index: 0 },
  ]

/** A tool call, with its arguments streamed as partial JSON like the real wire. */
export const calls =
  (name: string, input: Record<string, unknown>): ModelStep =>
  () => [
    {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'tool_use', id: `call-${name}`, name },
    },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) },
    },
    { type: 'content_block_stop', index: 0 },
  ]

/** A scripted client whose answer stops half-way until the test lets it finish. */
export interface PacedClient extends ScriptedClient {
  /** Resolves once the first half has been streamed and consumed. */
  reached: Promise<void>
  /** Release the second half. */
  release(): void
}

/**
 * A client that streams `first`, WAITS, then streams `rest` (BUG-46).
 *
 * WHY PACING IS THE WHOLE TEST APPARATUS HERE. The defect is a state that exists
 * only between `turn_start` and `turn_end` — the archive is missing the open
 * turn by design, so what a page load paints mid-turn is a different answer from
 * what it paints afterwards. A double that answers instantly never produces that
 * state, so a suite built on {@link scriptedClient} alone could assert the fix
 * and still pass against the bug. Holding the model open is what makes "during a
 * turn" a thing a test can be inside of.
 *
 * IT EXTENDS THE SHARED DOUBLE RATHER THAN FORKING IT, for the reason that
 * module's header gives at length: the streaming shape here is a transcription
 * of Anthropic's wire protocol, and the last time there were four copies of it,
 * three fell behind and their turns silently completed having seen no text. This
 * is a fifth USE of that protocol and must not become a fifth transcription — so
 * it emits the same three event types {@link says} does, in the same order, and
 * differs only in where it pauses.
 *
 * `reached` resolves when the consumer comes back for the event AFTER the first
 * delta, which is the point at which that delta is durably in the junction —
 * appended by `promptStream` before it yields. Waiting on it is therefore
 * waiting for "the turn has said something", not for a timer.
 */
export function pacedClient(first: string, rest: string): PacedClient {
  const seen: ModelRequest[] = []
  let release = (): void => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let arrive = (): void => {}
  const reached = new Promise<void>((resolve) => {
    arrive = resolve
  })
  return {
    seen,
    reached,
    release: () => release(),
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        return (async function* () {
          yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
          yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: first } }
          arrive()
          await gate
          yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: rest } }
          yield { type: 'content_block_stop', index: 0 }
        })()
      },
    },
  }
}
