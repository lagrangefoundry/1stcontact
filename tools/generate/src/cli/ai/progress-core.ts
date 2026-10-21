/**
 * [[REQ-360]] — a delegated build says it is still going, on the turn the client
 * is reading. [[REQ-416]] — and so does what it is doing, and the talker beside it.
 *
 * WHY THE HOST HAS TO DO THIS. lagrange-framework REQ-205 makes the delegation
 * runtime record a `progress` record on the caller's open round every interval a
 * worker runs — `still working, elapsed N min`. It records it on the JUNCTION,
 * and only `manager.watch` yields it. The round's own `promptStream`, which is
 * what `/api/ai/prompt` streams to the client, is parked inside the `Delegate`
 * call for the whole build and yields nothing until it returns. So without this,
 * the heartbeat reaches a client that reloaded and nobody else — which is the
 * client who already knew something was happening.
 *
 * WHAT IT DOES. Reads the junction forward from where the turn started, on the
 * manager's own poll cadence, while the turn's stream is pending, and puts each
 * new `progress` record into the stream as a `progress` event. A batch holding
 * several yields only the latest: the status says what is under way now, and an
 * older line is simply wrong.
 *
 * [[REQ-416]] — THE TALKER RIDES THE SAME READ. A message the client writes while
 * the consultant builds opens a talker round beside it (lagrange-framework
 * REQ-210), in THIS isolate, because the fork is the worker's backend state and
 * only this isolate holds it. Its records land on the same junction, so the same
 * read finds them and puts them on the stream the client is holding, as
 * {@link TALKER} events. `tick` is called on every poll — which is where the host
 * takes the client's waiting messages and opens the talker — and `settle` is
 * awaited after the turn's own stream ends, still reading, so a talker reply that
 * outlives its worker is not cut off.
 *
 * WHAT IT DOES NOT CHANGE. A consumer that walks away mid-build is noticed sooner
 * — on the next heartbeat rather than when the build returns — but the turn is
 * not cut short for it: the pending step is allowed to finish before the turn's
 * stream is closed, exactly as it was when nothing could be written to a gone
 * consumer until the build came back.
 *
 * NO LIBRARY IMPORT, for `budget-core.ts`'s reason: both hosts load this.
 */

import type { StreamEvent } from './budget-core'

/** The framework's record kind and this host's event kind for "still working". */
export const PROGRESS = 'progress'

/**
 * [[REQ-416]] — the event kind a talker round's records travel as: `meta.event`
 * is `start`, `text` or `done`, `meta.turn_id` the talker round, and
 * `meta.message_id` the client's waiting message it answers, where the host knows
 * it. [[BUG-240]] — `start` carries `cued` for a round the host opened on a cue,
 * and `done` carries `passed` for a round that had nothing to add.
 */
export const TALKER = 'talker'

/** Who wrote a `progress` record: the model's own words, or the host's heartbeat. */
const MODEL = 'model'

/** The part of a junction this reads: records from a cursor, and where it ends. */
export interface ProgressLog {
  size(): number
  readFrom(cursor: number): [Array<Record<string, unknown>>, number]
}

/**
 * A junction `progress` record as the event the panel's status widget reads
 * (lagrange-framework REQ-209).
 *
 * [[BUG-215]] — A HEARTBEAT HAS NO WORDS. The framework's own text is plumbing
 * (`still working, elapsed N min`), so a host-sourced record keeps the stream
 * alive and says how long, and carries nothing to show. A model-sourced record is
 * the consultant's own line — "The consultant is building …" — and is shown.
 */
export function progressEvent(record: Record<string, unknown>): StreamEvent {
  const source = String(record.source ?? '')
  const eta = Number(record.eta_s ?? 0)
  return {
    kind: PROGRESS,
    content: source === MODEL ? String(record.content ?? '') : '',
    meta: {
      source,
      turn_id: String(record.turn_id ?? ''),
      ...(record.started_at ? { started_at: String(record.started_at) } : {}),
      ...(eta > 0 ? { eta_s: eta } : {}),
      elapsed_s: Number(record.elapsed_s ?? 0),
    },
  }
}

/**
 * [[REQ-416]] — the talker rounds on one junction, and their records as
 * {@link TALKER} events.
 *
 * A round is a talker's when its `turn_start` names the worker it was forked from
 * (`fork_of`), or when the host already knows its id because it opened it. Every
 * other record is somebody else's and answers `null`.
 */
export class TalkerFrames {
  private readonly rounds = new Map<string, string>()

  /** The talker round `turnId` answers the client's waiting message `messageId`. */
  follow(turnId: string, messageId: string): void {
    this.rounds.set(turnId, messageId)
  }

