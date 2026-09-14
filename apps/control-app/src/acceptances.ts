import {
  ACCEPTANCE_GRANTED,
  ACCEPTANCE_REQUESTED,
  ACCEPTANCE_WITHDRAWN,
} from './builder/contact-events.js'
import {
  ACCEPTANCE_KEYS,
  PRIVACY_POLICY_ACCEPTED,
  T_AND_C_ACCEPTED,
  acceptanceType,
  holdsState,
  isAcceptanceKey,
  isRevocable,
  needsDocument,
} from './builder/acceptances.js'
import { contactEventInsert, type EventEnv } from './events'
import type { Scope } from './scope'
import type { Ticket, TicketStore } from './tickets'
import { newId } from '../../../tools/generate/src/store/ids'

/**
 * User acceptances — what a contact has agreed to, asked for, and been shown
 * ([[REQ-240]], [[DOC-44]]).
 *
 * THREE THINGS, AND THEY ARE DELIBERATELY THREE. The *definition* is a ticket in
 * the business's own store (§3), the *state* is a row (§4), and the *history* is
 * `contact_events` (§5). Collapsing any pair loses something concrete: a
 * definition in code cannot differ per business, a state in the event log cannot
 * be queried, and a history in the state row cannot tell "never asked" from
 * "withdrawn last week".
 *
 * IT IS A SERVICE, WITH NO FLOW BAKED INTO IT (§6). Sign-up may ask about the
 * mailing list; a capture form sets a preference and a request; a portal will
 * let somebody change their mind. The acceptance layer is consumed by all of
 * them and belongs to none — SO THE WRITE PATH IS A FUNCTION AND NOT A ROUTE.
 * If recording an acceptance were reachable only from inside the builder's
 * authenticated gate, a public self-serve sign-up could never call it, and
 * self-serve sign-up is precisely the thing this round must not preclude.
 * {@link recordAcceptance} takes a database and a contact id, and nothing else.
 *
 * THE DOCUMENT IS A TICKET, ON `templates.ts`'s PRECEDENT AND FOR ITS REASON.
 * Copy that must change without a deploy belongs in the tenant's store; the
 * newest ticket carrying the key wins, and a record written last month still
 * points at the ticket that said what it said. That also closes the platform-only
 * gap in one move — a customer's terms are a ticket in the customer's store,
 * reached by this same code with no second path and no platform branch
 * ([[DOC-40]] §2.1 rule 1).
 *
 * AND THE ACCEPTANCE NAMES THE TICKET UID, NOT A VERSION STRING. "What did they
 * agree to" then resolves to immutable stored text rather than to a number
 * somebody has to map back to a document later — and "do they owe a fresh one"
 * is {@link documentOutstanding}, a COMPARISON against the document in force
 * rather than a null check. `terms.ts` already records why a null check is
 * wrong: it answers "have they ever accepted anything", which is the same
 * question only until the first time the document changes.
 */

/** The ticket type. Spelled once; `tickets.ts` registers the pack under it. */
export const ACCEPTANCE_TYPE = 'acceptance'

/**
 * The type's schema, merged into `productTypePack()`.
 *
 * `acceptance_key` IS AN ENUM OVER THE REGISTRY, so a definition cannot be
 * authored under a key no writer will ever look up. The failure of a closed set
 * is a refusal at authoring time; the failure of an open one is a lookup that
 * finds nothing at the moment somebody is agreeing to something.
 *
 * THE BODY IS THE DOCUMENT AND IS REQUIRED, like a template's and unlike a
 * material's. A material's body is written asynchronously by an extractor, so an
 * empty one is a stage; an acceptance document with no text is not a document,
 * and the moment it is read somebody is being asked to agree to it.
 */
export const ACCEPTANCE_SCHEMA = {
  fields: {
    acceptance_key: { type: 'enum', enum: [...ACCEPTANCE_KEYS], required: true },
  },
  body: { required: true, non_empty: true },
}

