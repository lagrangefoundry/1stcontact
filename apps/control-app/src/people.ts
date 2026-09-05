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
 * FOUR RELATIONS, AND THREE OF THEM ARE NOT THE SAME TABLE ([[DOC-42]] §4). The
 * distinction this module exists to get right, because an earlier draft got it
 * wrong:
 *
 * - **contact** — a `users` row in this tenant, never invited. Known here, and
 *   MAY become a member.
 * - **invited** — a row that has been asked and has not come: `invited_at` set,
 *   `tos_accepted_at` null.
 * - **member** — a row that has SIGNED UP: `tos_accepted_at` set. May log in.
 * - **operator** — a `memberships` row. May RUN a business, which is a different
 *   act and usually a different business.
 * - **entitled** — an `entitlements` row. Has been granted access to a thing.
 *
 * A MEMBER IS SOMEONE WHO SIGNED UP, NOT SOMEONE WE INVITED ([[REQ-188]]). The
 * marker used to be `invited_at`, which describes what *we* did rather than what
 * *they* did — send the invite and the tab called that person a member at once.
 * An invitation nobody answered is not a relationship, and the middle state is
 * exactly the one an operator can act on.
 *
 * `memberships` DOES NOT MEAN "MAY LOG IN". {@link invitePerson} writes the
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
 * THE READ NEVER LEAVES THE TENANT. The list is `users WHERE tenant_id = ?` and
 * nothing else. The operated-businesses column joins `memberships` onto
 * `tenants` for a NAME, which is metadata about the join and not the content of
 * another business — the same thing `businessesFor` already does for the caller.
 * Nothing here can read what is inside a business the caller is not in.
 */

import { EMAIL_SHAPE_ERROR, isEmailShape } from './builder/email-shape.js'
import type { IdentityEnv } from './identity'
import { newId, normaliseEmail } from './identity'
import type { Scope } from './scope'

/**
 * A person as the tab lists them.
 *
 * THE TWO MARKERS ARE REPORTED RATHER THAN INTERPRETED ([[REQ-188]]). `invited_at`
 * is what {@link invitePerson} sets and `tos_accepted_at` is what accepting the
 * terms sets, and between them they carry the three states ([[DOC-42]] §4.1);
 * the derivation lives at the one surface that draws it, in
 * `builder/people-state.js`, so there is no second copy here free to disagree.
 *
 * AND THE TAB SHOWS THE STATE RATHER THAN FILTERING ON IT: a list that dropped
 * contacts would be a second population, and the CRM reads the same rows
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
  email: string
  displayName: string | null
  /** `active` is the member relation; anything else is refused `user_inactive`. */
  status: string
  /** Null means a contact: known here, never invited, may become a member. */
  invitedAt: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  /** Set means a member: they signed up, which includes accepting the terms. */
  termsAcceptedAt: string | null
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
   * id it would read as an opaque `acct_…` beside real names, which is the
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

/** Everything the detail pane shows about one person. */
export interface PersonDetail {
  person: Person
  operates: OperatedBusiness[]
  grants: Grant[]
}

interface UserRecord {
  id: string
  email: string
  status: string
  display_name: string | null
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  tos_accepted_at: string | null
  created_at: string
}

const USER_COLUMNS =
  'id, email, status, display_name, invited_at, first_seen_at, last_seen_at, ' +
  'tos_accepted_at, created_at'

