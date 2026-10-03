import { isEmailShape } from './builder/email-shape.js'
import { newId, normaliseEmail, type IdentityEnv } from './identity'

/**
 * The addresses a person signs in with, as they manage them ([[REQ-368]]).
 *
 * THE FIRST SELF-EDIT ON THE PROFILE PORTAL. Every row in `user_emails` already
 * signs in — `subjectFor` resolves through any of them — so this file adds no
 * new kind of identity. It lets the person holding those rows add one, remove
 * one, and choose which is primary, under four rules the server enforces
 * whatever the page shows:
 *
 *   - at least one VALIDATED address is always kept;
 *   - an address belongs to one account only, and the refusal does not say whose;
 *   - adding an address does not validate it — signing in through it does
 *     (`redeemSignIn` in `sessions.ts` stamps `verified_at`);
 *   - only a validated address may be primary, and the primary cannot be removed
 *     until another address is primary.
 *
 * EVERY FUNCTION TAKES THE CALLER'S OWN PERSON, which the route reads off the
 * admission and never off the request. An address id that belongs to somebody
 * else matches no row here, exactly as an id that does not exist.
 *
 * THE PERMISSION FLAGS ARE COMPUTED HERE AND READ BY THE PAGE, the arrangement
 * the preferences section already has ([[REQ-245]]): the portal draws a control
 * only where a row says it may, so the page and the server cannot disagree about
 * which address is removable.
 */

/** One address, as the profile portal shows it. */
export interface SignInAddress {
  id: string
  email: string
  primary: boolean
  /** At least one sign-in has completed through a link mailed to this address. */
  validated: boolean
  /** May be removed now — not the primary, and not the last validated address. */
  removable: boolean
  /** May be made primary now — validated, and not already primary. */
  canMakePrimary: boolean
}

/**
 * A refusal the person is owed the reason for.
 *
 * `status` IS THE HTTP ANSWER, so the route has one branch for every refusal in
 * this file rather than one per class.
 */
export class SignInAddressRefusedError extends Error {
  readonly name = 'SignInAddressRefusedError'
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
  ) {
    super(message)
  }
}

/**
 * THE WORDING FOR AN ADDRESS SOMEBODY ELSE HOLDS, and it is deliberately the
 * wording for any address that cannot be added. "Already in use by another
 * account" would confirm that account exists — the existence oracle
 * `idx_user_emails_tenant_email` is scoped to avoid.
 */
export const ADDRESS_UNAVAILABLE = 'That address cannot be added to your account.'

interface AddressRow {
  id: string
  email: string
  is_primary: number
  verified_at: string | null
}

async function rowsOf(env: IdentityEnv, userId: string): Promise<AddressRow[]> {
  const { results } = await env.DB.prepare(
    // ORDERED AS `PRIMARY_EMAIL_SQL` PICKS, so the head of the list is the
    // address every other surface shows this person as.
    'SELECT id, email, is_primary, verified_at FROM user_emails WHERE user_id = ? ' +
      'ORDER BY is_primary DESC, created_at ASC, id ASC',
  )
    .bind(userId)
    .all<AddressRow>()
  return results ?? []
}

/** Every address this person signs in with, primary first, with what each allows. */
export async function signInAddressesOf(env: IdentityEnv, userId: string): Promise<SignInAddress[]> {
  const rows = await rowsOf(env, userId)
  const validatedCount = rows.filter((row) => row.verified_at !== null).length
  return rows.map((row) => {
    const primary = row.is_primary === 1
    const validated = row.verified_at !== null
    return {
      id: row.id,
      email: row.email,
      primary,
      validated,
      removable: !primary && (!validated || validatedCount > 1),
      canMakePrimary: validated && !primary,
    }
  })
}

/**
 * Add an address. It arrives UNVALIDATED, and primary only if the person holds
 * no primary at all — the primary defaults to the first address they entered.
 */