/** One contact's standing answer on one key. */
export interface AcceptanceRecord {
  contactId: string
  /** Which business's record this is — always the contact's own. */
  businessId: string
  key: string
  granted: boolean
  /** Which document ticket they accepted. Null for a preference. */
  documentUid: string | null
  /** When the value was set — the act, not the row's last touch. */
  setAt: string
}

/** What a writer says happened. */
export interface AcceptanceSpec {
  contactId: string
  key: string
  /**
   * Which way. A {@link REQUEST} key may only be granted, because there is
   * nothing to take back; a document may only be granted, because un-agreeing to
   * terms already acted under is not a state this system can represent.
   */
  granted: boolean
  /**
   * THE WORDING THEY WERE SHOWN, AND IT IS REQUIRED.
   *
   * A checkbox's is its form label, an implied acceptance's is in the form's
   * config, a document's is the ticket. Wording reconstructed later — from
   * today's label, or today's copy — cannot evidence what was on the page that
   * day, and a transition recorded without it is a transition that can never be
   * evidenced. So it is refused rather than defaulted: a default would be this
   * module inventing what somebody read.
   */
  wording: string
  /** The document ticket accepted. Required for a document key, refused for others. */
  documentUid?: string | null
  /** When it happened. Defaults to now, and an importer passes the real time. */
  occurredAt?: string
  /**
   * Narrow the write to a contact in THIS business.
   *
   * OPTIONAL, BECAUSE THE BUSINESS IS DERIVED EITHER WAY. Both inserts are
   * `INSERT ... SELECT ... FROM users`, so the row lands on the contact's own
   * business whether or not a caller names one. Supplying it turns the write
   * into a refusal as well — nothing is written for a contact outside that
   * business — which is what a caller holding a scope should always do.
   */
  businessId?: string
  /** The audit stamp. Injectable so a suite can order two writes deterministically. */
  now?: string
}

/** Refused because nothing declares this key. */
export class UnknownAcceptanceError extends Error {
  readonly name = 'UnknownAcceptanceError'
  constructor(readonly key: string) {
    super(
      `\`${key}\` is not an acceptance key. The system-defined keys are ` +
        `${ACCEPTANCE_KEYS.join(', ')}, declared in builder/acceptances.js.`,
    )
  }
}

/** Refused because the write does not fit what this kind of acceptance IS. */
export class AcceptanceRefusedError extends Error {
  readonly name = 'AcceptanceRefusedError'
  constructor(readonly key: string, reason: string) {
    super(`Refusing to record \`${key}\`: ${reason}. Nothing was written.`)
  }
}

/** Refused because the contact is not in this business, or does not exist. */
export class UnknownAcceptanceContactError extends Error {
  readonly name = 'UnknownAcceptanceContactError'
  constructor() {
    super('No such contact in this business.')
  }
}

/** No definition carries this key in this business's store, and none is seeded. */
export class AcceptanceDocumentNotFoundError extends Error {
  readonly name = 'AcceptanceDocumentNotFoundError'
  constructor(readonly key: string) {
    super(`No \`${key}\` acceptance document exists in this business.`)
  }
}

interface AcceptanceRow {
  contact_id: string
  business_id: string
  acceptance_key: string
  granted: number
  document_uid: string | null
  set_at: string
}

function toRecord(row: AcceptanceRow): AcceptanceRecord {
  return {
    contactId: row.contact_id,
    businessId: row.business_id,
    key: row.acceptance_key,
    granted: row.granted !== 0,
    documentUid: row.document_uid,
    setAt: row.set_at,
  }
}

const ACCEPTANCE_COLUMNS =
  'contact_id, business_id, acceptance_key, granted, document_uid, set_at'

