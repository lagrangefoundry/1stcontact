import { findAwarenessReport, resolveCorpus } from './generated/knowledge'
import { PROJECT_KB } from './knowledge'
import type { SessionKnowledge } from './session-knowledge'
import type { Ticket, TicketStore } from './tickets'

/**
 * The session cursor and the per-turn delta ([[REQ-160]]; [[DOC-39]] §5.1, §6.4).
 *
 * THE PROBLEM THIS FILE EXISTS FOR, stated concretely: the AI asks *"do you have
 * any positioning material?"*, the client says yes and uploads it, and nothing
 * tells the AI it arrived.
 *
 * IT IS NOT A PRIMING-FRESHNESS BUG, and reaching for one is the trap. Priming
 * already runs every turn and a landscape is an ordinary ticket read, so a
 * rebuilt map is picked up next turn with no new machinery. The fault is that **a
 * map is a description, not a notification** — a new brand document lands inside
 * the existing "brand and positioning" territory and changes the map's prose not
 * at all. Correct, current, freshly read, and silent. So the delta travels
 * separately from the description, and this is that channel.
 *
 * NO NEW ARTEFACT. `updated_at >= cursor` is the same change feed [[REQ-159]]
 * consumes for indexing; this is that query with a different cursor. A change-log
 * *ticket* was considered and rejected ([[DOC-39]] §5.1): rewritten on every
 * upload, a compare-and-set contention point, unbounded growth in one body, and
 * either polluting the corpus or requiring a predicate everyone remembers. The
 * feed is automatically complete over every corpus member, because it is derived
 * from the corpus rather than written beside it.
 *
 * THE PROJECT KB ONLY, and that is a fact about the corpora rather than a
 * shortcut. The system knowledge base is a release artefact — byte-identical for
 * every client, changed by upgrading the software — so it cannot acquire a
 * document during a conversation and a change feed over it would be a query that
 * is always empty. Asking it every turn would cost a store scan to prove
 * something the deployment model already guarantees.
 *
 * KNOWN GAP, recorded rather than solved ([[DOC-39]] §5.1): the feed is reliably
 * additive and unreliably subtractive. An archive or a detach may not surface in
 * an `updated_at >=` sweep.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The character budget for the titles ([[DOC-39]] §6.4).
 *
 * CHARACTERS AND NOT ENTRIES, because the thing being bounded is context. Ten
 * entries is a different cost depending on how long the titles are, and the whole
 * point of the budget is that KM's marginal cost on a turn is bounded — so the
 * budget is denominated in the thing being spent.
 */
export const DELTA_BUDGET_CHARS = 400

/** The chat ticket field the cursor lives in. */
export const CURSOR_FIELD = 'kb_cursor'

/**
 * Conversations are corpus members and are NOT delta entries.
 *
 * Two reasons, and the first alone would settle it. A session's own chat ticket
 * is written by this very file — the cursor lives on it — so a sweep that
 * included it would report the conversation to itself, every turn, forever. And
 * a chat ticket carries no content to search for until something writes the
 * AI-maintained summary its body is reserved for ([[REQ-171]]); announcing one as
 * arrived material would be announcing a title.
 *
 * The exclusion is the delta's alone. Chat tickets remain in the corpus, are
 * still indexed, and still appear in the landscape — [[REQ-159]] owns that, and
 * this is a statement about what is worth a line in the forced context.
 */
const CHAT_TYPE = 'chat'

/**
 * A session's place in the change feed.
 *
 * TWO PARTS, AND THE SECOND IS NOT BOOKKEEPING FAT. The feed's predicate is
 * `updated_at >= cursor`, inclusive at the boundary — which the component chose
 * so that an indexer cannot miss a document written in the same instant its
 * cursor was taken. Inclusivity means a cursor set to the newest timestamp
 * re-reports the newest document on the next turn, forever. So the boundary
 * timestamp travels with the uids already reported AT that timestamp, and those
 * are dropped on the next sweep. The list is bounded by how many documents share
 * one timestamp — one, normally; a handful after a bulk import — and never grows
 * with the corpus.
 */
export interface Cursor {
  at: string
  seen: string[]
}

/** One entry the delta reports. */
export interface DeltaEntry {
  uid: string
  title: string
  updated_at: string
}

