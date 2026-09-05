import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  ensurePlatformOperator,
  findAccount,
  ownsBusiness,
  ownsPlatformBusiness,
  provisionInvite,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { resolveScope, ScopeRefusedError } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-185 — **`platform_admin` was two capabilities wearing one flag.**
 *
 * WHAT THIS FILE IS WRITTEN AGAINST. Not an exception — a reading. The column
 * answered two questions with nothing to do with each other ([[DOC-42]] §10.3):
 * *am I an owner of the 1st Contact business*, which is not special in any way
 * and which every business's owner needs, and *may I enter a business I hold no
 * membership on*, which is genuinely ours alone and is ours because 1st Contact
 * HOSTS the others ([[DOC-42]] §8). A hand reading the bundle as "admins get
 * extra pages" builds a generic privileged-surface mechanism, which produces no
 * wrong answer and no failing test — so what is asserted here is that the two
 * halves are now separately observable, and that neither can be reached through
 * the other.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed migrations applied, and every row is written by a
 * shipped entry point — `provisionInvite`, `ensurePlatformOperator` — rather
 * than seeded by hand, so a divergence between what the product writes and what
 * the test assumes would fail here rather than pass.
 */

const PLATFORM = 'req185-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `req185-${(seq += 1)}@example.test`

async function admitted(email: string): Promise<Extract<Admission, { ok: true }>> {
  const result = await admit(identityEnv(), email)
  if (!result.ok) throw new Error(`expected an admitted account, got ${result.reason}`)
  return result
}

/** The hosting half, and ONLY it — no membership on the platform business. */
async function makeHost(userId: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET platform_operator = 1 WHERE id = ?').bind(userId).run()
}

const membershipCount = async (email: string): Promise<number> => {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM memberships m JOIN users u ON u.id = m.user_id ' +
      'WHERE u.tenant_id = ? AND u.email = ? AND m.business_id = ?',
  )
    .bind(PLATFORM, email, PLATFORM)
    .first<{ n: number }>()
  return row?.n ?? 0
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-185 — the two capabilities are separately observable', () => {
  /**
   * THE FIRST ACCEPTANCE CRITERION, in both directions. "No single predicate
   * answers both *is this person an owner here* and *may this person enter a
   * business they are not a member of*" — so each half is granted alone and the
   * other is asserted absent. One direction alone would pass against a rename.
   */
  it('test_UAT_FC_REQ-185_the_hosting_column_confers_no_ownership', async () => {
    const email = anEmail()
    const host = await provisionInvite(identityEnv(), { email, endsAt: null })
    await makeHost(host.user.id)

    const admission = await admitted(email)
    expect(admission.user.platform_operator).toBe(1)
    // They hold the genuinely special power and are not an owner of the 1st
    // Contact business, so the fulfilment gate refuses them.
    expect(ownsPlatformBusiness(identityEnv(), admission)).toBe(false)
    expect(ownsBusiness(admission, PLATFORM)).toBe(false)
  })

  it('test_UAT_FC_REQ-185_owning_the_platform_business_confers_no_bypass', async () => {
    const ownerEmail = anEmail()
    const customerEmail = anEmail()
    await ensurePlatformOperator(identityEnv(), ownerEmail)
    // The ownership half alone: take the hosting column back off.
    const owner = await findAccount(identityEnv(), ownerEmail)
    await env.DB.prepare('UPDATE users SET platform_operator = 0 WHERE id = ?')
      .bind(owner?.id ?? '')
      .run()
    const customer = await provisionInvite(identityEnv(), { email: customerEmail, endsAt: null })

    const admission = await admitted(ownerEmail)
    expect(ownsPlatformBusiness(identityEnv(), admission)).toBe(true)
    expect(admission.user.platform_operator).toBe(0)

    // Owning the business whose product is businesses does not let them walk
    // into a customer's. That is what the other half was for, and they no
    // longer hold it.
    const refusal = await resolveScope(identityEnv(), admission, customer.businessId).catch(
      (err: unknown) => err,
    )
    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    expect((refusal as ScopeRefusedError).reason).toBe('not_a_member')
  })

  /**
   * "Owning the 1st Contact business is expressed the same way as owning any
   * other business, and a UAT asserts the two are indistinguishable to a
   * caller." The comparison is over the whole admitted-business record, so a
   * later field that made the platform's own business special would fail here.
   */
  it('test_UAT_FC_REQ-185_owning_1st_contact_is_indistinguishable_from_owning_a_salon', async () => {
    const operatorEmail = anEmail()
    const customerEmail = anEmail()
    await ensurePlatformOperator(identityEnv(), operatorEmail)
    await provisionInvite(identityEnv(), { email: customerEmail, accountName: 'Salon', endsAt: null })

    const platform = (await admitted(operatorEmail)).businesses.find(
      (b) => b.businessId === PLATFORM,
    )
    const salon = (await admitted(customerEmail)).businesses[0]

    // Same role, through the same column, read by the same function.
    expect(platform?.role).toBe('owner')
    expect(salon.role).toBe('owner')
    // And the same shape otherwise: the only differences are the id, the label
    // and the grant's own identifiers — nothing that says "this one is ours".
    const shapeOf = (b: typeof salon) => ({
      role: b.role,
      selectable: b.selectable,
      lapse: b.lapse,
      plan: b.entitlement?.plan ?? null,
      status: b.entitlement?.status ?? null,
    })
    expect(shapeOf(platform!)).toEqual(shapeOf(salon))
  })
})

