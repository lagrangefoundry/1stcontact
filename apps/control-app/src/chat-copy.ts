import { CURSOR_FIELD } from './session-delta'
import { PENDING_FIELD } from './session-pending'
import type { Ticket, TicketStore } from './tickets'

/**
 * A business's conversation history, moved between builders ([[REQ-294]]).
 *
 * WHY THIS EXISTS. `bin/copy-to-cloud` carried the Lagrange Foundry site to
 * production and none of the consultant conversations that produced it. The
 * reasoning behind a long-lived site's decisions lives in those conversations,
 * and a consultant that cannot read them re-litigates settled choices.
 *
 * A SECOND PAIR OF ROUTES, NOT A BIGGER `SitePayload`. The site pair's identity
 * is that it is one payload with one producer and one consumer, and keeping the
 * two halves in step is a maintenance obligation `router.ts` names out loud.
 * Folding conversations into it would make every future change to either half a
 * change to both, and would make a plain site copy carry data the operator did
 * not ask for. So this file is that obligation discharged a second time, for a
 * second payload: {@link readChats} produces it, {@link writeChats} consumes it,
 * and they are the only two functions that know its shape.
 *
 * THE WORKER READS AND THE WORKER WRITES, for the reason the site pair gives.
 * Under `wrangler dev` a D1 database is a miniflare SQLite file whose layout is
 * an implementation detail; Node has no contract for it. Both ends therefore go
 * through the very store the Worker serves from.
 *
 * WHAT A CONVERSATION IS HERE ([[REQ-160]], [[DOC-10]] §8): a `chat` ticket
 * found by `fields.session_id`, whose BODY is the engagement ledger
 * ([[REQ-171]]), whose `chat_transcript` comment is the whole session file, and
 * which carries a standing note about its own engagement in `fields.frame`
 * ([[REQ-283]]). All of that is the conversation and all of it travels.
 */

/**
 * The chat-ticket fields that must NOT be carried to another store.
 *
 * THE RULE, STATED ONCE: a field that points into one store's own sequence, or
 * into a turn one host was running, is not a property of the CONVERSATION and
 * cannot mean anything where it lands.
 *
 * `kb_cursor` is the session's place in the change feed ([[REQ-160]]) — a
 * timestamp plus the uids sitting exactly on it, answering *"what has this
 * session already been told about"* against a specific store's `ticket_changes`
 * sequence. Carried, it names positions that mean something else in the
 * destination or nothing at all, and the destination's indexer silently skips
 * turns it never saw. That is the failure worth naming: the import succeeds.
 *
 * `pending_turn` is the same rule one layer up ([[BUG-121]]). It holds what a
 * turn was asked *while that turn is still unaccounted for* — written before the
 * model is called, forgotten when the turn completes. It is a claim about a host
 * that was mid-flight, and the destination was running nothing, so an `open`
 * record carried there is a statement that is false the moment it arrives.
 *
 * A DENY LIST AND NOT AN ALLOW LIST, deliberately. The thing being carried is a
 * record, and the point of carrying it is fidelity: a new field describing the
 * conversation should travel without this file being edited. What must not
 * travel is characterised by a property — *it points at a runtime* — which is
 * exactly what a named list with the rule written beside it captures.
 */
export const NOT_PORTABLE_FIELDS: readonly string[] = [CURSOR_FIELD, PENDING_FIELD]

/** One comment on a chat ticket, as it crosses the wire. */
export interface ChatComment {
  /** `chat_transcript`, `tool_transcript`, or whatever the library adds next. */
  kind: string
  body: string
}

/**
 * One conversation, whole.
 *
 * ADDRESSED BY `sessionId` AND BY NOTHING ELSE. It is what the library itself
 * finds a chat ticket by, it is minted by the session rather than by a store,
 * and it therefore means the same thing on both sides — which is precisely what
 * a ticket uid does not. Uids are rewritten at the far end, like tenancy.
 */
export interface ChatRecord {
  sessionId: string
  title: string
  /** The chat lifecycle is `open` and only `open`; carried so nothing is assumed. */
  status: string | null
  /** The engagement ledger ([[REQ-171]]) — append-only, and the indexed half. */
  body: string
  /** The chat ticket's fields, less {@link NOT_PORTABLE_FIELDS}. */
  fields: Record<string, unknown>
  /**
   * Every comment the ticket holds, not a chosen list of kinds.
   *
   * THE TRANSCRIPT IS ONE KIND AND IT IS NOT THE ONLY ONE — a session that
   * called a tool also has a `tool_transcript`. A list of kinds spelled here
   * would go stale the day the library adds a third, and would go stale
   * SILENTLY: the import would succeed and part of the record would be missing.
   * Carrying what is there needs no such list.
   */
  comments: ChatComment[]
}