  /** Whether `record` belongs to a talker round. */
  owns(record: Record<string, unknown>): boolean {
    const turnId = String(record.turn_id ?? '')
    if (turnId === '') return false
    if (record.kind === 'turn_start' && record.fork_of && !this.rounds.has(turnId)) this.rounds.set(turnId, '')
    return this.rounds.has(turnId)
  }

  /** `record` as a talker event, or `null` when it is not one the panel draws. */
  frame(record: Record<string, unknown>): StreamEvent | null {
    if (!this.owns(record)) return null
    const turnId = String(record.turn_id)
    const messageId = this.rounds.get(turnId) ?? ''
    const meta = (event: string, more: Record<string, unknown> = {}): Record<string, unknown> => ({
      event,
      turn_id: turnId,
      ...(messageId ? { message_id: messageId } : {}),
      ...more,
    })
    // [[BUG-240]] — A CUED ROUND answers no message the client sent (its
    // `turn_start` carries no content), and a round that PASSED said nothing:
    // both are said, so the panel draws a cued reply on its own and a pass not at all.
    if (record.kind === 'turn_start') {
      return {
        kind: TALKER,
        content: '',
        meta: meta('start', { said: contentText(record.content), ...(record.cued ? { cued: true } : {}) }),
      }
    }
    if (record.kind === 'delta') return { kind: TALKER, content: String(record.content ?? ''), meta: meta('text') }
    if (record.kind === 'turn_end') {
      return {
        kind: TALKER,
        content: '',
        meta: meta('done', { status: String(record.status ?? ''), ...(record.passed ? { passed: true } : {}) }),
      }
    }
    return null
  }
}

/** What the client said, from a `turn_start`'s content: text, or text blocks. */
function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b) => b && typeof b === 'object' && (b as { type?: string }).type === 'text')
      .map((b) => String((b as { text?: unknown }).text ?? ''))
      .join(' ')
  }
  return ''
}

/** [[REQ-416]] — what the host does beside a turn's stream; see {@link withProgress}. */
export interface Beside {
  talkers: TalkerFrames
  /** Called on every poll. Must not throw. */
  tick(): Promise<void>
  /** Resolves when nothing the host started beside the turn is still running. */
  settle(): Promise<void>
}

/**
 * `events`, with every `progress` record — and, beside a turn that can be forked,
 * every talker record — the junction gains while they run put in among them.
 *
 * `log` is read from its size when this starts, which is before `events` has
 * taken its first step — so the turn's own records are all in range and nothing
 * from an earlier turn is.
 */
export async function* withProgress(
  events: AsyncIterable<StreamEvent>,
  log: ProgressLog,
  pollMs: number,
  beside: Beside | null = null,
): AsyncGenerator<StreamEvent> {
  const it = events[Symbol.asyncIterator]()
  let at = log.size()
  let pending: Promise<IteratorResult<StreamEvent>> | null = null
  let finished = false
  // DRAINED BEFORE ANY EVENT IS PASSED ON, so a heartbeat written during a build
  // arrives ahead of the `tool_activity` that reports the build's end, and a
  // talker's reply is in order with what the worker said around it.
  function* drain(): Generator<StreamEvent> {
    const [records, next] = log.readFrom(at)
    at = next
    let latest: Record<string, unknown> | null = null
    for (const record of records) {
      if (record.kind === PROGRESS) {
        latest = record
        continue
      }
      const talker = beside?.talkers.frame(record)
      if (talker) yield talker
    }
    if (latest) yield progressEvent(latest)
  }
  const pause = (): { tick: Promise<null>; cancel: () => void } => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), pollMs)
    })
    return { tick, cancel: () => clearTimeout(timer) }
  }
  try {
    for (;;) {
      pending ??= it.next()
      const wait = pause()
      const step = await Promise.race([pending, wait.tick])
      wait.cancel()
      if (step === null) await beside?.tick()
      yield* drain()
      if (step === null) continue
      pending = null
      if (step.done) {
        finished = true
        break
      }
      yield step.value
    }
    // [[REQ-416]] — THE TURN'S STREAM IS OVER, BUT A TALKER IT OPENED MAY NOT BE:
    // one that was waiting when the worker closed runs as the next round, and the
    // client is still holding this stream for it.
    if (beside) {
      let settled = false
      const done = beside.settle().then(() => {
        settled = true
      })
      while (!settled) {
        const wait = pause()
        await Promise.race([done, wait.tick])
        wait.cancel()
        yield* drain()
      }
      yield* drain()
    }
  } finally {
    if (!finished) {
      if (pending) await pending.catch(() => undefined)
      await it.return?.()
    }
  }
}
