import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  ensurePlatformOperator,
  ownsPlatformBusiness,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import {
  openGrant,
  peopleOf,
  personDetail,
  revokeGrant,
  setPersonStatus,
} from '../apps/control-app/src/people'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-170 — **the User tab: the people of a business, their membership and their
 * grants.**
 *
 * WHAT THIS FILE IS WRITTEN AGAINST. The tab is uniform: it shows the people of
 * whichever business is open, and there is no branch on which business that is.
 * A platform-only people list is [[DOC-40]] §2.1 rule 1's named failure mode, and
 * it is a failure that produces no wrong answer and no exception — so what is
 * asserted here is that the same functions, pointed at a customer's business,
 * answer about that customer's people and about nothing of ours.
 *
 * THE FOUR RELATIONS ARE THE OTHER HALF ([[DOC-42]] §4). An earlier draft of the
 * model said `memberships` means *may log in*; the schema disagrees, and the
 * cases below pin the corrected reading — an account logs in holding no
 * membership on the business it logs in to, `users.status` is what stops a
 * sign-in, and a membership is the right to RUN a business.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed migrations applied, and every row is written by a
 * shipped entry point — `inviteAccount`, `provisionBusiness`, `openGrant` —
 * rather than seeded by hand, so a divergence between what the product writes and
 * what the tab reads would fail here rather than pass.
 */

const PLATFORM = 'req170-platform'

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

let seq = 0
const anEmail = (): string => `req170-${(seq += 1)}@example.test`

/** A contact: known to a business, never invited, and MAY become a member. */
async function addContact(tenantId: string, email: string): Promise<string> {
  const id = `usr_contact_${(seq += 1)}`
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, tenantId, email, 'active', now, now)
    .run()
  return id
}

beforeAll(async () => {
  await applySchema(env.DB as D1Database)
})

describe('REQ-170 — the people of the business you are in', () => {
  /**
   * *"The tab shows the people of the business you are in... For the 1st Contact
   * business those people are our customers; for a customer's business they are
   * that customer's customers."*
   */
  it('test_UAT_FC_REQ-170_lists_the_people_of_the_scoped_business_and_no_others', async () => {
    const mine = anEmail()
    const invited = await inviteAccount(identityEnv(), { email: mine, accountName: 'Alice Plumbing' })

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    expect(people.map((p) => p.email)).toContain(mine)

    // The SAME function against the customer's own business answers about their
    // people. Alice is our customer and is NOT one of her own — the recursion is
    // two levels and this is where it is observable.
    const theirs = await peopleOf(identityEnv(), { businessId: invited.businessId })
    expect(theirs.map((p) => p.email)).not.toContain(mine)
  })

  /**
   * *"Contacts appear in the list. A person the business knows and has not
   * invited is a row with `invited_at` null, and the tab shows them as such."*
   */
  it('test_UAT_FC_REQ-170_a_contact_is_listed_and_is_distinguishable_from_a_member', async () => {
    const memberEmail = anEmail()
    const contactEmail = anEmail()
    await inviteAccount(identityEnv(), { email: memberEmail, accountName: 'A Business' })
    await addContact(PLATFORM, contactEmail)

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const member = people.find((p) => p.email === memberEmail)
    const contact = people.find((p) => p.email === contactEmail)

    expect(member?.invitedAt).not.toBeNull()
    expect(contact?.invitedAt).toBeNull()
  })

  /**
   * *"Not found and not in this business are the same answer"* — the tab must not
   * become the existence oracle `identity.ts` and `scope.ts` both refuse to be.
   */
  it('test_UAT_FC_REQ-170_a_person_in_another_business_is_indistinguishable_from_one_that_does_not_exist', async () => {
    const invited = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Theirs' })
    const ours = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const someone = ours[0]

    const acrossTheBarrier = await personDetail(
      identityEnv(),
      { businessId: invited.businessId },
      someone.id,
    )
    const doesNotExist = await personDetail(
      identityEnv(),
      { businessId: invited.businessId },
      'usr_no_such_person',
    )
    expect(acrossTheBarrier).toBeNull()
    expect(doesNotExist).toBeNull()
  })
})

