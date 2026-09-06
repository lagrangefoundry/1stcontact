/**
 * The people of a business — the read and write half of the User tab
 * ([[REQ-170]], [[DOC-42]]).
 *
 * THE TAB IS UNIFORM AND THIS MODULE IS WHY. It answers "who are the people of
 * the business I am in", and the business is whichever one the caller's scope
 * resolved to. Viewed from 1st Contact the rows are our customers; viewed from a
 * customer's business they are that customer's customers. There is no branch on
 * which business it is, and there must not be: a platform-only people list is
 * [[DOC-40]] §2.1 rule 1's named failure mode arriving one table lower down.
 *
 * A CONTACT IS THE ENTITY, AND EVERYTHING ELSE IS A FACT ABOUT ONE ([[DOC-44]]
 * §2, §3, [[REQ-188]]). A `users` row in this tenant is a **contact** — the
 * whole population, whatever else is true of them. The rest are axes, and they
 * are independent:
 *
 * - **access** — *member*: `tos_accepted_at` set, meaning they SIGNED UP and may
 *   log in. Nothing else on the row implies it.
 * - **pipeline** — *lead* → *invited* → …: `pipeline_stage`, a stored value.
 *   Where the relationship stands, which is a different question from whether
 *   they can sign in.
 * - **operator** — a `memberships` row. May RUN a business, which is a different
 *   act and usually a different business.
 * - **entitled** — an `entitlements` row. Has been granted access to a thing.
 *
 * A MEMBER IS SOMEONE WHO SIGNED UP, NOT SOMEONE WE INVITED. The marker used to
 * be `invited_at`, which describes what *we* did rather than what *they* did —
 * send the invite and the tab called that person a member at once.
 *
 * AND THE FIX FOR THAT WAS ITSELF ONE LINE TOO FEW. Contact / Invited / Member
 * on a single axis cannot represent a member who was never invited, nor a lead
 * who is neither, and both occur ([[DOC-44]] §3). Two axes can, and the invite
 * moving somebody along one of them leaves the other exactly where it was. *
 * `memberships` DOES NOT MEAN "MAY LOG IN". {@link addContact} writes the
 * person's `users` row into this tenant while `provisionBusiness` writes their
 * membership on the business they will run — so an account logs in holding no
 * membership on the business it logs in to. Reading `memberships` to answer "may
 * this person sign in" is the specific error this comment exists to prevent.
 *
 * AND THOSE TWO ARE DELIBERATELY SEPARATE CALLS ([[REQ-186]]). Inviting is the
 * transition every business performs on its own people; provisioning a business
 * is 1st Contact's product-fulfilment action. One function doing both can only
 * express a person who owns a business, which is level 1 and nothing else.
 *
 * AND THE HISTORY IS A FIFTH RELATION, WHICH IS A LOG AND NOT A STATE
 * ([[REQ-195]]). `contact_events` records what HAPPENED to a person — added,
 * invited, signed up, mailed — and is appended to rather than written over. The
 * four axes above are the current answer; the history is how it came to be that
 * answer, and it is the only one of the five that can say a thing happened
 * twice.
 *
 * THE READ NEVER LEAVES THE TENANT. The list is `users WHERE tenant_id = ?` and
 * nothing else. The operated-businesses column joins `memberships` onto
 * `tenants` for a NAME, which is metadata about the join and not the content of
 * another business — the same thing `businessesFor` already does for the caller.
 * Nothing here can read what is inside a business the caller is not in.
 */

import { EMAIL_SHAPE_ERROR, isEmailShape } from './builder/email-shape.js'
// THE STAGE VALUES COME FROM THE MODULE THAT NAMES THEM, the same way the email
// shape does. `builder/people-axes.js` is the one definition of the two axes
// ([[DOC-44]] §3) and it has no imports of its own precisely so both sides of
// the seam can reach it; a string literal written here would be a second answer
// to what `invited` is spelt like, free to drift by one character in silence.
import { INVITED as PIPELINE_INVITED, LEAD as PIPELINE_LEAD } from './builder/people-axes.js'
// THE EVENT KINDS COME FROM THE MODULE THAT NAMES THEM, for the same reason the
// stages do: `builder/contact-events.js` has no imports precisely so both sides
// of the seam can reach it, and a literal written here would be a second answer
// to what `contact.invited` is spelt like ([[REQ-195]]).
import { CONTACT_CREATED, CONTACT_INVITED } from './builder/contact-events.js'
import { contactEventInsert, eventsOf, provenanceOf, type ContactEvent } from './events'
import type { IdentityEnv, UserEmailRow } from './identity'
import {
  accountInsert,
  emailsOf,
  newId,
  normaliseEmail,
  PRIMARY_EMAIL_SQL,
  USER_ID_BY_EMAIL_SQL,
  userEmailInsert,
} from './identity'
// THE NAME IS A TABLE, AND THIS MODULE DOES NOT KNOW ITS PREDICATE ([[REQ-193]]).
// `superseded_at IS NULL` is written in `names.ts` and nowhere else; what this
// file holds is the join fragment and the lift, so a reader here cannot forget
// the filter and show a name the person used to have.
import {
  CURRENT_NAME_COLUMNS,
  CURRENT_NAME_JOIN,
  formerNamesIn,
  formerNamesOf,
  InvalidNameError,
  nameFromJoin,
  writeName,
  type JoinedName,
  type NamePatch,
  type PersonName,
} from './names'
import type { Scope } from './scope'

