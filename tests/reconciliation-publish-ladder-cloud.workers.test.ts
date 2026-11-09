import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { imageLadder, type ImageRenderer } from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { publishedOutPrefix, publishedSourcePrefix } from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UAT — story-5349d01f, AC-2527 (store-port parity), the CLOUD leg.
 *
 * The same publish with the same fake renderer, run against the cloud store
 * (real D1 and R2 inside workerd) and the in-memory store, must leave the same
 * renditions at the same paths. The filesystem leg (fs vs memory) is in
 * `reconciliation-publish-ladder.test.ts`, because workerd has no filesystem;
 * together they cover all three stores against the one in-memory reference.
 */

const HERO = new TextEncoder().encode('hero photograph bytes')

/** The Images binding faked at its port: a 1000×500 picture, rungs as text. */
function fakeRenderer(): ImageRenderer {
  return {
    measure: async () => ({ width: 1000, height: 500 }),
    resize: async (bytes, _type, width) =>
      new TextEncoder().encode(`${new TextDecoder().decode(bytes)}@${width}`),
  }
}

function imagePage(slug: string): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'image',
            src: '/assets/hero.jpg',
            alt: 'a picture',
            sizing: { width: { mode: 'fixed', px: 480 } },
          },
        ],
      },
    },
  }
}

/** A cloud store for `tenant` holding `slug`, with one picture. */
async function cloudSite(tenant: string, slug: string) {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: tenant, name: tenant, status: 'active' })
  const store = await platform.forTenant(tenant)
  const seed = siteSeed({ slug, pages: { 'home.json': imagePage(slug) } })
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [{ name: 'hero.jpg', bytes: HERO }],
  })
  return store
}

/** Every object under `prefix`, by key relative to it, with its bytes. */
async function objectsUnder(prefix: string): Promise<Map<string, Uint8Array>> {
  const listed = await env.SITES.list({ prefix: `${prefix}/`, limit: 1000 })
  const found = new Map<string, Uint8Array>()
  for (const object of listed.objects) {
    const body = await env.SITES.get(object.key)
    found.set(object.key.slice(prefix.length + 1), new Uint8Array(await body!.arrayBuffer()))
  }
  return found
}

describe('story-5349d01f — renditions cross the store port identically (cloud)', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC2527_cloud_and_memory_stores_hold_identical_renditions_and_the_frozen_definition_ignores_the_ladder', async () => {
    const slug = nextSlug('ladder-cloud')

    // Cloud: real D1 + R2.
    const cloud = await cloudSite('ac2523-with', slug)
    const onCloud = await publishSite(cloud, slug, { ladder: imageLadder(fakeRenderer()) })
    expect(onCloud.published).toBe(true)
    const siteKey = (await cloud.siteKey(slug))!

    // Memory: the same site, the same publish.
    const seed = siteSeed({ slug, pages: { 'home.json': imagePage(slug) }, assets: { 'hero.jpg': HERO } })
    const mem = memorySiteStore()
    mem.seed(slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
    const onMem = await publishSite(mem, slug, { ladder: imageLadder(fakeRenderer()) })
    expect(onMem.id).toBe(onCloud.id)

    // Same rendition paths and bytes, beside the rendered output.
    const out = await objectsUnder(publishedOutPrefix(siteKey, onCloud.id))
    const cloudDerived = [...out.keys()].filter((k) => k.startsWith('assets/d/')).sort()
    const memDerived = mem.derivedRevision(slug, onMem.id) ?? new Map<string, Uint8Array>()
    expect(cloudDerived).toHaveLength(3)
    expect(cloudDerived).toEqual([...memDerived.keys()].sort())
    for (const key of cloudDerived) expect(out.get(key), key).toEqual(memDerived.get(key))

    // The render got the measured dimensions and names only held renditions.
    const html = new TextDecoder().decode(out.get('home.html'))
    expect(html).toContain('width="1000"')
    expect(html).toContain('height="500"')
    const srcset = /srcset="([^"]+)"/.exec(html)![1].split(', ').map((c) => c.split(' ')[0])
    for (const src of srcset) expect(out.has(src), src).toBe(true)

    // The frozen definition is byte-identical with and without a ladder, and
    // holds no rendition.
    const bare = await cloudSite('ac2523-without', slug)
    const noLadder = await publishSite(bare, slug, {})
    const bareOut = await objectsUnder(publishedOutPrefix((await bare.siteKey(slug))!, noLadder.id))
    expect([...bareOut.keys()].some((k) => k.startsWith('assets/d/'))).toBe(false)

    const frozenWith = await objectsUnder(publishedSourcePrefix(siteKey, onCloud.id))
    const frozenWithout = await objectsUnder(
      publishedSourcePrefix((await bare.siteKey(slug))!, noLadder.id),
    )
    expect([...frozenWith.keys()].sort()).toEqual([...frozenWithout.keys()].sort())
    for (const [key, bytes] of frozenWith) expect(bytes, key).toEqual(frozenWithout.get(key))
    expect([...frozenWith.keys()].some((k) => k.includes('assets/d/'))).toBe(false)
    expect((await cloud.readRevision(slug, onCloud.id))?.assets.map((a) => a.name)).toEqual(['hero.jpg'])
  })
})
