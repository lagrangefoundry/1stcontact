/**
 * The group chat's host-side vocabulary ([[REQ-357]]).
 *
 * A builder conversation can be a ROOM: one transcript in which the client, the
 * consultant and the assistant all post. The room itself — turn-taking,
 * attribution, the transcript — is lagrange-framework's (`createGroup`,
 * `openGroup`, `Orchestrator`, `GroupToolbox`); nothing here reimplements it.
 * What lives here is what only this host can say: the names the room shows, the
 * session ids it is addressed by, the field that guards one exchange at a time,
 * and how a contribution reads on this product's wire.
 *
 * The functions that DRIVE a room — open it, run an exchange, stop one — are in
 * `host-core.ts`, beside the turn path every member round goes through.
 */
import groupChatDocument from './group-chat.json'
import { ASSISTANT_ROLE, CONSULTANT_ROLE } from './roles'

/** The adapter variant the assistant runs on — its own `backends.json` entry. */
export const ASSISTANT_BACKEND = 'claude_assistant'

/** The speakers the framework reserves for the operator and for the room itself. */
const OPERATOR_SPEAKER = '@operator'

/** The display names, read from the one config entry that holds them. */
export interface GroupNames {
  consultant: string
  assistant: string
  client: string
  room: string
}

/** The room's own budgets, as this product opens a room with them. */
export interface GroupRoomSettings {
  maxAutoTurns: number
  maxContributions: number
}

/**
 * The names the room shows, from `group-chat.json` and nowhere else.
 *
 * READ, NEVER RESTATED: code and priming name roles, so a rename is an edit to
 * that file. A missing name is refused at the point of use, naming the key,
 * rather than rendered as an empty label.
 */
export function groupNames(): GroupNames {
  const names = (groupChatDocument as { names?: Record<string, unknown> }).names ?? {}
  const read = (key: keyof GroupNames): string => {
    const value = names[key]
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`group-chat.json names no '${key}' participant.`)
    }
    return value
  }
  return {
    consultant: read('consultant'),
    assistant: read('assistant'),
    client: read('client'),
    room: read('room'),
  }
}

/** The budgets a new room is created with. */
export function groupRoomSettings(): GroupRoomSettings {
  const room = (groupChatDocument as { room?: Record<string, unknown> }).room ?? {}
  return {
    maxAutoTurns: Number(room.max_auto_turns) || 0,
    maxContributions: Number(room.max_contributions) || 0,
  }
}

/** The assistant's private session for a site. */
export function assistantSessionIdFor(site: string): string {
  return `assistant-${site}`
}

/** The room's session for a site — one room per site. */
export function roomSessionIdFor(site: string): string {
  return `room-${site}`
}

/** The name the assistant's backend is registered under, per site. */
export function assistantBackendName(site: string): string {
  return `${ASSISTANT_BACKEND}+site:${site}`
}

/** The site a room id addresses, or null. Existence is the caller's check. */
export function siteOfRoom(sessionId: string): string | null {
  const site = sessionId.startsWith('room-') ? sessionId.slice('room-'.length) : ''
  return site === '' ? null : site
}

// -- one exchange at a time ---------------------------------------------------

/**
 * The room-ticket field that says an exchange is running ([[REQ-357]]).
 *
 * ON THE ROOM'S OWN CHAT TICKET, written with compare-and-set, so the guard
 * holds across isolates rather than inside one: two prompt requests for one room
 * landing in two isolates race on `expected_version`, and exactly one wins. A JSON
 * string, like `pending_turn` beside it.
 *
 * `stop` IS THE DURABLE HALF OF STOP. A stop request may land in any isolate; it
 * writes `stop: true` here, and the isolate running the exchange reads it between
 * rounds and while a round is in flight, and ends that round with the framework's
 * own control-record stop on the member's junction.
 */
export const EXCHANGE_FIELD = 'exchange'

export interface ExchangeGuard {
  /** When the guard was last written — a heartbeat, refreshed every round. */
  at: string
  /** The member session whose round is in flight, or `''`. */
  calling: string
  /** Somebody asked for the exchange to stop. */
  stop: boolean
}

