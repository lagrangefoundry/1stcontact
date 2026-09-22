import {
  businessBackendName,
  businessSessionIdFor,
  sessionIdFor,
  siteBackendName,
} from '../../../tools/generate/src/cli/ai/host-core'
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
  /**
   * Conversations the destination did not hold, written whole.
   *
   * A PLACEHOLDER AT THE TARGET ID COUNTS AS NOT HELD ([[BUG-137]]). The
   * deployed builder auto-creates an empty session the first time it is opened,
   * and it is a ticket rather than a conversation — see {@link writeChats}.
   */
  created: number
  /** Conversations it did hold, rewritten because `force` said so. */
  replaced: number
  /** Conversations it did hold, left exactly as they were. */
  kept: number
  /** Comments written across the two write cases. */
  comments: number
  /**
   * Rows a copy made BEFORE [[BUG-137]] stranded, archived by this one.
   *
   * Each is a chat ticket still carrying a SOURCE-side session id that this very
   * import has just re-addressed — unreachable where it sits, and its content
   * landing again in the same breath. Ordinarily zero.
   */
  strays: number
}

/**
 * A destination this history can be re-addressed onto ([[BUG-137]]).
 *
 * TWO IDS AND NOTHING ELSE, because a session id is derived from exactly one of
 * them. The route resolves both from the authorised scope and the store — never
 * from the payload, which names the source and addresses nothing.
 */
export interface ChatsTarget {
  /** This business's own id, as the destination mints it. */
  businessId: string
  /** The one site this business holds, or `null` when it holds none. */
  siteKey: string | null
}

/**
 * A history that cannot be re-addressed onto this destination ([[BUG-137]]).
 *
 * REFUSAL AND NOT A PASS-THROUGH. A conversation that arrives addressed to
 * nothing reports success and reads as data loss months later — which is the
 * whole of the bug this class exists to make impossible to repeat. Raised before
 * anything is written, so a refusal leaves the destination exactly as it was.
 */
export class ChatAddressError extends Error {
  readonly name = 'ChatAddressError'
  /** The session ids the refusal is about, so a caller need not parse prose. */
  readonly sessions: readonly string[]
  constructor(message: string, sessions: readonly string[] = []) {
    super(message)
    this.sessions = sessions
  }
}

/** The ticket type a conversation lives on. */
const CHAT_TYPE = 'chat'

/**
 * The comment kind the session file lives in — the library's own.
 *
 * NAMED ONCE, AND ONLY AS THE ONE KIND WITH AN ADDRESS IN IT. Comments are
 * carried wholesale rather than by a list of kinds ({@link ChatRecord.comments}),
 * and that is unchanged: this constant selects the kind whose HEADER has to be
 * re-addressed, not the kinds that travel.
 */
const TRANSCRIPT_KIND = 'chat_transcript'

/**
 * What a session id is ABOUT — a site, or a business ([[REQ-160]], [[REQ-239]]).
 *
 * THE TWO PREFIXES ARE READ OUT OF THE DERIVERS rather than spelled here. A
 * session id is `sessionIdFor(siteKey)` or `businessSessionIdFor(businessId)`,
 * and the whole of [[BUG-137]] is an id embedded in a derived key drifting from
 * the thing that derives it. A literal `'site-'` in this file would be that
 * same mistake, one layer up: the day a prefix changed upstream, this import
 * would go on recognising the old one and would resume producing exactly the
 * unreachable conversations it was written to stop.
 */
const SITE_SESSION_PREFIX = sessionIdFor('')
const BUSINESS_SESSION_PREFIX = businessSessionIdFor('')

/** Which of the two a conversation is, and the source id it names. */
type ChatSubject = 'site' | 'business'

interface ChatAddress {
  subject: ChatSubject
  /** The SOURCE's site key or business id, as the session id carries it. */
  id: string
}

/** Read a session id back to what it is about, or `null` for a form we do not mint. */
function addressOf(sessionId: string): ChatAddress | null {
  for (const [subject, prefix] of [
    ['site', SITE_SESSION_PREFIX],
    ['business', BUSINESS_SESSION_PREFIX],
  ] as const) {
    if (!sessionId.startsWith(prefix)) continue
    const id = sessionId.slice(prefix.length)
    return id === '' ? null : { subject, id }
  }
  return null
}

/** Where one carried conversation lands, in the destination's own vocabulary. */
interface ReAddressed {
  sessionId: string
  /** The registry name the destination registers for this subject. */
  backend: string
}

