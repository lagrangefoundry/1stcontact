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
 * when no business qualifies.
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
  return new Map((result.ok ? result.businesses : []).map((b) => [b.accountId, b]))
}

async function setGrant(accountId: string, column: 'ends_at' | 'starts_at' | 'status', value: string) {
  await env.DB.prepare(`UPDATE entitlements SET ${column} = ? WHERE account_id = ?`)
    .bind(value, accountId)
    .run()
}

async function grantStatus(accountId: string): Promise<string | undefined> {
  const row = await env.DB.prepare('SELECT status FROM entitlements WHERE account_id = ?')
    .bind(accountId)
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
      .bind(result.accountId)
      .first<{ name: string; status: string }>()
    expect(tenant).toEqual({ name: 'Harbour Bakery', status: 'active' })

    // The membership: joins THAT person to THAT business as owner, active.
    const membership = await env.DB.prepare(
      'SELECT account_id, role, status FROM memberships WHERE user_id = ?',
    )
      .bind(user!.id)
      .first<{ account_id: string; role: string; status: string }>()
    expect(membership).toEqual({ account_id: result.accountId, role: 'owner', status: 'active' })

    // The grant: against the same business, administrator-issued, active, with
    // a start, the end the caller supplied, and the address it was made to.
    const grant = await env.DB.prepare(
      'SELECT plan, source, status, starts_at, ends_at, email FROM entitlements WHERE account_id = ?',
    )
      .bind(result.accountId)
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
      .bind(plain.accountId)
      .first<{ name: string }>()
    expect(plainTenant?.name).toBe(unlabelled)
    const plainGrant = await env.DB.prepare('SELECT ends_at FROM entitlements WHERE account_id = ?')
      .bind(plain.accountId)
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

    const shapeOf = async (accountId: string) => ({
      tenant: await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
        .bind(accountId)
        .first(),
      membership: await env.DB.prepare(
        'SELECT user_id, role, status, granted_by FROM memberships WHERE account_id = ?',
      )
        .bind(accountId)
        .first(),
      grant: await env.DB.prepare(
        'SELECT email, plan, source, status, starts_at, ends_at, granted_by, note FROM entitlements ' +
          'WHERE account_id = ?',
      )
        .bind(accountId)
        .first(),
    })

    const invitedShape = await shapeOf(invited.accountId)
    const addedShape = await shapeOf(added.accountId)
    // Not vacuous: each side really holds every row.
    expect(invitedShape.tenant).toEqual({ status: 'active' })
    expect(invitedShape.membership).toMatchObject({ role: 'owner', status: 'active' })
    expect(invitedShape.grant).toMatchObject({ source: 'admin_grant', status: 'active' })
    expect(addedShape).toEqual(invitedShape)

    // Names and identifiers are the only per-business differences.
    expect(added.accountId).not.toBe(invited.accountId)
    const names = await env.DB.prepare('SELECT id, name FROM tenants WHERE id IN (?, ?)')
      .bind(invited.accountId, added.accountId)
      .all<{ id: string; name: string }>()
    expect(new Map((names.results ?? []).map((r) => [r.id, r.name]))).toEqual(
      new Map([
        [invited.accountId, 'First'],
        [added.accountId, 'Second'],
      ]),
    )

    // The additional business is immediately operable: listed selectable, and
    // its starter site readable through the ordinary site-storage port.
    const admitted = byId(await admit(identityEnv(), email))
    expect(admitted.get(added.accountId)?.selectable).toBe(true)
    const store = await d1r2SiteStore(identityEnv()).forTenant(added.accountId)
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
    expect(admitted.ok && admitted.businesses.map((b) => [b.accountId, b.selectable])).toEqual([
      [repaired.accountId, true],
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
    expect(again.accountId).toBe(repaired.accountId)
    expect(again.siteSlug).toBeNull()
    expect(await count('tenants')).toBe(tenantsBefore)
    expect(await count('memberships')).toBe(membershipsBefore)
  })
})

describe('admission returns the set of businesses', () => {
  it('test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'Corner Florist', endsAt: null })
    const grant = await env.DB.prepare('SELECT id FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ id: string }>()

    const first = await admit(identityEnv(), email)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.businesses).toHaveLength(1)
    expect(first.businesses[0].accountId).toBe(invited.accountId)
    expect(first.businesses[0].name).toBe('Corner Florist')
    expect(first.businesses[0].entitlement?.id).toBe(grant?.id)

    // No singular account or grant beside the set.
    expect(Object.keys(first)).not.toContain('accountId')
    expect(Object.keys(first)).not.toContain('entitlement')

    // Deterministic — with several businesses too, so the order is a real claim.
    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Second', email })
    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Third', email })
    const project = (r: Admission) =>
      r.ok ? r.businesses.map((b) => [b.accountId, b.name, b.entitlement?.id ?? null]) : null
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

    const s = businesses.get(salon.accountId)
    const t = businesses.get(studio.accountId)
    expect(s?.name).toBe('Salon')
    expect(t?.name).toBe('Studio')
    expect(s?.selectable).toBe(true)
    expect(t?.selectable).toBe(true)
    // Each grant belongs to its own business, and the two differ.
    expect(s?.entitlement?.account_id).toBe(salon.accountId)
    expect(t?.entitlement?.account_id).toBe(studio.accountId)
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
      await setGrant(dead.accountId, column, value())

      const businesses = byId(await admit(identityEnv(), email))
      expect(businesses.size, `${label}: both businesses should be listed`).toBe(2)
      expect(businesses.get(dead.accountId)?.selectable, label).toBe(false)
      expect(businesses.get(dead.accountId)?.entitlement, label).toBeNull()
      expect(businesses.get(dead.accountId)?.name, label).toBe('Dead')
      expect(businesses.get(live.accountId)?.selectable, label).toBe(true)
      expect(businesses.get(live.accountId)?.entitlement?.account_id, label).toBe(live.accountId)
    }
  })

  it('test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list', async () => {
    const email = anEmail()
    const kept = await provisionInvite(identityEnv(), { email, accountName: 'Kept', endsAt: null })
    const withdrawn = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Withdrawn', email })
    const expired = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Expired', email })

    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE account_id = ?')
      .bind(new Date().toISOString(), withdrawn.accountId)
      .run()
    await env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE account_id = ?')
      .bind(ISO(-1_000), expired.accountId)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.accountId)).toEqual([kept.accountId])
    const names = result.businesses.map((b) => b.name)
    expect(names).not.toContain('Withdrawn')
    expect(names).not.toContain('Expired')

    // Their grants were never touched — exclusion is about the membership.
    expect(await grantStatus(withdrawn.accountId)).toBe('active')
    expect(await grantStatus(expired.accountId)).toBe('active')
  })
})