/**
 * The statement that writes one acceptance state row, as a statement.
 *
 * A BUILDER SO IT CAN GO IN A BATCH, on `contactEventInsert`'s precedent. The
 * state and the event are one act — a value set with no event is a change nobody
 * can evidence, and an event with no value is a history whose subject does not
 * exist — so they are written together or neither is.
 *
 * `INSERT ... SELECT ... FROM users`, WHICH IS WHERE `business_id` COMES FROM.
 * The caller names a contact and the contact's own row decides which business
 * the record lands in, so the two can never disagree.
 *
 * AN UPSERT, BECAUSE THIS IS STATE. The unique index on (contact, key) is what
 * it conflicts on, so "set the newsletter" is one statement rather than a read
 * followed by a decision two concurrent writers make differently. `created_at`
 * is deliberately not in the update list: the row remembers when it first
 * existed, and `set_at` is when the current value was chosen.
 */
function acceptanceInsert(
  env: EventEnv,
  spec: {
    contactId: string
    key: string
    granted: boolean
    documentUid: string | null
    setAt: string
    now: string
    businessId?: string
  },
): D1PreparedStatement {
  const scoped = spec.businessId !== undefined
  const where = scoped ? 'WHERE u.id = ? AND u.tenant_id = ?' : 'WHERE u.id = ?'
  const statement = env.DB.prepare(
    'INSERT INTO user_acceptances (id, contact_id, business_id, acceptance_key, ' +
      'granted, document_uid, set_at, created_at, updated_at) ' +
      `SELECT ?, u.id, u.tenant_id, ?, ?, ?, ?, ?, ? FROM users u ${where} ` +
      'ON CONFLICT (contact_id, acceptance_key) DO UPDATE SET ' +
      'granted = excluded.granted, document_uid = excluded.document_uid, ' +
      'set_at = excluded.set_at, updated_at = excluded.updated_at',
  )
  const values: unknown[] = [
    newId('acc'),
    spec.key,
    spec.granted ? 1 : 0,
    spec.documentUid,
    spec.setAt,
    spec.now,
    spec.now,
    spec.contactId,
  ]
  if (scoped) values.push(spec.businessId)
  return statement.bind(...values)
}

/**
 * Record what a contact agreed to, asked for, or took back.
 *
 * THE ONE WRITE PATH, for every type and every caller. A form, a portal control
 * and a sign-up flow all land here, so the rules below are enforced once rather
 * than remembered three times.
 *
 * WHAT IT REFUSES, and each refusal is a fact about the model rather than a
 * validation preference:
 *
 *   an undeclared key       nothing branches on a key nobody designed;
 *   an empty wording        a transition that cannot be evidenced (see
 *                           {@link AcceptanceSpec.wording});
 *   withdrawing a document  not revocable by the contact — the account is simply
 *                           never entered, which is a thing that happens rather
 *                           than a state to store;
 *   withdrawing a request   there is nothing to take back;
 *   a document with no uid  "what did they agree to" would have no answer;
 *   a uid on anything else  a preference is versioned by nothing, and a stored
 *                           uid would imply it was.
 *
 * A `request` WRITES AN EVENT AND NO ROW, which is the whole of what a request
 * is. Everything else writes both, in one batch.
 *
 * THE EVENT KIND IS THE DIRECTION, never a payload to open and read: granted,
 * withdrawn, requested. A timeline that says "changed" has lost the thing it was
 * for.
 */
