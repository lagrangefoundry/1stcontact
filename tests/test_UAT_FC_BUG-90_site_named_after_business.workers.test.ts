import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import {
  businessSiteName,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * BUG-90 — **a business's one site is named after the business.**
 *
 * THE SYMPTOM WAS A SWITCH THAT DID NOT SWITCH. In the Site tab, moving the
 * business selector from one business to another left what looked like the
 * previous business's site on screen. The builder remembers the operator's
 * selected slug and keeps it across a business change when the business being
 * entered also holds a site under that slug — which is right for a reload and
 * wrong for a switch, because a slug is unique only inside its own business.
 *
 * THE REASON IT FIRED ON ALMOST EVERY SWITCH was that every business provisioned
 * carried a site under one fixed word, `unnamed` ([[REQ-190]]). Two businesses
 * could not help colliding. Naming the site after the business removes the
 * collision at its source: two sites share a name only if two businesses do.
 *
 * IT SUPERSEDES A DECISION [[REQ-190]] MADE ON PURPOSE, and the supersession is
 * asserted in that ticket's own suite rather than only here — see
 * `test_UAT_FC_BUG-90_a_new_account_finds_its_one_site_named_after_the_business`,
 * which sits where the opposite claim used to. REQ-190 argued the business's
 * name was the wrong name for a site because "an account will own several"; a
 * business holds exactly one site for now, so there is no second site for the
 * name to be wrong for.
 *
 * WHAT THIS FILE ADDS is the derivation itself and the provisioning path end to
 * end: what a business's name yields, what happens when it yields nothing, and
 * what the site says about itself once written.
 */

const PLATFORM = 'bug90-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ...overrides,
  }
}

let seq = 0
const anEmail = (): string => `bug90-${(seq += 1)}@example.test`

const root = () => d1r2SiteStore({ DB: env.DB, SITES: env.SITES })

/** A business, provisioned through the shipped path, plus a handle on it. */
async function aBusiness(name: string): Promise<{
  businessId: string
  siteSlug: string
  store: TenantSiteStore
}> {
  const invited = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: name,
    endsAt: null,
  })
  return {
    businessId: invited.businessId,
    siteSlug: invited.siteSlug!,
    store: await root().forTenant(invited.businessId),
  }
}

type SiteConfig = { id?: string; config?: { businessName?: string; tagline?: string } }

beforeAll(async () => {
  await applySchema(env.DB as D1Database)
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
  )
    .bind(PLATFORM, 'BUG-90 platform', new Date(0).toISOString())
    .run()
})

