/**
 * Delegates — an owner asking somebody else to help run their business
 * ([[REQ-369]], [[EPIC-23]] §3).
 *
 * A SEPARATE ACT FROM THE INVITE, AND A SEPARATE FILE. `invites.ts` asks a
 * contact to sign up and moves them along the pipeline; this grants a person a
 * `delegate` membership on THIS business and moves nothing. "Two acts, two
 * functions, no flag" is that file's rule and this one keeps it: an `asDelegate`
 * boolean on the invite would make the difference between asking somebody in
 * and handing them the business a parameter.
 *
 * THE CONTACT IS NOT THE DELEGATE. A contact is a `users` row in the INVITING
 * business's tenant, and sign-in resolves only in the PLATFORM tenant
 * (`signInTenant`). So the contact's primary address is resolved to a platform
 * user — the person who can actually sign in — and the membership hangs off
 * that user. If nobody signs in at that address yet, one is created through
 * {@link addContact} in the platform tenant, which is the same path that makes
 * every 1st Contact customer: a user, their own account, and their address.
 * Creating them any other way would be a second definition of "a person who can
 * sign in".
 *
 * THE MEMBERSHIP IS WRITTEN WHEN THE OWNER PRESSES, NOT WHEN THE INVITEE
 * ACCEPTS. Granting access is the owner's act; following the link is how the
 * delegate reaches it. A pending state would be a third value somebody has to
 * remember to filter, and the invitee still proves their inbox before seeing
 * anything because the only way in is a sign-in.
 *
 * REVOKING KEEPS THE ROW ([[REQ-170]]'s keep-the-history rule). `revoked_at` is
 * stamped and `businessesFor` already excludes it, so the business leaves the
 * delegate's selector on their next request and a request naming it is refused
 * `not_a_member`. Re-inviting reinstates the same row, because
 * `(user_id, business_id)` is unique.
 *
 * THE SENDER IS PASSED IN, NEVER IMPORTED, on `messages.ts`'s precedent.
 */

import { addContact, personOf, type Person } from './people'
import { businessRecord } from './business'
import {
  DELEGATE_ROLE,
  OWNER_ROLE,
  USER_ID_BY_EMAIL_SQL,
  emailsOf,
  newId,
  normaliseEmail,
  requirePlatformTenant,
  type IdentityEnv,
} from './identity'
import type { SendEmail } from './mail'
import { sendRecordedEmail, type MessageRecord } from './messages'
import type { Scope } from './scope'
import type { InviteUrlFor } from './sessions'
import { copyOf, renderCopy, templateFor, type TemplateKey } from './templates'
import type { TicketStore } from './tickets'

/** The template every delegate invitation renders from. Spelled once. */
export const DELEGATE_TEMPLATE: TemplateKey = 'delegate'

/** Where somebody stands as a delegate of one business, as the detail pane shows it. */
export interface DelegateStatus {
  status: 'active' | 'revoked'
  grantedAt: string
  revokedAt: string | null
}

/** What making somebody a delegate did. */
export interface DelegateResult {
  contactId: string
  /** The address the invitation went to. */
  to: string
  /** `failed` means the membership exists and the mail did not go — see the record. */
  status: 'sent' | 'failed'
  reason: string | null
  message: MessageRecord
  delegate: DelegateStatus
}

/** Everything one delegate invitation needs. */
export interface DelegateDeps {
  env: IdentityEnv
  /** The business being delegated — the owner's scope. */
  scope: Scope
  /** That business's ticket store, where the template and the record live. */
  store: TicketStore
  send: SendEmail
  /** The deployment's sending address, the fallback when the template names none. */
  from: string
  /**
   * The sign-in link issuer, minting in the PLATFORM tenant. That is the tenant
   * the delegate signs in to; a link minted in the business's tenant would
   * resolve the contact row, which nothing lets sign in.
   */
  inviteUrl: InviteUrlFor
  /** The owner pressing the button, recorded as `granted_by`. */
  grantedBy: string | null
}

/**
 * Refused before anything was written or sent. The message is the sentence the
 * owner reads, so it names the remedy.
 */
export class DelegateRefusedError extends Error {}

/** Refused because the id names nobody in this business. */
export class UnknownDelegateError extends Error {
  constructor() {
    super('No such contact in this business.')
  }
}

/** The contact's primary address, or null — scoped by tenant as well as id. */
async function primaryAddressOf(
  env: IdentityEnv,
  businessId: string,
  contactId: string,
): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT e.email AS email FROM user_emails e JOIN users u ON u.id = e.user_id ' +
      'WHERE u.id = ? AND u.tenant_id = ? AND e.is_primary = 1',
  )
    .bind(contactId, businessId)
    .first<{ email: string }>()
  return row?.email ?? null
}