describe('grant state is evaluated per business', () => {
  it('test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed', async () => {
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, accountName: 'First', endsAt: ISO(86_400_000) })

    // Not yet ended: admitted, selectable, reporting that grant.
    const live = byId(await admit(identityEnv(), email))
    expect(live.get(first.accountId)?.selectable).toBe(true)
    expect(live.get(first.accountId)?.entitlement?.account_id).toBe(first.accountId)

    // Ended, and the person's only business: refused on the entitlement.
    await setGrant(first.accountId, 'ends_at', ISO(-1_000))
    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')

    // Beside an open-ended business the lapsed one is listed unselectable with
    // no grant, and the person is admitted — open-ended never expires.
    const second = await provisionBusiness(identityEnv(), { accountUserId: first.user.id, name: 'Second', email })
    const mixed = byId(await admit(identityEnv(), email))
    expect(mixed.get(first.accountId)?.selectable).toBe(false)
    expect(mixed.get(first.accountId)?.entitlement).toBeNull()
    expect(mixed.get(second.accountId)?.selectable).toBe(true)
    expect(mixed.get(second.accountId)?.entitlement?.ends_at).toBeNull()

    // Both lapsed: refused — so a stop-at-the-first implementation cannot pass.
    await setGrant(second.accountId, 'ends_at', ISO(-1_000))
    const allLapsed = await admit(identityEnv(), email)
    expect(allLapsed.ok).toBe(false)
    expect(!allLapsed.ok && allLapsed.reason).toBe('no_entitlement')
  })

  it('test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused', async () => {
    const email = anEmail()
    const scheduled = await provisionInvite(identityEnv(), { email, accountName: 'Scheduled', endsAt: null })
    await setGrant(scheduled.accountId, 'starts_at', ISO(86_400_000))

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')

    const entitled = await provisionBusiness(identityEnv(), {
      accountUserId: scheduled.user.id,
      name: 'Entitled',
      email,
    })
    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.get(scheduled.accountId)?.selectable).toBe(false)
    expect(businesses.get(scheduled.accountId)?.entitlement).toBeNull()
    expect(businesses.get(entitled.accountId)?.selectable).toBe(true)
  })

  it('test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'Revoked', endsAt: null })
    await setGrant(invited.accountId, 'status', 'revoked')

    // No date was touched: the grant is still open-ended.
    const dates = await env.DB.prepare('SELECT starts_at, ends_at FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ starts_at: string; ends_at: string | null }>()
    expect(dates?.ends_at).toBeNull()
    expect(dates!.starts_at <= new Date().toISOString()).toBe(true)

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')

    // It stays listed, unselectable, once another business is entitled.
    const other = await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Other', email })
    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.get(invited.accountId)?.selectable).toBe(false)
    expect(businesses.get(invited.accountId)?.entitlement).toBeNull()
    expect(businesses.get(other.accountId)?.selectable).toBe(true)
  })
})

describe('membership state excludes, grants untouched', () => {
  it('test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain', async () => {
    const withdrawals: Array<[string, string, () => string]> = [
      ['withdrawn', 'UPDATE memberships SET revoked_at = ? WHERE account_id = ?', () => new Date().toISOString()],
      ['not active', 'UPDATE memberships SET status = ? WHERE account_id = ?', () => 'suspended'],
      ['expired', 'UPDATE memberships SET expires_at = ? WHERE account_id = ?', () => ISO(-1_000)],
    ]

    for (const [label, sql, value] of withdrawals) {
      // Sole membership: refused on the membership, the grant still active.
      const email = anEmail()
      const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
      await env.DB.prepare(sql).bind(value(), invited.accountId).run()

      const refused = await admit(identityEnv(), email)
      expect(refused.ok, `${label}: still admitted`).toBe(false)
      expect(!refused.ok && refused.reason, `${label}: wrong reason`).toBe('no_membership')
      expect(await grantStatus(invited.accountId), `${label}: grant disturbed`).toBe('active')

      // Beside a live membership: that business is excluded, the person admitted.
      const other = anEmail()
      const kept = await provisionInvite(identityEnv(), { email: other, endsAt: null })
      const dropped = await provisionBusiness(identityEnv(), {
        accountUserId: kept.user.id,
        name: 'Dropped',
        email: other,
      })
      await env.DB.prepare(sql).bind(value(), dropped.accountId).run()
      const admitted = await admit(identityEnv(), other)
      expect(admitted.ok && admitted.businesses.map((b) => b.accountId), label).toEqual([kept.accountId])
      expect(await grantStatus(dropped.accountId), `${label}: grant disturbed`).toBe('active')
    }
  })
})
