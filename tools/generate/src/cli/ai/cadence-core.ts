/**
 * [[REQ-379]] — the consultant keeps the client oriented when it goes quiet.
 *
 * WHY THE HOST AND NOT THE PRIMING. A builder session runs inside one of the
 * consultant's tool calls and takes minutes, and for all of them the client sees
 * nothing. Charlie's Plumbing 2 (EPIC-19 Finding 18) had consultant turns of 17,
 * 28 and 10 minutes, and none said beforehand that the consultant was going away,
 * for how long, or that the panel needed the client meanwhile. A priming rule
 * asks for that line and the model forgets it; this makes it hold anyway. The
 * consultant still supplies the words — `Delegate` takes a required `note` — and
 * the host guarantees they are shown, and shown BEFORE the work runs.
 *
 * WHERE IT SITS, and why that is the only place that works. The framework's tool
 * loop yields a `tool_issue` event for a call before it runs it, and the manager
 * records that event and never delivers it — so nothing above the manager can see
 * a call coming. A wrapper on the backend's own stream can, and anything it yields
 * as text the manager records as the assistant's words: shown live, kept in the
 * transcript, and read by the next turn. That is `narrateExhaustion`'s position
 * and its reason (`turn-clock-core.ts`).
 *
 * AND THE OTHER HALF: a builder session that completed having written the site
 * is a milestone the host can see for itself, so it records it on the plan
 * (`builderSessionCompleted`) and the checks it triggers fall due.
 *
 * NO FILESYSTEM AND NO LIBRARY IMPORT, for `budget-core.ts`'s reason: both hosts
 * load this.
 */

import { TEXT, TOOL_ACTIVITY, type StreamEvent } from './budget-core'
import { DELEGATE_TOOL, delegationResult } from './turn-clock-core'

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The framework's "issued, not yet run" event kind (`stream.js`, REQ-175). Not
 * exported from the package's door, so the spelling is fixed here.
 */
export const TOOL_ISSUE = 'tool_issue'

/** The delegation outcome of a worker that finished and reported (`delegation_toolbox.js`). */
const REPORTED = 'reported'

/** The `Delegate` parameter that carries the client's line. */
export const DELEGATE_NOTE = 'note'

/** The `delegate` operation's added parameter, as the model reads it. */
const NOTE_PARAM = {
  type: 'string',
  required: true,
  description:
    'One line the client sees in the chat the moment you hand this off, before the work starts: ' +
    'what is being built and roughly how long it takes — "Building your home page now; it takes ' +
    'about ten minutes." The worker never sees it.',
}

/** What the client is told when a call came without its note. */
export const FALLBACK_NOTE = "I'm going off to build this now — it usually takes a few minutes."

/** The longest a note is shown at, so a brief pasted into it cannot flood the chat. */
const NOTE_CAP = 240

/** `declaration` with the client's note added to `delegate` as a required parameter. */
export function withClientNote(declaration: Untyped): Untyped {
  return {
    ...declaration,
    operations: (declaration.operations ?? []).map((op: Untyped) =>
      op.tool === DELEGATE_TOOL ? { ...op, params: { ...(op.params ?? {}), [DELEGATE_NOTE]: NOTE_PARAM } } : op,
    ),
  }
}

/**
 * The status line the client sees as a builder session starts.
 *
 * THE COUNT IS THE PANEL'S: open asks, nothing else — the same number the panel's
 * own progress line shows — so the two never disagree about what is waiting.
 */
export function statusLine(note: unknown, openAsks: number): string {
  const flat = typeof note === 'string' ? note.replace(/\s+/g, ' ').trim() : ''
  const said = flat === '' ? FALLBACK_NOTE : flat.length > NOTE_CAP ? `${flat.slice(0, NOTE_CAP - 1)}…` : flat
  const meanwhile =
    openAsks > 0
      ? ` Meanwhile, ${openAsks} ${openAsks === 1 ? 'question above needs' : 'questions above need'} you.`
      : ''
  return `_${said.replace(/_/g, '\\_')}_${meanwhile}`
}

/** What the host gives the wrapper. Each is optional; an absent one is a no-op. */
export interface CadenceHooks {
  /** How many asks are open on the panel right now. */
  openAsks?: () => Promise<number>
  /** A builder session completed having written the site. */
  builderCompleted?: () => Promise<void>
}

/**
 * The consultant's backend, telling the client before it goes quiet.
 *
 * ONCE A TURN. The first `Delegate` a turn issues is announced; a later one in the
 * same turn has already been — the client was told the consultant is away.
 *
 * NOTHING HERE FAILS A TURN: a count that cannot be read is a line without the
 * count, and a milestone that cannot be written is a milestone missed.
 */
export function keepClientOriented(backend: Untyped, hooks: CadenceHooks = {}): Untyped {
  async function* oriented(ref: string, content: unknown, opts: Record<string, unknown> = {}): AsyncGenerator<StreamEvent> {
    let announced = false
    let spoke = false
    for await (const event of backend.promptStream(ref, content, opts) as AsyncGenerator<StreamEvent>) {
      if (event.kind === TOOL_ISSUE && event.meta?.name === DELEGATE_TOOL && !announced) {
        announced = true
        let open = 0
        try {
          open = hooks.openAsks ? await hooks.openAsks() : 0
        } catch {
          open = 0
        }
        const input = (event.meta?.input ?? {}) as Record<string, unknown>
        yield { kind: TEXT, content: `${spoke ? '\n\n' : ''}${statusLine(input[DELEGATE_NOTE], open)}\n\n` }
        spoke = true
      }
      if (event.kind === TEXT && event.content) spoke = true
      if (event.kind === TOOL_ACTIVITY && event.meta?.name === DELEGATE_TOOL && hooks.builderCompleted) {
        const result = delegationResult(event.meta?.output)?.result
        if (result?.outcome === REPORTED && result.wrote === true) {
          try {
            await hooks.builderCompleted()
          } catch {
            // A milestone missed is not a turn lost.
          }
        }
      }
      yield event
    }
  }

  return new Proxy(backend, {
    get(target: Untyped, property: string | symbol): unknown {
      if (property === 'promptStream') return oriented
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
