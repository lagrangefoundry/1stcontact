/**
 * The per-contact link a gated download's mail carries ([[REQ-244]] §2).
 *
 * WHY THE LINK IS PER CONTACT AT ALL. A single unguessable URL to an artifact
 * cannot say WHO followed it — everyone who gets the mail gets the same link —
 * so *"they came back on Thursday and took the second paper"* is not a fact the
 * system could hold. The token is minted per contact per form, and the
 * attribution is the REASON for it rather than a side benefit of it.
 *
 * IT IS NOT A CREDENTIAL, AND NOTHING HERE MAY MAKE IT ONE. A sign-up link
 * creates a member, and therefore expires and is single-use, which is exactly
 * what `login_tokens` already does. This one identifies a contact for the purpose
 * of recording a visit and unlocking a download; it grants no session, names no
 * membership, and reaches nothing but its own page and its own artifacts. The two
 * kinds of link have OPPOSITE rules, which is why they are two tables rather than
 * one with a `purpose` column — one column is all it takes for somebody to make
 * the rules the same.
 *
 * AND IT DOES NOT EXPIRE. Delivery is at-most-once ever and [[REQ-223]]
 * deliberately refuses a public re-send path, so an expired link is a dead end at
 * exactly the thing the contact came for.
 *
 * THIS MODULE IS THE TABLE AND NOTHING ELSE. It mints, resolves and revokes;
 * what a resolved grant then OPENS is `gate.ts`, which reads the form's own
 * published definition. Kept apart so `lead.ts` can mint a link without importing
 * the thing that reads form definitions, which imports `lead.ts`.
 */

import { newId } from '../../../tools/generate/src/store/ids'
import type { Scope } from './scope'

/** What this module needs from the environment: a database, and nothing else. */
export interface GrantEnv {
  DB: D1Database
}

/**
 * One issued link.
 *
 * IT NAMES THE FORM AND NOT ITS ARTIFACTS. What the page lists is read from the
 * site's live published definition when it is opened, so there is one answer to
 * *what does this form promise* rather than a copy here free to drift from it.
 */
export interface AssetGrant {
  /** The opaque token the URL carries. */
  id: string
  contactId: string
  /** Always the contact's own — derived by the insert, never supplied. */
  businessId: string
  siteId: string
  /**
   * WHICH FORM, BY THE PAGE IT SITS ON AND THE INSTANCE ON THAT PAGE
   * ([[BUG-93]]) — the same handle the form put on the wire.
   *
   * IT WAS THE INSTANCE ID ALONE, and that could not name a form: a component
   * name is unique on one page and the same name is legal on the next, so a
   * grant minted for the whitepapers `signup` and one minted for the home
   * page's `signup` were the same row, opening whichever definition the
   * receiver happened to resolve first.
   */
  formHandle: string
  createdAt: string
  revokedAt: string | null
}

/** Refused because the contact is not in this business, or does not exist. */
export class UnknownGrantSubjectError extends Error {
  constructor() {
    super('No such contact in this business.')
  }
}

interface GrantRow {
  id: string
  contact_id: string
  business_id: string
  site_id: string
  form_handle: string
  created_at: string
  revoked_at: string | null
}

const GRANT_COLUMNS = 'id, contact_id, business_id, site_id, form_handle, created_at, revoked_at'

function toGrant(row: GrantRow): AssetGrant {
  return {
    id: row.id,
    contactId: row.contact_id,
    businessId: row.business_id,
    siteId: row.site_id,
    formHandle: row.form_handle,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }
}