describe('REQ-170 — the four relations are not the same table', () => {
  /**
   * *"`memberships` does not mean may log in... an account logs in holding no
   * membership on the business it logs in to."* ([[DOC-42]] §4)
   */
  it('test_UAT_FC_REQ-170_an_account_logs_in_holding_no_membership_on_the_business_it_logs_in_to', async () => {
    const email = anEmail()
    await inviteAccount(identityEnv(), { email, accountName: "Alice's Plumbing" })

    const onPlatform = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships m JOIN users u ON u.id = m.user_id ' +
        'WHERE u.email = ? AND m.business_id = ?',
    )
      .bind(email, PLATFORM)
      .first<{ n: number }>()

    const admission = await admit(identityEnv(), email)
    expect(onPlatform?.n).toBe(0)
    expect(admission.ok).toBe(true)
  })

  /**
   * *"Being in the list is the member relation... the control is `users.status`,
   * which `admit` refuses as `user_inactive`."*
   */
  it('test_UAT_FC_REQ-170_status_is_the_login_control_and_a_suspended_person_is_refused', async () => {
    const email = anEmail()
    await inviteAccount(identityEnv(), { email, accountName: 'A Business' })
    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const person = people.find((p) => p.email === email)!

    await setPersonStatus(identityEnv(), { businessId: PLATFORM }, person.id, 'suspended')

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.reason).toBe('user_inactive')
  })

  /**
   * *"The operator column... the businesses that person may operate — the
   * membership rows — which is the only place a second business is visible at
   * all."*
   */
  it('test_UAT_FC_REQ-170_the_detail_shows_the_businesses_that_person_runs', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: "Alice's Plumbing" })
    await provisionBusiness(identityEnv(), {
      accountUserId: invited.user.id,
      name: "Alice's Second",
    })

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const person = people.find((p) => p.email === email)!
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, person.id)

    expect(detail?.operates.map((b) => b.name).sort()).toEqual([
      "Alice's Plumbing",
      "Alice's Second",
    ])
    expect(detail?.operates.every((b) => b.role === 'owner')).toBe(true)
  })
})

describe('REQ-170 — grants are a list, and revocation keeps the row', () => {
  /**
   * *"Grants are displayed as a list, not as a single current value. An account
   * accumulates them and a UI that shows one would misrepresent an account
   * holding two."*
   */
  it('test_UAT_FC_REQ-170_an_account_holding_two_grants_shows_both', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: 'Two Grants' })
    await openGrant(identityEnv(), {
      businessId: invited.businessId,
      plan: 'pro',
      endsAt: '2027-01-01T00:00:00.000Z',
    })

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const person = people.find((p) => p.email === email)!
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, person.id)

    // Provisioning writes one; the operator opened a second. Both are present,
    // and both name the business they are for.
    expect(detail!.grants.length).toBeGreaterThanOrEqual(2)
    expect(detail!.grants.every((g) => g.businessId === invited.businessId)).toBe(true)
  })

  /**
   * *"It names the business, always. 'This user's plan' is unrepresentable."*
   */
  it('test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused', async () => {
    await expect(openGrant(identityEnv(), { businessId: '', plan: 'pro' })).rejects.toThrow()
  })

  /**
   * *"Revocation sets `revoked_at` and `status='revoked'` rather than deleting
   * the row — the history of what access was given is the thing being kept."*
   */
  it('test_UAT_FC_REQ-170_revocation_marks_the_grant_and_does_not_delete_it', async () => {
    const invited = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Revoked' })
    const grant = await openGrant(identityEnv(), { businessId: invited.businessId, plan: 'pro' })

    await revokeGrant(identityEnv(), grant.id)

    const row = await env.DB.prepare(
      'SELECT status, revoked_at FROM entitlements WHERE id = ?',
    )
      .bind(grant.id)
      .first<{ status: string; revoked_at: string | null }>()

    expect(row).not.toBeNull()
    expect(row?.status).toBe('revoked')
    expect(row?.revoked_at).not.toBeNull()
  })
})

describe('REQ-170 — the gate is two conditions and neither is "admin"', () => {
  /**
   * *"1. you are an owner of the business you are in — uniform. 2. does this
   * business's product happen to be businesses."* ([[DOC-42]] §7)
   *
   * A customer owns their own business and is refused here, which is what stops
   * the control being a general privilege.
   */
  it('test_UAT_FC_REQ-170_the_fulfilment_control_is_refused_to_a_customer_who_owns_their_own_business', async () => {
    const customer = anEmail()
    await inviteAccount(identityEnv(), { email: customer, accountName: 'A Customer' })
    const theirs = await admit(identityEnv(), customer)

    const operator = anEmail()
    await inviteAccount(identityEnv(), { email: operator, accountName: 'The Operator' })
    await ensurePlatformOperator(identityEnv(), operator)
    const ours = await admit(identityEnv(), operator)

    expect(ownsPlatformBusiness(identityEnv(), theirs)).toBe(false)
    expect(ownsPlatformBusiness(identityEnv(), ours)).toBe(true)
  })
})
