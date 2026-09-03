import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  provisionBusiness,
  provisionInvite,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-178 — **an account operates several businesses, not one** ([[DOC-40]] §2).
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database with the deployed schema applied from `db/migrations`, and every
 * business is provisioned through the shipped entry points rather than seeded by
 * hand — so what is proved is what an invite and a second business actually
 * write, not a fixture's idea of them.
 *
 * THE CLAIM THIS FILE EXISTS FOR. A lapsed grant used to refuse the PERSON.
 * With several businesses that is a lockout: an account whose second business
 * expired loses the first one too. `ok` is now a property of the person and
 * access is a property of the business, and the two cases that separate those —
 * one lapsed among several, and every one lapsed — are driven from both sides
 * here against dates the test sets rather than against the clock.
 */

const PLATFORM = 'req178-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `req178-${(seq += 1)}@example.test`

/** Push a business's grant into the past — the "card expired" shape. */
async function lapse(accountId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), accountId)
    .run()
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-178 — admission returns the set', () => {
  it('test_UAT_FC_REQ-178_an_account_with_two_businesses_is_admitted_to_both', async () => {
    // The plainest form of the acceptance: one person, two businesses, and an
    // admission that names both — each with its own grant and its own
    // `tenants.name`, because the id is deliberately opaque and a switcher has
    // nothing else to label a row with.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, accountName: 'Salon', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Studio',
      email,
    })

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.businesses.map((b) => b.businessId).sort()).toEqual(
      [first.businessId, second.businessId].sort(),
    )
    expect(result.businesses.map((b) => b.name).sort()).toEqual(['Salon', 'Studio'])
    // Each grant belongs to the business it was made against — the meter is per
    // business even though the invoice is per account ([[DOC-40]] §5).
    for (const business of result.businesses) {
      expect(business.entitlement, `${business.name} carried no grant`).toBeTruthy()
      expect(business.entitlement?.account_id).toBe(business.businessId)
      expect(business.selectable).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-178_admission_carries_no_singular_account_id', async () => {
    // The failure this guards is one call site left behind: a caller reading a
    // singular id off the admission would serve whichever business sorted first
    // to a person who had selected the second — plausible, silent and wrong. The
    // field is DELETED rather than kept beside the list, so the observable claim
    // is that the key is not there at all.
    const email = anEmail()
    await provisionInvite(identityEnv(), { email, endsAt: null })

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    expect(Object.keys(result)).not.toContain('accountId')
    expect(Object.keys(result)).not.toContain('entitlement')
    expect(Object.keys(result)).toContain('businesses')
  })
})

describe('REQ-178 — denial is per business', () => {
  it('test_UAT_FC_REQ-178_one_lapsed_business_does_not_refuse_the_person', async () => {
    // The behaviour change. Before this ticket a single expired grant refused
    // the person outright, so an account whose second business lapsed could not
    // reach the first one either.
    const email = anEmail()
    const live = await provisionInvite(identityEnv(), { email, accountName: 'Live', endsAt: null })
    const dead = await provisionBusiness(identityEnv(), {
      accountUserId: live.user.id,
      name: 'Lapsed',
      email,
    })
    await lapse(dead.businessId)

    const result = await admit(identityEnv(), email)
    expect(result.ok, 'a lapsed second business refused the whole person').toBe(true)
    if (!result.ok) return

    // The lapsed business is PRESENT and marked, not dropped. A business that
    // simply vanishes from the switcher is indistinguishable from one that was
    // deleted, which is the wrong thing to tell someone whose card expired.
    const byId = new Map(result.businesses.map((b) => [b.businessId, b]))
    expect(byId.get(dead.businessId), 'the lapsed business vanished').toBeTruthy()
    expect(byId.get(dead.businessId)?.selectable).toBe(false)
    expect(byId.get(dead.businessId)?.entitlement).toBeNull()
    expect(byId.get(dead.businessId)?.name).toBe('Lapsed')

    expect(byId.get(live.businessId)?.selectable).toBe(true)
  })

  it('test_UAT_FC_REQ-178_every_business_lapsed_is_refused_with_no_entitlement', async () => {
    // `no_entitlement` keeps its meaning at the ACCOUNT level: none of them, not
    // this one. Driven with two businesses rather than one, because with one the
    // assertion would pass on code that never looked past the first.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Second',
      email,
    })
    await lapse(first.businessId)
    await lapse(second.businessId)

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_entitlement')
  })

  it('test_UAT_FC_REQ-178_a_revoked_or_expired_membership_excludes_its_business', async () => {
    // Revoked and expired exclude ENTIRELY rather than marking unselectable: a
    // withdrawn membership is not a lapsed grant, and listing it would tell a
    // former employee which businesses they used to be able to reach. Both
    // columns are driven, because checking only one makes the other decorative.
    const email = anEmail()
    const kept = await provisionInvite(identityEnv(), { email, accountName: 'Kept', endsAt: null })
    const revoked = await provisionBusiness(identityEnv(), {
      accountUserId: kept.user.id,
      name: 'Revoked',
      email,
    })
    const expired = await provisionBusiness(identityEnv(), {
      accountUserId: kept.user.id,
      name: 'Expired',
      email,
    })

    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE account_id = ?')
      .bind(new Date().toISOString(), revoked.businessId)
      .run()
    await env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE account_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), expired.businessId)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.businessId)).toEqual([kept.businessId])
  })

  it('test_UAT_FC_REQ-178_person_level_refusals_are_decided_before_any_business', async () => {
    // `no_email`, `no_user` and `user_inactive` are about the PERSON and keep
    // their precedence: a suspended person holding a perfectly live business is
    // still refused, and refused as `user_inactive` rather than as anything
    // about their businesses.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?')
      .bind('suspended', invited.user.id)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('user_inactive')
  })
})