/**
 * Re-derive every carried conversation's address from the destination's own ids
 * ([[BUG-137]]).
 *
 * RE-DERIVED, NEVER PATCHED. Each value below is produced by calling the very
 * function that mints it — `sessionIdFor`, `businessSessionIdFor`,
 * `siteBackendName`, `businessBackendName` — with the DESTINATION's id. Nothing
 * is spelled twice, so the mapping cannot come apart from the minting.
 *
 * AMBIGUITY IS REFUSED RATHER THAN GUESSED, in the words `/api/export` already
 * refuses it. A payload naming two source sites has no unambiguous destination
 * site, and a first match would put one site's conversation in another's pane —
 * the same reasoning that makes the site export refuse a business holding two.
 *
 * Returns a map from the SOURCE session id to where it lands, which is also what
 * lets {@link writeChats} recognise a row a pre-fix copy stranded.
 */
function reAddress(chats: readonly ChatRecord[], target: ChatsTarget): Map<string, ReAddressed> {
  const unreadable: string[] = []
  const sourceSites = new Set<string>()
  const sourceBusinesses = new Set<string>()
  const addresses = new Map<string, ChatAddress>()

  for (const chat of chats) {
    const sessionId = String(chat.sessionId ?? '').trim()
    if (sessionId === '') continue
    const address = addressOf(sessionId)
    if (address === null) {
      unreadable.push(sessionId)
      continue
    }
    addresses.set(sessionId, address)
    ;(address.subject === 'site' ? sourceSites : sourceBusinesses).add(address.id)
  }

  if (unreadable.length > 0) {
    throw new ChatAddressError(
      `${unreadable.length} conversation(s) carry a session id in no form this ` +
        'product mints, so there is nothing to re-address them onto. Nothing was ' +
        'written.',
      unreadable,
    )
  }
  if (sourceSites.size > 1) {
    throw new ChatAddressError(
      `These conversations are about ${sourceSites.size} different sites, so there ` +
        'is no unambiguous destination site to re-address them onto. Nothing was ' +
        'written.',
      [...sourceSites].map((id) => sessionIdFor(id)),
    )
  }
  if (sourceBusinesses.size > 1) {
    throw new ChatAddressError(
      `These conversations are about ${sourceBusinesses.size} different businesses, ` +
        'so there is no unambiguous destination business to re-address them onto. ' +
        'Nothing was written.',
      [...sourceBusinesses].map((id) => businessSessionIdFor(id)),
    )
  }
  if (sourceSites.size > 0 && target.siteKey === null) {
    throw new ChatAddressError(
      `Business '${target.businessId}' holds no site, so a conversation about one ` +
        'has nowhere to land. Copy the site first. Nothing was written.',
      [...sourceSites].map((id) => sessionIdFor(id)),
    )
  }

  const landing = new Map<string, ReAddressed>()
  for (const [sessionId, address] of addresses) {
    landing.set(
      sessionId,
      address.subject === 'site'
        ? {
            sessionId: sessionIdFor(target.siteKey as string),
            backend: siteBackendName(target.siteKey as string),
          }
        : {
            sessionId: businessSessionIdFor(target.businessId),
            backend: businessBackendName(target.businessId),
          },
    )
  }
  return landing
}

/**
 * The session file's header, as the library writes and reads it.
 *
 * THE FRAMEWORK'S OWN EXPRESSION, copied deliberately rather than approximated:
 * `Session.fromFile` matches exactly this, and a looser one here would rewrite a
 * header the library then cannot parse. The header is the only part of a
 * transcript this file touches — the turns beneath it are the record and are
 * carried byte for byte.
 */
const SESSION_HEADER_RE = /^<!--\s*xgd-session\s*\n(.*?)\n-->\s*/s

/**
 * Re-address one session file's header ([[BUG-137]]).
 *
 * THE HEADER ADDRESSES; THE TURNS ARE THE RECORD. `id` is the session id again,
 * `backend` is the registry name the manager resolves when it attaches — and it
 * THROWS on a name nobody registered, so a transcript carrying the source's
 * would open the conversation in the right pane with its composer frozen on
 * *"Unknown backend claude+site:…"*. `chat_ticket_uid` names the ticket the
 * session is homed on, which is the destination's and not the source's.
 *
 * `backend_ref` IS CLEARED, on {@link NOT_PORTABLE_FIELDS}' own rule one layer
 * down: it names a conversation on a host that was RUNNING, and the destination
 * was running nothing. The library reads an absent ref as the cold-start path —
 * a new conversation seeded from the summary and the window — which is the
 * correct outcome rather than a loss.
 *
 * `chat_ticket_uid` IS REWRITTEN ONLY WHERE THE SOURCE HAD ONE. An empty string
 * means the summary feature is off, and planting a uid would turn on a feature
 * the source had off.
 *
 * A body with no header — or one whose header is not JSON — is returned
 * untouched. This is not the place to decide what an unparseable transcript is.
 */