/**
 * A person as the tab lists them.
 *
 * THE TWO AXES ARE REPORTED RATHER THAN INTERPRETED ([[REQ-188]], [[DOC-44]] §3).
 * `pipelineStage` is the stored stage and `termsAcceptedAt` is what accepting the
 * terms sets; between them they carry both axes, and the labels live at the one
 * surface that draws them, in `builder/people-axes.js`, so there is no second
 * copy here free to disagree.
 *
 * `invitedAt` IS STILL HERE AND IS NO LONGER A STATE. It records WHEN we asked,
 * which is a fact worth showing on a record; whether they are in that state is
 * `pipelineStage` ([[DOC-44]] §4). A reader deriving the stage from this stamp
 * would be reintroducing exactly what the column was added to remove.
 *
 * AND THE TAB SHOWS THE AXES RATHER THAN FILTERING ON THEM: a list that dropped
 * leads would be a second population, and the CRM reads the same rows
 * ([[DOC-42]] §9).
 *
 * `tos_accepted_at` AND NOT `first_seen_at` is the membership marker, because the
 * two differ. `admit` stamps `first_seen_at` on the first request through the
 * door and `guardTerms` runs after it, so the first means "reached the
 * interstitial once" and only the second means "completed sign-up" — which is
 * the legal fact, and the one worth being able to query.
 */
export interface Person {
  id: string
  /**
   * The PRIMARY address ([[REQ-191]]).
   *
   * ONE OF POSSIBLY SEVERAL, and the list shows one because a list shows one
   * thing per row. The rest are on {@link PersonDetail}. Null is a contact with
   * no address at all — a person reached only by phone, which the column this
   * replaced could not represent ([[DOC-42]] §4.1).
   */
  email: string | null
  /**
   * The ACCOUNT this contact belongs to ([[REQ-194]], [[DOC-42]] §6).
   *
   * REPORTED SO THAT THE TWO NOUNS ARE VISIBLY DIFFERENT ON THIS SURFACE. The
   * grants below name their subject by account key, and an operator looking at a
   * grant against `acct_…` needs somewhere to see which person that is. It is
   * many-to-one: two people on one account are two rows here carrying the same
   * value, which is what v1 does not yet produce and the schema already allows.
   */
  accountId: string
  /**
   * Their name right now, or null when they have none yet ([[REQ-193]]).
   *
   * THE RECORD AND NOT A STRING. A `displayName` field beside it would be a
   * second representation of the same fact in one payload — free to disagree,
   * and the thing this ticket's "no `sort_name`" rule refuses one table down.
   * What to show is `name.displayName`, resolved by `displayNameOf` in
   * `builder/people-name.js`, which both sides of the seam read.
   *
   * THE SAME SHAPE AS THE ADDRESS ONE ROW UP, AND A DIFFERENT AXIS. An address
   * is multi-valued NOW, so the list carries the primary and the detail carries
   * the rest; a name is multi-valued OVER TIME, so the list carries the current
   * one and `formerNames` carries what is safe to show of the rest.
   */
  name: PersonName | null
  /**
   * The names they used to have that are safe to surface ([[REQ-193]]).
   *
   * `changed` ONLY, FILTERED BY THE SERVER. The operator has to be able to find
   * *Sarah Jones* and be shown *Sarah Patel*, and the list is searched in the
   * browser — so the former names have to travel. A `corrected` supersession is
   * a typo kept for audit and never leaves `names.ts`, which is what makes "a
   * client cannot surface a deadname" a property of this payload rather than a
   * rule every client has to remember.
   */
  formerNames: string[]
  /** `active` is the member relation; anything else is refused `user_inactive`. */
  status: string
  /** When the invite was sent. A record of an act, never the pipeline stage. */
  invitedAt: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  /** Set means a member: they signed up, which includes accepting the terms. */
  termsAcceptedAt: string | null
  /** The pipeline axis: `lead` for every new contact, `invited` after an invite. */
  pipelineStage: string
  createdAt: string
}

/** A business this person may RUN — the operator relation, not the member one. */
export interface OperatedBusiness {
  businessId: string
  name: string
  role: string
  status: string
  revokedAt: string | null
}

/** One grant, as the editor shows it ([[DOC-42]] §6, [[REQ-184]]). */
export interface Grant {
  id: string
  /** The OBJECT — which business the access is to. */
  businessId: string
  /**
   * That business's name, so the joined table can say which one ([[REQ-189]]).
   *
   * IT CANNOT BE BORROWED FROM `operates`. The row that most needs a name is
   * the one with no membership to borrow it from — a grant against a business
   * this person does not run, which is a support arrangement or a mistake and
   * is precisely the mismatch the joined table exists to surface. Left to the
   * id it would read as an opaque `biz_…` beside real names, which is the
   * cell an operator would skip.
   *
   * THE SAME METADATA-ONLY JOIN `operates` ALREADY MAKES: `tenants.name` for a
   * business, and nothing inside it. Null when the tenant row is gone, so a
   * dangling grant still renders rather than disappearing.
   */
  businessName: string | null
  /** The SUBJECT. Null is a per-business capacity grant ([[REQ-184]]). */
  accountId: string | null
  plan: string
  source: string
  status: string
  startsAt: string
  endsAt: string | null
  note: string | null
}

/** One address, as the detail pane lists it ([[REQ-191]]). */
export interface PersonEmail {
  id: string
  email: string
  /** Exactly one of a person's addresses may carry this — a partial unique index says so. */
  isPrimary: boolean
  createdAt: string
}

/**
 * Everything the detail pane shows about one person.
 *
 * `emails` IS THE WHOLE SET AND `person.email` IS THE HEAD OF IT ([[REQ-191]]).
 * Both are here rather than one, because the list and the detail ask different
 * questions: the row shows who this is, and the pane shows everywhere they can
 * be reached. A pane that showed only the primary would make a second address
 * unobservable, which is the state that lets an operator invite the same human
 * twice.
 */
