import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admissibleBusiness,
  admit,
  newId,
  provisionInvite,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-184 — **the entitlement's subject is the account** ([[DOC-42]] §6, §10.2).
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed migration sequence applied in order — `0004` writes
 * `account_id` holding a business, `0005` seeds the operator's rows through that
 * column, and `0006` renames it and adds the real subject. So the rename is
 * proved against a database that already held `0004`'s and `0005`'s rows, which
 * is the only way to prove it: a suite that created the post-rename schema
 * directly would assert the destination and skip the journey.
 *
 * THE BUG BEING FIXED IS SILENT, WHICH IS WHY IT IS WORTH A FILE. `account_id`
 * told the next hand to put an account id in it. They would have, because the
 * name said to, and the row would have INSERTED — attaching a grant to nothing
 * that exists, so that `bestActiveGrant` finds no grant for a business that was
 * supposed to have one. Nothing throws; a customer is simply locked out of
 * something they paid for. Every assertion below is about a query returning the
 * wrong number of rows rather than about an error being raised.
 *
 * AND THE TWO KINDS OF GRANT ARE KEPT APART BY ONE COLUMN. Per-business CAPACITY
 * ("Alice's Plumbing holds a pro plan") names no account; per-ACCOUNT access
 * ("Bob may read Alice's paywalled pages") names both. They are different grants
 * rather than one generalised, because capacity must not require re-granting
 * every member as they join — so neither may satisfy the other's question, and
 * both directions are driven here.
 */

const PLATFORM = 'req184-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `req184-${(seq += 1)}@example.test`

const iso = (offsetMs = 0): string => new Date(Date.now() + offsetMs).toISOString()

/** The columns a table actually has, as SQLite reports them. */
async function columnsOf(table: string): Promise<string[]> {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
  return (results ?? []).map((r) => r.name).sort()
}

/** Write one grant directly, so the two kinds can be compared side by side. */
async function grant(spec: {
  businessId: string | null
  accountId: string | null
  status?: string
  startsAt?: string
  endsAt?: string | null
}): Promise<string> {
  const id = newId('ent')
  const now = iso()
  await env.DB.prepare(
    'INSERT INTO entitlements (id, business_id, account_id, plan, source, status, starts_at, ' +
      'ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      spec.businessId,
      spec.accountId,
      'pro',
      'admin_grant',
      spec.status ?? 'active',
      spec.startsAt ?? now,
      spec.endsAt ?? null,
      now,
      now,
    )
    .run()
  return id
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-184 — the columns say what they hold', () => {
  it('test_UAT_FC_REQ-184_no_column_named_for_an_account_holds_a_business', async () => {
    // The acceptance in its plainest form, asked of the database rather than of
    // the migration text — a file that says `RENAME COLUMN` and a database that
    // performed it are different claims, and only the second one is what the
    // Worker queries.
    //
    // `memberships` IS INCLUDED DELIBERATELY. Its column always held a business
    // and leaving it alone was defensible while `account_id` meant "business"
    // everywhere. The moment `entitlements.account_id` starts meaning an actual
    // account, two adjacent tables carrying that name with opposite meanings is
    // strictly worse than the state this ticket set out to fix.
    const memberships = await columnsOf('memberships')
    expect(memberships).toContain('business_id')
    expect(memberships).not.toContain('account_id')

    const entitlements = await columnsOf('entitlements')
    expect(entitlements).toContain('business_id')
    // And the subject now has a column of its own, which is the half that was
    // missing rather than misnamed.
    expect(entitlements).toContain('account_id')
  })

  it('test_UAT_FC_REQ-184_the_rename_carries_every_existing_grant_forward', async () => {
    // The migration is applied to a database that ALREADY HOLDS rows written
    // through the old name: `0005` seeds the operator's membership and grant
    // against `account_id`, and `0006` runs afterwards. If the rename dropped and
    // recreated the column — the tempting way to write it — those rows would
    // still be there and their ids would be NULL, which is a lost grant that
    // reports as "never granted" rather than as an error.
    const membership = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships WHERE business_id = ?',
    )
      .bind('1stcontact')
      .first<{ n: number }>()
    expect(Number(membership?.n ?? 0)).toBe(1)

    const seeded = await env.DB.prepare(
      'SELECT business_id, account_id, plan, status FROM entitlements WHERE business_id = ?',
    )
      .bind('1stcontact')
      .first<{ business_id: string; account_id: string | null; plan: string; status: string }>()
    expect(seeded?.business_id).toBe('1stcontact')
    expect(seeded?.plan).toBe('pro')
    expect(seeded?.status).toBe('active')
    // A grant written before there was a subject to name is a per-business
    // capacity grant, and NULL is what says so — not a missing value to be
    // backfilled later.
    expect(seeded?.account_id).toBeNull()
  })

  it('test_UAT_FC_REQ-184_provisioning_writes_capacity_and_names_no_subject', async () => {
    // What the shipped write path does, read back out of the database rather
    // than out of its return value. Naming a subject here would make the grant
    // the inviter's personally, and invisible to the second member the day one
    // is added — which is the wrong-direction generalisation this ticket exists
    // to foreclose.
    const email = anEmail()
    const invite = await provisionInvite(identityEnv(), { email, accountName: 'Salon', endsAt: null })

    const row = await env.DB.prepare(
      'SELECT business_id, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(invite.businessId)
      .first<{ business_id: string; account_id: string | null }>()
    expect(row?.business_id).toBe(invite.businessId)
    expect(row?.account_id).toBeNull()

    // And the membership too: the join says which BUSINESS this person may log
    // in to ([[DOC-42]] §4).
    const membership = await env.DB.prepare(
      'SELECT business_id FROM memberships WHERE business_id = ?',
    )
      .bind(invite.businessId)
      .first<{ business_id: string }>()
    expect(membership?.business_id).toBe(invite.businessId)
  })
})

