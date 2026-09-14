import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { provisionBusiness, type IdentityEnv } from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-236 — **provisioning mints a site key, and derives nothing from the name.**
 *
 * THIS FILE WAS [[BUG-90]]'s AND THE SUPERSESSION IS THE POINT OF THE RENAME.
 * BUG-90 answered a switch that did not switch: every business provisioned
 * carried a site under one fixed word, `unnamed`, so two businesses could not
 * help colliding, and its fix was to derive the site's name from the business's
 * — `Gigabyte Alchemy` yielding `gigabytealchemy`. That removed the collision by
 * making the name carry the business.
 *
 * [[REQ-236]] REMOVES THE NAME INSTEAD, which is the same cure applied one level
 * down: a site is addressed by its KEY, 128 minted bits, so there is nothing to
 * collide and nothing to derive. `businessSiteName` is deleted rather than
 * relaxed, and with it the fallback-to-business-id case that existed only
 * because a derivation could yield the empty string.
 *
 * WHAT SURVIVES FROM BUG-90 UNCHANGED, and is asserted below because REQ-236
 * must not quietly take it away: the site introduces itself with the business's
 * name AS ENTERED, two businesses each get their own site and neither can see
 * the other, and both doors onto `provisionBusiness` behave identically.
 *
 * WHAT REQ-236 ADDS is the property the whole ticket exists for — a key is
 * minted, not derived, so nothing about the business's name reaches the site's
 * address, and renaming the business cannot move it.
 */

const PLATFORM = 'req236-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ...overrides,
  }
}

let seq = 0
const anEmail = (): string => `req236-${(seq += 1)}@example.test`

const root = () => d1r2SiteStore({ DB: env.DB, SITES: env.SITES })

/** A business, provisioned through the shipped path, plus a handle on it. */
async function aBusiness(name: string): Promise<{
  businessId: string
  siteKey: string
  store: TenantSiteStore
}> {
  const invited = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: name,
    endsAt: null,
  })
  return {
    businessId: invited.businessId,
    siteKey: invited.siteKey!,
    store: await root().forTenant(invited.businessId),
  }
}

type SiteConfig = { id?: string; config?: { businessName?: string; tagline?: string } }

beforeAll(async () => {
  await applySchema()
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
  )
    .bind(PLATFORM, 'REQ-236 platform', new Date(0).toISOString())
    .run()
})

describe('REQ-236 — what provisioning names a site', () => {
  it('test_UAT_FC_REQ-236_provisioning_mints_a_key_and_derives_nothing_from_the_name', async () => {
    // THE WORKED EXAMPLE FROM BUG-90, ANSWERED THE OTHER WAY. A business called
    // `Gigabyte Alchemy` still gets exactly one site, and that site still
    // introduces itself with the business's name as ENTERED — but its ADDRESS
    // says nothing about the business at all.
    const made = await aBusiness('Gigabyte Alchemy')

    // NOT `gigabytealchemy`, AND NOT ANY FUNCTION OF THE NAME. Asserted as an
    // absence rather than against a format, because the property REQ-236 wants
    // is "the name did not reach this", not "the key looks like this".
    expect(made.siteKey).not.toContain('gigabytealchemy')
    expect(made.siteKey.toLowerCase()).not.toContain('alchemy')

    // AND IT IS THE KEY THE STORE ITSELF HANDS OUT — the one enumeration that
    // can produce one, so a caller has no other way to learn it.
    expect(await made.store.siteKeys('site')).toEqual([made.siteKey])

    const site = (await made.store.readSiteJson(made.siteKey)) as SiteConfig | null
    expect(site, 'the starter site was not written').not.toBeNull()
    expect(site!.config?.businessName).toBe('Gigabyte Alchemy')

    // THE TAGLINE NAMES THE BUSINESS IN PROSE, which is the half of BUG-90 that
    // was always about content rather than address and is untouched.
    expect(site!.config?.tagline).toBe('Gigabyte Alchemy — built with 1st Contact')
  })

  it('test_UAT_FC_REQ-236_a_name_that_derives_nothing_is_no_longer_a_case', async () => {
    // BUG-90 HAD TO ANSWER THIS AND REQ-236 DISSOLVES IT. A business named
    // entirely of punctuation derived the empty string, and a site with no name
    // could not be addressed — so provisioning fell back to the business id, an
    // ugly address chosen because it was at least reachable.
    //
    // With nothing derived there is no empty string to fall back FROM. The case
    // is asserted as ORDINARY: the odd name provisions exactly like any other.
    const odd = await aBusiness('!!! ***')
    expect(odd.siteKey).not.toBe(odd.businessId)
    expect(await odd.store.siteKeys('site')).toEqual([odd.siteKey])
    expect(await odd.store.hasDraft(odd.siteKey)).toBe(true)
  })

  it('test_UAT_FC_REQ-236_no_business_is_provisioned_under_the_word_unnamed', async () => {
    // THE WORD IS STILL GONE, and this still earns its place: `unnamed` was
    // REQ-190's deliberate starter name and the thing BUG-90 was filed about, so
    // its absence is asserted rather than assumed. Over the STORE and the
    // written definition, because there is no constant left to compare against.
    const fresh = await aBusiness('Felix Test')
    const keys = await fresh.store.siteKeys()
    expect(keys).toEqual([fresh.siteKey])
    expect(keys).not.toContain('unnamed')

    const site = (await fresh.store.readSiteJson(fresh.siteKey)) as SiteConfig | null
    expect(site!.config?.businessName).toBe('Felix Test')
    expect(JSON.stringify(site)).not.toContain('Unnamed')
  })

  it('test_UAT_FC_REQ-236_two_businesses_named_the_same_each_get_their_own_site', async () => {
    // BUG-90's LAST COLLISION, NOW IMPOSSIBLE RATHER THAN MERELY LEGAL. Two
    // businesses that chose the same name used to get two sites sharing one
    // slug — fine, because a slug was unique only inside its business, but still
    // the case the builder's remembered-slug carry could misread. Two minted
    // keys cannot coincide, so there is no shared name left to carry.
    const first = await aBusiness('Bakery')
    const second = await aBusiness('Bakery')

    expect(first.businessId).not.toBe(second.businessId)
    expect(first.siteKey).not.toBe(second.siteKey)

    // AND NEITHER BUSINESS CAN SEE THE OTHER'S — the barrier REQ-190 moved into
    // the key, restated over the verb that now hands keys out.
    expect(await first.store.siteKeys()).toEqual([first.siteKey])
    expect(await second.store.siteKeys()).toEqual([second.siteKey])
    expect(await first.store.hasDraft(second.siteKey)).toBe(false)
  })

  it('test_UAT_FC_REQ-236_a_business_added_by_an_operator_is_provisioned_the_same_way', async () => {
    // EVERY ENTRY POINT ONTO `provisionBusiness`, not just the invite. A business
    // an operator adds and a business an invite creates must be indistinguishable
    // afterwards ([[REQ-178]]) — so this asserts the rule through the second door
    // rather than assuming the one function is reached the same way twice.
    const invited = await inviteAccount(identityEnv(), {
      email: anEmail(),
      accountName: 'First Business',
      endsAt: null,
    })
    const added = await provisionBusiness(identityEnv(), {
      accountId: invited.user.account_id,
      name: 'Second Business',
    })

    expect(added.siteKey).not.toContain('secondbusiness')
    const store = await root().forTenant(added.businessId)
    expect(await store.siteKeys('site')).toEqual([added.siteKey])

    const site = (await store.readSiteJson(added.siteKey)) as SiteConfig | null
    expect(site!.config?.businessName).toBe('Second Business')
  })
})