export interface PersonDetail {
  person: Person
  emails: PersonEmail[]
  operates: OperatedBusiness[]
  grants: Grant[]
  /**
   * What has happened to them, newest first and capped ([[REQ-195]]).
   *
   * ONE SEQUENCE, inbound and outbound together, because a reader interleaving
   * two lists by eye is a reader who will get the order wrong on the one
   * occasion it matters.
   */
  events: ContactEvent[]
  /**
   * Where they came from — the EARLIEST event, read by its own query.
   *
   * NOT THE TAIL OF `events`, which is capped: provenance taken off a truncated
   * list is quietly wrong for exactly the contacts with the longest histories,
   * which are the ones an operator is most likely to ask about. Null for a
   * contact whose history predates the spine, which is honest rather than
   * invented.
   */
  provenance: ContactEvent | null
}

interface UserRecord extends JoinedName {
  id: string
  /** Joined from `user_emails`, never a column on `users` ([[REQ-191]]). */
  email: string | null
  account_id: string
  status: string
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  tos_accepted_at: string | null
  pipeline_stage: string | null
  created_at: string
}

/**
 * Every read of a person: their own columns, the primary address joined on
 * ([[REQ-191]]) and the current name joined on ([[REQ-193]]).
 *
 * ALIASED OFF `u`, because {@link PRIMARY_EMAIL_SQL} is a correlated subquery and
 * has to name the row it correlates with — and because the name join needs the
 * same handle. Every query below therefore reads {@link USER_SOURCE}.
 *
 * BOTH ARRIVE ON THIS QUERY RATHER THAN AFTER IT. A second round trip would need
 * the ids of everybody in the business as bind variables, which is a limit the
 * model knows nothing about and a list that is unbounded by design.
 */
const USER_COLUMNS =
  `u.id AS id, ${PRIMARY_EMAIL_SQL} AS email, u.account_id AS account_id, ` +
  'u.status AS status, u.invited_at AS invited_at, ' +
  'u.first_seen_at AS first_seen_at, u.last_seen_at AS last_seen_at, ' +
  'u.tos_accepted_at AS tos_accepted_at, u.pipeline_stage AS pipeline_stage, ' +
  `u.created_at AS created_at, ${CURRENT_NAME_COLUMNS}`

/** `user_emails` rows as the pane wants them — the storage shape stays in `identity.ts`. */
function toPersonEmail(row: UserEmailRow): PersonEmail {
  return { id: row.id, email: row.email, isPrimary: row.is_primary === 1, createdAt: row.created_at }
}

const USER_SOURCE = `FROM users u ${CURRENT_NAME_JOIN}`

function toPerson(row: UserRecord, formerNames: string[] = []): Person {
  return {
    id: row.id,
    email: row.email,
    accountId: row.account_id,
    name: nameFromJoin(row),
    formerNames,
    status: row.status,
    invitedAt: row.invited_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    termsAcceptedAt: row.tos_accepted_at,
    // COALESCED HERE AND NOWHERE ELSE. The column is `NOT NULL DEFAULT 'lead'`,
    // so this only fires for a row read through a schema older than 0009 — and
    // one default, at the boundary, beats every caller downstream having to
    // remember that the stage might be missing.
    pipelineStage: row.pipeline_stage ?? PIPELINE_LEAD,
    createdAt: row.created_at,
  }
}

/**
 * Everyone in this business, contacts included.
 *
 * ORDERED BY `created_at`, oldest first, so the list does not reshuffle when
 * someone signs in — `last_seen_at` moves on every request and an ordering that
 * read it would make the row under the operator's cursor jump.
 */