describe('REQ-184 — capacity and account access are different grants', () => {
  it('test_UAT_FC_REQ-184_a_grant_names_an_account_and_a_business_independently', async () => {
    // The shape [[DOC-42]] §6 asks for, and the case that motivates it: two
    // members of one business, one paying for gated content and one not. That is
    // unrepresentable while the grant IS the business, and representable the
    // moment the subject has a column — so the claim is proved by writing all
    // three combinations against ONE business and reading them back apart.
    const businessId = newId('acct')
    const alice = newId('acct')
    const bob = newId('acct')

    await grant({ businessId, accountId: null })
    await grant({ businessId, accountId: alice })
    await grant({ businessId, accountId: bob })

    const { results } = await env.DB.prepare(
      'SELECT account_id FROM entitlements WHERE business_id = ? ORDER BY account_id',
    )
      .bind(businessId)
      .all<{ account_id: string | null }>()
    expect((results ?? []).map((r) => r.account_id).sort()).toEqual([alice, bob, null].sort())
  })

  it('test_UAT_FC_REQ-184_an_account_subject_grant_does_not_satisfy_a_business_capacity_check', async () => {
    // The direction that would be a confidentiality-shaped bug rather than a
    // lockout: if the capacity check ignored the subject, one member's personal
    // grant would open the whole business to EVERY member holding a membership on
    // it. Driven through the shipped reader, not through a hand-written query.
    const email = anEmail()
    const invite = await provisionInvite(identityEnv(), { email, accountName: 'Studio', endsAt: null })

    // Take the capacity grant away and replace it with one naming an account.
    await env.DB.prepare('DELETE FROM entitlements WHERE business_id = ?')
      .bind(invite.businessId)
      .run()
    await grant({ businessId: invite.businessId, accountId: newId('acct') })

    const business = await admissibleBusiness(identityEnv(), invite.businessId)
    expect(business, 'the business itself disappeared').toBeTruthy()
    expect(business?.entitlement, 'an account grant answered a capacity question').toBeNull()
    expect(business?.selectable).toBe(false)
    // And it reports `never_granted` rather than `expired` or `revoked`: no
    // capacity grant was ever made against this business, and describing
    // somebody else's personal grant as the reason would be a true row and a
    // false answer.
    expect(business?.lapse?.reason).toBe('never_granted')

    // The whole account is refused at the door, which is the same answer one
    // level up — the person holds a membership and their business holds no
    // capacity.
    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(false)
    if (!admission.ok) expect(admission.reason).toBe('no_entitlement')
  })

  it('test_UAT_FC_REQ-184_a_business_capacity_grant_does_not_satisfy_an_account_subject_lookup', async () => {
    // The converse, which the same one column settles for free: a capacity grant
    // names no subject, so an `account_id = ?` lookup can never match it. Asserted
    // because the tempting shortcut for the future paywall is "a grant on the
    // business counts for everybody in it", and that would hand the paying
    // member's access to the one who did not pay.
    const email = anEmail()
    const invite = await provisionInvite(identityEnv(), { email, accountName: 'Bakery', endsAt: null })
    const bob = newId('acct')

    const forBob = await env.DB.prepare(
      'SELECT id FROM entitlements WHERE business_id = ? AND account_id = ?',
    )
      .bind(invite.businessId, bob)
      .first<{ id: string }>()
    expect(forBob, 'a capacity grant answered a per-account question').toBeNull()

    // And it is genuinely the SUBJECT that separates them, not the absence of
    // rows: the same lookup finds the grant once one is made to Bob, against the
    // very same business.
    const id = await grant({ businessId: invite.businessId, accountId: bob })
    const now = await env.DB.prepare(
      'SELECT id FROM entitlements WHERE business_id = ? AND account_id = ?',
    )
      .bind(invite.businessId, bob)
      .first<{ id: string }>()
    expect(now?.id).toBe(id)

    // Adding it changed nothing about whether the BUSINESS may be entered — the
    // capacity grant provisioning wrote is still the one answering that.
    const business = await admissibleBusiness(identityEnv(), invite.businessId)
    expect(business?.selectable).toBe(true)
    expect(business?.entitlement?.account_id).toBeNull()
    expect(business?.entitlement?.business_id).toBe(invite.businessId)
  })

  it('test_UAT_FC_REQ-184_expiry_still_expires_after_the_rename', async () => {
    // The one property most likely to be broken silently by a column rename: the
    // date arithmetic lives in the same WHERE clause the renamed column is in, so
    // a rename that lost a predicate along the way would leave every expired
    // grant covering forever. Driven from both sides against a date the test
    // sets, not against the clock.
    const email = anEmail()
    const invite = await provisionInvite(identityEnv(), { email, accountName: 'Garage' })

    expect((await admissibleBusiness(identityEnv(), invite.businessId))?.selectable).toBe(true)

    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(iso(-86_400_000), invite.businessId)
      .run()

    const lapsed = await admissibleBusiness(identityEnv(), invite.businessId)
    expect(lapsed?.selectable).toBe(false)
    expect(lapsed?.lapse?.reason).toBe('expired')
  })
})
