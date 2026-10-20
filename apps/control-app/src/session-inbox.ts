import type { ClientInbox, StopRequest, WaitingMessage } from '../../../tools/generate/src/cli/ai/host-core'
import { newId } from '../../../tools/generate/src/store/ids'
import { findChat } from './session-delta'
import type { Ticket, TicketStore } from './tickets'

/**
 * Messages the client sent while a turn was running, on the session's `chat`
 * ticket ([[BUG-224]]).
 *
 * THE SAME TICKET {@link pendingTurns} WRITES, for the same reason: it is the
 * one store every isolate shares, and this Worker always has it. The request
 * carrying a message and the request running the turn are often different
 * isolates, so neither may hold the message in memory.
 *
 * COMPARE-AND-SET, because two writers are ordinary here: the client posting and
 * the running turn taking. A lost race re-reads and retries, so a message posted
 * while the turn was taking is never written over.
 */
export const INBOX_FIELD = 'client_inbox'

/**
 * [[REQ-416]] — the Stops the client pressed, on the same ticket and for the same
 * reason: the isolate running the turn is rarely the one the press arrived at.
 */
export const STOPS_FIELD = 'client_stops'

const ATTEMPTS = 5

/** A JSON list a chat ticket carries under `field`; a corrupt value reads as none. */
function storedList(chat: Ticket | null, field: string): unknown[] {
  const raw = (chat?.fields ?? {})[field]
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** The waiting messages a chat ticket carries; a corrupt value reads as none. */
export function storedInbox(chat: Ticket | null): WaitingMessage[] {
  return storedList(chat, INBOX_FIELD).filter(
    (m): m is WaitingMessage =>
      Boolean(m) &&
      typeof (m as WaitingMessage).id === 'string' &&
      typeof (m as WaitingMessage).text === 'string' &&
      typeof (m as WaitingMessage).at === 'string',
  )
}

/** [[REQ-416]] — the Stops a chat ticket carries; a corrupt value reads as none. */
function storedStops(chat: Ticket | null): StopRequest[] {
  return storedList(chat, STOPS_FIELD).filter(
    (s): s is StopRequest =>
      Boolean(s) &&
      ((s as StopRequest).turn === null || typeof (s as StopRequest).turn === 'string') &&
      typeof (s as StopRequest).at === 'string',
  )
}

const isConflict = (error: unknown): boolean =>
  /conflict|version|stale|expected_version/i.test(
    `${(error as { code?: string })?.code ?? ''} ${(error as Error)?.message ?? ''}`,
  )

export function sessionInbox(
  store: TicketStore,
  now: () => string = () => new Date().toISOString(),
): ClientInbox {
  /**
   * Rewrite one of the session's lists from what it holds now; answers what
   * `change` reported. A session with no `chat` ticket yet gets one, as the
   * pending record does.
   */
  async function change<M, T>(
    sessionId: string,
    field: string,
    held: (chat: Ticket | null) => M[],
    next: (held: M[]) => { keep: M[]; answer: T },
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      const chat = await findChat(store, sessionId)
      const { keep, answer } = next(held(chat))
      const value = keep.length > 0 ? JSON.stringify(keep) : ''
      try {
        if (chat === null) {
          if (value !== '') {
            await store.create({
              type: 'chat',
              title: sessionId,
              fields: { session_id: sessionId, [field]: value },
            })
          }
        } else if (value !== ((chat.fields ?? {})[field] ?? '')) {
          await store.update({
            uid: chat.uid,
            patch: { fields: { [field]: value } },
            expected_version: chat.version,
          })
        }
        return answer
      } catch (error) {
        if (!isConflict(error) || attempt + 1 >= ATTEMPTS) throw error
      }
    }
  }

  return {
    post: (sessionId, text) =>
      change(sessionId, INBOX_FIELD, storedInbox, (held) => {
        const message = { id: newId('msg'), text, at: now() }
        return { keep: [...held, message], answer: message }
      }),
    take: (sessionId, ids) =>
      change(sessionId, INBOX_FIELD, storedInbox, (held) => {
        const taken = ids ? held.filter((m) => ids.includes(m.id)) : held
        return { keep: held.filter((m) => !taken.includes(m)), answer: taken }
      }),
    read: async (sessionId) => storedInbox(await findChat(store, sessionId)),
    stop: (sessionId, turnId) =>
      change(sessionId, STOPS_FIELD, storedStops, (held) => ({
        keep: [...held, { turn: turnId, at: now() }],
        answer: undefined,
      })),
    // A READ FIRST, so the turn's poll costs no write when nobody pressed Stop.
    takeStops: async (sessionId) =>
      storedStops(await findChat(store, sessionId)).length === 0
        ? []
        : change(sessionId, STOPS_FIELD, storedStops, (held) => ({ keep: [], answer: held })),
  }
}