export async function recordAcceptance(
  env: EventEnv,
  spec: AcceptanceSpec,
): Promise<AcceptanceRecord | null> {
  const { key } = spec
  if (!isAcceptanceKey(key)) throw new UnknownAcceptanceError(key)

  const wording = (spec.wording ?? '').trim()
  if (wording === '') {
    throw new AcceptanceRefusedError(
      key,
      'no wording was given, so nothing would evidence what the contact was shown',
    )
  }

  const document = spec.documentUid ?? null
  if (needsDocument(key) && document === null) {
    throw new AcceptanceRefusedError(
      key,
      'it is an acceptance of a document and no document ticket was named',
    )
  }
  if (!needsDocument(key) && document !== null) {
    throw new AcceptanceRefusedError(
      key,
      `a ${acceptanceType(key)} is versioned by nothing, so it cannot name a document`,
    )
  }

  // ONE RULE FOR BOTH WAYS OF NOT BEING REVOCABLE, with the two honest reasons.
  // A second check per type would be two places for the same question to be
  // answered, free to disagree the day a fourth type arrives.
  if (!spec.granted && !isRevocable(key)) {
    throw new AcceptanceRefusedError(
      key,
      holdsState(key)
        ? 'a document acceptance is not revocable by the contact'
        : 'it is a request, and there is nothing to take back',
    )
  }

  const now = spec.now ?? new Date().toISOString()
  const occurredAt = spec.occurredAt ?? now
  const kind = !holdsState(key)
    ? ACCEPTANCE_REQUESTED
    : spec.granted
      ? ACCEPTANCE_GRANTED
      : ACCEPTANCE_WITHDRAWN

  const event = contactEventInsert(env, {
    contactId: spec.contactId,
    kind,
    occurredAt,
    detail: {
      key,
      wording,
      ...(document === null ? {} : { document }),
    },
    now,
    ...(spec.businessId === undefined ? {} : { businessId: spec.businessId }),
  })

  if (!holdsState(key)) {
    // A REQUEST IS AN EVENT AND NOTHING ELSE. `INSERT ... SELECT` over an empty
    // select is a no-op rather than an error, so the changes count is what says
    // whether the contact was there to record anything against.
    const written = await event.run()
    if (!written.meta?.changes) throw new UnknownAcceptanceContactError()
    return null
  }

  const state = acceptanceInsert(env, {
    contactId: spec.contactId,
    key,
    granted: spec.granted,
    documentUid: document,
    setAt: occurredAt,
    now,
    ...(spec.businessId === undefined ? {} : { businessId: spec.businessId }),
  })
  const [stateResult] = await env.DB.batch([state, event])
  if (!stateResult.meta?.changes) throw new UnknownAcceptanceContactError()

  // READ BACK RATHER THAN RECONSTRUCTED. The row carries the business the
  // statement derived, which the caller did not supply and this function has no
  // second way of knowing.
  const row = await env.DB.prepare(
    `SELECT ${ACCEPTANCE_COLUMNS} FROM user_acceptances WHERE contact_id = ? AND acceptance_key = ?`,
  )
    .bind(spec.contactId, key)
    .first<AcceptanceRow>()
  if (!row) throw new UnknownAcceptanceContactError()
  return toRecord(row)
}

/**
 * Everything one contact currently holds, in registry order.
 *
 * SCOPED BY BUSINESS AS WELL AS BY CONTACT, so a caller in one business holding
 * an id from another reads an empty list — which is what an id that never
 * existed reads as.
 */