/**
 * Where a cold session's cursor starts: **where the landscape's coverage ends**
 * ([[DOC-39]] §6.3).
 *
 * Concretely, the awareness map's build timestamp — NOT "now", and the difference
 * is the case that would otherwise fall through. A document uploaded after the
 * last rebuild and before the session opens belongs in neither the map (which
 * predates it) nor a start-of-session cursor (which postdates it), so it would be
 * silently invisible to a session that had every right to know about it.
 * Anchoring on the map's build time makes the two exactly complementary.
 *
 * WITH NO MAP PUBLISHED YET this reduces to now, which is the same rule read at
 * its other end: a landscape that covers nothing ends where the session starts.
 * That is also why resumption needs no separate "while you were away" report —
 * the first turn after a resume sweeps from the map forward, so what arrived
 * while the client was away arrives with it.
 */
export async function coverageCursor(store: TicketStore, now: string): Promise<Cursor> {
  const report = (await findAwarenessReport(store, PROJECT_KB)) as Ticket | null
  const at = typeof report?.updated_at === 'string' ? report.updated_at : now
  return { at, seen: [] }
}

/** The `chat` ticket homing this session, or `null`. */
export async function findChat(store: TicketStore, sessionId: string): Promise<Ticket | null> {
  // `limit: 'all'` and the match in JS rather than in the predicate, both for the
  // component's own reasons: `query` pages at 50 ordered by a random uid, so a
  // bounded page decides findability by where a uid happened to sort; and a
  // numeric-looking session id could be coerced by the predicate parser and
  // mis-match the stored string.
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

/** The cursor a chat ticket carries, or `null` when it has never held one. */
export function storedCursor(chat: Ticket | null): Cursor | null {
  const raw = (chat?.fields ?? {})[CURSOR_FIELD]
  if (typeof raw !== 'string' || raw.trim() === '') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && typeof (parsed as Cursor).at === 'string') {
      const value = parsed as Cursor
      return { at: value.at, seen: Array.isArray(value.seen) ? value.seen.map(String) : [] }
    }
  } catch {
    // A corrupt cursor costs one over-wide sweep, which reports a document twice
    // at worst. Failing the turn over a bookkeeping field would be the more
    // expensive answer, and the same judgement REQ-159 made for its transcript
    // cursors.
  }
  return null
}

/**
 * What entered the corpus at or after `cursor`, newest last.
 *
 * ORDERED BY TIME because the delta is a report about *when*, and because the cap
 * has to truncate the least interesting end. Oldest first, so the titles that
 * survive truncation are the ones the client uploaded first — the ones the
 * conversation is most likely already about.
 */
export async function changedSince(
  store: TicketStore,
  kb: Untyped,
  cursor: Cursor,
): Promise<DeltaEntry[]> {
  const tickets = (await resolveCorpus(store, kb, { since: cursor.at })) as Ticket[]
  return tickets
    .filter((t) => t.type !== CHAT_TYPE)
    .filter((t) => !cursor.seen.includes(t.uid))
    .map((t) => ({
      uid: t.uid,
      title: (t.title ?? '').trim() || t.uid,
      updated_at: t.updated_at ?? cursor.at,
    }))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
}

/** The cursor after reporting `entries` — the boundary, and who sat on it. */
export function advance(cursor: Cursor, entries: DeltaEntry[]): Cursor {
  const at = entries.reduce((max, e) => (e.updated_at > max ? e.updated_at : max), cursor.at)
  const seen = [
    ...(at === cursor.at ? cursor.seen : []),
    ...entries.filter((e) => e.updated_at === at).map((e) => e.uid),
  ]
  return { at, seen: [...new Set(seen)] }
}

/**
 * The line the model reads, or `null`.
 *
 * AN EMPTY DELTA EMITS LITERALLY NOTHING — not a heading, not *"nothing new"*
 * ([[DOC-39]] §6.4). A line that appears every turn and is almost always empty is
 * worse than absent: it teaches the model that this region carries no
 * information, which is precisely the region the non-empty case needs to be
 * noticed in. `null` rather than `''` so a caller cannot append it by accident.
 *
 * THE COUNT IS ALWAYS EXACT; THE TITLES ARE WHAT GET TRUNCATED. A character
 * budget is a hard stop on content, but the number is one integer and is always
 * reported in full — so a bulk import reads *"41 documents added, including …"*
 * and the AI knows both the magnitude and a sample. Truncating the count instead
 * would hide the magnitude, which is the one thing that cannot be recovered by
 * searching for it.
 *
 * NO EXCERPTS, NO SUMMARIES, NO RIGHTS ANNOTATIONS. The AI now knows the material
 * exists and can search it, which is the entire job and it is done in one line.
 * Anything more answers a question that has not been asked yet.
 */