export async function addSignInAddress(
  env: IdentityEnv,
  person: { id: string; tenantId: string },
  typed: string,
  now: Date = new Date(),
): Promise<SignInAddress[]> {
  const email = normaliseEmail(typed)
  if (!isEmailShape(email)) {
    throw new SignInAddressRefusedError('That is not an email address.', 400)
  }
  const rows = await rowsOf(env, person.id)
  if (rows.some((row) => row.email === email)) {
    // THEIR OWN ADDRESS, which is no oracle: it is on the list they are looking at.
    throw new SignInAddressRefusedError('That address is already on your list.', 409)
  }
  const stamp = now.toISOString()
  const primary = rows.some((row) => row.is_primary === 1) ? 0 : 1
  try {
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).bind(newId('eml'), person.id, person.tenantId, email, primary, stamp, stamp),
      touch(env, person.id, stamp),
    ])
  } catch (err) {
    // `idx_user_emails_tenant_email` refused it: somebody else in this business
    // holds the address. Said in words that do not confirm it.
    if (/UNIQUE/i.test(err instanceof Error ? err.message : String(err))) {
      throw new SignInAddressRefusedError(ADDRESS_UNAVAILABLE, 409)
    }
    throw err
  }
  return signInAddressesOf(env, person.id)
}

/**
 * Remove an address — never the primary, never the last validated one.
 *
 * THE RULES ARE IN THE DELETE ITSELF, not checked first and then acted on, so
 * two removals racing each other cannot together take the last validated
 * address. Only when nothing was deleted is the row read, to say why.
 */
export async function removeSignInAddress(
  env: IdentityEnv,
  userId: string,
  emailId: string,
  now: Date = new Date(),
): Promise<SignInAddress[]> {
  const stamp = now.toISOString()
  const [deleted] = await env.DB.batch([
    env.DB.prepare(
      'DELETE FROM user_emails WHERE id = ? AND user_id = ? AND is_primary = 0 AND (' +
        'verified_at IS NULL OR (SELECT COUNT(*) FROM user_emails o ' +
        'WHERE o.user_id = ? AND o.id <> ? AND o.verified_at IS NOT NULL) > 0)',
    ).bind(emailId, userId, userId, emailId),
    touch(env, userId, stamp),
  ])
  if ((deleted.meta?.changes ?? 0) === 0) {
    const row = (await rowsOf(env, userId)).find((candidate) => candidate.id === emailId)
    if (!row) throw new SignInAddressRefusedError('That address is not on your list.', 404)
    if (row.is_primary === 1) {
      throw new SignInAddressRefusedError(
        'Make another address primary before removing this one.',
        409,
      )
    }
    throw new SignInAddressRefusedError('You must keep at least one validated address.', 409)
  }
  return signInAddressesOf(env, userId)
}

/**
 * Make a validated address the primary one — where the platform sends its mail,
 * and the address the person is shown as.
 *
 * ONE BATCH, SO ONE TRANSACTION, and the first statement only clears the old
 * primary when the new one qualifies. `idx_user_emails_one_primary` refuses two
 * primaries, so the order — clear, then set — is required as well as sensible.
 */
export async function makePrimarySignInAddress(
  env: IdentityEnv,
  userId: string,
  emailId: string,
  now: Date = new Date(),
): Promise<SignInAddress[]> {
  const row = (await rowsOf(env, userId)).find((candidate) => candidate.id === emailId)
  if (!row) throw new SignInAddressRefusedError('That address is not on your list.', 404)
  if (row.verified_at === null) {
    throw new SignInAddressRefusedError(
      'Only a validated address can be primary. Sign in through it first.',
      409,
    )
  }
  if (row.is_primary === 1) return signInAddressesOf(env, userId)
  const stamp = now.toISOString()
  const qualifies =
    'EXISTS (SELECT 1 FROM user_emails t WHERE t.id = ? AND t.user_id = ? AND t.verified_at IS NOT NULL)'
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE user_emails SET is_primary = 0, updated_at = ? WHERE user_id = ? AND is_primary = 1 AND ${qualifies}`,
    ).bind(stamp, userId, emailId, userId),
    env.DB.prepare(
      'UPDATE user_emails SET is_primary = 1, updated_at = ? ' +
        'WHERE id = ? AND user_id = ? AND verified_at IS NOT NULL',
    ).bind(stamp, emailId, userId),
    touch(env, userId, stamp),
  ])
  return signInAddressesOf(env, userId)
}

/**
 * Move the person's `updated_at`, so the operator's Contacts pane — which polls
 * for who changed ([[REQ-233]]) — sees an address change as a change.
 */
function touch(env: IdentityEnv, userId: string, stamp: string): D1PreparedStatement {
  return env.DB.prepare('UPDATE users SET updated_at = ? WHERE id = ?').bind(stamp, userId)
}