function reAddressTranscript(body: string, landing: ReAddressed, chatUid: string): string {
  const match = SESSION_HEADER_RE.exec(body)
  if (match === null) return body
  let meta: Record<string, unknown>
  try {
    meta = JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return body
  }
  if (typeof meta !== 'object' || meta === null) return body
  meta.id = landing.sessionId
  if (typeof meta.backend === 'string' && meta.backend !== '') meta.backend = landing.backend
  if (typeof meta.backend_ref === 'string' && meta.backend_ref !== '') meta.backend_ref = ''
  if (typeof meta.chat_ticket_uid === 'string' && meta.chat_ticket_uid !== '') {
    meta.chat_ticket_uid = chatUid
  }
  // Rebuilt exactly as `Session.toFile` writes one, so the bytes this import
  // leaves are the bytes the library would have written itself.
  return `<!-- xgd-session\n${JSON.stringify(meta, null, 2)}\n-->\n\n${body.slice(match[0].length)}`
}

/**
 * Whether a conversation the destination holds is a PLACEHOLDER rather than a
 * conversation ([[BUG-137]]).
 *
 * THIS IS THE ANSWER TO "IT ALREADY HOLDS THE TARGET SESSION", AND IT HAS TO BE.
 * The deployed builder auto-creates an empty `site-…` and `business-…` session
 * the first time it is opened, so the destination holds one before any copy ever
 * runs. [[REQ-294]]'s *"one the far side already holds is KEPT and counted"* is
 * right for protecting the client's own turns and wrong against that — it would
 * preserve the emptiness in place of the history being imported, and report
 * success doing it, which is this bug reproduced with a green tick.
 *
 * EMPTY IS EMPTY OF EVERYTHING, not "has no `chat_transcript`". A blank
 * engagement ledger and no comment carrying any bytes at all: if the destination
 * has a single byte of anything — a transcript, a tool record stream, a ledger
 * entry — it is a conversation, and the client's own turns are protected exactly
 * as they were. Asking the question of the record rather than of one comment
 * kind is what keeps a library that adds a third kind from being able to make
 * this wrong.
 */
