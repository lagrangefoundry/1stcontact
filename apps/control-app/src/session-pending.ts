import type { PendingPrompt, PendingPrompts } from '../../../tools/generate/src/cli/ai/host-core'
import { findChat } from './session-delta'
import type { Ticket, TicketStore } from './tickets'

/**
 * What a session's turn was asked, while that turn is still unaccounted for
 * ([[BUG-121]]).
 *
 * THE PROBLEM THIS FILE EXISTS FOR, stated concretely: the operator types a long
 * message, watches a reply begin, navigates away — and the conversation holds
 * nothing at all. Not a truncated reply: no reply, and **no prompt**. There is
 * nothing to read back and nothing to re-send.
 *
 * WHY NOTHING SURVIVES TODAY, and why the fix is not "archive more eagerly". An
 * in-flight turn's records live on the junction, the junction is RAM in this
 * Worker (`ai.ts`), and the archive deliberately lags by a whole open turn —
 * `closedPrefix` cuts at the last boundary where no turn is open, because folding
 * half a turn splits one reply in two. So between `turn_start` and `turn_end`
 * there is no durable copy of anything, by design, and that is as true of the
 * turn's tool records as of its prose. Making the fold eager would break the
 * transcript; the only thing that closes the window properly is a durable
 * junction beside a durable driver ([[EPIC-19]] Finding 4).
 *
 * SO THIS RECORDS THE ONE THING WORTH RECORDING EARLY. Not a second transcript —
 * the client's own words, written before the model is called, so the prompt is on
 * disk before the first token is generated and before any tool can touch the
 * site. An interrupted turn then costs the client the answer, and never the
 * question.
 *
 * NO NEW ARTEFACT, AND NOT IN THE TRANSCRIPT. It is a field on the session's own
 * `chat` ticket, found or created by exactly the lookup the corpus cursor
 * (`kb_cursor`) already performs on the same ticket — see `session-delta.ts`,
 * whose shape this follows deliberately. Writing it INTO the `chat_transcript`
 * instead was considered and rejected: the fold identifies a turn by the turn id
 * the library mints inside `promptStream`, which the host cannot know before the
 * turn starts, so a pre-written user turn would either duplicate the real one or
 * have to be reconciled afterwards — in the failure path, by an isolate that is
 * gone. A field is advisory, the transcript stays authoritative, and the two are
 * reconciled on read by comparing the text.
 *
 * IT ALSO CARRIES THE TURN'S OUTCOME, which is the other half of the ticket: a
 * turn that ends `aborted` or `error` KEEPS its record, so an interruption leaves
 * a mark rather than a gap. Only a turn that completes forgets it.
 */

/** The `chat` ticket field the record lives in. */
export const PENDING_FIELD = 'pending_turn'

/**
 * The record a session holds, or `null` when it holds none.
 *
 * A CORRUPT VALUE READS AS ABSENT, deliberately, and it is the same judgement
 * `storedCursor` makes about the cursor beside it: this is a safety net, and a
 * net that fails the turn it was meant to protect is worse than no net. What it
 * costs is one interruption going unreported.
 */
export function storedPending(chat: Ticket | null): PendingPrompt | null {
  const raw = (chat?.fields ?? {})[PENDING_FIELD]
  if (typeof raw !== 'string' || raw.trim() === '') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const value = parsed as Partial<PendingPrompt>
      if (typeof value.text === 'string' && value.text !== '') {
        return {
          text: value.text,
          at: typeof value.at === 'string' ? value.at : '',
          status: value.status === 'aborted' || value.status === 'error' ? value.status : 'open',
        }
      }
    }
  } catch {
    // See above: unreadable is reported as nothing to report.
  }
  return null
}

/**
 * The port `host-core.ts` reaches this through ([[BUG-121]]).
 *
 * A SEAM RATHER THAN A CALL, for the reason `delta` beside it is one: the host is
 * runtime-agnostic and this is a write to a ticket store over a ticket type the
 * host knows nothing about. What the host owns is the TIMING — before the model,
 * and again when the turn closes — which is the thing that makes the record worth
 * anything.
 *
 * THE CLOCK IS THIS SIDE OF THE SEAM. `Date` is one of the things a runtime
 * supplies, and the host already refuses to name one.
 */
export function pendingTurns(
  store: TicketStore,
  now: () => string = () => new Date().toISOString(),
): PendingPrompts {
  const write = async (sessionId: string, value: string): Promise<void> => {
    const chat = await findChat(store, sessionId)
    if (chat === null) {
      // The same find-or-create the archive performs a moment later on the same
      // predicate, and idempotent with it: it finds this ticket rather than
      // minting a second. A session whose first turn is the interrupted one is
      // exactly the case that must not be the unprotected one.
      await store.create({
        type: 'chat',
        title: sessionId,
        fields: { session_id: sessionId, [PENDING_FIELD]: value },
      })
      return
    }
    // NO `expected_version`, for `writeCursor`'s reason: two turns racing to
    // replace this both replace it, and refusing a turn to protect a safety net
    // would be the wrong trade. A `fields` patch merges, so the cursor beside it
    // is untouched.
    await store.update({ uid: chat.uid, patch: { fields: { [PENDING_FIELD]: value } } })
  }

  return {
    open: (sessionId, text) => write(sessionId, JSON.stringify({ text, at: now(), status: 'open' })),
    async close(sessionId, outcome) {
      const pending = storedPending(await findChat(store, sessionId))
      // NOTHING TO CLOSE IS NOT A FAILURE. A turn that never opened a record —
      // the store was unreadable, or this deployment opened the turn before the
      // upgrade — must not have one invented for it here.
      if (pending === null) return
      if (outcome === 'complete') {
        await write(sessionId, '')
        return
      }
      await write(sessionId, JSON.stringify({ ...pending, status: outcome }))
    },
    read: async (sessionId) => storedPending(await findChat(store, sessionId)),
  }
}