export function deltaLine(entries: DeltaEntry[], budget = DELTA_BUDGET_CHARS): string | null {
  if (entries.length === 0) return null
  const noun = entries.length === 1 ? 'document' : 'documents'

  const quoted: string[] = []
  let used = 0
  for (const entry of entries) {
    const rendered = `"${entry.title}"`
    if (used + rendered.length + 2 > budget) break
    quoted.push(rendered)
    used += rendered.length + 2
  }

  // Even one very long title must not be dropped to nothing — a delta naming no
  // document at all reports that something happened while withholding the only
  // thing that makes it actionable.
  if (quoted.length === 0) quoted.push(`"${entries[0].title.slice(0, budget)}"`)

  const rest = entries.length - quoted.length
  if (rest === 0) {
    return `${entries.length} ${noun} entered this client's knowledge since your last turn: ${quoted.join(', ')}. Search for anything you need from them.`
  }
  return `${entries.length} ${noun} entered this client's knowledge since your last turn, including ${quoted.join(', ')} — and ${rest} more. Search for anything you need from them.`
}

/**
 * The per-turn delta for one session: sweep, report, advance.
 *
 * ADVANCED BEFORE THE TURN RATHER THAN AFTER IT, which is the opposite of what
 * `host-core.ts` does with the draft-change baseline, and the asymmetry is
 * deliberate. That baseline is recorded after the turn so the assistant's OWN
 * edits are absorbed and never reported back to it as somebody else's work. This
 * one is advanced before, because the assistant cannot write to the corpus — the
 * knowledge surface is read-only by construction — so there are no writes of its
 * own to absorb, and advancing late would re-report the same upload on the next
 * turn if the turn were abandoned.
 *
 * THE CHAT TICKET IS FOUND OR CREATED HERE, and it is the same find-or-create the
 * archive performs a moment later on the same predicate. It has to be: a cursor
 * with nowhere to live would be recomputed from the map on every turn, so the
 * first upload of a conversation would be announced again and again. Creating it
 * is idempotent with the archive's own lookup — that finds this ticket and
 * comments on it rather than minting a second.
 *
 * @returns the line for the reminder, or `null` when nothing arrived.
 */
export async function turnDelta(
  knowledge: SessionKnowledge,
  store: TicketStore,
  sessionId: string,
  now: string,
): Promise<string | null> {
  const kb = knowledge.perKb.get(PROJECT_KB)
  // No project KB opened means no corpus that can change — the system KB is a
  // release artefact. There is nothing to report and nothing to advance.
  if (kb === undefined) return null
  const projectKb = asMap(kb.kbs).get(PROJECT_KB)
  if (projectKb === undefined) return null

  const chat = await findChat(store, sessionId)
  const cursor = storedCursor(chat) ?? (await coverageCursor(store, now))
  const entries = await changedSince(store, projectKb, cursor)
  const next = advance(cursor, entries)

  if (next.at !== cursor.at || next.seen.length !== cursor.seen.length || chat === null) {
    await writeCursor(store, sessionId, next, chat)
  }
  return deltaLine(entries)
}

/** Persist the cursor, creating the session's chat ticket if it has none yet. */
async function writeCursor(
  store: TicketStore,
  sessionId: string,
  cursor: Cursor,
  chat: Ticket | null,
): Promise<void> {
  const value = JSON.stringify(cursor)
  if (chat === null) {
    await store.create({
      type: 'chat',
      title: sessionId,
      fields: { session_id: sessionId, [CURSOR_FIELD]: value },
    })
    return
  }
  // NO `expected_version`, deliberately. The transcript comment's fold is
  // compare-and-set because losing an increment loses what the client said; a
  // cursor is a bookmark, and two turns racing to move it forward both move it
  // forward. Refusing the turn to protect a bookmark would be the wrong trade.
  await store.update({ uid: chat.uid, patch: { fields: { [CURSOR_FIELD]: value } } })
}

function asMap(value: Untyped): Map<string, Untyped> {
  return value instanceof Map ? value : new Map(Object.entries(value ?? {}))
}