async function isPlaceholder(store: TicketStore, ticket: Ticket): Promise<boolean> {
  if ((ticket.body ?? '') !== '') return false
  const { comments } = await store.comments({ uid: ticket.uid })
  return comments.every((comment) => String(comment.body ?? '') === '')
}

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
 * RE-ADDRESSED ONTO THIS DESTINATION FIRST ([[BUG-137]]), and that is what makes
 * "matched by `session_id`" true at all. A session id is DERIVED from the thing
 * it is about — `site-<site key>`, `business-<business id>` — and neither id
 * survives a crossing: a business's id is minted independently on each side (it
 * is why the copy command matches businesses by NAME), and the destination's
 * site key is minted fresh by the site import. So a carried session id names a
 * site and a business that do not exist here, and writing it through unchanged
 * lands a row in the right tenant, with its transcript intact, that nothing can
 * ever ask for. {@link reAddress} re-derives each one from this destination's own
 * ids before anything is written, and refuses rather than guessing when it
 * cannot. `fields.backend` and the session file's header carry the same two ids
 * and are re-derived in the same breath.
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
 * A PLACEHOLDER AT THE TARGET ID IS NOT A CONVERSATION ([[BUG-137]]), and is
 * written over without `--force`. The deployed builder auto-creates an empty
 * session the first time it is opened, so the destination holds one before any
 * copy runs; keeping it would preserve the emptiness in place of the history
 * being imported and report success doing it. See {@link isPlaceholder} for what
 * empty means and why it is asked of the whole record.
 *
 * A ROW A PRE-FIX COPY STRANDED IS ARCHIVED ([[BUG-137]]). Copies made before
 * this fix left chat tickets under SOURCE-side session ids: unreachable where
 * they sit, and their content landing again in this very run. Archiving is the
 * store's own removal — every read above storage is built over
 * `archived: false` — and it is bounded to exactly the ids this import has just
 * re-addressed, so nothing else can be caught by it. That is what makes a
 * re-run idempotent over what a pre-fix copy left behind rather than leaving a
 * second, invisible copy beside the reachable one.
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
  target: ChatsTarget,
): Promise<ChatsLanded> {
  const chats = payload.chats ?? []
  // BEFORE ANY WRITE, and that ordering is the refusal's whole value: a history
  // this destination cannot address must leave it exactly as it was, for the
  // reason `/api/import` refuses ahead of `createDraft` rather than rolling back
  // after it.
  const landing = reAddress(chats, target)

  const { tickets } = await store.query({ predicate: `type=${CHAT_TYPE}`, limit: 'all' })
  const held = new Map<string, Ticket>()
  for (const ticket of tickets) {
    const sessionId = sessionIdOf(ticket)
    if (sessionId !== '') held.set(sessionId, ticket)
  }

  const landed: ChatsLanded = { created: 0, replaced: 0, kept: 0, comments: 0, strays: 0 }
  for (const chat of chats) {
    const carried = String(chat.sessionId ?? '').trim()
    // A record naming no session cannot be matched on a re-copy, so landing it
    // would be landing a ticket the next run would land again.
    if (carried === '') continue
    const place = landing.get(carried)
    if (place === undefined) continue
    const sessionId = place.sessionId
    const existing = held.get(sessionId)
    // Asked once, and only where it can change the answer: a store read per
    // conversation on a destination that holds nothing would be a read for
    // nothing.
    const placeholder = existing !== undefined && (await isPlaceholder(store, existing))

    if (existing !== undefined && !placeholder && payload.force !== true) {
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
    // produce a conversation nothing could ever find again. It is the
    // RE-ADDRESSED id ([[BUG-137]]) for exactly that reason — the carried one is
    // the source's and matches nothing the destination will ever ask for.
    //
    // `backend` IS RE-DERIVED beside it, and only where the source recorded one:
    // an empty backend means the conversation never started, and inventing a
    // name for it would be inventing a fact.
    const carriedFields = portableOf(chat.fields ?? {})
    const fields: Record<string, unknown> = { ...carriedFields, session_id: sessionId }
    if (typeof carriedFields.backend === 'string' && carriedFields.backend !== '') {
      fields.backend = place.backend
    }
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
      // RECORDED AS HELD, so a payload carrying two records that land on one
      // address writes one conversation rather than two tickets the library
      // would then choose between by scan order.
      held.set(sessionId, created.ticket)
      landed.created += 1
    } else {
      await store.update({ uid: existing.uid, patch: { title, fields, body } })
      uid = existing.uid
      // COUNTED BY WHAT WAS THERE, NOT BY WHICH STORE VERB RAN ([[BUG-137]]).
      // Writing over a placeholder reuses its row, because the row is what the
      // library will find — but the destination held no CONVERSATION, and these
      // counters are about conversations. Reporting it as a replacement would
      // tell the operator their history overwrote something.
      if (placeholder) landed.created += 1
      else landed.replaced += 1
    }

    landed.comments += await writeComments(store, uid, chat.comments ?? [], place)

    // The row a pre-fix copy left under the SOURCE's id, now that this one is
    // reachable. Only ever a row this import has itself re-addressed away from,
    // and never the row just written: on a copy into the business it came from,
    // the carried id and the landing id are the same string.
    //
    // AND ONLY AFTER THE CONTENT HAS ACTUALLY LANDED, which is why this sits
    // past the write rather than beside the match. A conversation that was KEPT
    // did not land, so its stray is the only copy of those turns the destination
    // has — archiving it there would destroy the very history the operator is
    // trying to reach. `kept` is what says `--force` is the way to mean it.
    const stray = carried === sessionId ? undefined : held.get(carried)
    if (stray !== undefined) {
      await store.archive({ uid: stray.uid })
      held.delete(carried)
      landed.strays += 1
    }
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
 *
 * AND THE SESSION FILE'S HEADER IS RE-ADDRESSED ON THE WAY IN ([[BUG-137]]).
 * That comment is not opaque bytes: it carries the session id a third time, the
 * backend name the manager resolves against its registry when it attaches, and
 * the uid of the chat ticket the session is homed on — all three the source's.
 * See {@link reAddressTranscript}, which touches the header and nothing below it.
 * Every other kind, `tool_transcript` included, is carried untouched: they are
 * records of what happened rather than statements about where it lives.
 */
async function writeComments(
  store: TicketStore,
  uid: string,
  comments: ChatComment[],
  place: ReAddressed,
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
    const carried = String(comment.body ?? '')
    const body = kind === TRANSCRIPT_KIND ? reAddressTranscript(carried, place, uid) : carried
    const there = existing.get(kind)
    if (there === undefined) await store.comment({ uid, kind, body })
    else await store.update({ uid: there.uid, patch: { body } })
    written += 1
  }
  return written
}
