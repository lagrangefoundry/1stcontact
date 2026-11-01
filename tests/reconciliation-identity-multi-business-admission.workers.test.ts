import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  newId,
  provisionBusiness,
  provisionInvite,
  STARTER_HEADING,
  type Admission,
  type AdmittedBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'

/**
 * STORY-7b1025b8 (STORY-146), as reshaped by REQ-178 — *an account operates
 * several businesses, not one*.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database with the deployed schema applied from `db/migrations`, and every
 * business is provisioned through the shipped entry points (`provisionInvite`,
 * `provisionBusiness`) and admitted through `admit` — the function the Worker's
 * request path calls. Rows are read back out of D1 rather than trusted from a
 * return value, and grant/membership state is moved by the dates and statuses a
 * test sets, not by the clock.
 *
 * THE SPLIT THESE CRITERIA PROVE. Being admitted is a property of the PERSON;
 * being selectable is a property of each BUSINESS. A lapsed, future-dated or
 * revoked grant marks its business unselectable but keeps it listed; a withdrawn
 * or expired membership removes its business entirely; the person is refused only
 * when no live membership remains.
 */

const PLATFORM = 'story146-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `story146-${(seq += 1)}@example.test`

const ISO = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()

/** The admitted businesses keyed by id, or a failed expectation when refused. */
function byId(result: Admission): Map<string, AdmittedBusiness> {
  expect(result.ok, `admission was refused: ${!result.ok ? result.reason : ''}`).toBe(true)
  return new Map((result.ok ? result.businesses : []).map((b) => [b.businessId, b]))
}

async function setGrant(businessId: string, column: 'ends_at' | 'starts_at' | 'status', value: string) {
  await env.DB.prepare(`UPDATE entitlements SET ${column} = ? WHERE business_id = ?`)
    .bind(value, businessId)
    .run()
}

async function grantStatus(businessId: string): Promise<string | undefined> {
  const row = await env.DB.prepare('SELECT status FROM entitlements WHERE business_id = ?')
    .bind(businessId)
    .first<{ status: string }>()
  return row?.status
}

async function count(table: 'tenants' | 'memberships' | 'entitlements' | 'users'): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
  return row?.n ?? 0
}

beforeAll(async () => {
  await applySchema()
})