describe('REQ-185 — PLATFORM_ADMINS is not locked out by a missing row', () => {
  /**
   * THE PROPERTY [[DOC-40]] §6 EXISTS TO PROTECT, and the one this ticket most
   * risked breaking: moving ownership onto `memberships.role` puts it behind a
   * ROW, and a missing row is precisely the lockout. So "a holder of
   * `PLATFORM_ADMINS` can operate the 1st Contact business against a database
   * carrying no membership row for them" is asserted against a database where
   * the row demonstrably does not exist first.
   */
  it('test_UAT_FC_REQ-185_a_holder_is_admitted_against_a_database_with_no_membership_row', async () => {
    const email = anEmail()
    // The premise, stated rather than assumed: nothing at all for this person.
    expect(await findAccount(identityEnv(), email)).toBeNull()
    expect(await membershipCount(email)).toBe(0)

    const admission = await admit(identityEnv({ PLATFORM_ADMINS: email }), email)

    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    // Not merely admitted — able to OPERATE the business, which is a live grant
    // as well as a membership.
    expect(ownsPlatformBusiness(identityEnv(), admission)).toBe(true)
    const scope = await resolveScope(identityEnv(), admission, PLATFORM)
    expect(scope?.businessId).toBe(PLATFORM)
  })

  /**
   * "The act of using it should leave the row behind rather than depend on it
   * forever." So the var is emptied afterwards and the holder is still there —
   * which is what makes this break glass and not a permanent second
   * authorisation path.
   */
  it('test_UAT_FC_REQ-185_using_the_var_leaves_the_membership_row_behind', async () => {
    const email = anEmail()
    await admit(identityEnv({ PLATFORM_ADMINS: email }), email)
    expect(await membershipCount(email)).toBe(1)

    // Emptied, exactly as a deployment would after recovering.
    const after = await admit(identityEnv({ PLATFORM_ADMINS: '' }), email)
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(ownsPlatformBusiness(identityEnv(), after)).toBe(true)
  })

  /**
   * The var confers BOTH halves — which the ticket requires explicitly, because
   * a holder must be able to operate the 1st Contact business AND retain the
   * hosting capability the flag used to carry. They are written as two separate
   * facts, and both are read back separately here.
   */
  it('test_UAT_FC_REQ-185_the_var_confers_both_halves_as_two_separate_facts', async () => {
    const email = anEmail()
    const customerEmail = anEmail()
    const customer = await provisionInvite(identityEnv(), { email: customerEmail, endsAt: null })

    const admission = await admit(identityEnv({ PLATFORM_ADMINS: email }), email)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return

    // The ownership half — a membership row, like any other business's owner.
    expect(ownsPlatformBusiness(identityEnv(), admission)).toBe(true)
    // The hosting half — a column, read only by `scope.ts`.
    expect(admission.user.platform_operator).toBe(1)
    const scope = await resolveScope(identityEnv(), admission, customer.businessId)
    expect(scope?.businessId).toBe(customer.businessId)
  })

  /**
   * Idempotent by `WHERE NOT EXISTS`, the shape the ticket names
   * `0005_operator_membership.sql` for. Every admission by a holder runs the
   * seed, so a second membership row per login would be a slow-motion corruption
   * of the one table admission is decided from.
   */
  it('test_UAT_FC_REQ-185_seeding_repeatedly_writes_one_membership', async () => {
    const email = anEmail()
    const seedEnv = identityEnv({ PLATFORM_ADMINS: email })
    await admit(seedEnv, email)
    await admit(seedEnv, email)
    await ensurePlatformOperator(seedEnv, email)

    expect(await membershipCount(email)).toBe(1)
    const grants = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM entitlements WHERE business_id = ? AND account_id IS NULL',
    )
      .bind(PLATFORM)
      .first<{ n: number }>()
    expect(grants?.n).toBe(1)
  })

  /**
   * An address the var does not name gets nothing. `admit` creates nothing for
   * anyone the database decides about, and the seed is the one exception — so
   * the exception has to be bounded by the var and by nothing else.
   */
  it('test_UAT_FC_REQ-185_an_address_the_var_does_not_name_is_still_refused', async () => {
    const named = anEmail()
    const stranger = anEmail()

    const admission = await admit(identityEnv({ PLATFORM_ADMINS: named }), stranger)

    expect(admission.ok).toBe(false)
    if (admission.ok) return
    expect(admission.reason).toBe('no_user')
    expect(await membershipCount(stranger)).toBe(0)
  })
})

