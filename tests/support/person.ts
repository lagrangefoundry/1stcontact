import {
  PRIMARY_EMAIL_SQL,
  USER_ID_BY_EMAIL_SQL,
  normaliseEmail,
  type IdentityEnv,
  type UserRow,
} from '../../apps/control-app/src/identity'

/**
 * The PERSON one address reaches, inside one business.
 *
 * IT EXISTS BECAUSE `findAccount` STOPPED BEING THIS ([[REQ-194]]). That function
 * returned a `UserRow` while an account WAS a person, so a suite wanting "the
 * operator I just seeded" asked for the account and got them. It answers with an
 * `accounts` row now — correctly, because its one production caller goes on to
 * make that value a business's owner — and the suites that wanted the person need
 * somewhere to ask for the person.
 *
 * A FIXTURE AND NOT A SHIPPED FUNCTION. The product resolves a person exactly
 * once, inside `admit`, and exporting that would be widening a private read for
 * the benefit of tests. What is reused instead is the two SQL fragments
 * `identity.ts` already exports for exactly this — so the address is resolved
 * through ANY of a person's addresses and the primary one is joined on, the same
 * two rules the front door applies.
 */
export async function personByEmail(
  env: IdentityEnv,
  tenantId: string,
  email: string,
): Promise<UserRow | null> {
  return env.DB.prepare(
    `SELECT u.*, ${PRIMARY_EMAIL_SQL} AS email FROM users u ` +
      `WHERE u.tenant_id = ? AND u.id = ${USER_ID_BY_EMAIL_SQL}`,
  )
    .bind(tenantId, tenantId, normaliseEmail(email))
    .first<UserRow>()
}