describe('the invite provisions', () => {
  it('test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back', async () => {
    const email = anEmail()
    const endsAt = ISO(30 * 86_400_000)
    const result = await provisionInvite(identityEnv(), {
      email,
      accountName: 'Harbour Bakery',
      plan: 'pro',
      endsAt,
    })
    expect(result.created).toBe(true)

    // The person: held against the platform's own tenant, invited, not yet seen.
    const user = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .first<{ id: string; invited_at: string | null; first_seen_at: string | null }>()
    expect(user, 'no person was written for the invited address').toBeTruthy()
    expect(user?.id).toBe(result.user.id)
    expect(user?.invited_at).toBeTruthy()
    expect(user?.first_seen_at).toBeNull()

    // The business: a registered, active tenant carrying the supplied label.
    const tenant = await env.DB.prepare('SELECT name, status FROM tenants WHERE id = ?')
      .bind(result.businessId)
      .first<{ name: string; status: string }>()
    expect(tenant).toEqual({ name: 'Harbour Bakery', status: 'active' })

    // The membership: joins THAT person to THAT business as owner, active.
    const membership = await env.DB.prepare(
      'SELECT business_id, role, status FROM memberships WHERE user_id = ?',
    )
      .bind(user!.id)
      .first<{ business_id: string; role: string; status: string }>()
    expect(membership).toEqual({ business_id: result.businessId, role: 'owner', status: 'active' })

    // The grant: against the same business, administrator-issued, active, with
    // a start, the end the caller supplied, and the address it was made to.
    const grant = await env.DB.prepare(
      'SELECT plan, source, status, starts_at, ends_at, email FROM entitlements WHERE business_id = ?',
    )
      .bind(result.businessId)
      .first<{ plan: string; source: string; status: string; starts_at: string; ends_at: string | null; email: string }>()
    expect(grant?.plan).toBe('pro')
    expect(grant?.source).toBe('admin_grant')
    expect(grant?.status).toBe('active')
    expect(grant?.starts_at).toBeTruthy()
    expect(grant?.ends_at).toBe(endsAt)
    expect(grant?.email).toBe(email)

    // With no label supplied, the business is named with the address; an
    // open-ended invite records no end.
    const unlabelled = anEmail()
    const plain = await provisionInvite(identityEnv(), { email: unlabelled, endsAt: null })
    const plainTenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(plain.businessId)
      .first<{ name: string }>()
    expect(plainTenant?.name).toBe(unlabelled)
    const plainGrant = await env.DB.prepare('SELECT ends_at FROM entitlements WHERE business_id = ?')
      .bind(plain.businessId)
      .first<{ ends_at: string | null }>()
    expect(plainGrant?.ends_at).toBeNull()
  })

  it('test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape', async () => {
    const email = anEmail()
    const window = { plan: 'pro', startsAt: ISO(-60_000), endsAt: ISO(86_400_000), grantedBy: 'operator', note: 'n' }
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'First', ...window })
    const added = await provisionBusiness(identityEnv(), {
      accountUserId: invited.user.id,
      name: 'Second',
      email,
      ...window,
    })

    const shapeOf = async (businessId: string) => ({
      tenant: await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
        .bind(businessId)
        .first(),
      membership: await env.DB.prepare(
        'SELECT user_id, role, status, granted_by FROM memberships WHERE business_id = ?',
      )
        .bind(businessId)
        .first(),
      grant: await env.DB.prepare(
        'SELECT email, plan, source, status, starts_at, ends_at, granted_by, note FROM entitlements ' +
          'WHERE business_id = ?',
      )
        .bind(businessId)
        .first(),
    })

    const invitedShape = await shapeOf(invited.businessId)
    const addedShape = await shapeOf(added.businessId)
    // Not vacuous: each side really holds every row.
    expect(invitedShape.tenant).toEqual({ status: 'active' })
    expect(invitedShape.membership).toMatchObject({ role: 'owner', status: 'active' })
    expect(invitedShape.grant).toMatchObject({ source: 'admin_grant', status: 'active' })
    expect(addedShape).toEqual(invitedShape)

    // Names and identifiers are the only per-business differences.
    expect(added.businessId).not.toBe(invited.businessId)
    const names = await env.DB.prepare('SELECT id, name FROM tenants WHERE id IN (?, ?)')
      .bind(invited.businessId, added.businessId)
      .all<{ id: string; name: string }>()
    expect(new Map((names.results ?? []).map((r) => [r.id, r.name]))).toEqual(
      new Map([
        [invited.businessId, 'First'],
        [added.businessId, 'Second'],
      ]),
    )

    // The additional business is immediately operable: listed selectable, and
    // its starter site readable through the ordinary site-storage port.
    const admitted = byId(await admit(identityEnv(), email))
    expect(admitted.get(added.businessId)?.selectable).toBe(true)
    const store = await d1r2SiteStore(identityEnv()).forTenant(added.businessId)
    const pages = await store.readPages(added.siteSlug)
    expect(pages.map((p) => p.name)).toContain('home.json')
    expect(JSON.stringify(pages.find((p) => p.name === 'home.json')?.page)).toContain(STARTER_HEADING)

    // An empty owner or an empty name is refused before anything is written.
    const before = {
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    }
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: '   ', name: 'No owner' }),
    ).rejects.toThrow(/account/i)
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: '   ' }),
    ).rejects.toThrow(/name/i)
    expect({
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    }).toEqual(before)
  })

  it('test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one', async () => {
    // The one partial state the two-step write can leave: a person row and no
    // business. Written directly, because it is exactly the row an interrupted
    // invite would have left behind.
    const email = anEmail()
    const now = new Date().toISOString()
    await env.DB.prepare(
      'INSERT INTO users (id, tenant_id, email, status, display_name, platform_admin, ' +
        'invited_at, created_at, updated_at, fields) VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?, ?)',
    )
      .bind(newId('usr'), PLATFORM, email, 'active', now, now, now, '{}')
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_membership')

    const repaired = await provisionInvite(identityEnv(), { email, endsAt: null })
    expect(repaired.created).toBe(false)
    expect(repaired.siteSlug, 'the re-invite provisioned no business').toBeTruthy()

    const admitted = await admit(identityEnv(), email)
    expect(admitted.ok && admitted.businesses.map((b) => [b.businessId, b.selectable])).toEqual([
      [repaired.businessId, true],
    ])

    const people = await env.DB.prepare('SELECT id FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .all<{ id: string }>()
    expect(people.results ?? []).toHaveLength(1)

    // A re-invite of someone who already holds a business reports the first one
    // they hold and writes nothing.
    const tenantsBefore = await count('tenants')
    const membershipsBefore = await count('memberships')
    const again = await provisionInvite(identityEnv(), { email, endsAt: null })
    expect(again.created).toBe(false)
    expect(again.businessId).toBe(repaired.businessId)
    expect(again.siteSlug).toBeNull()
    expect(await count('tenants')).toBe(tenantsBefore)
    expect(await count('memberships')).toBe(membershipsBefore)
  })
})

