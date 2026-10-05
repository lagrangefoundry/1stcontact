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
 * [[REQ-386]] — AND EVERY OTHER SLOW CALL. Delegation is not the only way to go
 * quiet: one consultant turn ran several `capture_site` calls, two timed out and
 * were tried again, and the client sat through twenty silent minutes. The same
 * position announces each call to a tool `slow-tools.json` lists, in the host's
 * words, with an estimate of about 1, 5 or 30 minutes. A call that repeats one
 * that failed earlier in the turn says it is a retry and which attempt. The words
 * are the host's here, not the model's, because the model's own context already
 * streams: prose written before a tool call reaches the client as it is written.
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
import slowToolsDocument from './slow-tools.json'

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
  const flat = flatten(note)
  return announcement(flat === '' ? FALLBACK_NOTE : capped(flat, NOTE_CAP), openAsks)
}

/** `said` as the client's italic line, with how many of the panel's asks wait. */
function announcement(said: string, openAsks: number): string {
  const meanwhile =
    openAsks > 0
      ? ` Meanwhile, ${openAsks} ${openAsks === 1 ? 'question above needs' : 'questions above need'} you.`
      : ''
  return `_${said.replace(/_/g, '\\_')}_${meanwhile}`
}

function flatten(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function capped(text: string, cap: number): string {
  return text.length > cap ? `${text.slice(0, cap - 1)}…` : text
}

/** One tool that keeps the client waiting, as `slow-tools.json` lists it. */
export interface SlowTool {
  tool: string
  doing: string
  fallback?: string
  minutes: number
}

/** The estimates the client is given — orders of magnitude, nothing finer. */
const ESTIMATES: Record<number, string> = {
  1: 'about a minute',
  5: 'about 5 minutes',
  30: 'about 30 minutes',
}

/** The longest an input value is quoted at inside a line. */
const VALUE_CAP = 120

/**
 * The slow tools, by the name the model calls them. An estimate outside 1/5/30
 * is refused when this loads, so a mistyped number fails a deploy and never
 * reaches a client as "about 7 minutes".
 */
export const SLOW_TOOLS: ReadonlyMap<string, SlowTool> = new Map(
  (slowToolsDocument.tools as SlowTool[]).map((entry) => {
    if (!(entry.minutes in ESTIMATES)) {
      throw new Error(`slow-tools.json: ${entry.tool} estimates ${entry.minutes} minutes; use 1, 5 or 30.`)
    }
    return [entry.tool, entry]
  }),
)

/** What a slow call is doing, in the client's words, with its retry said. */
function slowDoing(slow: SlowTool, input: Record<string, unknown>, attempt: number): string {
  let missing = false
  const filled = slow.doing.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = capped(flatten(input[key]), VALUE_CAP)
    if (value === '') missing = true
    return value
  })
  const doing = missing ? (slow.fallback ?? slow.doing) : filled
  return `${doing}${attempt > 1 ? ` again (attempt ${attempt}; the last try failed)` : ''}`
}

/**
 * The line the client sees as a slow call starts ([[REQ-386]]). `attempt` above 1
 * says the call is being tried again after an earlier one failed.
 */
export function slowLine(slow: SlowTool, input: Record<string, unknown>, attempt: number, openAsks: number): string {
  return announcement(`${slowDoing(slow, input, attempt)} — ${ESTIMATES[slow.minutes]}.`, openAsks)
}

/**
 * [[REQ-390]] — the slow operation under way, as the working line beside the
 * composer shows it: what is being done, and the estimate when there is one. A
 * `Delegate` carries no estimate of its own; its note says how long in words.
 */
export interface WorkingNote {
  doing: string
  estimate?: string
}

/** The estimates in the working line's short form. */
const SHORT_ESTIMATES: Record<number, string> = {
  1: 'about 1 min',
  5: 'about 5 min',
  30: 'about 30 min',
}

/**
 * [[REQ-390]] — the working line's words: "<consultant> is building your home page".
 *
 * A NOTE THAT STARTS WITH WHAT IS BEING DONE ("Building …", "Capturing …") reads
 * after the name; anything else is quoted after it, because a note is the model's
 * words and need not be a phrase that follows "is".
 */
