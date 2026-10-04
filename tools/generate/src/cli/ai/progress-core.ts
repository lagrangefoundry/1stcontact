/**
 * [[REQ-360]] — a delegated build says it is still going, on the turn the client
 * is reading.
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
 * several yields only the latest: the line says how long it has been, and an
 * older figure is simply wrong.
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

/** The part of a junction this reads: records from a cursor, and where it ends. */
export interface ProgressLog {
  size(): number
  readFrom(cursor: number): [Array<Record<string, unknown>>, number]
}

/** A junction `progress` record as the event the panel reads. */
export function progressEvent(record: Record<string, unknown>): StreamEvent {
  return {
    kind: PROGRESS,
    content: String(record.content ?? ''),
    meta: { elapsed_s: Number(record.elapsed_s ?? 0) },
  }
}

/** The latest `progress` record in `records`, or null. */
function latestProgress(records: Array<Record<string, unknown>>): Record<string, unknown> | null {
  let latest: Record<string, unknown> | null = null
  for (const record of records) if (record.kind === PROGRESS) latest = record
  return latest
}

/**
 * `events`, with every `progress` record the junction gains while they run put in
 * among them.
 *
 * `log` is read from its size when this starts, which is before `events` has
 * taken its first step — so the turn's own records are all in range and nothing
 * from an earlier turn is.
 */
export async function* withProgress(
  events: AsyncIterable<StreamEvent>,
  log: ProgressLog,
  pollMs: number,
): AsyncGenerator<StreamEvent> {
  const it = events[Symbol.asyncIterator]()
  let at = log.size()
  let pending: Promise<IteratorResult<StreamEvent>> | null = null
  let finished = false
  try {
    for (;;) {
      pending ??= it.next()
      let timer: ReturnType<typeof setTimeout> | undefined
      const tick = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), pollMs)
      })
      const step = await Promise.race([pending, tick])
      clearTimeout(timer)
      // DRAINED BEFORE THE EVENT IS PASSED ON, so a heartbeat written during a
      // build arrives ahead of the `tool_activity` that reports the build's end.
      const [records, next] = log.readFrom(at)
      at = next
      const latest = latestProgress(records)
      if (latest) yield progressEvent(latest)
      if (step === null) continue
      pending = null
      if (step.done) {
        finished = true
        return
      }
      yield step.value
    }
  } finally {
    if (!finished) {
      if (pending) await pending.catch(() => undefined)
      await it.return?.()
    }
  }
}