describe('admission returns the set of businesses', () => {
  it('test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'Corner Florist', endsAt: null })
    const grant = await env.DB.prepare('SELECT id FROM entitlements WHERE business_id = ?')
      .bind(invited.businessId)
      .first<{ id: string }>()

    const first = await admit(identityEnv(), email)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.businesses).toHaveLength(1)
    expect(first.businesses[0].businessId).toBe(invited.businessId)
    expect(first.businesses[0].name).toBe('Corner Florist')
    expect(first.businesses[0].entitlement?.id).toBe(grant?.id)

    // No singular account or grant beside the set.
    expect(Object.keys(first).sort()).toEqual(['businesses', 'ok', 'user'])
    expect(Object.keys(first)).not.toContain('accountId')
    expect(Object.keys(first)).not.toContain('businessId')
    expect(Object.keys(first)).not.toContain('entitlement')

    // Deterministic — with several businesses too, so the order is a real claim.
    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Second', email })
    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Third', email })
    const project = (r: Admission) =>
      r.ok ? r.businesses.map((b) => [b.businessId, b.name, b.entitlement?.id ?? null]) : null
    const a = project(await admit(identityEnv(), email))
    const b = project(await admit(identityEnv(), email))
    expect(a).toHaveLength(3)
    expect(b).toEqual(a)
  })

  it('test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant', async () => {
    const email = anEmail()
    const salon = await provisionInvite(identityEnv(), { email, accountName: 'Salon', plan: 'pro', endsAt: null })
    const studio = await provisionBusiness(identityEnv(), {
      accountUserId: salon.user.id,
      name: 'Studio',
      email,
      plan: 'starter',
    })

    const result = await admit(identityEnv(), email)
    const businesses = byId(result)
    expect(businesses.size).toBe(2)

    const s = businesses.get(salon.businessId)
    const t = businesses.get(studio.businessId)
    expect(s?.name).toBe('Salon')
    expect(t?.name).toBe('Studio')
    expect(s?.selectable).toBe(true)
    expect(t?.selectable).toBe(true)
    // Each grant belongs to its own business, and the two differ.
    expect(s?.entitlement?.business_id).toBe(salon.businessId)
    expect(t?.entitlement?.business_id).toBe(studio.businessId)
    expect(s?.entitlement?.plan).toBe('pro')
    expect(t?.entitlement?.plan).toBe('starter')
    expect(s?.entitlement?.id).not.toBe(t?.entitlement?.id)
  })

  it('test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted', async () => {
    const variants: Array<[string, 'ends_at' | 'starts_at' | 'status', () => string]> = [
      ['lapsed', 'ends_at', () => ISO(-1_000)],
      ['not started', 'starts_at', () => ISO(86_400_000)],
      ['revoked', 'status', () => 'revoked'],
    ]
    for (const [label, column, value] of variants) {
      const email = anEmail()
      const live = await provisionInvite(identityEnv(), { email, accountName: 'Live', endsAt: null })
      const dead = await provisionBusiness(identityEnv(), {
        accountUserId: live.user.id,
        name: 'Dead',
        email,
      })
      await setGrant(dead.businessId, column, value())

      const businesses = byId(await admit(identityEnv(), email))
      expect(businesses.size, `${label}: both businesses should be listed`).toBe(2)
      expect(businesses.get(dead.businessId)?.selectable, label).toBe(false)
      expect(businesses.get(dead.businessId)?.entitlement, label).toBeNull()
      expect(businesses.get(dead.businessId)?.name, label).toBe('Dead')
      expect(businesses.get(live.businessId)?.selectable, label).toBe(true)
      expect(businesses.get(live.businessId)?.entitlement?.business_id, label).toBe(live.businessId)
    }
  })

  it('test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list', async () => {
    const email = anEmail()
    const kept = await provisionInvite(identityEnv(), { email, accountName: 'Kept', endsAt: null })
    const withdrawn = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Withdrawn', email })
    const expired = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Expired', email })

    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE business_id = ?')
      .bind(new Date().toISOString(), withdrawn.businessId)
      .run()
    await env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE business_id = ?')
      .bind(ISO(-1_000), expired.businessId)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.businessId)).toEqual([kept.businessId])
    const names = result.businesses.map((b) => b.name)
    expect(names).not.toContain('Withdrawn')
    expect(names).not.toContain('Expired')

    // Their grants were never touched — exclusion is about the membership.
    expect(await grantStatus(withdrawn.businessId)).toBe('active')
    expect(await grantStatus(expired.businessId)).toBe('active')
  })
})