export async function peopleOf(env: IdentityEnv, scope: Scope): Promise<Person[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? ` +
      'ORDER BY u.created_at ASC, u.id ASC',
  )
    .bind(scope.businessId)
    .all<UserRecord>()
  // ONE QUERY FOR THE WHOLE BUSINESS, not one per person: the list is searched
  // in the browser, so every row needs its safe former names and a query each
  // would make the tab's cost linear in the size of the customer base.
  const formerly = await formerNamesIn(env, scope.businessId)
  return (results ?? []).map((row) => toPerson(row, formerly.get(row.id) ?? []))
}

/**
 * One person's row, and nothing joined onto it beyond their name and primary
 * address ([[REQ-199]]).
 *
 * SCOPED BY BOTH id AND tenant, which is what stops a caller in one business
 * reading a row in another by guessing an id — the existence oracle `identity.ts`
 * and `scope.ts` both refuse to be. Not found and not-in-this-business are the
 * same answer for the same reason {@link personDetail} gives.
 *
 * SEPARATE FROM {@link personDetail} BECAUSE THE INVITE ASKS A SMALLER QUESTION.
 * The detail pane needs the businesses, the grants, the history and the
 * provenance — five reads for one person, which is right for a pane and wrong
 * for a loop over a checked selection. This is the one query the row itself
 * costs, so inviting ten contacts is ten reads rather than fifty.
 */
export async function personOf(
  env: IdentityEnv,
  scope: Scope,
  personId: string,
): Promise<Person | null> {
  if (personId === '') return null
  const row = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
  )
    .bind(scope.businessId, personId)
    .first<UserRecord>()
  if (!row) return null
  return toPerson(row, await formerNamesOf(env, row.id))
}

/**
 * One person, with what they may run and what they hold.
 *
 * SCOPED BY BOTH id AND tenant. A person id alone would let a caller in one
 * business read a row in another by guessing — the existence oracle `identity.ts`
 * and `scope.ts` both refuse to be. Not found and not-in-this-business are the
 * same answer for the same reason.
 */
export async function personDetail(
  env: IdentityEnv,
  scope: Scope,
  personId: string,
): Promise<PersonDetail | null> {
  const row = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
  )
    .bind(scope.businessId, personId)
    .first<UserRecord>()
  if (!row) return null

  // READ AFTER THE SCOPED ROW, never instead of it. `emailsOf` takes a person id
  // and no tenant — it is a child read, and the row above is what establishes
  // that this caller may see this person at all.
  const emails = await emailsOf(env, personId)

  const operates = await env.DB.prepare(
    'SELECT m.business_id AS business_id, t.name AS name, m.role AS role, ' +
      'm.status AS status, m.revoked_at AS revoked_at FROM memberships m ' +
      'JOIN tenants t ON t.id = m.business_id WHERE m.user_id = ? ' +
      'ORDER BY m.granted_at ASC',
  )
    .bind(personId)
    .all<{
      business_id: string
      name: string
      role: string
      status: string
      revoked_at: string | null
    }>()

  const businessIds = (operates.results ?? []).map((b) => b.business_id)
  // BY ACCOUNT, NOT BY PERSON ([[REQ-194]]). This passed `personId` while an
  // account WAS a person, so a grant naming a subject could only ever be found
  // for the one person whose id it happened to equal. The subject is an account
  // key, so the lookup is the account key.
  const grants = await grantsFor(env, row.account_id, businessIds)
  const formerly = await formerNamesOf(env, personId)

  // BOTH READS ARE SCOPED AGAIN rather than trusting the row above. They are two
  // more queries against a table that carries its own `business_id`, and a read
  // that took the scope on trust would be the one place the barrier depended on
  // a caller's memory ([[REQ-195]]).
  const events = await eventsOf(env, scope, personId)
  const provenance = await provenanceOf(env, scope, personId)

  return {
    person: toPerson(row, formerly),
    emails: emails.map(toPersonEmail),
    operates: (operates.results ?? []).map((b) => ({
      businessId: b.business_id,
      name: b.name,
      role: b.role,
      status: b.status,
      revokedAt: b.revoked_at,
    })),
    grants,
    events,
    provenance,
  }
}

/**
 * The grants that concern this person: the ones naming their account, and the
 * capacity grants on the businesses they run.
 *
 * BOTH KINDS, BECAUSE THE MODEL HAS BOTH ([[DOC-42]] §6). A capacity grant
 * (`account_id IS NULL`) says "this business holds a plan" and is what every row
 * written so far is; an account-subject grant says "this account may reach this
 * thing" and is what a customer's paywall will write. Showing only one would
 * make the editor lie about which it was changing.
 *
 * THE SUBJECT IS AN ACCOUNT KEY AND THIS TAKES ONE ([[REQ-194]]). It took a
 * person id, because in code an account was a person — so a grant naming an
 * account would have been invisible here the moment an account held anybody but
 * the person whose id it was written as. The caller reads the account off the
 * person; two people on one account see the same grants, which is what belonging
 * to an account means.
 */
async function grantsFor(
  env: IdentityEnv,
  accountId: string,
  businessIds: string[],
): Promise<Grant[]> {
  // LEFT JOIN, not an inner one: a grant naming a business whose `tenants` row
  // has gone must still be reported. An inner join would silently drop it, and
  // a grant that vanishes is the one an operator can never ask about.
  const columns =
    'e.id AS id, e.business_id AS business_id, t.name AS business_name, ' +
    'e.account_id AS account_id, e.plan AS plan, e.source AS source, ' +
    'e.status AS status, e.starts_at AS starts_at, e.ends_at AS ends_at, e.note AS note'
  const rows: GrantRecord[] = []

  const own = await env.DB.prepare(
    `SELECT ${columns} FROM entitlements e LEFT JOIN tenants t ON t.id = e.business_id ` +
      'WHERE e.account_id = ? ORDER BY e.starts_at ASC',
  )
    .bind(accountId)
    .all<GrantRecord>()
  rows.push(...(own.results ?? []))

  if (businessIds.length > 0) {
    const holes = businessIds.map(() => '?').join(', ')
    const capacity = await env.DB.prepare(
      `SELECT ${columns} FROM entitlements e LEFT JOIN tenants t ON t.id = e.business_id ` +
        `WHERE e.account_id IS NULL AND e.business_id IN (${holes}) ORDER BY e.starts_at ASC`,
    )
      .bind(...businessIds)
      .all<GrantRecord>()
    rows.push(...(capacity.results ?? []))
  }

  return rows.map((r) => ({
    id: r.id,
    businessId: r.business_id,
    businessName: r.business_name ?? null,
    accountId: r.account_id,
    plan: r.plan,
    source: r.source,
    status: r.status,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    note: r.note,
  }))
}

interface GrantRecord {
  id: string
  business_id: string
  business_name: string | null
  account_id: string | null
  plan: string
  source: string
  status: string
  starts_at: string
  ends_at: string | null
  note: string | null
}

/** What the operator supplies to add a contact. */
export interface AddContactSpec {
  email: string
  /** Optional, and only ever filled IN — see {@link addContact}. */
  displayName?: string | null
}

/** What the add did, and to whom. */
export interface AddContactOutcome {
  /**
   * True only when a row was INSERTED.
   *
   * It reports which of the two branches ran rather than what state the person
   * ended in, because both branches leave a contact behind and the operator's
   * question at the moment they press `+` is *did I just add someone, or was
   * this address already here*. A `+` that silently reported success on an
   * address it did nothing with is how the same human quietly becomes two rows
   * in an operator's head while staying one in the table.
   */
  created: boolean
  person: Person
}

/** Refused because there is nothing to add. */
export class InvalidContactError extends Error {}

/**
 * ADD: the fundamental act, and until [[REQ-199]] it did not exist.
 *
 * THE TAB COULD INVITE AND COULD NOT ADD. `invitePerson` was insert-or-update,
 * so it was the only way to create a contact — which meant creating one
 * necessarily also asked them to sign up. That collapses two different acts, and
 * the one it lost is the more basic: MOST CONTACTS ARE NEVER INVITED AT ALL.
 *
 * TWO FUNCTIONS, NOT ONE WITH A FLAG. This creates and leaves the pipeline at
 * Lead; `invitePerson` in `invites.ts` transitions an existing contact to
 * Invited and sends them mail. A single function taking `alsoInvite` would make
 * the difference between *I am recording somebody* and *I am emailing a
 * stranger* a boolean, which is the kind of parameter that eventually defaults
 * wrong — and defaults wrong in the direction of mailing people nobody meant to
 * mail.
 *
 * THE NEW ROW IS A **LEAD** ([[DOC-44]] §4). That is the initial value of the
 * pipeline axis and it is what a contact we hold an address for and nothing else
 * IS. Nothing here stamps `invited_at`, because nobody has been asked anything.
 *
 * IT FINDS RATHER THAN DUPLICATES, on the same argument the invite used to make
 * for itself ([[DOC-42]] §9). Adding an address this business already holds is
 * an operator arriving at a person who is already here; a second row would be
 * the exact duplicate `idx_user_emails_tenant_email` exists to prevent, and from
 * then on the CRM and this tab can disagree about somebody who is one person.
 *
 * IT MATCHES ON ANY OF THEIR ADDRESSES, NOT ONLY THE PRIMARY ONE ([[REQ-191]]),
 * for the reason the invite did: a person holds as many addresses as they have,
 * and typing their second one has to reach the person their first one reaches.
 *
 * IT ADDS NO ADDRESS TO A PERSON IT MATCHED, and it writes no event for one
 * either. A match means nothing happened: the contact was already here, at that
 * address, and a `contact.created` row for the second press would put a second
 * origin on a person who has one ([[REQ-195]]). Which surface adds a SECOND
 * address to somebody is [[REQ-189]]'s territory or later.
 *
 * A NAME TYPED HERE IS FILLED IN AND NEVER OVERWRITTEN, exactly as the invite
 * did it: a courtesy for a person who has none, because renaming somebody is
 * {@link setPersonRecord}'s surface and doing it here would write a supersession
 * into their name history for an act that was not a rename ([[REQ-193]]).
 *
 * AND NO MAIL IS SENT. Not "not yet" — never, by construction. This function
 * imports nothing that could send anything, which is what makes "adding a
 * contact cannot email them" a property of the code rather than a rule somebody
 * has to keep remembering as the tab grows.
 *
 * ONE EVENT, AND IT IS THE PROVENANCE ROW ([[REQ-195]]). `contact.created` with
 * `via: 'add'` — where this person came from, which is a question no column on
 * `users` answers. The old two-events-in-one-batch shape was the invite doing
 * both acts at once; split, each act writes its own.
 */
export async function addContact(
  env: IdentityEnv,
  scope: Scope,
  spec: AddContactSpec,
): Promise<AddContactOutcome> {
  // Casefolded on the way in, for the reason `0005` records: the index is
  // byte-exact, so `Sarah@…` added over `sarah@…` would be a second person that
  // `admit` — which normalises — would never find.
  const email = normaliseEmail(spec.email ?? '')
  if (email === '') throw new InvalidContactError('A contact needs an email address.')
  const displayName = (spec.displayName ?? '').trim() || null

  const now = new Date().toISOString()
  const existing = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} ` +
      `WHERE u.tenant_id = ? AND u.id = ${USER_ID_BY_EMAIL_SQL}`,
  )
    .bind(scope.businessId, scope.businessId, email)
    .first<UserRecord>()

  if (existing) {
    // NOTHING IS WRITTEN AT ALL for somebody already here, not even a stamp.
    // The row is theirs and this press changed nothing about it; a courtesy
    // name is the one exception, on the rule above.
    if (displayName && !nameFromJoin(existing)) {
      await writeName(env, existing.id, { displayName })
      const named = await env.DB.prepare(
        `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
      )
        .bind(scope.businessId, existing.id)
        .first<UserRecord>()
      if (named) return { created: false, person: toPerson(named) }
    }
    return { created: false, person: toPerson(existing) }
  }

  // `status` IS `active` AND `platform_operator` IS 0, both written rather than
  // defaulted. The first is the login control ([[DOC-42]] §5); the second is the
  // hosting capability, which nothing on this tab may ever confer.
  //
  // `pipeline_stage` IS WRITTEN AS `lead` RATHER THAN LEFT TO THE COLUMN DEFAULT.
  // The default says the same thing today, and this is the surface whose whole
  // claim is *the new row is a Lead* — a claim that must not be a property of a
  // migration somebody could change without reading this.
  //
  // THE PERSON, THEIR ACCOUNT AND THEIR FIRST ADDRESS GO AS ONE BATCH
  // ([[REQ-191]], [[REQ-194]]). A person written without an address is a person
  // nothing can find — not `admit`, not the invite, not this function on its
  // second press.
  //
  // ONE ACCOUNT PER CONTACT, AND THAT IS v1 RATHER THAN THE MODEL ([[REQ-194]]).
  // Every contact belongs to an account, including a lead nobody will ever bill,
  // because "belongs to an account" with exceptions is a nullable column and an
  // empty chair.
  const id = newId('usr')
  const accountId = newId('acct')
  await env.DB.batch([
    accountInsert(env, { id: accountId, tenantId: scope.businessId, name: displayName, now }),
    env.DB.prepare(
      'INSERT INTO users (id, tenant_id, account_id, status, platform_operator, ' +
        'pipeline_stage, created_at, updated_at, fields) ' +
        'VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)',
    ).bind(id, scope.businessId, accountId, 'active', PIPELINE_LEAD, now, now, '{}'),
    userEmailInsert(env, { userId: id, tenantId: scope.businessId, email, now }),
    contactEventInsert(env, {
      contactId: id,
      businessId: scope.businessId,
      kind: CONTACT_CREATED,
      detail: { via: 'add' },
      now,
    }),
  ])
  if (displayName) await writeName(env, id, { displayName })

  const row = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
  )
    .bind(scope.businessId, id)
    .first<UserRecord>()
  if (!row) throw new InvalidContactError('The new contact was not readable back.')
  return { created: true, person: toPerson(row) }
}

/**
 * The pipeline half of the invite: Lead → **Invited**, and nothing else
 * ([[DOC-42]] §9, [[REQ-188]], [[REQ-199]]).
 *
 * IT TAKES A CONTACT ID AND CANNOT CREATE ONE. That is the whole of what changed
 * in [[REQ-199]]: the invite acts on a SELECTION of contacts that already exist,
 * so there is no address to insert from and no branch here that inserts. A
 * contact id that names nobody in this business is refused, and not-found and
 * not-in-this-business are the same answer for the reason `personDetail` gives.
 *
 * IT MOVES THE PIPELINE AXIS AND LEAVES ACCESS ALONE ([[DOC-44]] §3). It sets
 * `pipeline_stage` to `invited` and stamps `invited_at` — the state, and when it
 * was entered — and touches `tos_accepted_at` not at all. Membership is that
 * column; nothing written here can complete that journey, because completing it
 * is the person's own act.
 *
 * AND IT DOES NOT CARE WHETHER THEY ARE ALREADY A MEMBER. Inviting somebody who
 * has signed up is an ordinary thing to do — the axes are independent, so they
 * end up an invited member, which is a state the old single line could not spell
 * at all.
 *
 * `invited_at` IS NOT RESTAMPED for someone already invited. It records WHEN
 * this person was invited, so overwriting it on a second press would falsify the
 * one fact in the row this function exists to write. THE STAGE IS ASSIGNED
 * RATHER THAN COALESCED, and the asymmetry is the point: `invited_at` answers
 * "when did this happen" and must not be rewritten; the stage answers "where are
 * they now" and this is the write that decides it.
 *
 * AND THE PRESS ITSELF IS RECORDED, EVERY TIME ([[REQ-195]]) — including presses
 * that change no column at all. The stamp says when we FIRST asked and the
 * events say how many times we have, and only one of those two questions has an
 * answer without them. In the same batch as the update, because a transition
 * recorded by a separate round trip is a transition that can be missing from the
 * history of a row that shows it happened.
 *
 * IT SENDS NOTHING, AND THE COMPOSITION IS `invites.ts`'S. This is the identity
 * schema's half; rendering the message, sending it and recording what was sent
 * are three other modules' halves, and putting them together here would put a
 * ticket-store dependency and a network port on the module every people read
 * goes through.
 */
export async function markInvited(
  env: IdentityEnv,
  scope: Scope,
  contactId: string,
): Promise<Person> {
  const now = new Date().toISOString()
  const existing = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
  )
    .bind(scope.businessId, contactId)
    .first<UserRecord>()
  if (!existing) throw new UnknownPersonError()

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET invited_at = COALESCE(invited_at, ?), pipeline_stage = ?, ' +
        'updated_at = ? WHERE id = ?',
    ).bind(now, PIPELINE_INVITED, now, existing.id),
    contactEventInsert(env, {
      contactId: existing.id,
      businessId: scope.businessId,
      kind: CONTACT_INVITED,
      now,
    }),
  ])

  const row = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} ${USER_SOURCE} WHERE u.tenant_id = ? AND u.id = ?`,
  )
    .bind(scope.businessId, existing.id)
    .first<UserRecord>()
  if (!row) throw new UnknownPersonError()
  return toPerson(row)
}

/** Refused because the person is not in this business, or does not exist. */
export class UnknownPersonError extends Error {
  constructor() {
    super('No such person in this business.')
  }
}

/**
 * The member control: may this person sign in at all.
 *
 * `users.status` AND NOT `memberships.revoked_at` ([[DOC-42]] §5). `admit`
 * checks this before it looks at any business and refuses `user_inactive`, so it
 * is the one field that stops a login. Withdrawing a membership withdraws the
 * right to RUN a business and deliberately leaves that person's own Portal
 * reachable, which is a different act with a different meaning.
 */
export async function setPersonStatus(
  env: IdentityEnv,
  scope: Scope,
  personId: string,
  status: string,
): Promise<Person> {
  const now = new Date().toISOString()
  const changed = await env.DB.prepare(
    'UPDATE users SET status = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
  )
    .bind(status, now, scope.businessId, personId)
    .run()
  if (!changed.meta?.changes) throw new UnknownPersonError()

  const detail = await personDetail(env, scope, personId)
  if (!detail) throw new UnknownPersonError()
  return detail.person
}

/**
 * The fields of a person's record an operator owns ([[BUG-54]], [[REQ-193]]).
 *
 * A PATCH: an absent key is "leave it alone", and is not the same as `null`.
 * `name: {displayName: null}` clears the name; an absent `name` does not touch
 * it.
 * The panel commits one field at a time, so in practice exactly one key
 * arrives — but the distinction has to be in the type, because the alternative
 * is a route that writes back whatever the caller was holding for every column
 * it did not mean to change.
 */
export interface PersonPatch {
  email?: string
  /**
   * The parts of their name to change ([[REQ-193]]). Absent means leave the
   * name alone entirely; present with one key changes that part and carries the
   * rest forward.
   */
  name?: NamePatch
  /**
   * Why the name is being replaced — `changed` for a real name change, anything
   * else (including nothing) for a correction.
   *
   * IT IS A SEPARATE KEY AND NOT A FLAG ON THE PARTS, because it is a fact about
   * the TRANSITION rather than about any part of the name. The default is the
   * safe one and the deliberate one is the explicit act: a typo fixed at the
   * keyboard must not become a searchable, displayable former name.
   */
  nameReason?: string | null
}

/** Refused because of what was typed — a bad address, or one already taken. */
export class InvalidPersonRecordError extends Error {}

/**
 * Is this D1 failure `idx_user_emails_tenant_email` refusing a duplicate?
 *
 * MATCHED ON THE MESSAGE, because that is what SQLite gives — there is no code
 * on the error to switch on. Deliberately narrow: anything that is not
 * recognisably the unique index is rethrown, so a genuine database failure
 * stays a 500 and is not reported to the operator as "that address is taken".
 *
 * IT NAMES `user_emails` NOW ([[REQ-191]]) — the same constraint, moved off
 * `users` with the column. Left pointing at the old table it would have matched
 * nothing, and a duplicate address would have reached the operator as a 500.
 */
function isDuplicateEmail(err: unknown): boolean {
  const said = err instanceof Error ? err.message : String(err)
  return (
    /UNIQUE constraint failed/i.test(said) &&
    /user_emails\.email|user_emails\.tenant_id/i.test(said)
  )
}

/**
 * Correct who somebody is ([[BUG-54]], [[REQ-193]]).
 *
 * THE OPERATOR IS THE CURATOR, AND THIS IS THE SURFACE THEY CURATE ON. The
 * small business owner is the one who corrects a misspelled contact, who knows
 * that Robert is Bob, who knows this customer is a Dr — and the name fields are
 * designed for them. A contact's own self-declaration is simpler and will not
 * fill most of them in, which is why every part but the displayed name is
 * optional and why *just my name* is a complete answer.
 *
 * THE NAME IS A ROW AND CHANGING IT IS A SUPERSESSION, not an UPDATE. So this
 * route carries `nameReason` beside the parts: without it, every correction of
 * a typo would be recorded as a former name, and former names are searched and
 * shown. `writeName` defaults it to `corrected` and only an explicit `changed`
 * makes the old name visible.
 *
 * THE AUTHORITY, AND THE PANEL'S CHECK IS NOT. `builder/people.js` refuses a
 * malformed address inline so the operator sees it while still looking at the
 * box, but that is feedback: this is the refusal that counts, and it runs for
 * anyone who reaches the route by any other means. Both read
 * {@link isEmailShape}, from a module neither of them owns, so there is exactly
 * one answer to what an address is.
 *
 * CASEFOLDED ON THE WAY IN, for the reason `0005` records and
 * {@link addContact} already obeys: `idx_user_emails_tenant_email` is
 * byte-exact and `admit` normalises, so an address stored as typed would be a
 * person the front door could no longer find. This is the write that most needs
 * it — an invite at least starts from a fresh row, whereas this can strand a
 * member who was signing in yesterday. The schema refuses the unnormalised form
 * outright now ([[REQ-191]]), so forgetting it is a failed write rather than a
 * silent lockout; normalising here is what stops the write failing.
 *
 * A DUPLICATE IS A SENTENCE AND NOT A 500. Two people in one business holding
 * one address is exactly what the index exists to prevent, so hitting it is an
 * ordinary outcome of a typo and the operator is told which of their two
 * problems it is.
 *
 * NOTHING HERE TOUCHES `status`, `pipeline_stage`, `invited_at`,
 * `tos_accepted_at` OR THE STAMPS. They are the record of what the system
 * observed and of what the person themselves did ([[DOC-42]] §4), and the two
 * axes of the tab are read off them; a route that let them be set by hand would
 * make the axes assertions rather than observations. The stage is written by the
 * invite, which is an ACT with a meaning, and it will want an operator-facing
 * mover of its own the day there is a third stage to move to — that is a
 * different route from this one, which corrects who somebody is. `status` is
 * separate for the same reason: it is the login control.
 */
export async function setPersonRecord(
  env: IdentityEnv,
  scope: Scope,
  personId: string,
  patch: PersonPatch,
): Promise<Person> {
  const email = patch.email === undefined ? undefined : normaliseEmail(patch.email ?? '')
  if (email !== undefined && !isEmailShape(email)) {
    throw new InvalidPersonRecordError(`Email ${EMAIL_SHAPE_ERROR}.`)
  }
  if (email === undefined && patch.name === undefined) {
    throw new InvalidPersonRecordError('Nothing to change.')
  }

  const now = new Date().toISOString()

  // THE PERSON IS RESOLVED FIRST, AND IT IS THE SCOPE CHECK ([[REQ-191]],
  // [[REQ-193]]). Neither the address nor the name lives on `users` any more, so
  // an `UPDATE ... WHERE tenant_id = ? AND id = ?` no longer touches anything
  // this patch can change — and a write to `user_emails` or `user_names` keyed on
  // `user_id` alone would carry no tenant at all. Asking once, here, keeps one
  // non-oracle answer for all of them: a caller in one business guessing an id
  // from another is told what a caller guessing an id that never existed is told.
  const found = await env.DB.prepare('SELECT id FROM users u WHERE u.tenant_id = ? AND u.id = ?')
    .bind(scope.businessId, personId)
    .first<{ id: string }>()
  if (!found) throw new UnknownPersonError()

  if (email !== undefined) {
    // IT REWRITES THE PRIMARY ROW RATHER THAN ADDING ONE. This route corrects
    // who somebody is — a typo in the address they were invited at — and a
    // correction that left the wrong address behind as a second identity would
    // keep resolving the person it was meant to stop resolving. ADDING an
    // address is a different act with a different surface ([[REQ-189]]).
    //
    // AND IT INSERTS WHEN THERE IS NOTHING TO REWRITE, so a contact holding no
    // address — the phone-only shape this table makes representable — gains one
    // by being given one, rather than silently keeping none.
    try {
      const changed = await env.DB.prepare(
        'UPDATE user_emails SET email = ?, updated_at = ? WHERE user_id = ? AND is_primary = 1',
      )
        .bind(email, now, personId)
        .run()
      if (!changed.meta?.changes) {
        await userEmailInsert(env, {
          userId: personId,
          tenantId: scope.businessId,
          email,
          now,
        }).run()
      }
    } catch (err) {
      if (isDuplicateEmail(err)) {
        throw new InvalidPersonRecordError('Somebody in this business already has that address.')
      }
      throw err
    }
    await env.DB.prepare('UPDATE users SET updated_at = ? WHERE id = ?').bind(now, personId).run()
  }

  if (patch.name !== undefined) {
    // THE MESSAGE IS THE OPERATOR'S, so a refusal about the name reads the same
    // way a refusal about the address does — beside the box it is about, rather
    // than as a 500.
    try {
      await writeName(env, personId, patch.name, patch.nameReason)
    } catch (err) {
      if (err instanceof InvalidNameError) throw new InvalidPersonRecordError(err.message)
      throw err
    }
  }

  const detail = await personDetail(env, scope, personId)
  if (!detail) throw new UnknownPersonError()
  return detail.person
}

/** What the operator supplies to open a dated grant. */
export interface GrantSpec {
  /** The OBJECT — which business the access is to. Required. */
  businessId: string
  /**
   * The SUBJECT — an `accounts.id` ([[REQ-194]]). Null opens a per-business
   * capacity grant ([[REQ-184]]) and is what every row written by provisioning is.
   *
   * IT IS AN ACCOUNT KEY AND WAS ALWAYS MEANT TO BE. Until accounts had a table
   * the only key anyone could put here was a person's, which is the confusion
   * [[DOC-42]] §6 names; the reader ({@link personDetail}) now looks a grant up by
   * the account the person belongs to, so a subject written as a person id would
   * simply never be found.
   */
  accountId?: string | null
  plan: string
  startsAt?: string
  endsAt?: string | null
  note?: string | null
  grantedBy?: string | null
}

/** Refused because the grant could not be repaired from outside once written. */
export class InvalidGrantError extends Error {}

/**
 * Open a grant.
 *
 * IT SAYS WHICH BUSINESS, ALWAYS. "This user's plan" is unrepresentable
 * ([[DOC-40]] §5, [[REQ-170]]): an account running three businesses holds up to
 * three grants, and an editor that omitted the object would silently change
 * whichever one it found first.
 *
 * `source` IS `admin_grant` AND IS NOT A PARAMETER. [[DOC-40]] §5 keeps access
 * and money separate — a subscription's webhook writes its own rows — so a grant
 * opened by hand is by construction the comped kind. Letting the caller name the
 * source would let this route forge one.
 *
 * REVOCATION IS NOT DELETION, and neither is expiry. See {@link revokeGrant}.
 */
export async function openGrant(env: IdentityEnv, spec: GrantSpec): Promise<Grant> {
  const businessId = (spec.businessId ?? '').trim()
  const plan = (spec.plan ?? '').trim()
  if (businessId === '') throw new InvalidGrantError('A grant must name the business it is for.')
  if (plan === '') throw new InvalidGrantError('A grant must name a plan.')

  const now = new Date().toISOString()
  const id = newId('ent')
  const accountId = spec.accountId ?? null
  const startsAt = spec.startsAt ?? now

  await env.DB.prepare(
    'INSERT INTO entitlements (id, business_id, account_id, plan, source, status, ' +
      'starts_at, ends_at, granted_by, note, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      businessId,
      accountId,
      plan,
      'admin_grant',
      'active',
      startsAt,
      spec.endsAt ?? null,
      spec.grantedBy ?? null,
      spec.note ?? null,
      now,
      now,
    )
    .run()

  const row = await env.DB.prepare(
    'SELECT e.id AS id, e.business_id AS business_id, t.name AS business_name, ' +
      'e.account_id AS account_id, e.plan AS plan, e.source AS source, ' +
      'e.status AS status, e.starts_at AS starts_at, e.ends_at AS ends_at, e.note AS note ' +
      'FROM entitlements e LEFT JOIN tenants t ON t.id = e.business_id WHERE e.id = ?',
  )
    .bind(id)
    .first<GrantRecord>()
  if (!row) throw new InvalidGrantError('The grant was not readable back after writing.')
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name ?? null,
    accountId: row.account_id,
    plan: row.plan,
    source: row.source,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    note: row.note,
  }
}

