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

/** What the host sends the model — the half of a turn a test can assert on. */
export interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
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