/** What `GET /api/chats/export` answers and `POST /api/chats/import` takes. */
export interface ChatsPayload {
  /**
   * The business as the SOURCE side names it.
   *
   * IT NAMES THE SOURCE AND ADDRESSES NOTHING, exactly as `SitePayload.slug`
   * does. The destination resolves its own business from the authorised scope;
   * this is here so a refusal can say where the conversations came from.
   */
  business: string
  chats: ChatRecord[]
  /**
   * Replace a conversation the destination already holds (`--force`).
   *
   * ABSENT MEANS NO, and the default it selects is *keep what is there*. See
   * {@link writeChats} for why that is not `/api/import`'s 409.
   */
  force?: boolean
}

/** What an import did, per conversation. */
export interface ChatsLanded {
  /** Conversations the destination did not hold, written whole. */
  created: number
  /** Conversations it did hold, rewritten because `force` said so. */
  replaced: number
  /** Conversations it did hold, left exactly as they were. */
  kept: number
  /** Comments written across the two write cases. */
  comments: number
}

/** The ticket type a conversation lives on. */
const CHAT_TYPE = 'chat'

/** `fields.session_id` of a chat ticket, or `''` when it carries none. */
function sessionIdOf(ticket: Ticket): string {
  const value = (ticket.fields ?? {}).session_id
  return typeof value === 'string' ? value.trim() : ''
}

/** A field block with the runtime pointers removed. Used on both directions. */
function portableOf(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (NOT_PORTABLE_FIELDS.includes(key)) continue
    out[key] = value
  }
  return out
}

/**
 * Read every conversation this business holds — nothing refused, nothing gated.
 *
 * EVERY CONVERSATION THE BUSINESS HOLDS, AND NOT "THIS SITE'S". A `chat` ticket
 * carries no site reference of any kind: it is found by `fields.session_id` and
 * scoped by the handle it was opened on. "The conversations belonging to this
 * site" is not expressible without inventing a link this product does not have,
 * and inventing one to answer a copy command would be the wrong place to decide
 * it. The business is the unit, which is also the unit the consultant reads
 * across ([[REQ-228]]).
 *
 * ARCHIVED CONVERSATIONS DO NOT TRAVEL, and that needs no code here: `query` is
 * built over a scan hardcoded to `archived: false`. A conversation the client
 * deleted is one they deleted, and carrying it to production would undo that.
 *
 * `limit: 'all'`, for the library's own reason: `query` pages at 50 ordered by a
 * random uid, so a bounded page would decide which conversations travel by where
 * their uids happened to sort.
 */
export async function readChats(store: TicketStore, business: string): Promise<ChatsPayload> {
  const { tickets } = await store.query({ predicate: `type=${CHAT_TYPE}`, limit: 'all' })
  const chats: ChatRecord[] = []
  for (const ticket of tickets) {
    const sessionId = sessionIdOf(ticket)
    // A chat ticket with no session id names no conversation, and the far side
    // has nothing to match it on. Skipped rather than carried under a made-up
    // id, which would create a second unaddressable ticket on every copy.
    if (sessionId === '') continue
    const { comments } = await store.comments({ uid: ticket.uid })
    chats.push({
      sessionId,
      title: ticket.title ?? '',
      status: ticket.status,
      body: ticket.body ?? '',
      fields: portableOf(ticket.fields ?? {}),
      comments: comments
        .map((c) => ({
          kind: String((c.fields ?? {}).kind ?? ''),
          body: String(c.body ?? ''),
        }))
        .filter((c) => c.kind !== ''),
    })
  }
  // Ordered by session id so two exports of one store are byte-comparable —
  // `query` orders by a random uid, which would make a diff of two backups
  // report a reshuffle as a change.
  chats.sort((a, b) => a.sessionId.localeCompare(b.sessionId))
  return { business, chats }
}

