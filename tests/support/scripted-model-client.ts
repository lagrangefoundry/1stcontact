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

/**
 * What the host sends the model — the half of a turn a test can assert on.
 *
 * `system` is a STRING or a list of `{type: 'text', text}` blocks: the backend
 * splits it at the priming's cache boundaries and sends blocks when there is one
 * to declare. A test asking what the model was told reads {@link modelSaw}
 * rather than either shape by hand.
 */
export interface ModelRequest {
  system: string | { type: string; text?: string }[]
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/** Flatten one wire content value — string, or a list of text blocks — to text. */
function textOf(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((block) =>
      block && typeof block === 'object' && 'text' in block
        ? String((block as { text: unknown }).text ?? '')
        : '',
    )
    .join('\n')
}

/**
 * EVERYTHING the model was sent on one request, as one string.
 *
 * The per-turn reminder is not a field of its own. It rides the TAIL of the last
 * message (the library's REQ-144): appended past the history rather than in front
 * of it, so no cache breakpoint ever lands on a block guaranteed to differ next
 * turn. It used to ride `system`, and a suite that still reads only `system` is
 * asserting against a placement the library has moved — which is silent, because
 * "the signal is absent" is what half of these assertions want to see.
 *
 * Reading the whole request is deliberately placement-agnostic: what a reminder
 * assertion is actually about is whether the model was told, not which field
 * carried it, and that property survives the next time upstream moves the tail.
 */
export function modelSaw(req: ModelRequest): string {
  return [textOf(req.system), ...req.messages.map((message) => textOf(message.content))].join('\n\n')
}

/** One Anthropic streaming event, as the SDK emits them. */
export type WireEvent = Record<string, unknown>

/**
 * One scripted answer: the events the model streams for a single call.
 *
 * An ASYNC ITERABLE is allowed beside the plain array so a step can stall
 * part-way through a turn ({@link stalls}) — a real stream arrives over time, and
 * a case about what is true WHILE a turn is in flight has no other way to hold
 * one open. The transcription itself stays in this file either way, which is the
 * rule BUG-39 exists to keep.
 */
export type ModelStep = (req: ModelRequest) => WireEvent[] | AsyncIterable<WireEvent>

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
          // `for await` over the plain-array case is the same loop it always
          // was; it additionally accepts a step that produces its events over
          // time, which is what {@link stalls} needs.
          for await (const event of events) yield event
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

/** A turn held open part-way through, and the two handles that control it. */
export interface StalledStep {
  step: ModelStep
  /**
   * Resolves once the host has consumed the assistant text and asked for more —
   * i.e. the turn is genuinely IN FLIGHT: begun, not finished, nothing about it
   * yet complete.
   */
  entered: Promise<void>
  /**
   * Let the stalled turn run to completion. Call it in a `finally`: a step left
   * stalled leaves the request that is awaiting it pending for the rest of the
   * run.
   */
  release(): void
}

/**
 * Prose that STOPS PART-WAY: the text streams, then the turn hangs until released.
 *
 * The one thing an instantaneous double cannot express, and the only way to
 * observe what is true of a conversation *while a turn is in flight* — which is
 * the whole of the junction's claim (AC-1057): the tier in front of the store
 * holds the turn being spoken, the store holds the conversation, and losing the
 * host in between costs the first and not the second. Against a double that
 * answers before the client can read a byte, a turn is complete and drained
 * before any "mid-turn" instant exists to look at.
 *
 * The events are the same three `says` emits, in the same order — this stalls the
 * stream, it does not invent a different one.
 */
export function stalls(text: string): StalledStep {
  let enter!: () => void
  const entered = new Promise<void>((resolve) => {
    enter = resolve
  })
  let open!: () => void
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })

  const step: ModelStep = () =>
    (async function* () {
      yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }
      // Reached only when the host comes back for the next event, so by here the
      // delta has been consumed and the turn is under way.
      enter()
      await gate
      yield { type: 'content_block_stop', index: 0 }
    })()

  return { step, entered, release: () => open() }
}

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
