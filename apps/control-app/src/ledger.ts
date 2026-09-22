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
import {
  ledgerError,
  type LedgerDeps,
  type LedgerRecord,
  type LedgerState,
} from '../../../tools/generate/src/cli/ai/ledger-core'
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

/**
 * The chat ticket field holding the standing note ([[REQ-283]]).
 *
 * THE FRONTMATTER OF THE TICKET THE LEDGER IS ALREADY IN, which is the operator's
 * decision and a better fit than either framework placement. `summary.js` splits
 * its two zones across a comment's field and that comment's body so that
 * *"rewriting the frame and appending to the log are then structurally different
 * writes that cannot clobber each other"*. That INVARIANT is what matters; the
 * comment is incidental. This host already has the log in the chat ticket's body
 * — where the knowledge component indexes it, and a comment body is not — so the
 * note goes in that ticket's own frontmatter and the invariant is reproduced
 * exactly: a field patch merges and never touches the body, and the ledger's
 * append never reads the field.
 *
 * AND IT REMOVES A READ RATHER THAN ADDING ONE. `SummaryStore` caches comment uids
 * precisely because *"`comments` is a full scan of the subject's comments"*;
 * {@link findChat} already fetches this ticket for the ledger, so the note arrives
 * in a read this host was doing anyway.
 *
 * KEEPING IT OUT OF THE CORPUS IS CORRECT, not a compromise. `ticketText` indexes
 * title and body: the ledger is the durable record and belongs in the index, and
 * the note is a working paper rewritten many times in one session, which would
 * feed the corpus a stream of vectors that supersede themselves.
 *
 * Named `frame` after the framework's word for the zone, so a reader comparing
 * this against `summary.js` finds it; every word the MODEL reads calls it a
 * standing note, because "frame" is framework vocabulary.
 */
export const FRAME_FIELD = 'frame'

/** The standing note on a chat ticket, or `''`. */
function noteOf(chat: Ticket | null): string {
  const fields = (chat?.fields ?? {}) as Record<string, unknown>
  const note = fields[FRAME_FIELD]
  return typeof note === 'string' ? note : ''
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
      return { entries: entries + 1, title: chat.title, note: noteOf(chat) }
    },

    async rename(name: string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      // NO `expected_version`. A title is not accumulated: two turns racing to
      // name the engagement both name it, and the second one wins, which is the
      // answer a later rename is asking for anyway. Refusing a rename to protect
      // a title would spend the client's turn on bookkeeping.
      await tickets.update({ uid: chat.uid, patch: { title: name } })
      return { entries: countEntries(chat.body ?? ''), title: name, note: noteOf(chat) }
    },

    async setNote(note: string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      // COMPARE-AND-SET, like the append above and unlike the rename. Two turns
      // racing to rewrite one note is a genuine conflict — the loser's whole note
      // is gone, not a sentence of it — which is the one place the framework
      // insisted on it too. `update` already takes `expected_version` on the
      // ticket, so this is the invariant the placement was chosen for rather than
      // anything this file had to build.
      //
      // A FIELD PATCH AND NOT A BODY WRITE. `patch.fields` merges, so the ledger
      // in the body is untouched and every other field on the ticket survives —
      // which is what makes the two zones structurally unable to clobber each
      // other rather than merely unlikely to.
      try {
        await tickets.update({
          uid: chat.uid,
          patch: { fields: { [FRAME_FIELD]: note } },
          expected_version: chat.version,
        })
      } catch (error) {
        throw conflictOrRethrow(error)
      }
      return { entries: countEntries(chat.body ?? ''), title: chat.title, note }
    },

    async read(): Promise<LedgerRecord> {
      // AN UNWRITTEN RECORD IS EMPTY, NOT MISSING, which is the one place this
      // differs from the two writes above. They raise `NO_LEDGER` because a
      // decision that cannot be written is something the client must be told
      // about; this one feeds the per-turn seed, and a conversation whose ticket
      // does not exist yet — the first turn of every engagement — has simply not
      // decided anything. Refusing here would fail the turn over its own
      // newness.
      const chat = await findChat(tickets, sessionId)
      return chat === null
        ? { body: '', title: '', note: '' }
        : { body: chat.body ?? '', title: chat.title ?? '', note: noteOf(chat) }
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