export async function acceptancesOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
): Promise<AcceptanceRecord[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${ACCEPTANCE_COLUMNS} FROM user_acceptances ` +
      'WHERE business_id = ? AND contact_id = ?',
  )
    .bind(scope.businessId, contactId)
    .all<AcceptanceRow>()
  const rows = (results ?? []).map(toRecord)
  // Registry order, not insertion order: a panel listing what somebody has
  // agreed to should not reorder itself because they changed their mind about
  // the newsletter this morning.
  const rank = (key: string): number => {
    const at = ACCEPTANCE_KEYS.indexOf(key)
    return at === -1 ? ACCEPTANCE_KEYS.length : at
  }
  return rows.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key))
}

/** One contact's standing answer on one key, or null if they have never been asked. */
export async function acceptanceOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
  key: string,
): Promise<AcceptanceRecord | null> {
  const row = await env.DB.prepare(
    `SELECT ${ACCEPTANCE_COLUMNS} FROM user_acceptances ` +
      'WHERE business_id = ? AND contact_id = ? AND acceptance_key = ?',
  )
    .bind(scope.businessId, contactId, key)
    .first<AcceptanceRow>()
  return row ? toRecord(row) : null
}

/**
 * Every contact in this business whose answer on `key` is `granted`.
 *
 * THE QUERY THIS TABLE EXISTS FOR. "Who is on the newsletter" is what eventually
 * sends a newsletter, and it runs through `idx_user_acceptances_business_key` —
 * business, then key, then value, which is the order the question is asked in.
 * The same question over a JSON bag on `users` is a scan of every contact in the
 * business, because D1 cannot index into one.
 */
export async function contactsWith(
  env: EventEnv,
  scope: Scope,
  key: string,
  granted = true,
): Promise<string[]> {
  const { results } = await env.DB.prepare(
    'SELECT contact_id FROM user_acceptances ' +
      'WHERE business_id = ? AND acceptance_key = ? AND granted = ? ' +
      'ORDER BY contact_id',
  )
    .bind(scope.businessId, key, granted ? 1 : 0)
    .all<{ contact_id: string }>()
  return (results ?? []).map((r) => r.contact_id)
}

/**
 * The document in force for `key` in this business, seeding the default if the
 * business has never had one.
 *
 * NEWEST WINS, WHICH IS WHAT MAKES REPLACEMENT A WRITE RATHER THAN AN EDIT
 * (`templates.ts`'s argument, unchanged). Several tickets may carry one key; the
 * most recently created is the one being agreed to. Rewriting the copy wholesale
 * need not destroy the ticket that last month's acceptances point at — which is
 * the entire reason a record names a uid rather than a version string.
 *
 * SEED-IF-ABSENT, NEVER SEED-UNCONDITIONALLY. A business that has never been
 * asked for its terms has none, and the first sign-up would otherwise fail for
 * want of copy nobody knew they had to write. The seed is written AS A TICKET,
 * so the very next act on it is ordinary authoring.
 */
export async function documentFor(store: TicketStore, key: string): Promise<Ticket> {
  if (!isAcceptanceKey(key)) throw new UnknownAcceptanceError(key)
  if (!needsDocument(key)) {
    throw new AcceptanceRefusedError(key, 'it is not an acceptance of a document')
  }

  const { tickets } = await store.query({
    predicate: `type=${ACCEPTANCE_TYPE} AND fields.acceptance_key=${key}`,
    sort: '-created_at',
    limit: 'all',
  })
  if (tickets.length > 0) return tickets[0]

  const seed = SEED_DOCUMENTS[key]
  if (!seed) throw new AcceptanceDocumentNotFoundError(key)
  const { ticket } = await store.create({
    type: ACCEPTANCE_TYPE,
    title: seed.title,
    fields: { acceptance_key: key },
    body: seed.body,
  })
  return ticket
}

/**
 * Do they owe a fresh acceptance of this document?
 *
 * A COMPARISON, NOT A NULL CHECK, and `terms.ts` already wrote down why: "has
 * this person ever accepted anything" is the same question only until the first
 * time the document changes, and then it is silently the wrong one for everybody
 * who accepted the old one.
 *
 * SO BUMPING A DOCUMENT IS WRITING A NEWER TICKET UNDER THE SAME KEY, and every
 * prior acceptance reads as outstanding from that moment — with no row rewritten
 * and nothing sweeping the table.
 */
export function documentOutstanding(
  /**
   * THE DOCUMENT IN FORCE, NARROWED TO THE UID IT IS COMPARED BY ([[REQ-245]]).
   * It was a whole {@link Ticket}, which every caller happens to hold — except
   * the portal's projection, which has already reduced the definition to what it
   * shows. Widening the parameter to what the function actually reads costs
   * nothing at the existing call sites and saves a cast at the new one.
   */
  inForce: { uid: string },
  record: AcceptanceRecord | null,
): boolean {
  if (!record || !record.granted) return true
  return record.documentUid !== inForce.uid
}

interface SeedDocument {
  title: string
  body: string
}

/**
 * The documents a business starts with.
 *
 * DELIBERATELY BUSINESS-NEUTRAL, on `SEED_TEMPLATES`'s reasoning: the same seed
 * is written into whichever store asks, so naming 1st Contact here would put our
 * name in a plumber's terms to their own customers.
 *
 * THE COPY IS PLACEHOLDER AND THAT IS NOT AN OVERSIGHT — the same position
 * `terms.ts` takes about `TERMS_TEXT`. The mechanism is what is being built; the
 * words are a content dependency with their own lead time. They live in a ticket
 * rather than a constant, so supplying the real text is authoring rather than a
 * deploy, which is the whole point of the document being a ticket.
 *
 * ONLY THE DOCUMENT KEYS ARE SEEDED. A preference has no document to agree to —
 * its wording belongs to the surface that asked, and is recorded on the event.
 */
export const SEED_DOCUMENTS: Record<string, SeedDocument> = {
  [T_AND_C_ACCEPTED]: {
    title: 'Terms and conditions',
    body: [
      'These terms have not been written yet.',
      '',
      'Replace this text with your own terms and conditions. Everyone who agrees',
      'to them is recorded as having agreed to THIS document, so rewriting them',
      'later leaves those records pointing at what was actually on the page at',
      'the time.',
    ].join('\n'),
  },
  [PRIVACY_POLICY_ACCEPTED]: {
    title: 'Privacy policy',
    body: [
      'This privacy policy has not been written yet.',
      '',
      'Replace this text with your own policy: what you collect, why, how long',
      'you keep it, and how somebody asks you to delete it.',
    ].join('\n'),
  },
}

/* ────────────────────────────────────────────────────────────────────────────
 * THE PORTAL'S VIEW ([[REQ-245]])
 *
 * What a signed-in contact is shown of their own acceptances, and the one write
 * they are allowed to make.
 *
 * IT PROJECTS; IT DOES NOT DECIDE. Which acceptances exist is the business's
 * definitions (below); which of them the contact may change is
 * {@link isRevocable}, which is a property of the KEY'S TYPE. Neither answer is
 * spelt here and neither is spelt in the module that draws it — so a business
 * turning on a new preference, or the registry gaining a key of either
 * unwritable type, lands on the page with nothing edited.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * What a business has TURNED ON, and what it calls it.
 *
 * TURNING ONE ON IS WRITING ITS DEFINITION. There is deliberately no second
 * list — no config field naming which preferences a portal renders, no table of
 * enabled keys — because a second list is a second answer to which acceptances
 * a business holds, free to drift from the first by one entry in silence. The
 * definitions ARE the answer, and the registry ({@link ACCEPTANCE_KEYS}) bounds
 * which keys a definition may be written under rather than deciding which of
 * them this business uses.
 *
 * THE LABEL IS THE TICKET'S TITLE AND THE WORDING IS ITS BODY. `acceptanceLabel`
 * is what an OPERATOR'S screen calls a key — one phrase for every business. This
 * is what the CONTACT is shown, so it comes from the business's own document and
 * changes without a deploy, exactly as `templates.ts` intends.
 */
export interface AcceptanceDefinition {
  key: string
  /** Which of the three, so a caller branches on behaviour rather than on key. */
  type: string
  /** The ticket that is in force for this key — what an acceptance would name. */
  uid: string
  /** The ticket's title: what the contact sees this called. */
  label: string
  /** The ticket's body: the sentence they are agreeing to, and the evidence. */
  wording: string
}

function toDefinition(ticket: Ticket): AcceptanceDefinition {
  const key = String(ticket.fields?.acceptance_key ?? '')
  return {
    key,
    type: acceptanceType(key) ?? '',
    uid: ticket.uid,
    label: ticket.title,
    wording: ticket.body,
  }
}

/**
 * Every acceptance this business has turned on, newest definition per key, in
 * registry order.
 *
 * NEWEST WINS, PER KEY — {@link documentFor}'s rule, applied to the whole set in
 * one query rather than one query per key. Replacing a definition is a write and
 * not an edit, so the record written last month still points at the ticket that
 * said what it said.
 *
 * A DEFINITION UNDER A KEY NOBODY DECLARES IS DROPPED rather than rendered as a
 * row with no behaviour. The store's own enum refuses to author one, so this is
 * the case where the registry shrank under a ticket that outlived it — and a row
 * whose type is unknown has no honest control state to be in.
 */
export async function definitionsFor(store: TicketStore): Promise<AcceptanceDefinition[]> {
  const { tickets } = await store.query({
    predicate: `type=${ACCEPTANCE_TYPE}`,
    sort: '-created_at',
    limit: 'all',
  })
  const newest = new Map<string, AcceptanceDefinition>()
  for (const ticket of tickets) {
    const definition = toDefinition(ticket)
    if (!isAcceptanceKey(definition.key)) continue
    if (!newest.has(definition.key)) newest.set(definition.key, definition)
  }
  return ACCEPTANCE_KEYS.filter((key) => newest.has(key)).map(
    (key) => newest.get(key) as AcceptanceDefinition,
  )
}

/**
 * One line of the portal: what it is, where this contact stands, and since when.
 *
 * `editable` IS THE WHOLE OF THE CONTROL DECISION, and it is computed here from
 * {@link isRevocable} rather than inferred from the key by whatever draws it. A
 * document is not revocable by the contact and a request has nothing to take
 * back, so both arrive `false` and the surface has nothing to decide — which is
 * what makes "type 1 and type 3 offer no control" a property of the type rather
 * than of some markup a later hand could rearrange.
 *
 * `granted` IS NULLABLE AND NULL IS A DIFFERENT FACT. Nobody has put the
 * question, which is not the same as a refusal and must not be drawn as one —
 * the same distinction the operator's Agreements pane already keeps.
 *
 * `wording` IS SENT ONLY FOR THE EDITABLE ONES, because it is only there that
 * the contact is being asked something: it is the sentence beside the control,
 * and it is what the event records as the evidence. A document's body is the
 * document, and a portal is not where somebody reads their terms.
 */
export interface PortalAcceptance {
  key: string
  label: string
  /** The sentence beside the control. Empty for anything with no control. */
  wording: string
  editable: boolean
  /**
   * A RECORD OF SOMETHING THAT HAPPENED, rather than a value that currently
   * stands — {@link holdsState} inverted, which is true of a request and of
   * nothing else ([[REQ-240]] §2).
   *
   * IT IS A BOOLEAN AND NOT THE TYPE NAME, deliberately. Between this and
   * `editable` the surface has everything it needs — which control to offer and
   * which tense to say it in — and knows none of the registry's vocabulary. So a
   * key of any type, including one added tomorrow, gets the right treatment from
   * two facts the acceptance layer computed, with the module that draws it
   * untouched ([[REQ-245]] §2).
   */
  historic: boolean
  /** True, false, or null — never asked. */
  granted: boolean | null
  /** When the current answer was given, or null. */
  since: string | null
  /**
   * For a document only: they agreed, but to an earlier one ([[REQ-240]] §2).
   * False everywhere else, including for a document they have never accepted —
   * "never asked" is `granted: null` and saying both would be saying it twice.
   */
  outstanding: boolean
}

/** The latest `acceptance.requested` per key — a request's whole history. */
async function requestsOf(
  env: EventEnv,
  scope: Scope,
  contactId: string,
): Promise<Map<string, string>> {
  const { results } = await env.DB.prepare(
    'SELECT occurred_at, detail FROM contact_events ' +
      'WHERE business_id = ? AND contact_id = ? AND kind = ? ' +
      'ORDER BY occurred_at DESC, rowid DESC',
  )
    .bind(scope.businessId, contactId, ACCEPTANCE_REQUESTED)
    .all<{ occurred_at: string; detail: string }>()
  const latest = new Map<string, string>()
  for (const row of results ?? []) {
    let key = ''
    try {
      const parsed: unknown = JSON.parse(row.detail || '{}')
      if (parsed && typeof parsed === 'object') {
        key = String((parsed as Record<string, unknown>).key ?? '')
      }
    } catch (_e) {
      // A row whose detail is unreadable is a row that cannot say which key it
      // was about. Skipping it loses one line; throwing loses the page.
      continue
    }
    if (key && !latest.has(key)) latest.set(key, row.occurred_at)
  }
  return latest
}

/**
 * Everything a signed-in contact is shown of their own acceptances.
 *
 * THE CONTACT IS THE CALLER'S OWN AND THE BUSINESS IS THE CONTACT'S OWN. Both
 * reads are scoped by {@link Scope}, so an id from another business reads as an
 * id that never existed — which is the same answer {@link acceptancesOf} already
 * gives and the reason no caller here can turn this into a lookup.
 *
 * THE DEFINITIONS DRIVE THE LIST AND THE STATE FILLS IT IN, never the other way
 * round. A state row under a key the business has since stopped defining draws
 * nothing: the surface would have no wording to label it with, and inventing one
 * is the thing §5's wording rule exists to prevent.
 */
export async function portalAcceptances(
  env: EventEnv,
  store: TicketStore,
  scope: Scope,
  contactId: string,
): Promise<PortalAcceptance[]> {
  const [definitions, held, asked] = await Promise.all([
    definitionsFor(store),
    acceptancesOf(env, scope, contactId),
    requestsOf(env, scope, contactId),
  ])
  const byKey = new Map(held.map((record) => [record.key, record]))

  return definitions.map((definition) => {
    const editable = isRevocable(definition.key)
    if (!holdsState(definition.key)) {
      const when = asked.get(definition.key) ?? null
      return {
        key: definition.key,
        label: definition.label,
        wording: '',
        editable,
        historic: true,
        granted: when === null ? null : true,
        since: when,
        outstanding: false,
      }
    }
    const record = byKey.get(definition.key) ?? null
    return {
      key: definition.key,
      label: definition.label,
      wording: editable ? definition.wording : '',
      editable,
      historic: false,
      granted: record ? record.granted : null,
      since: record ? record.setAt : null,
      outstanding:
        needsDocument(definition.key) && record !== null
          ? documentOutstanding(definition, record)
          : false,
    }
  })
}

/**
 * The one write the portal may make ([[REQ-245]] §2).
 *
 * IT IS BOUNDED BY TYPE AND NOT BY A LIST. `isRevocable` is true of a preference
 * and of nothing else, so a document key and a request key are refused here
 * whichever way the caller asks — and a key added to the registry tomorrow gets
 * the answer its type implies with nothing edited. That is the whole of how far
 * the read-only contract opens: this module may set and unset a contact's own
 * preference, and it may not grant access, move an entitlement or destroy
 * anything, because there is no function here that does any of those.
 *
 * THE WORDING COMES FROM THE DEFINITION AND NOT FROM THE CALLER. It is the
 * sentence the portal drew beside the control, read from the business's own
 * ticket at the moment of the write — so a client cannot supply its own evidence
 * of what somebody was shown, which is precisely the value it would be worth
 * forging.
 *
 * AN UNDEFINED KEY IS REFUSED, because there would be no wording to record and
 * therefore no transition that could ever be evidenced. A business that has not
 * turned a preference on has not shown anybody a sentence about it.
 */
export async function setPreference(
  env: EventEnv,
  store: TicketStore,
  scope: Scope,
  contactId: string,
  key: string,
  granted: boolean,
  now?: string,
): Promise<PortalAcceptance> {
  if (!isAcceptanceKey(key)) throw new UnknownAcceptanceError(key)
  if (!isRevocable(key)) {
    throw new AcceptanceRefusedError(
      key,
      `a ${acceptanceType(key)} is not the contact's to change from their portal`,
    )
  }
  const definition = (await definitionsFor(store)).find((entry) => entry.key === key)
  if (!definition) throw new AcceptanceDocumentNotFoundError(key)

  await recordAcceptance(env, {
    contactId,
    key,
    granted,
    wording: definition.wording,
    businessId: scope.businessId,
    ...(now === undefined ? {} : { now }),
  })

  // READ BACK THROUGH THE SAME PROJECTION THE PAGE WAS DRAWN FROM, rather than
  // assembling a reply out of what was just asked for. The caller's next render
  // is then the same shape as its first, and a write that landed differently
  // from what was requested says so instead of being echoed back.
  const after = (await portalAcceptances(env, store, scope, contactId)).find(
    (entry) => entry.key === key,
  )
  if (!after) throw new UnknownAcceptanceContactError()
  return after
}