describe('BUG-90 — the name a business gives its site', () => {
  it('test_UAT_FC_BUG-90_provisioning_names_the_site_after_the_business', async () => {
    // THE WORKED EXAMPLE FROM THE TICKET. A business called `Gigabyte Alchemy`
    // gets one site called `gigabytealchemy` — and the site introduces itself
    // with the business's name as ENTERED, not with the squashed form the
    // address uses. Both are asserted because an operator meets the site twice:
    // once in a URL and once in a rendered `<title>`.
    const made = await aBusiness('Gigabyte Alchemy')
    expect(made.siteSlug).toBe('gigabytealchemy')

    const site = (await made.store.readSiteJson('gigabytealchemy')) as SiteConfig | null
    expect(site, 'the starter site was not written').not.toBeNull()
    expect(site!.config?.businessName).toBe('Gigabyte Alchemy')

    // THE DEFINITION'S OWN `id` MATCHES THE SLUG. It is a second copy of the
    // name and nothing reads it, which is exactly why it is asserted: a copy
    // nobody checks is a copy that drifts.
    expect(site!.id).toBe('gigabytealchemy')

    // AND THE TAGLINE NAMES THE BUSINESS THE SAME WAY — it is prose, so it gets
    // the prose form.
    expect(site!.config?.tagline).toBe('Gigabyte Alchemy — built with 1st Contact')
  })

  it('test_UAT_FC_BUG-90_the_derived_name_keeps_letters_and_digits_in_any_script', async () => {
    // THE DERIVATION, STATED ONCE. Lowercased, with every character that is not
    // a letter or a digit REMOVED rather than hyphenated — which is what the
    // sites that already existed when this bug was filed are called, so applying
    // the rule to them renames nothing to a form nobody has ever typed.
    expect(businessSiteName('1st Contact', 'biz_x')).toBe('1stcontact')
    expect(businessSiteName('Gigabyte Alchemy', 'biz_x')).toBe('gigabytealchemy')
    expect(businessSiteName('XGD', 'biz_x')).toBe('xgd')
    expect(businessSiteName('Lagrange Foundry', 'biz_x')).toBe('lagrangefoundry')
    expect(businessSiteName("Cole's Bakery", 'biz_x')).toBe('colesbakery')

    // UNICODE LETTERS AND DIGITS COUNT, so a business named outside ASCII gets
    // its own name back rather than falling through to the id. A slug reaches a
    // URL path segment, which carries non-ASCII perfectly well once encoded.
    expect(businessSiteName('Ωμέγα', 'biz_x')).toBe('ωμέγα')
    expect(businessSiteName('東京デザイン', 'biz_x')).toBe('東京デザイン')
  })

  it('test_UAT_FC_BUG-90_a_name_that_derives_nothing_falls_back_to_the_business_id', async () => {
    // A NAME MADE ENTIRELY OF PUNCTUATION DERIVES THE EMPTY STRING, and a site
    // with no name cannot be addressed at all — so provisioning would fail at
    // its last step, having already written the tenant, the membership and the
    // grant. The id is ugly and it is REACHABLE, which is the right trade for a
    // case that should not occur: the operator renames it, exactly as they would
    // have renamed `unnamed`.
    expect(businessSiteName('!!! ***', 'biz_fallback')).toBe('biz_fallback')

    const odd = await aBusiness('!!! ***')
    expect(odd.siteSlug).toBe(odd.businessId)
    expect(await odd.store.siteKey(odd.businessId)).not.toBeNull()
  })

  it('test_UAT_FC_BUG-90_no_business_is_provisioned_under_the_word_unnamed', async () => {
    // THE WORD IS GONE FROM PROVISIONING ENTIRELY. Asserted over the STORE and
    // not over a constant, because the constant it would have compared against
    // has been deleted — and asserted for a business whose name has nothing to
    // do with the word, which is the case that used to produce it.
    const fresh = await aBusiness('Felix Test')
    expect(fresh.siteSlug).toBe('felixtest')
    expect(await fresh.store.siteKey('unnamed')).toBeNull()
    expect(await fresh.store.slugs()).toEqual(['felixtest'])

    const site = (await fresh.store.readSiteJson('felixtest')) as SiteConfig | null
    expect(site!.config?.businessName).toBe('Felix Test')
    expect(JSON.stringify(site)).not.toContain('Unnamed')
  })

  it('test_UAT_FC_BUG-90_two_businesses_named_the_same_each_get_their_own_site', async () => {
    // THE COLLISION THAT REMAINS, AND IS LEGAL. Removing the fixed word does not
    // make two sites with one name impossible — it makes them require two
    // businesses that chose the same name. The slug is unique per business, so
    // both are provisioned, both are addressable, and neither can see the other.
    //
    // THIS IS THE CASE THE BUILDER'S REMEMBERED-SLUG CARRY WOULD STILL MISREAD,
    // and the ticket says so: with one site per business the carry cannot pick
    // the wrong row, because a business's only site is also the row the fallback
    // would choose. It becomes reachable again when a business holds two sites,
    // which is when the site selector lands.
    const first = await aBusiness('Bakery')
    const second = await aBusiness('Bakery')

    expect(first.siteSlug).toBe('bakery')
    expect(second.siteSlug).toBe('bakery')
    expect(first.businessId).not.toBe(second.businessId)
    expect(await first.store.siteKey('bakery')).not.toBe(await second.store.siteKey('bakery'))
  })

  it('test_UAT_FC_BUG-90_a_business_added_by_an_operator_is_named_the_same_way', async () => {
    // EVERY ENTRY POINT ONTO `provisionBusiness`, not just the invite. A business
    // an operator adds and a business an invite creates must be indistinguishable
    // afterwards ([[REQ-178]]), and the site's name is part of what that means —
    // so this asserts the rule through the second door rather than assuming the
    // one function is reached the same way twice.
    const invited = await inviteAccount(identityEnv(), {
      email: anEmail(),
      accountName: 'First Business',
      endsAt: null,
    })
    const added = await provisionBusiness(identityEnv(), {
      accountId: invited.user.account_id,
      name: 'Second Business',
    })

    expect(added.siteSlug).toBe('secondbusiness')
    const store = await root().forTenant(added.businessId)
    const site = (await store.readSiteJson('secondbusiness')) as SiteConfig | null
    expect(site!.config?.businessName).toBe('Second Business')
  })
})