/**
 * The live link this contact holds for this form, minting one if they hold none.
 *
 * IDEMPOTENT, AND THAT IS THE POINT. A form promising two papers sends two mails
 * and both must link at the one page; a contact who submits the same form again
 * a month later must reach the page they were already given. So this is
 * find-or-mint rather than mint, and the schema enforces it as well — a partial
 * unique index over the live rows — because two writers racing this function is
 * an ordinary thing and a guarantee only the application maintains is a guarantee
 * that eventually is not maintained ([[DOC-45]] §7).
 *
 * `INSERT ... SELECT ... FROM users`, WHICH IS WHERE `business_id` COMES FROM,
 * on `contactEventInsert`'s precedent. The caller names a contact and the
 * contact's own row decides which business the grant is filed under, so the two
 * can never disagree — and supplying the scope narrows it further, to *write
 * nothing unless the contact is in THAT business*.
 *
 * `ON CONFLICT DO NOTHING` AND THEN A READ, rather than a read and then a write.
 * The read-first shape is a decision two concurrent callers make differently and
 * the loser gets a constraint violation; this shape has one loser and they read
 * back the winner's row, which is the row they wanted.
 */
export async function grantFor(
  env: GrantEnv,
  scope: Scope,
  spec: { contactId: string; siteId: string; formHandle: string; now?: string },
): Promise<AssetGrant> {
  const now = spec.now ?? new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO asset_grants (id, contact_id, business_id, site_id, form_handle, created_at) ' +
      'SELECT ?, u.id, u.tenant_id, ?, ?, ? FROM users u WHERE u.id = ? AND u.tenant_id = ? ' +
      'ON CONFLICT DO NOTHING',
  )
    .bind(newId('gate'), spec.siteId, spec.formHandle, now, spec.contactId, scope.businessId)
    .run()

  const row = await env.DB.prepare(
    `SELECT ${GRANT_COLUMNS} FROM asset_grants ` +
      'WHERE contact_id = ? AND business_id = ? AND site_id = ? AND form_handle = ? ' +
      'AND revoked_at IS NULL',
  )
    .bind(spec.contactId, scope.businessId, spec.siteId, spec.formHandle)
    .first<GrantRow>()
  // UNREACHABLE FROM THE CAPTURE PATH, which has just written or found this
  // contact in this business. It is raised rather than returned because a caller
  // with nowhere to put the link has no sensible second choice, and a silent
  // `null` would become a mail with a dead button.
  if (!row) throw new UnknownGrantSubjectError()
  return toGrant(row)
}

/**
 * The grant this token names, or `null`.
 *
 * NOT SCOPED BY BUSINESS, DELIBERATELY, AND IT IS NOT A HOLE IN THE BARRIER. The
 * caller is an unauthenticated visitor holding 128 random bits; there is no
 * business in the request for this to be scoped by, and the token IS the claim.
 * What the caller may then do with the resolved grant is the gate's business, and
 * it is scoped by the grant's own site and business rather than by anything the
 * URL asserted.
 *
 * A REVOKED GRANT RESOLVES TO NOTHING, which is what makes revocation a refusal
 * rather than a flag every reader has to remember to check.
 */
export async function resolveGrant(env: GrantEnv, token: string): Promise<AssetGrant | null> {
  if (token === '') return null
  const row = await env.DB.prepare(
    `SELECT ${GRANT_COLUMNS} FROM asset_grants WHERE id = ? AND revoked_at IS NULL`,
  )
    .bind(token)
    .first<GrantRow>()
  return row ? toGrant(row) : null
}

/**
 * Cut a link off. `true` when this call is what cut it.
 *
 * NOTHING CALLS THIS YET, and that is a deliberate resting point rather than an
 * omission. A revoked token has to be refused — it is the third of the three
 * refusals that must be indistinguishable — so the column and the enforcement are
 * built and proved. The SURFACE belongs with contact erasure ([[DOC-37]]), which
 * does not exist; a button here would be a guess at that design, and the guess
 * would be the thing erasure then had to work around.
 *
 * SCOPED, so an operator in one business cannot revoke a link in another even
 * holding its token.
 */
export async function revokeGrant(
  env: GrantEnv,
  scope: Scope,
  token: string,
  now: string = new Date().toISOString(),
): Promise<boolean> {
  const done = await env.DB.prepare(
    'UPDATE asset_grants SET revoked_at = ? WHERE id = ? AND business_id = ? AND revoked_at IS NULL',
  )
    .bind(now, token, scope.businessId)
    .run()
  return (done.meta?.changes ?? 0) > 0
}
