import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv, TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { publishSite } from '../tools/generate/src/publish/publish'
import { pendingChanges } from '../tools/generate/src/publish/publish'
import { collectSiteDigest } from '../tools/generate/src/cli/ai/digest-core'
import { applySchema } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * [[REQ-303]] — **a site with tens of megabytes of assets still takes a turn**,
 * against real D1 and real R2.
 *
 * WHY THIS HAS TO RUN IN WORKERD. The failure was a 128 MB isolate dying on a
 * fifty-megabyte site, and the fix is that the change count is now derived from
 * what the STORE already recorded about its objects — `site_assets` rows and the
 * etag R2 stamped at `put`. Neither of those exists on a filesystem, so the node
 * suite can prove the digest asks for no bytes and cannot prove what the tier
 * that broke actually does instead.
 *
 * THE BUCKET IS WATCHED RATHER THAN THE STORE. The node suite instruments the
 * port; here the observation is one level lower, on R2 itself, because the
 * question is what crossed the wire into the isolate. An implementation that
 * satisfied the port's shape while fetching every object would pass a port-level
 * assertion and reproduce the outage.
 *
 * THE CLAIMS:
 *
 *   1. A turn's digest against a site holding tens of megabytes of assets
 *      completes, and fetches NOT ONE of those objects.
 *   2. What it does fetch is bounded by the site's DEFINITION and not by its
 *      pictures: the same handful of kilobytes whether the site weighs thirty
 *      megabytes or nothing.
 *   3. Where R2 records an etag, an asset replaced by DIFFERENT BYTES OF THE
 *      SAME LENGTH is still counted — a size alone would call those equal.
 *   4. The digest's `live` and `pending` are the values the status surface
 *      `describe_site` reports for the same site at the same moment.
 */

const TENANT = 'req303'

/** One R2 fetch, as {@link watchBucket} saw it. */
interface Fetched {
  key: string
  bytes: number
}

/**
 * The bucket, with every object it actually handed over recorded.
 *
 * A PROXY AND NOT A HAND-WRITTEN DOUBLE. What is under test is the real store
 * against the real bucket; a stand-in would prove the stand-in. Only `get` is
 * intercepted, because only `get` transfers content — `list` answers metadata,
 * which is the whole point of the change.
 */
function watchBucket(inner: R2Bucket): { bucket: R2Bucket; fetched: Fetched[] } {
  const fetched: Fetched[] = []
  const bucket = new Proxy(inner, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown
      if (typeof value !== 'function') return value
      const bound = (value as (...args: unknown[]) => unknown).bind(target)
      if (property !== 'get') return bound
      return async (...args: unknown[]) => {
        const object = (await bound(...args)) as { size?: number } | null
        if (object) fetched.push({ key: String(args[0]), bytes: object.size ?? 0 })
        return object
      }
    },
  })
  return { bucket: bucket as R2Bucket, fetched }
}

/** A picture's worth of bytes, distinguishable from any other picture's. */
function picture(size: number, fill: number): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.fill(fill)
  bytes[0] = fill
  return bytes
}

/** A tenant handle over whichever bucket the case wants to watch. */
async function handle(SITES: R2Bucket): Promise<TenantSiteStore> {
  const root = d1r2SiteStore({ DB: env.DB, SITES } as unknown as SiteStoreEnv)
  await root.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  return root.forTenant(TENANT)
}

/** A published site holding `count` assets of `each` bytes. */
async function publishedSite(
  store: TenantSiteStore,
  assets: Record<string, Uint8Array>,
): Promise<string> {
  const seed = siteSeed({ assets })
  const site = await store.createDraft()
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })
  await publishSite(store, site, { message: 'first' })
  return site
}

describe('REQ-303 — the digest against real D1 and R2', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-303_a_site_with_tens_of_megabytes_of_assets_takes_its_turn', async () => {
    const watched = watchBucket(env.SITES)
    const store = await handle(watched.bucket)
    // The shape the report measured: seventeen assets, tens of megabytes.
    const site = await publishedSite(
      store,
      Object.fromEntries(
        Array.from({ length: 17 }, (_, i) => [`photo-${i}.jpg`, picture(2 * 1024 * 1024, i + 1)]),
      ),
    )

    watched.fetched.length = 0
    const digest = await collectSiteDigest(site, { store })

    expect(digest.live).not.toBeNull()
    expect(digest.pending).toBe(0)
    // NOT ONE PICTURE CROSSED THE WIRE. Thirty-four megabytes are held by this
    // site and none of them were asked for.
    expect(watched.fetched.filter((f) => f.key.includes('/assets/'))).toEqual([])
    // THE TIMEOUT IS THE SEEDING'S, NOT THE DIGEST'S. Putting thirty-four
    // megabytes into R2 and publishing them is the slow part of this case by an
    // order of magnitude; the derivation being asserted is the cheap thing at
    // the end of it, which is the whole claim.
  }, 120_000)

  it('test_UAT_FC_REQ-303_what_a_digest_fetches_is_the_definition_and_never_the_pictures', async () => {
    const watched = watchBucket(env.SITES)
    const store = await handle(watched.bucket)
    const heavy = await publishedSite(
      store,
      Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [`photo-${i}.jpg`, picture(1024 * 1024, i + 1)]),
      ),
    )
    const light = await publishedSite(store, { 'tiny.svg': picture(8, 1) })

    const weigh = async (site: string): Promise<number> => {
      watched.fetched.length = 0
      await collectSiteDigest(site, { store })
      return watched.fetched.reduce((sum, f) => sum + f.bytes, 0)
    }

    const heavyBytes = await weigh(heavy)
    const lightBytes = await weigh(light)

    // Eight megabytes of pictures against eight bytes of one, and what the
    // digest pulled in differs by less than a page of JSON.
    expect(heavyBytes).toBeLessThan(64 * 1024)
    expect(Math.abs(heavyBytes - lightBytes)).toBeLessThan(4 * 1024)
  })

  it('test_UAT_FC_REQ-303_an_asset_replaced_by_the_same_length_of_different_bytes_still_counts', async () => {
    const store = await handle(env.SITES)
    const site = await publishedSite(store, { 'hero.jpg': picture(4096, 1) })
    expect((await collectSiteDigest(site, { store })).pending).toBe(0)

    // SAME NAME, SAME LENGTH, DIFFERENT BYTES. R2 recorded an etag over the
    // content at `put`, so this tier sees it without opening either object.
    await store.write(site, { assets: [{ name: 'hero.jpg', bytes: picture(4096, 2) }] })

    const changes = await pendingChanges(store, site)
    expect(changes.modified).toEqual(['assets/hero.jpg'])
    expect((await collectSiteDigest(site, { store })).pending).toBe(1)
  })

  it('test_UAT_FC_REQ-303_the_digest_agrees_with_the_status_surface_at_the_same_moment', async () => {
    const store = await handle(env.SITES)
    const site = await publishedSite(store, { 'hero.jpg': picture(64 * 1024, 3) })
    await store.write(site, { assets: [{ name: 'later.svg', bytes: picture(512, 4) }] })

    // `describe_site` reports `pendingChanges` verbatim as its `pending` field,
    // so this is the agreement [[REQ-285]] was protecting — one site, one
    // moment, one answer.
    const [status, digest] = await Promise.all([
      pendingChanges(store, site),
      collectSiteDigest(site, { store }),
    ])
    expect(digest.live).toBe(status.baseRevision)
    expect(digest.pending).toBe(
      status.added.length + status.modified.length + status.removed.length,
    )
    expect(status.added).toEqual(['assets/later.svg'])
  })
})