describe('REQ-185 — the bypass refuses exactly what it refused before', () => {
  /**
   * "The bypass's existing refusals are unchanged: no grant still refuses, a
   * deactivated business still refuses, and the handle it returns still carries
   * no extra scope." The ticket changes what the check READS and nothing about
   * what it decides, so each refusal is driven again through the renamed column.
   */
  it('test_UAT_FC_REQ-185_the_bypass_still_refuses_a_business_with_no_grant', async () => {
    const hostEmail = anEmail()
    const customerEmail = anEmail()
    const host = await provisionInvite(identityEnv(), { email: hostEmail, endsAt: null })
    const customer = await provisionInvite(identityEnv(), { email: customerEmail, endsAt: null })
    await makeHost(host.user.id)
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), customer.businessId)
      .run()

    const refusal = await resolveScope(
      identityEnv(),
      await admitted(hostEmail),
      customer.businessId,
    ).catch((err: unknown) => err)

    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    expect((refusal as ScopeRefusedError).reason).toBe('no_entitlement')
  })

  it('test_UAT_FC_REQ-185_the_bypass_still_refuses_a_deactivated_business', async () => {
    const hostEmail = anEmail()
    const customerEmail = anEmail()
    const host = await provisionInvite(identityEnv(), { email: hostEmail, endsAt: null })
    const customer = await provisionInvite(identityEnv(), { email: customerEmail, endsAt: null })
    await makeHost(host.user.id)
    await env.DB.prepare('UPDATE tenants SET status = ? WHERE id = ?')
      .bind('suspended', customer.businessId)
      .run()

    const refusal = await resolveScope(
      identityEnv(),
      await admitted(hostEmail),
      customer.businessId,
    ).catch((err: unknown) => err)

    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    // Not distinguishable from "no such business", which is the existence-oracle
    // argument `scope.ts` makes and this ticket does not touch.
    expect((refusal as ScopeRefusedError).reason).toBe('unknown_business')
  })

  /**
   * "The handle it returns still carries no extra scope" — and [[REQ-185]] gives
   * that claim a field to stand on. A business reached through the bypass comes
   * back with `role: null`, so entering a business you host can never be read
   * back as owning it.
   */
  it('test_UAT_FC_REQ-185_a_business_reached_by_the_bypass_carries_no_role', async () => {
    const hostEmail = anEmail()
    const customerEmail = anEmail()
    const host = await provisionInvite(identityEnv(), { email: hostEmail, endsAt: null })
    const customer = await provisionInvite(identityEnv(), { email: customerEmail, endsAt: null })
    await makeHost(host.user.id)

    const admission = await admitted(hostEmail)
    // The premise: the bypass is doing the work, not a membership nobody noticed.
    expect(admission.businesses.map((b) => b.businessId)).not.toContain(customer.businessId)

    const scope = await resolveScope(identityEnv(), admission, customer.businessId)
    expect(scope?.businessId).toBe(customer.businessId)
    // An ordinary business handle, and not an ownership claim over it.
    expect(ownsBusiness(admission, customer.businessId)).toBe(false)
  })
})