function toPerson(row: UserRecord): Person {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    invitedAt: row.invited_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    termsAcceptedAt: row.tos_accepted_at,
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
    `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = ? ORDER BY created_at ASC, id ASC`,
  )
    .bind(scope.businessId)
    .all<UserRecord>()
  return (results ?? []).map(toPerson)
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
    `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = ? AND id = ?`,
  )
    .bind(scope.businessId, personId)
    .first<UserRecord>()
  if (!row) return null

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
  const grants = await grantsFor(env, personId, businessIds)

  return {
    person: toPerson(row),
    operates: (operates.results ?? []).map((b) => ({
      businessId: b.business_id,
      name: b.name,
      role: b.role,
      status: b.status,
      revokedAt: b.revoked_at,
    })),
    grants,
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
 */
async function grantsFor(
  env: IdentityEnv,
  personId: string,
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
    .bind(personId)
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

/** What the operator supplies to invite someone. */
export interface InviteSpec {
  email: string
  /** Optional, and only ever filled IN — see {@link invitePerson}. */
  displayName?: string | null
}

/** What the invite did, and to whom. */
export interface InviteOutcome {
  /**
   * True only when a row was INSERTED.
   *
   * It reports which of the two branches ran rather than what state the person
   * ended in, because both branches leave an invitee behind and the operator's
   * question at the moment they press the button is *did I just add someone, or
   * did I promote someone you already knew about*. A field that answered the
   * former with `true` in both cases would make the contact→invited transition
   * invisible at exactly the surface that performs it.
   */
  created: boolean
  person: Person
}

/** Refused because there is nothing to invite. */
export class InvalidInviteError extends Error {}

/**
 * The invite: the verb that turns a contact into an INVITEE ([[DOC-42]] §9,
 * [[REQ-188]]).
 *
 * IT DOES NOT MAKE A MEMBER, and that is the correction [[REQ-188]] carries. It
 * stamps `invited_at`, which records that we asked; membership is
 * `tos_accepted_at`, which records that they came. Nothing this function writes
 * can complete that journey, because completing it is the person's own act.
 *
 * IT UPDATES, AND INSERTS ONLY WHEN THERE IS NOTHING TO UPDATE. Contact and
 * member are ONE population in two states, and this is the transition between
 * them — so the row `idx_users_tenant_email` already decides is the row that is
 * stamped. [[DOC-42]] §9's own falsifier is *"an invite that inserts rather than
 * updates"*, and the failure it names is concrete: a contact captured by a form
 * and later invited becomes a SECOND row carrying the same address, which is the
 * exact case [[DOC-40]] cites as the reason contacts and users are one table.
 * From then on the CRM and the User tab can disagree about a person who is both.
 *
 * IT WRITES INTO THE BUSINESS THE CALLER IS IN, and that is the whole of the
 * level question ([[DOC-42]] §3). Invited from the 1st Contact business it makes
 * Alice; invited from Alice's business it makes Bob. Same code, same row shape,
 * and the only difference is `tenant_id` — because a level is a position and not
 * a property, and a branch here on which business it is would be §3's falsifier.
 *
 * `invited_at` IS NOT RESTAMPED for someone already invited. It records WHEN this
 * person was invited, so overwriting it on a second press would falsify the one
 * fact in the row that this function exists to write. Re-inviting someone already
 * invited — or already a member — is therefore a no-op that reports them back,
 * not an error: the operator asked for a state the system is already in.
 *
 * `display_name` IS FILLED IN AND NEVER OVERWRITTEN. A name typed at the invite
 * is a courtesy for a row that has none; editing an existing one is [[REQ-183]]
 * §5's surface, and letting the invite do it would give the tab a second,
 * undeclared way to rename a person.
 *
 * NO ENTITLEMENT IS WRITTEN, deliberately ([[DOC-42]] §5). The Portal is what
 * membership IS — a member reaches their own payments, details and delete button
 * by virtue of holding a row at all. A grant here would be §5's
 * falsifier ("an entitlement row created for every member and revoked for none")
 * and its hazard is not tidiness: a grant that CAN be absent produces a person
 * who can sign in and cannot reach their own erasure control ([[DOC-37]]).
 * Access to the app is a separate grant and `provisionBusiness` writes it.
 *
 * AND NO MAIL IS SENT. There is no sender in this repository. The invite is a
 * database transition and the person is admitted the next time they pass the
 * front door; naming that here is the point, because an "invite" that silently
 * sends nothing is a feature an operator will assume exists and will not check.
 */
export async function invitePerson(
  env: IdentityEnv,
  scope: Scope,
  spec: InviteSpec,
): Promise<InviteOutcome> {
  // Casefolded on the way in, for the reason `0005` records: the index is
  // byte-exact, so `Sarah@…` invited over `sarah@…` would be a second person
  // that `admit` — which normalises — would never find.
  const email = normaliseEmail(spec.email ?? '')
  if (email === '') throw new InvalidInviteError('An invite needs an email address.')
  const displayName = (spec.displayName ?? '').trim() || null

  const now = new Date().toISOString()
  const existing = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = ? AND email = ?`,
  )
    .bind(scope.businessId, email)
    .first<UserRecord>()

  if (existing) {
    // COALESCE on both, so a second press changes nothing it should not: the
    // stamp survives and so does a name somebody already set.
    await env.DB.prepare(
      'UPDATE users SET invited_at = COALESCE(invited_at, ?), ' +
        'display_name = COALESCE(display_name, ?), updated_at = ? WHERE id = ?',
    )
      .bind(now, displayName, now, existing.id)
      .run()
    const row = await env.DB.prepare(
      `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = ? AND id = ?`,
    )
      .bind(scope.businessId, existing.id)
      .first<UserRecord>()
    if (!row) throw new InvalidInviteError('The invited person was not readable back.')
    return { created: false, person: toPerson(row) }
  }

  // `status` IS `active` AND `platform_operator` IS 0, both written rather than
  // defaulted. The first is the login control ([[DOC-42]] §5) and an invite that
  // left it unset would produce a member refused `user_inactive` by the door it
  // was supposed to open. The second is the hosting capability, which no invite
  // may ever confer.
  const id = newId('usr')
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, display_name, platform_operator, ' +
      'invited_at, created_at, updated_at, fields) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
  )
    .bind(id, scope.businessId, email, 'active', displayName, now, now, now, '{}')
    .run()

  const row = await env.DB.prepare(
    `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = ? AND id = ?`,
  )
    .bind(scope.businessId, id)
    .first<UserRecord>()
  if (!row) throw new InvalidInviteError('The invited person was not readable back.')
  return { created: true, person: toPerson(row) }
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
 * The two fields of a person's record an operator owns ([[BUG-54]]).
 *
 * A PATCH: an absent key is "leave it alone", and is not the same as `null`.
 * `displayName: null` clears the name; `displayName` absent does not touch it.
 * The panel commits one field at a time, so in practice exactly one key
 * arrives — but the distinction has to be in the type, because the alternative
 * is a route that writes back whatever the caller was holding for every column
 * it did not mean to change.
 */
export interface PersonPatch {
  email?: string
  displayName?: string | null
}

/** Refused because of what was typed — a bad address, or one already taken. */
export class InvalidPersonRecordError extends Error {}

/**
 * Is this D1 failure the `(tenant_id, email)` index refusing a duplicate?
 *
 * MATCHED ON THE MESSAGE, because that is what SQLite gives — there is no code
 * on the error to switch on. Deliberately narrow: anything that is not
 * recognisably the unique index is rethrown, so a genuine database failure
 * stays a 500 and is not reported to the operator as "that address is taken".
 */
function isDuplicateEmail(err: unknown): boolean {
  const said = err instanceof Error ? err.message : String(err)
  return /UNIQUE constraint failed/i.test(said) && /users\.email|users\.tenant_id/i.test(said)
}

/**
 * Correct who somebody is ([[BUG-54]]).
 *
 * THE AUTHORITY, AND THE PANEL'S CHECK IS NOT. `builder/people.js` refuses a
 * malformed address inline so the operator sees it while still looking at the
 * box, but that is feedback: this is the refusal that counts, and it runs for
 * anyone who reaches the route by any other means. Both read
 * {@link isEmailShape}, from a module neither of them owns, so there is exactly
 * one answer to what an address is.
 *
 * CASEFOLDED ON THE WAY IN, for the reason `0005` records and
 * {@link invitePerson} already obeys: the `(tenant_id, email)` index is
 * byte-exact and `admit` normalises, so an address stored as typed would be a
 * person the front door could no longer find. This is the write that most needs
 * it — an invite at least starts from a fresh row, whereas this can strand a
 * member who was signing in yesterday.
 *
 * A DUPLICATE IS A SENTENCE AND NOT A 500. Two people in one business holding
 * one address is exactly what the index exists to prevent, so hitting it is an
 * ordinary outcome of a typo and the operator is told which of their two
 * problems it is.
 *
 * NOTHING HERE TOUCHES `status`, `invited_at`, `tos_accepted_at` OR THE STAMPS.
 * They are the record of what the system observed and of what the person
 * themselves did ([[DOC-42]] §4), and the three states of the tab are derived
 * from them; a route that let them be set by hand would make the states
 * assertions rather than observations. `status` has its own route because it is
 * a different act — the login control — with its own meaning.
 */
export async function setPersonRecord(
  env: IdentityEnv,
  scope: Scope,
  personId: string,
  patch: PersonPatch,
): Promise<Person> {
  const sets: string[] = []
  const binds: unknown[] = []

  if (patch.email !== undefined) {
    const email = normaliseEmail(patch.email ?? '')
    if (!isEmailShape(email)) throw new InvalidPersonRecordError(`Email ${EMAIL_SHAPE_ERROR}.`)
    sets.push('email = ?')
    binds.push(email)
  }
  if (patch.displayName !== undefined) {
    // EMPTY BECOMES NULL rather than an empty string, so "no name" has one
    // representation — the one the list already draws `No name yet` for.
    sets.push('display_name = ?')
    binds.push((patch.displayName ?? '').trim() || null)
  }
  if (sets.length === 0) throw new InvalidPersonRecordError('Nothing to change.')

  const now = new Date().toISOString()
  sets.push('updated_at = ?')
  binds.push(now)

  let changed
  try {
    changed = await env.DB.prepare(
      `UPDATE users SET ${sets.join(', ')} WHERE tenant_id = ? AND id = ?`,
    )
      .bind(...binds, scope.businessId, personId)
      .run()
  } catch (err) {
    if (isDuplicateEmail(err)) {
      throw new InvalidPersonRecordError('Somebody in this business already has that address.')
    }
    throw err
  }
  // SCOPED BY TENANT AND ID TOGETHER, so a caller in one business guessing an
  // id from another gets the same answer as one guessing an id that never
  // existed — the non-oracle rule `personDetail` already keeps.
  if (!changed.meta?.changes) throw new UnknownPersonError()

  const detail = await personDetail(env, scope, personId)
  if (!detail) throw new UnknownPersonError()
  return detail.person
}

/** What the operator supplies to open a dated grant. */
export interface GrantSpec {
  /** The OBJECT — which business the access is to. Required. */
  businessId: string
  /** The SUBJECT. Null opens a per-business capacity grant ([[REQ-184]]). */
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
    'INSERT INTO entitlements (id, business_id, account_id, email, plan, source, status, ' +
      'starts_at, ends_at, granted_by, note, created_at, updated_at) ' +
      'VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