describe('REQ-178 — provisioning a second business', () => {
  it('test_UAT_FC_REQ-178_invite_and_provision_business_write_the_same_shape', async () => {
    // The two paths must not drift into provisioning differently-shaped
    // businesses, so the shapes are COMPARED rather than each asserted against a
    // separate expectation that could be edited apart. Read back out of D1,
    // because a function reporting what it meant to write would pass having
    // written nothing.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), {
      email,
      accountName: 'By invite',
      plan: 'pro',
      endsAt: null,
      grantedBy: 'operator',
      note: 'first',
    })
    const added = await provisionBusiness(identityEnv(), {
      accountUserId: invited.user.id,
      name: 'By invite',
      email,
      plan: 'pro',
      endsAt: null,
      grantedBy: 'operator',
      note: 'first',
    })

    const shapeOf = async (accountId: string) => {
      const tenant = await env.DB.prepare('SELECT name, status FROM tenants WHERE id = ?')
        .bind(accountId)
        .first<{ name: string; status: string }>()
      const membership = await env.DB.prepare(
        'SELECT user_id, role, status FROM memberships WHERE account_id = ?',
      )
        .bind(accountId)
        .first<{ user_id: string; role: string; status: string }>()
      const grant = await env.DB.prepare(
        'SELECT email, plan, source, status, ends_at, granted_by, note FROM entitlements ' +
          'WHERE account_id = ?',
      )
        .bind(accountId)
        .first<Record<string, unknown>>()
      const page = await env.DB.prepare(
        'SELECT name FROM site_pages WHERE tenant_id = ? AND slug = ? ORDER BY name',
      )
        .bind(accountId, accountId)
        .first<{ name: string }>()
      return { tenant, membership, grant, page }
    }

    expect(await shapeOf(added.businessId)).toEqual(await shapeOf(invited.businessId))

    // And the pieces that are per-business by construction still differ, so the
    // comparison above is not passing because both sides are empty.
    expect(added.businessId).not.toBe(invited.businessId)
    expect(added.siteSlug).toBe(added.businessId)
  })

  it('test_UAT_FC_REQ-178_a_second_business_is_immediately_operable', async () => {
    // A business is not provisioned until a person may operate it, it carries
    // access, and there is something to edit. Asserted through `admit` rather
    // than through the return value, because admission is what a login actually
    // asks.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    const added = await provisionBusiness(identityEnv(), {
      accountUserId: invited.user.id,
      name: 'Second',
      email,
    })

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    const business = result.ok
      ? result.businesses.find((b) => b.businessId === added.businessId)
      : undefined
    expect(business?.selectable).toBe(true)
    expect(business?.name).toBe('Second')

    const page = await env.DB.prepare(
      'SELECT name FROM site_pages WHERE tenant_id = ? AND slug = ?',
    )
      .bind(added.businessId, added.siteSlug)
      .first<{ name: string }>()
    expect(page?.name).toBe('home.json')
  })

  it('test_UAT_FC_REQ-178_a_business_needs_an_account_and_a_name', async () => {
    // Both refusals are stated rather than left to a foreign-key that D1 does
    // not enforce here: a membership pointing at nobody, or a business labelled
    // with the empty string, is a row that cannot be repaired from the outside.
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: '  ', name: 'Nameless owner' }),
    ).rejects.toThrow(/account/i)
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: '   ' }),
    ).rejects.toThrow(/name/i)
  })

  it('test_UAT_FC_REQ-178_re_inviting_someone_with_no_business_provisions_one', async () => {
    // The repair the provisioning split makes available. The user row is written
    // before the batch that makes a business operable, so a failure between them
    // leaves a person refused `no_membership`. Re-inviting them completes the
    // account rather than refusing as "already exists" — it is not a second
    // account, because the account is the person and the person already existed.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('DELETE FROM memberships WHERE user_id = ?').bind(invited.user.id).run()
    expect((await admit(identityEnv(), email)).ok).toBe(false)

    const again = await provisionInvite(identityEnv(), { email, endsAt: null })
    expect(again.created, 'the person was created a second time').toBe(false)
    expect(again.businessId).not.toBe(invited.businessId)
    expect(again.siteSlug).toBe(again.businessId)

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    expect(result.ok && result.businesses.map((b) => b.businessId)).toEqual([again.businessId])
  })
})
