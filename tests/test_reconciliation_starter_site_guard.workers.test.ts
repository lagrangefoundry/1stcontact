import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import {
  provisionBusiness,
  STARTER_HEADING,
  STARTER_SLUG,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema, tenantStore } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { siteSeed } from './support/site-seed'

/**
 * story-fde7370b — **provisioning seeds a starter site only when it created one.**
 *
 * Runs inside workerd against the real D1 and R2 with the baseline applied,
 * through the shipped entry points: the store's own `createDraft`, and
 * `provisionBusiness`, which is what both the add-a-business route and the
 * invite fixture call. Since REQ-190 the starter slug is the fixed word
 * `unnamed` and a slug is unique only within its business, so the collision
 * `createStarterSite` guards against is a business that already holds a site
 * called `unnamed`. A freshly minted business key is 16 random bytes, so that
 * is not reachable by chance — the one thing pinned here is that randomness:
 * the first `getRandomValues` call `provisionBusiness` makes (minting the
 * business key) is answered with bytes the test chose, and an authored site is
 * placed at `unnamed` under that key beforehand. Nothing inside the product is
 * replaced.
 */

const PLATFORM = 'starter-guard-platform'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

let seq = 0
const anEmail = (): string => `starter-guard-${(seq += 1)}@example.test`

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('story-fde7370b — createDraft reports creation, and provisioning respects it', () => {
  it('test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug', async () => {
    const tenant = `acct_${crypto.randomUUID().replace(/-/g, '')}`
    const store = await tenantStore(tenant)
    const slug = `draft-${(seq += 1)}`
    expect(await store.createDraft(slug)).toBe(true)
    const versionAfterCreate = await store.version(slug)
    expect(await store.createDraft(slug)).toBe(false)
    expect(await store.version(slug)).toBe(versionAfterCreate)
  })

  it('test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged', async () => {
    const owner = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Owner', endsAt: null })

    // The key provisioning will mint, chosen in advance.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const businessId = `biz_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`

    // An authored site already at the starter slug inside that business: a
    // non-starter definition and pages, and a journalled change so the counter
    // has moved.
    const store = await tenantStore(businessId)
    const slug = STARTER_SLUG
    const seed = siteSeed({ slug, patchSiteJson: { name: 'Authored Business' } })
    expect(await store.createDraft(slug)).toBe(true)
    await store.write(slug, {
      siteJson: seed.siteJson,
      pages: [
        { name: 'home.json', page: { id: 'home', title: 'Authored home' } },
        { name: 'about.json', page: { id: 'about', title: 'About us' } },
      ],
    })
    await store.appendChange(slug, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })
    const siteKeyBefore = await store.siteKey(slug)
    const before = {
      siteJson: JSON.stringify(await store.readSiteJson(slug)),
      pages: JSON.stringify(await store.readPages(slug)),
      version: await store.version(slug),
      counter: await store.counter(slug),
    }
    expect(before.counter).toBe(1)

    // Provision, with the business key pinned to that business.
    const pinned = ((array: Uint8Array): Uint8Array => {
      array.set(bytes)
      return array
    }) as unknown as typeof crypto.getRandomValues
    vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce(pinned)
    const result = await provisionBusiness(identityEnv(), {
      accountId: owner.user.account_id,
      name: 'Collides Ltd',
    })
    expect(result.businessId).toBe(businessId)
    expect(result.siteSlug).toBe(slug)

    // Left entirely alone: not merged with the starter, not repaired.
    // Still the same one site, under the same key — no second site was made.
    expect(await store.slugs()).toEqual([slug])
    expect(await store.siteKey(slug)).toBe(siteKeyBefore)
    expect(JSON.stringify(await store.readSiteJson(slug))).toBe(before.siteJson)
    expect(JSON.stringify(await store.readPages(slug))).toBe(before.pages)
    expect(await store.version(slug)).toBe(before.version)
    expect(await store.counter(slug)).toBe(before.counter)
    expect(before.pages).not.toContain(STARTER_HEADING)
  })

  it('test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site', async () => {
    const owner = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Owner', endsAt: null })

    const result = await provisionBusiness(identityEnv(), {
      accountId: owner.user.account_id,
      name: 'Fresh Ltd',
    })
    expect(result.siteSlug).toBe(STARTER_SLUG)

    const store = await tenantStore(result.businessId)
    expect(await store.slugs()).toEqual([STARTER_SLUG])
    expect(await store.readSiteJson(result.siteSlug)).not.toBeNull()
    const pages = await store.readPages(result.siteSlug)
    expect(pages.map((p) => p.name)).toEqual(['home.json'])
    expect(JSON.stringify(pages[0].page)).toContain(STARTER_HEADING)
  })
})