export function workingText(who: string, doing: string): string {
  const said = flatten(doing).replace(/[.\s]+$/, '')
  if (said === '') return who
  return /^[A-Z][a-z]+ing\b/.test(said) ? `${who} is ${said[0].toLowerCase()}${said.slice(1)}` : `${who}: ${said}`
}

/** A tool's output that says the call failed — how the Toolbox renders every refusal and host error. */
function failed(output: unknown): boolean {
  return typeof output === 'string' && output.startsWith('Error:')
}

/** Tool and input as one key, so a repeat of the same call is recognised. */
function callKey(name: string, input: unknown): string {
  return `${name}\u0000${JSON.stringify(input ?? {})}`
}

/** What the host gives the wrapper. Each is optional; an absent one is a no-op. */
export interface CadenceHooks {
  /** How many asks are open on the panel right now. */
  openAsks?: () => Promise<number>
  /** A builder session completed having written the site. */
  builderCompleted?: () => Promise<void>
  /** [[REQ-390]] — a slow operation was announced; the working line shows it. */
  working?: (note: WorkingNote) => void
}

/**
 * The consultant's backend, telling the client before it goes quiet.
 *
 * `Delegate` ONCE A TURN. The first `Delegate` a turn issues is announced; a later
 * one in the same turn has already been — the client was told the consultant is
 * away.
 *
 * EVERY SLOW CALL ([[REQ-386]]), because each is more waiting. The panel's count
 * rides on the turn's first line only; repeating it on every line is noise.
 *
 * NOTHING HERE FAILS A TURN: a count that cannot be read is a line without the
 * count, and a milestone that cannot be written is a milestone missed.
 */
export function keepClientOriented(backend: Untyped, hooks: CadenceHooks = {}): Untyped {
  async function* oriented(ref: string, content: unknown, opts: Record<string, unknown> = {}): AsyncGenerator<StreamEvent> {
    let delegated = false
    let counted = false
    let spoke = false
    const failures = new Map<string, number>()

    async function waiting(): Promise<number> {
      if (counted) return 0
      counted = true
      try {
        return hooks.openAsks ? await hooks.openAsks() : 0
      } catch {
        return 0
      }
    }

    for await (const event of backend.promptStream(ref, content, opts) as AsyncGenerator<StreamEvent>) {
      const name = event.meta?.name as string | undefined
      const input = (event.meta?.input ?? {}) as Record<string, unknown>
      let line: string | null = null
      let note: WorkingNote | null = null
      if (event.kind === TOOL_ISSUE && name === DELEGATE_TOOL) {
        // EVERY DELEGATE MOVES THE WORKING LINE; only the first is announced.
        const said = flatten(input[DELEGATE_NOTE])
        note = { doing: said === '' ? FALLBACK_NOTE : capped(said, NOTE_CAP) }
        if (!delegated) line = statusLine(input[DELEGATE_NOTE], await waiting())
        delegated = true
      } else if (event.kind === TOOL_ISSUE && name !== undefined && SLOW_TOOLS.has(name)) {
        const slow = SLOW_TOOLS.get(name)!
        const attempt = (failures.get(callKey(name, input)) ?? 0) + 1
        line = slowLine(slow, input, attempt, await waiting())
        note = { doing: slowDoing(slow, input, attempt), estimate: SHORT_ESTIMATES[slow.minutes] }
      }
      // [[REQ-390]] — TOLD BEFORE THE LINE IS YIELDED, so the host has the note by
      // the time the line reaches it and can put it on the stream right behind.
      if (note && hooks.working) {
        try {
          hooks.working(note)
        } catch {
          // A working line missed is not a turn lost.
        }
      }
      if (line !== null) {
        yield { kind: TEXT, content: `${spoke ? '\n\n' : ''}${line}\n\n` }
        spoke = true
      }
      if (event.kind === TEXT && event.content) spoke = true
      if (event.kind === TOOL_ACTIVITY && name !== undefined && SLOW_TOOLS.has(name) && failed(event.meta?.output)) {
        const key = callKey(name, event.meta?.input)
        failures.set(key, (failures.get(key) ?? 0) + 1)
      }
      if (event.kind === TOOL_ACTIVITY && name === DELEGATE_TOOL && hooks.builderCompleted) {
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
