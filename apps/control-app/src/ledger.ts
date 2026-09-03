/**
 * REQ-171 — the engagement record, kept in the session's own `chat` ticket.
 *
 * [[DOC-10]] §8 homes a session in a `chat` ticket and reserves the BODY for the
 * AI and the transcript for a `chat_transcript` comment. [[DOC-33]] §3.1 says
 * what the body is for: not a summary of the conversation but a **ledger** — what
 * was decided, why, and what was rejected. [[REQ-160]] wired the archive that
 * creates the ticket. Nothing wrote the body. This does.
 *
 * WHY THE BODY AND NOT ANOTHER COMMENT. The knowledge component indexes `title`
 * and `body` (`ticketText`); comments are not indexed. A chat ticket whose body
 * is empty contributes a content-free vector to the project KB, so every
 * conversation this client has ever had is unfindable — which is the opposite of
 * what homing a session in a ticket was for.
 *
 * ONLY THE WORKER HAS ONE. The `1c` CLI archives to a file and has no ticket
 * store, so it passes no ledger and composes no ledger surface (`host-core.ts`).
 * That is an honest capability difference, not a gap to paper over: there is
 * nowhere on a laptop for the record to go.
 */
import type { LedgerDeps, LedgerState } from '../../../tools/generate/src/cli/ai/ledger-core'
import { findChat } from './session-delta'
import type { Ticket, TicketStore } from './tickets'

/**
 * The heading `ledger-core.ts` renders each entry under.
 *
 * MATCHED AT THE START OF A LINE, so a decision whose prose happens to contain
 * the phrase cannot inflate the count. The count is what numbers the next entry,
 * and a ledger that renumbers itself under a client's own words would be worse
 * than one that does not number at all.
 */
const ENTRY_HEADING = /^### Decision \d+$/gm

/** How many decisions a ledger body holds. */
export function countEntries(body: string): number {
  return (body.match(ENTRY_HEADING) ?? []).length
}

/** An error carrying a code the ledger surface declares. */
function ledgerError(code: string, message: string): Error {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

/** The session's chat ticket, or the declared refusal when it has none yet. */
async function ledgerTicket(tickets: TicketStore, sessionId: string): Promise<Ticket> {
  const chat = await findChat(tickets, sessionId)
  // NOT AN ERROR THE MODEL SHOULD ROUTE AROUND. The archive creates the ticket
  // on the first turn that writes anything, so a session can genuinely reach
  // here before one exists. The declared message tells the consultant to say
  // what it decided in its reply and record it later, which loses the index
  // entry and keeps the client's answer.
  if (chat === null) throw ledgerError('NO_LEDGER', `no chat ticket homes session ${sessionId}`)
  return chat
}

/**
 * The `chat` ticket as a {@link LedgerDeps}.
 *
 * COMPARE-AND-SET ON EVERY WRITE, unlike the cursor beside it in
 * `session-delta.ts`, which deliberately has none. A cursor is a bookmark and
 * two turns racing both move it forward; a ledger entry is something a client
 * said, and a lost one is gone with no trace that it was ever written. The
 * declared `CONFLICT` tells the consultant to read and write again, which is
 * recoverable; silently dropping a decision is not.
 */
export function chatLedger(tickets: TicketStore, sessionId: string): LedgerDeps {
  return {
    async append(render: (index: number) => string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      const body = chat.body ?? ''
      const entries = countEntries(body)
      // Numbered from the count the host just read, which is the whole reason
      // the port takes a renderer rather than rendered text: nothing else in
      // the system knows what number this entry gets.
      const entry = render(entries + 1)
      const next = body.trim() === '' ? entry : `${body.replace(/\s+$/, '')}\n\n${entry}`
      try {
        await tickets.update({ uid: chat.uid, patch: { body: next }, expected_version: chat.version })
      } catch (error) {
        throw conflictOrRethrow(error)
      }
      return { entries: entries + 1, title: chat.title }
    },

    async rename(name: string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      // NO `expected_version`. A title is not accumulated: two turns racing to
      // name the engagement both name it, and the second one wins, which is the
      // answer a later rename is asking for anyway. Refusing a rename to protect
      // a title would spend the client's turn on bookkeeping.
      await tickets.update({ uid: chat.uid, patch: { title: name } })
      return { entries: countEntries(chat.body ?? ''), title: name }
    },
  }
}

/**
 * A version clash, translated; anything else left alone.
 *
 * The component reports the clash in its own vocabulary and this is the one
 * place that vocabulary is read, so the surface's declared `CONFLICT` is what
 * the model sees. An unrecognised failure is re-thrown unchanged rather than
 * flattened into `CONFLICT`, because telling a model to retry a write that
 * failed for some other reason is telling it to fail again.
 */
function conflictOrRethrow(error: unknown): unknown {
  const text = `${(error as { code?: string })?.code ?? ''} ${(error as Error)?.message ?? ''}`
  if (/conflict|version|stale|expected_version/i.test(text)) {
    return ledgerError('CONFLICT', 'the ledger moved while this entry was being written')
  }
  return error
}
