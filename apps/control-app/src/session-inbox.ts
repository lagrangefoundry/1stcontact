import type { ClientInbox, WaitingMessage } from '../../../tools/generate/src/cli/ai/host-core'
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

const ATTEMPTS = 5

/** The waiting messages a chat ticket carries; a corrupt value reads as none. */
export function storedInbox(chat: Ticket | null): WaitingMessage[] {
  const raw = (chat?.fields ?? {})[INBOX_FIELD]
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is WaitingMessage =>
        Boolean(m) && typeof m.id === 'string' && typeof m.text === 'string' && typeof m.at === 'string',
    )
  } catch {
    return []
  }
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
   * Rewrite the session's inbox from what it holds now; answers what `change`
   * reported. A session with no `chat` ticket yet gets one, as the pending record
   * does.
   */
  async function change<T>(
    sessionId: string,
    next: (held: WaitingMessage[]) => { keep: WaitingMessage[]; answer: T },
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      const chat = await findChat(store, sessionId)
      const { keep, answer } = next(storedInbox(chat))
      const value = keep.length > 0 ? JSON.stringify(keep) : ''
      try {
        if (chat === null) {
          if (value !== '') {
            await store.create({
              type: 'chat',
              title: sessionId,
              fields: { session_id: sessionId, [INBOX_FIELD]: value },
            })
          }
        } else if (value !== ((chat.fields ?? {})[INBOX_FIELD] ?? '')) {
          await store.update({
            uid: chat.uid,
            patch: { fields: { [INBOX_FIELD]: value } },
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
      change(sessionId, (held) => {
        const message = { id: newId('msg'), text, at: now() }
        return { keep: [...held, message], answer: message }
      }),
    take: (sessionId, ids) =>
      change(sessionId, (held) => {
        const taken = ids ? held.filter((m) => ids.includes(m.id)) : held
        return { keep: held.filter((m) => !taken.includes(m)), answer: taken }
      }),
    read: async (sessionId) => storedInbox(await findChat(store, sessionId)),
  }
}
