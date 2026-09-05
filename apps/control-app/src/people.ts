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
 * - **member** — a `users` row that has been invited. May log in.
 * - **operator** — a `memberships` row. May RUN a business, which is a different
 *   act and usually a different business.
 * - **entitled** — an `entitlements` row. Has been granted access to a thing.
 *
 * `memberships` DOES NOT MEAN "MAY LOG IN". `provisionInvite` writes the person's
 * `users` row into this tenant while `provisionBusiness` writes their membership
 * on the business they will run — so an account logs in holding no membership on
 * the business it logs in to. Reading `memberships` to answer "may this person
 * sign in" is the specific error this comment exists to prevent.
 *
 * THE READ NEVER LEAVES THE TENANT. The list is `users WHERE tenant_id = ?` and
 * nothing else. The operated-businesses column joins `memberships` onto
 * `tenants` for a NAME, which is metadata about the join and not the content of
 * another business — the same thing `businessesFor` already does for the caller.
 * Nothing here can read what is inside a business the caller is not in.
 */

import type { IdentityEnv } from './identity'
import { newId } from './identity'
import type { Scope } from './scope'

/**
 * A person as the tab lists them.
 *
 * `invited_at` IS THE CONTACT/MEMBER MARKER and is reported rather than
 * interpreted. It is what `provisionInvite` sets, so it is the only thing in the
 * schema that distinguishes the two states ([[DOC-42]] §4.1) — and the tab shows
 * the state rather than filtering on it, because a list that dropped contacts
 * would be a second population and the CRM reads the same rows ([[DOC-42]] §9).
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
  const columns =
    'id, business_id, account_id, plan, source, status, starts_at, ends_at, note'
  const rows: GrantRecord[] = []

  const own = await env.DB.prepare(
    `SELECT ${columns} FROM entitlements WHERE account_id = ? ORDER BY starts_at ASC`,
  )
    .bind(personId)
    .all<GrantRecord>()
  rows.push(...(own.results ?? []))

  if (businessIds.length > 0) {
    const holes = businessIds.map(() => '?').join(', ')
    const capacity = await env.DB.prepare(
      `SELECT ${columns} FROM entitlements WHERE account_id IS NULL ` +
        `AND business_id IN (${holes}) ORDER BY starts_at ASC`,
    )
      .bind(...businessIds)
      .all<GrantRecord>()
    rows.push(...(capacity.results ?? []))
  }

  return rows.map((r) => ({
    id: r.id,
    businessId: r.business_id,
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
  account_id: string | null
  plan: string
  source: string
  status: string
  starts_at: string
  ends_at: string | null
  note: string | null
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
    'SELECT id, business_id, account_id, plan, source, status, starts_at, ends_at, note ' +
      'FROM entitlements WHERE id = ?',
  )
    .bind(id)
    .first<GrantRecord>()
  if (!row) throw new InvalidGrantError('The grant was not readable back after writing.')
  return {
    id: row.id,
    businessId: row.business_id,
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
