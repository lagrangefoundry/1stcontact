/**
 * REQ-171 — the engagement record: decisions, the engagement's name, and the
 * standing note.
 *
 * [[DOC-10]] §8 homes a session in a `chat` ticket. [[DOC-33]] §3.1 says what a
 * record of it is for: not a summary of the conversation but a **ledger** — what
 * was decided, why, and what was rejected. Until [[REQ-356]] the ledger was the
 * chat ticket's body; it is now the `## Decision log` section of the SITE's plan
 * (`plan.ts`), because a decision is about the site and has to outlive the
 * conversation it was made in. The chat ticket keeps the engagement's name and
 * the standing note, which belong to the conversation.
 *
 * WHY A TICKET BODY AND NOT A COMMENT. The knowledge component indexes `title`
 * and `body` (`ticketText`); comments are not indexed. A log kept in a comment
 * would be unfindable, which is the opposite of what keeping it was for.
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
import {
  appendToSection,
  LOG_SECTION,
  logEntries,
  planSection,
  type PlanDeps,
} from '../../../tools/generate/src/cli/ai/plan-core'
import { conflictOrRethrow, sitePlan } from './plan'
import { findChat } from './session-delta'
import type { Ticket, TicketStore } from './tickets'

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
 * The engagement record as a {@link LedgerDeps}: decisions in the SITE's plan,
 * the title and standing note on the CONVERSATION's chat ticket ([[REQ-356]]).
 *
 * THE LOG MOVED AND THE NOTE DID NOT, because their lifetimes differ. A decision
 * is about the site and has to survive every conversation about it — kept on the
 * chat ticket, a site built over several sessions had several partial logs, and a
 * bricked conversation took its log with it ([[DOC-62]] §7). The standing note is
 * one session's working memory ([[REQ-283]]) and stays with that session.
 *
 * COMPARE-AND-SET ON EVERY WRITE, unlike the cursor beside it in
 * `session-delta.ts`, which deliberately has none. A cursor is a bookmark and
 * two turns racing both move it forward; a ledger entry is something a client
 * said, and a lost one is gone with no trace that it was ever written. The
 * declared `CONFLICT` tells the consultant to read and write again, which is
 * recoverable; silently dropping a decision is not.
 */
export function chatLedger(tickets: TicketStore, sessionId: string, site: string): LedgerDeps {
  const plan = sitePlan(tickets, site)
  return {
    async append(render: (index: number) => string): Promise<LedgerState> {
      let entries = 0
      // THE PLAN IS CREATED BY ITS FIRST ENTRY if the site has none yet, so a
      // decision can always be written — which is why `NO_LEDGER` no longer
      // arises here: the record belongs to the site, and the site exists.
      await plan.write((current) => {
        entries = logEntries(current.body) + 1
        // Numbered from the count the host just read, which is the whole reason
        // the port takes a renderer rather than rendered text: nothing else in
        // the system knows what number this entry gets.
        return { ...current, body: appendToSection(current.body, LOG_SECTION, render(entries)) }
      })
      const chat = await findChat(tickets, sessionId)
      return { entries, title: chat?.title ?? '', note: noteOf(chat) }
    },

    async rename(name: string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      // NO `expected_version`. A title is not accumulated: two turns racing to
      // name the engagement both name it, and the second one wins, which is the
      // answer a later rename is asking for anyway. Refusing a rename to protect
      // a title would spend the client's turn on bookkeeping.
      await tickets.update({ uid: chat.uid, patch: { title: name } })
      return { entries: await planEntries(plan), title: name, note: noteOf(chat) }
    },

    async setNote(note: string): Promise<LedgerState> {
      const chat = await ledgerTicket(tickets, sessionId)
      // COMPARE-AND-SET, like the append above and unlike the rename. Two turns
      // racing to rewrite one note is a genuine conflict — the loser's whole note
      // is gone, not a sentence of it — which is the one place the framework
      // insisted on it too.
      //
      // A FIELD PATCH AND NOT A BODY WRITE. `patch.fields` merges, so every other
      // field on the ticket survives.
      try {
        await tickets.update({
          uid: chat.uid,
          patch: { fields: { [FRAME_FIELD]: note } },
          expected_version: chat.version,
        })
      } catch (error) {
        throw conflictOrRethrow(error, ledgerConflict)
      }
      return { entries: await planEntries(plan), title: chat.title, note }
    },

    async read(): Promise<LedgerRecord> {
      // AN UNWRITTEN RECORD IS EMPTY, NOT MISSING. This feeds the per-turn seed,
      // and a site with no plan or a conversation with no ticket yet — the first
      // turn of every engagement — has simply not decided anything.
      const [current, chat] = await Promise.all([plan.read(), findChat(tickets, sessionId)])
      return {
        body: current ? planSection(current.body, LOG_SECTION) : '',
        title: chat?.title ?? '',
        note: noteOf(chat),
      }
    },
  }
}

/** How many decisions the site's log holds. */
async function planEntries(plan: PlanDeps): Promise<number> {
  const current = await plan.read()
  return current ? logEntries(current.body) : 0
}

const ledgerConflict = (): Error =>
  ledgerError('CONFLICT', 'the ledger moved while this entry was being written')