/** The platform-tenant person an address signs in as, whatever their status. */
async function platformUserAt(
  env: IdentityEnv,
  email: string,
): Promise<{ id: string; status: string } | null> {
  const platform = requirePlatformTenant(env)
  return env.DB.prepare(
    `SELECT u.id AS id, u.status AS status FROM users u ` +
      `WHERE u.tenant_id = ? AND u.id = ${USER_ID_BY_EMAIL_SQL}`,
  )
    .bind(platform, platform, normaliseEmail(email))
    .first<{ id: string; status: string }>()
}

interface MembershipRow {
  id: string
  role: string
  granted_at: string
  revoked_at: string | null
}

async function membershipOf(
  env: IdentityEnv,
  userId: string,
  businessId: string,
): Promise<MembershipRow | null> {
  return env.DB.prepare(
    'SELECT id, role, granted_at, revoked_at FROM memberships WHERE user_id = ? AND business_id = ?',
  )
    .bind(userId, businessId)
    .first<MembershipRow>()
}

function statusOf(row: MembershipRow): DelegateStatus {
  return {
    status: row.revoked_at === null ? 'active' : 'revoked',
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
  }
}

/**
 * Make one contact a delegate of this business, and send them the invitation.
 *
 * THE REFUSALS ARRIVE BEFORE ANYTHING IS WRITTEN, in the order an owner can act
 * on them: nobody to send to, a person who has been withdrawn from signing in,
 * and somebody who already owns the business.
 *
 * RE-PRESSING FOR A LIVE DELEGATE RESENDS AND KEEPS `granted_at`. It records
 * when they were made a delegate, and a second press is a reminder, not a new
 * grant. A REVOKED row is reinstated and restamped, because that IS a new grant.
 *
 * A REFUSED PROVIDER DOES NOT UNDO THE MEMBERSHIP, on `invites.ts`'s rule: the
 * attempt is what is recorded, and the owner can see `failed` and press again.
 */