// AC1750 ("refused when every business has lapsed") is superseded by AC2112 —
// membership admits, entitlement does not. Its both-sides expiry evidence lives
// in `reconciliation-identity-business-lapse.workers.test.ts`.
describe('grant state is evaluated per business', () => {
  it('test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused', async () => {
    const email = anEmail()
    const scheduled = await provisionInvite(identityEnv(), { email, accountName: 'Scheduled', endsAt: null })
    await setGrant(scheduled.businessId, 'starts_at', ISO(86_400_000))

    // The person's only business: admitted, the business listed but unselectable.
    const alone = byId(await admit(identityEnv(), email))
    expect([...alone.keys()]).toEqual([scheduled.businessId])
    expect(alone.get(scheduled.businessId)?.selectable).toBe(false)
    expect(alone.get(scheduled.businessId)?.entitlement).toBeNull()
    expect(alone.get(scheduled.businessId)?.lapse).toEqual({ reason: 'not_yet', endedAt: null })

    const entitled = await provisionBusiness(identityEnv(), {
      accountUserId: scheduled.user.id,
      name: 'Entitled',
      email,
    })
    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.get(scheduled.businessId)?.selectable).toBe(false)
    expect(businesses.get(scheduled.businessId)?.entitlement).toBeNull()
    expect(businesses.get(entitled.businessId)?.selectable).toBe(true)
  })

  it('test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'Revoked', endsAt: null })
    await setGrant(invited.businessId, 'status', 'revoked')

    // No date was touched: the grant is still open-ended.
    const dates = await env.DB.prepare('SELECT starts_at, ends_at FROM entitlements WHERE business_id = ?')
      .bind(invited.businessId)
      .first<{ starts_at: string; ends_at: string | null }>()
    expect(dates?.ends_at).toBeNull()
    expect(dates!.starts_at <= new Date().toISOString()).toBe(true)

    // The person's only business: admitted, listed, unselectable, reason revoked.
    const alone = byId(await admit(identityEnv(), email))
    expect([...alone.keys()]).toEqual([invited.businessId])
    expect(alone.get(invited.businessId)?.selectable).toBe(false)
    expect(alone.get(invited.businessId)?.entitlement).toBeNull()
    expect(alone.get(invited.businessId)?.lapse).toEqual({ reason: 'revoked', endedAt: null })

    // It stays listed, unselectable, once another business is entitled.
    const other = await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Other', email })
    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.get(invited.businessId)?.selectable).toBe(false)
    expect(businesses.get(invited.businessId)?.entitlement).toBeNull()
    expect(businesses.get(other.businessId)?.selectable).toBe(true)
  })
})

describe('membership state excludes, grants untouched', () => {
  it('test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain', async () => {
    const withdrawals: Array<[string, string, () => string]> = [
      ['withdrawn', 'UPDATE memberships SET revoked_at = ? WHERE business_id = ?', () => new Date().toISOString()],
      ['not active', 'UPDATE memberships SET status = ? WHERE business_id = ?', () => 'suspended'],
      ['expired', 'UPDATE memberships SET expires_at = ? WHERE business_id = ?', () => ISO(-1_000)],
    ]

    for (const [label, sql, value] of withdrawals) {
      // Sole membership: refused on the membership, the grant still active.
      const email = anEmail()
      const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
      await env.DB.prepare(sql).bind(value(), invited.businessId).run()

      const refused = await admit(identityEnv(), email)
      expect(refused.ok, `${label}: still admitted`).toBe(false)
      expect(!refused.ok && refused.reason, `${label}: wrong reason`).toBe('no_membership')
      expect(await grantStatus(invited.businessId), `${label}: grant disturbed`).toBe('active')

      // Beside a live membership: that business is excluded, the person admitted.
      const other = anEmail()
      const kept = await provisionInvite(identityEnv(), { email: other, endsAt: null })
      const dropped = await provisionBusiness(identityEnv(), {
        accountUserId: kept.user.id,
        name: 'Dropped',
        email: other,
      })
      await env.DB.prepare(sql).bind(value(), dropped.businessId).run()
      const admitted = await admit(identityEnv(), other)
      expect(admitted.ok && admitted.businesses.map((b) => b.businessId), label).toEqual([kept.businessId])
      expect(await grantStatus(dropped.businessId), `${label}: grant disturbed`).toBe('active')
    }
  })
})