/**
 * Withdraw a grant.
 *
 * IT SETS `revoked_at` AND `status` RATHER THAN DELETING THE ROW ([[REQ-170]]).
 * The history of what access was given is the thing being kept: an account
 * accumulates grants over its life ([[DOC-40]] §5), and a deleted one takes with
 * it the answer to "what were they promised, and when did we stop honouring it"
 * — which is the question anyone asking about a refusal is actually asking.
 */
export async function revokeGrant(env: IdentityEnv, grantId: string): Promise<void> {
  const now = new Date().toISOString()
  const changed = await env.DB.prepare(
    "UPDATE entitlements SET status = 'revoked', revoked_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(now, now, grantId)
    .run()
  if (!changed.meta?.changes) throw new InvalidGrantError('No such grant.')
}

/**
 * The gate on this tab's product-fulfilment controls lives in `identity.ts`.
 *
 * NOT REIMPLEMENTED HERE, and not as a query. [[REQ-185]] exports
 * {@link ownsPlatformBusiness}, which reads the admission rather than the
 * database — the admission already carries every business this person may
 * operate with its role, so asking again would be a second answer free to
 * disagree with the one admission was decided from. It also keeps `TENANT_ID` at
 * the two readers [[REQ-168]] left it, which a predicate written here would have
 * made three.
 *
 * The two conditions are [[DOC-42]] §7's and neither is the word "admin": you
 * own the business you are in, and this business's product is businesses.
 */
export { ownsBusiness, ownsPlatformBusiness } from './identity'