/**
 * Write a received history into this business's store.
 *
 * MATCHED BY `session_id`, WHICH IS WHAT MAKES A SECOND COPY FREE. Every write
 * below is a create or a replace of one whole conversation; nothing is ever
 * appended to. Run the command twice and the second run adds no ticket, no
 * comment and no turn — which is the failure this route exists to not have.
 *
 * A CONVERSATION ALREADY THERE IS KEPT, AND COUNTED. It is deliberately NOT
 * `/api/import`'s 409, and the difference is in the shape of the thing:
 *
 *   - A SITE IS ONE OBJECT. "Part of this import is new" is not expressible, so
 *     refusing the whole thing is the only honest answer to a destination that
 *     has been edited.
 *   - A HISTORY IS MANY OBJECTS. Refusing the set because one member is already
 *     present would mean that after the first copy, no later conversation could
 *     ever land — the command would be unusable exactly as the history grew.
 *
 * AND KEEPING IS THE SAFE DIRECTION HERE. The deployed builder is where the
 * client actually talks, so its copy of a session may have continued past the
 * local one; replacing by default would delete the client's own turns.
 *
 * `force` REPLACES, WHOLE. The ticket's fields and body are rewritten and each
 * carried comment is matched by kind and rewritten in place. Never merged:
 * reconciling two divergent copies of one session file is a conflict nobody
 * asked this command to resolve, and half-merging a transcript would produce a
 * conversation that never happened.
 *
 * AND A FIELD PATCH MERGES, WHICH IS THE BEHAVIOUR WANTED HERE RATHER THAN A
 * COMPROMISE WITH IT. The destination's own `kb_cursor` and `pending_turn` are
 * not in the payload ({@link NOT_PORTABLE_FIELDS}), so a merge leaves them
 * exactly as they were — the destination's place in its own change feed
 * survives a `force` re-copy, which is the same fact that kept the source's from
 * travelling, read from the other end.
 *
 * TENANCY AND UIDS ARE THE DESTINATION'S. The store handle is already
 * `forTenant`-bound, so there is no argument on this path that could name
 * another business, and every ticket created here is minted by this store —
 * which is why a uid collision is not a case this function has to think about.
 */
export async function writeChats(
  store: TicketStore,
  payload: ChatsPayload,
): Promise<ChatsLanded> {
  const { tickets } = await store.query({ predicate: `type=${CHAT_TYPE}`, limit: 'all' })
  const held = new Map<string, Ticket>()
  for (const ticket of tickets) {
    const sessionId = sessionIdOf(ticket)
    if (sessionId !== '') held.set(sessionId, ticket)
  }

  const landed: ChatsLanded = { created: 0, replaced: 0, kept: 0, comments: 0 }
  for (const chat of payload.chats ?? []) {
    const sessionId = String(chat.sessionId ?? '').trim()
    // A record naming no session cannot be matched on a re-copy, so landing it
    // would be landing a ticket the next run would land again.
    if (sessionId === '') continue
    const existing = held.get(sessionId)

    if (existing !== undefined && payload.force !== true) {
      landed.kept += 1
      continue
    }

    // THE RULE IS ENFORCED ON THE WRITE AS WELL AS ON THE READ, and that is
    // cheap defence rather than belt-and-braces. {@link readChats} never puts a
    // runtime pointer in a payload, but a payload is a FILE on this path —
    // `--backup` writes one and an operator can post one back — so a stripped
    // export is a claim about one producer where the failure it prevents is
    // silent. Stripping here makes it a property of the store instead.
    //
    // `session_id` IS RESTATED rather than trusted from the carried field
    // block: it is what a re-copy matches on, and the two disagreeing would
    // produce a conversation nothing could ever find again.
    const fields = { ...portableOf(chat.fields ?? {}), session_id: sessionId }
    const title = chat.title ?? sessionId
    const body = chat.body ?? ''
    let uid: string
    if (existing === undefined) {
      const created = await store.create({
        type: CHAT_TYPE,
        title,
        fields,
        body,
        // Carried only when the source said something. The chat lifecycle is
        // `open` and only `open`, so an absent status is the store's default
        // rather than a state to invent.
        ...(typeof chat.status === 'string' && chat.status !== '' ? { status: chat.status } : {}),
      })
      uid = created.ticket.uid
      landed.created += 1
    } else {
      await store.update({ uid: existing.uid, patch: { title, fields, body } })
      uid = existing.uid
      landed.replaced += 1
    }

    landed.comments += await writeComments(store, uid, chat.comments ?? [])
  }
  return landed
}

/**
 * Land one conversation's comments, matched by kind.
 *
 * BY KIND AND NOT BY POSITION, because kind is what the library reads them back
 * by: `TicketSessionArchive` walks a chat ticket's comments looking for the one
 * whose `fields.kind` is `chat_transcript`. A second comment of that kind would
 * make which transcript a session loads depend on scan order.
 *
 * REPLACED IN PLACE RATHER THAN ADDED BESIDE, for exactly that reason. A
 * `force` re-copy of a conversation the destination already holds must leave it
 * holding one transcript, not two.
 */
async function writeComments(
  store: TicketStore,
  uid: string,
  comments: ChatComment[],
): Promise<number> {
  const existing = new Map<string, Ticket>()
  for (const comment of (await store.comments({ uid })).comments) {
    const kind = String((comment.fields ?? {}).kind ?? '')
    if (kind !== '' && !existing.has(kind)) existing.set(kind, comment)
  }
  let written = 0
  for (const comment of comments) {
    const kind = String(comment.kind ?? '').trim()
    if (kind === '') continue
    const body = String(comment.body ?? '')
    const there = existing.get(kind)
    if (there === undefined) await store.comment({ uid, kind, body })
    else await store.update({ uid: there.uid, patch: { body } })
    written += 1
  }
  return written
}