/**
 * How long a guard may go unrefreshed before it is taken to belong to a run that
 * died with its isolate. One member round is bounded by the turn clock, and the
 * guard is refreshed at the start of every round, so a live run is never older
 * than one turn plus a margin.
 */
export function guardIsStale(guard: ExchangeGuard, turnSeconds: number, now = Date.now()): boolean {
  const at = Date.parse(guard.at)
  if (!Number.isFinite(at)) return true
  return now - at > (turnSeconds + 60) * 1000
}

export function readGuard(raw: unknown): ExchangeGuard | null {
  if (typeof raw !== 'string' || raw === '') return null
  try {
    const parsed = JSON.parse(raw) as Partial<ExchangeGuard>
    return {
      at: String(parsed.at ?? ''),
      calling: String(parsed.calling ?? ''),
      stop: parsed.stop === true,
    }
  } catch {
    return null
  }
}

export function writeGuard(guard: ExchangeGuard): string {
  return JSON.stringify(guard)
}

// -- how a contribution reads ------------------------------------------------

/** One contribution as the framework's `Group.history` reports it. */
export interface RoomContribution {
  speaker: string
  name?: string
  text: string
  ts?: string
  turn_id?: string
  passed?: boolean
  yielded?: boolean
}

/**
 * A contribution on this product's wire: who said it, as the client reads it.
 *
 * The CLIENT'S posts are the `user` side and everybody else's the `assistant`
 * side, which is what lets the chat panel draw the client on their own edge
 * without being taught who is who. `passed` marks a record the room made about a
 * participant — a decline, a skip — rather than something one of them said.
 */
export interface RoomTurn {
  role: 'user' | 'assistant'
  markdown: string
  speaker: string
  ts?: string
  turn_id?: string
  passed?: boolean
}

export function roomTurn(contribution: RoomContribution, names: GroupNames): RoomTurn {
  const operator = contribution.speaker === OPERATOR_SPEAKER
  const reserved = contribution.speaker.startsWith('@')
  const speaker = operator
    ? names.client
    : reserved
      ? names.room
      : contribution.name || contribution.speaker
  return {
    role: operator ? 'user' : 'assistant',
    markdown: contribution.text,
    speaker,
    ...(contribution.ts ? { ts: contribution.ts } : {}),
    ...(contribution.turn_id ? { turn_id: contribution.turn_id } : {}),
    ...(contribution.passed ? { passed: true } : {}),
  }
}

/** The room's `names` map: member ticket -> display name. */
export function memberNames(
  consultantTicket: string,
  assistantTicket: string,
  names: GroupNames,
): Record<string, string> {
  return { [consultantTicket]: names.consultant, [assistantTicket]: names.assistant }
}

/** Which role a member session is. */
export function roleOfMember(sessionId: string, site: string): string {
  return sessionId === assistantSessionIdFor(site) ? ASSISTANT_ROLE : CONSULTANT_ROLE
}

// -- one stream out of many producers -----------------------------------------

/**
 * An async queue the exchange writes into and the response reads out of.
 *
 * The orchestrator calls each member through a prompt FUNCTION, which cannot
 * yield to the stream the client is reading — so every member event, and every
 * post the room records, is pushed here and the generator the route consumes
 * drains it. `close` ends the stream; `fail` ends it with the error.
 */
export class EventChannel<T> {
  private readonly items: T[] = []
  private waiting: (() => void) | null = null
  private done = false
  private error: unknown = null

  push(item: T): void {
    this.items.push(item)
    this.wake()
  }

  close(): void {
    this.done = true
    this.wake()
  }

  fail(error: unknown): void {
    this.error = error
    this.close()
  }

  private wake(): void {
    const waiting = this.waiting
    this.waiting = null
    waiting?.()
  }

  async *drain(): AsyncGenerator<T> {
    for (;;) {
      while (this.items.length > 0) yield this.items.shift() as T
      if (this.done) {
        if (this.error !== null) throw this.error
        return
      }
      await new Promise<void>((resolve) => {
        this.waiting = resolve
      })
    }
  }
}

/** A post the room recorded, on the exchange's stream. `meta` is its {@link RoomTurn}. */
export const ROOM_POST = 'room_post'

/** A member round's own terminal event, renamed so it cannot end the exchange's stream. */
export const MEMBER_DONE = 'member_done'