export async function makeDelegate(
  deps: DelegateDeps,
  contactId: string,
): Promise<DelegateResult> {
  const { env, scope } = deps
  const contact: Person | null = await personOf(env, scope, contactId)
  if (!contact) throw new UnknownDelegateError()

  const to = await primaryAddressOf(env, scope.businessId, contactId)
  if (!to) {
    throw new DelegateRefusedError(
      'They have no primary address, so there is nowhere to send the invitation.',
    )
  }

  // THE PERSON WHO SIGNS IN, created through the ordinary path when absent. The
  // name is passed so a brand-new platform user is not nameless; `addContact`
  // only ever fills a name in, never overwrites one.
  let user = await platformUserAt(env, to)
  if (!user) {
    const made = await addContact(
      env,
      { businessId: requirePlatformTenant(env) },
      { email: to, displayName: contact.name?.displayName ?? null },
    )
    user = { id: made.person.id, status: made.person.status }
  }
  if (user.status !== 'active') {
    throw new DelegateRefusedError(
      'They cannot sign in at the moment, so an invitation would arrive with a link that does not work.',
    )
  }

  const existing = await membershipOf(env, user.id, scope.businessId)
  if (existing && existing.role === OWNER_ROLE && existing.revoked_at === null) {
    throw new DelegateRefusedError('They already own this business.')
  }

  const now = new Date().toISOString()
  if (!existing) {
    await env.DB.prepare(
      'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(newId('mem'), user.id, scope.businessId, DELEGATE_ROLE, 'active', deps.grantedBy, now)
      .run()
  } else if (existing.revoked_at !== null || existing.role !== DELEGATE_ROLE) {
    await env.DB.prepare(
      'UPDATE memberships SET role = ?, status = ?, revoked_at = NULL, expires_at = NULL, ' +
        'granted_by = ?, granted_at = ? WHERE id = ?',
    )
      .bind(DELEGATE_ROLE, 'active', deps.grantedBy, now, existing.id)
      .run()
  }
  const membership = await membershipOf(env, user.id, scope.businessId)
  if (!membership) throw new Error('The delegate membership was not readable back.')

  const ctaUrl = await deps.inviteUrl(to)
  if (!ctaUrl) {
    throw new DelegateRefusedError(
      'They cannot sign in at the moment, so an invitation would arrive with a link that does not work.',
    )
  }

  const business = await businessRecord(env, scope.businessId)
  const template = await templateFor(deps.store, DELEGATE_TEMPLATE)
  const rendered = renderCopy(copyOf(template), {
    cta_url: ctaUrl,
    business: business?.name ?? '',
  })
  const address = (await emailsOf(env, contactId)).find((row) => row.is_primary === 1)
  const message = await sendRecordedEmail(
    deps.store,
    {
      contactId,
      addressId: address?.id ?? '',
      templateKey: rendered.templateKey,
      templateUid: rendered.templateUid,
      subject: rendered.subject,
      from: rendered.from?.trim() || deps.from,
      // ONE RECIPIENT, as every message this platform sends.
      to,
      body: rendered.body,
    },
    deps.send,
  )

  return {
    contactId,
    to,
    status: message.status === 'failed' ? 'failed' : 'sent',
    reason: message.failure,
    message,
    delegate: statusOf(membership),
  }
}

/**
 * Withdraw a delegate. Stamps `revoked_at`; the row stays.
 *
 * REFUSED FOR SOMEBODY WHO IS NOT A LIVE DELEGATE, rather than answering
 * success for a revocation that changed nothing — the owner pressed Revoke on
 * a row the pane said was a delegate, and if it was not, the pane was wrong.
 */
export async function revokeDelegate(
  env: IdentityEnv,
  scope: Scope,
  contactId: string,
): Promise<DelegateStatus> {
  if (!(await personOf(env, scope, contactId))) throw new UnknownDelegateError()
  const to = await primaryAddressOf(env, scope.businessId, contactId)
  const user = to ? await platformUserAt(env, to) : null
  const membership = user ? await membershipOf(env, user.id, scope.businessId) : null
  if (!user || !membership || membership.role !== DELEGATE_ROLE || membership.revoked_at !== null) {
    throw new DelegateRefusedError('They are not a delegate of this business.')
  }
  const now = new Date().toISOString()
  await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE id = ?')
    .bind(now, membership.id)
    .run()
  return { status: 'revoked', grantedAt: membership.granted_at, revokedAt: now }
}

/**
 * Where one contact stands as a delegate of this business, or null if they
 * never were one.
 */
export async function delegateStatusOf(
  env: IdentityEnv,
  businessId: string,
  contactId: string,
): Promise<DelegateStatus | null> {
  const to = await primaryAddressOf(env, businessId, contactId)
  const user = to ? await platformUserAt(env, to) : null
  const membership = user ? await membershipOf(env, user.id, businessId) : null
  if (!membership || membership.role !== DELEGATE_ROLE) return null
  return statusOf(membership)
}

/**
 * The contacts of this business who are live delegates of it — the list's
 * badge.
 *
 * ONE QUERY FOR THE WHOLE LIST, on `peopleOf`'s rule. A contact matches when
 * their PRIMARY address is any address of a platform user holding a live
 * `delegate` membership here — primary, because that is the address the
 * invitation went to and the one the detail pane resolves.
 */
export async function delegateContactIds(env: IdentityEnv, businessId: string): Promise<string[]> {
  const platform = requirePlatformTenant(env)
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT ce.user_id AS id FROM memberships m ' +
      'JOIN user_emails pe ON pe.user_id = m.user_id AND pe.tenant_id = ? ' +
      'JOIN user_emails ce ON ce.email = pe.email AND ce.tenant_id = ? AND ce.is_primary = 1 ' +
      'WHERE m.business_id = ? AND m.role = ? AND m.revoked_at IS NULL',
  )
    .bind(platform, businessId, businessId, DELEGATE_ROLE)
    .all<{ id: string }>()
  return (results ?? []).map((row) => row.id)
}

/**
 * Which of these businesses are live — at least one site with a published
 * revision ([[REQ-369]]'s "published" predicate).
 *
 * LIVE IS `MAX(site_revisions.id)` WITH NO HEAD POINTER (DOC-12 §4), so a site
 * is live exactly when it has any revision at all, and a business is live when
 * any of its sites is. The switcher reads it to decide which business a
 * delegate opens on.
 */
export async function liveBusinessIds(
  env: IdentityEnv,
  businessIds: readonly string[],
): Promise<Set<string>> {
  if (businessIds.length === 0) return new Set()
  const marks = businessIds.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT s.tenant_id AS id FROM sites s WHERE s.tenant_id IN (${marks}) ` +
      'AND EXISTS (SELECT 1 FROM site_revisions r WHERE r.site_id = s.id)',
  )
    .bind(...businessIds)
    .all<{ id: string }>()
  return new Set((results ?? []).map((row) => row.id))
}
