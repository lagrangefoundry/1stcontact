import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { provisionBusiness, STARTER_HEADING, type IdentityEnv } from '../apps/control-app/src/identity'
import { applySchema, tenantStore } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { siteSeed } from './support/site-seed'

/**
 * story-fde7370b — **provisioning seeds a starter site only when it created one.**
 *
 * Runs inside workerd against the real D1 and R2 with every migration applied,
 * through the shipped entry points: the store's own `createDraft`, and
 * `provisionBusiness`, which is what both the add-a-business route and the
 * invite fixture call. The collision `createStarterSite` guards against is not
 * reachable by chance — the business id (and so the starter slug) is 16 random
 * bytes — so the one thing pinned here is that randomness: the first
 * `getRandomValues` call `provisionBusiness` makes is answered with bytes the
 * test chose, which puts the new business onto a slug that already holds an
 * authored site. Nothing inside the product is replaced.
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

    // The id provisioning will mint, chosen in advance.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const businessId = `acct_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`

    // An authored site already at that slug: a non-starter definition and page,
    // and a journalled change so the counter has moved.
    const store = await tenantStore(businessId)
    const seed = siteSeed({ slug: businessId, patchSiteJson: { name: 'Authored Business' } })
    expect(await store.createDraft(businessId)).toBe(true)
    await store.write(businessId, {
      siteJson: seed.siteJson,
      pages: [
        { name: 'home.json', page: { id: 'home', title: 'Authored home' } },
        { name: 'about.json', page: { id: 'about', title: 'About us' } },
      ],
    })
    await store.appendChange(businessId, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })
    const before = {
      siteJson: JSON.stringify(await store.readSiteJson(businessId)),
      pages: JSON.stringify(await store.readPages(businessId)),
      version: await store.version(businessId),
      counter: await store.counter(businessId),
    }
    expect(before.counter).toBe(1)

    // Provision, with the business id pinned to that slug.
    const pinned = ((array: Uint8Array): Uint8Array => {
      array.set(bytes)
      return array
    }) as unknown as typeof crypto.getRandomValues
    vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce(pinned)
    const result = await provisionBusiness(identityEnv(), {
      accountUserId: owner.user.id,
      name: 'Collides Ltd',
    })
    expect(result.businessId).toBe(businessId)
    expect(result.siteSlug).toBe(businessId)

    // Left entirely alone: not merged with the starter, not repaired.
    expect(JSON.stringify(await store.readSiteJson(businessId))).toBe(before.siteJson)
    expect(JSON.stringify(await store.readPages(businessId))).toBe(before.pages)
    expect(await store.version(businessId)).toBe(before.version)
    expect(await store.counter(businessId)).toBe(before.counter)
    expect(before.pages).not.toContain(STARTER_HEADING)
  })

  it('test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site', async () => {
    const owner = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Owner', endsAt: null })

    const result = await provisionBusiness(identityEnv(), { accountUserId: owner.user.id, name: 'Fresh Ltd' })

    const store = await tenantStore(result.businessId)
    expect(await store.readSiteJson(result.siteSlug)).not.toBeNull()
    const pages = await store.readPages(result.siteSlug)
    expect(pages.map((p) => p.name)).toEqual(['home.json'])
    expect(JSON.stringify(pages[0].page)).toContain(STARTER_HEADING)
  })
})
