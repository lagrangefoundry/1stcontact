import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { promoteToSiteAsset } from '../apps/control-app/src/material'
import { applySchema, makeD1Site, tenantStore } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'

/**
 * Reconciliation UATs for story-aacb7060 — the BUNDLE-32 half: **placement is a
 * recorded fact, written only when it is true**, and **a promotion that lands is
 * journalled like any other asset write**.
 *
 * The rights gate, the byte copy, the free name, the soft failure and the
 * nothing-to-publish refusal (AC-1709…AC-1713) are proved in
 * `reconciliation-site-asset-promotion.workers.test.ts`; this file holds the
 * criteria BUG-45 and BUG-47 added.
 *
 * WHAT MAKES THIS EVIDENCE. Every hand-over goes through the Worker's own route
 * table at the material entry point (`POST /api/material`, `POST
 * /api/material/fetch`), and placement is read back the way the Library reads it
 * — off the row `GET /api/material` lists. Re-promotion onto a site goes through
 * `promoteToSiteAsset`, the platform's only promotion path and the function the
 * route calls. The draft change journal is read through the site store's own
 * `changesSince`, the slice the assistant's next turn is built from. All of it
 * runs against real D1 and real R2 from `@cloudflare/vitest-pool-workers`.
 *
 * THE DOUBLES, AND WHY EACH IS AT A BOUNDARY WE DO NOT OWN. No describer is wired
 * (no criterion here is about a description) and the index hook only counts. The
 * fetch seam stands in for the open internet. The one internal stand-in is the
 * site store in AC-2017's soft-failure half: `RouterDeps.store`, the route
 * table's declared host seam, wrapped so it delegates everything to the real
 * store and refuses only `write` — there is no way to make real R2 refuse on
 * demand.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return { index: async () => async () => {}, ...over }
}

/**
 * One dropped file, through the real route. `slug` is sent whenever given, as the
 * overlay sends the open site with every upload whichever area was chosen.
 */
async function handOver(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role: string; slug?: string },
  over: Partial<RouterDeps> = {},
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role)
  if (file.slug !== undefined) form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    deps(over),
  )
  expect(response.status).toBe(200)
  return (await response.json()) as Record<string, unknown>
}

/** The row the Library would draw for one uid, off the platform's own listing. */
async function listed(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const response = await route(
    new Request('https://app.test/api/material'),
    routerEnv(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  const body = (await response.json()) as { material: Array<Record<string, unknown>> }
  const found = body.material.find((r) => r.uid === uid)
  if (!found) throw new Error(`${uid} is not in the account's material`)
  return found
}

/** The material, asked for by uid — "retrievable", not merely listed. */
async function retrieved(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const response = await route(
    new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
    routerEnv(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  return (await response.json()) as Record<string, unknown>
}

/** The journal's cursor now — what the assistant holds at the end of a turn. */
async function cursorOf(sites: TenantSiteStore, slug: string): Promise<number> {
  return (await sites.changesSince(slug)).now
}

/** The real store, refusing exactly the write. */
function storeRefusingWrite(real: TenantSiteStore): TenantSiteStore {
  return new Proxy(real, {
    get(target, property, receiver) {
      if (property === 'write') {
        return async () => {
          throw new Error('R2 PutObject rejected')
        }
      }
      return Reflect.get(target, property, receiver) as unknown
    },
  })
}

beforeAll(async () => {
  await APPLIED
})

describe('story-aacb7060 — placement is recorded only when it is true', () => {
  it('test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on', async () => {
    const tenant = 'ac2015'
    const first = await makeD1Site({ tenantId: tenant, slug: 'ac2015-first' })
    const second = await makeD1Site({ tenantId: tenant, slug: 'ac2015-second' })
    // A third site of the client's, open but never promoted onto — the list must
    // say exactly where the bytes went, not every site the client has.
    await makeD1Site({ tenantId: tenant, slug: 'ac2015-other' })

    // HAND OVER FOR A SITE THAT CAN BE WRITTEN TO: the list is exactly that site,
    // and only once the asset is actually in that site's library.
    const uploaded = await handOver(tenant, {
      bytes: bytesOf('the client’s wordmark'),
      name: 'wordmark.png',
      type: 'image/png',
      role: 'site',
      slug: first.slug,
    })
    const uid = String(uploaded.uid)
    expect(uploaded.site_asset).toBe('wordmark.png')
    expect(await first.store.listAssets(first.slug)).toContain('wordmark.png')
    expect((await listed(tenant, uid)).placed_on).toEqual([first.slug])

    // THE SAME SITE AGAIN: a second asset lands (promotion never replaces), but
    // the site is still listed once — the list is a set.
    const tickets = await ticketStoreFor(routerEnv(tenant))
    const again = await promoteToSiteAsset(tickets, first.store, {
      uid,
      slug: first.slug,
      name: 'wordmark.png',
    })
    expect(again.name).toBe('wordmark-2.png')
    expect((await listed(tenant, uid)).placed_on).toEqual([first.slug])

    // A SECOND SITE OF THE SAME CLIENT: both are listed.
    await promoteToSiteAsset(tickets, second.store, {
      uid,
      slug: second.slug,
      name: 'wordmark.png',
    })
    expect(await second.store.listAssets(second.slug)).toContain('wordmark.png')
    const placed = (await listed(tenant, uid)).placed_on as string[]
    expect([...placed].sort()).toEqual([first.slug, second.slug].sort())
    expect(placed).toHaveLength(2)

    // NEVER PROMOTED: an empty list, not an absent or unknown value.
    const unplaced = await handOver(tenant, {
      bytes: bytesOf('a photograph kept for later'),
      name: 'later.png',
      type: 'image/png',
      role: 'site',
    })
    expect(unplaced.site_asset).toBeNull()
    const unplacedRow = await listed(tenant, String(unplaced.uid))
    expect(unplacedRow).toHaveProperty('placed_on')
    expect(unplacedRow.placed_on).toEqual([])
  })

  it('test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material', async () => {
    const tenant = 'ac2016'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2016-open' })
    const assetsBefore = await site.store.listAssets(site.slug)

    // BACKGROUND, WHILE THE SITE IS OPEN. The upload names the open site, as the
    // overlay always does; nothing lands and nothing is recorded as placed.
    const background = await handOver(tenant, {
      bytes: bytesOf('# Positioning\n\nThe only late-night bakery in town.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
      slug: site.slug,
    })
    const backgroundUid = String(background.uid)
    expect(backgroundUid).not.toBe('')
    expect(background.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).toEqual(assetsBefore)
    const backgroundRow = await listed(tenant, backgroundUid)
    expect(backgroundRow.filename).toBe('positioning.md')
    expect(backgroundRow.placed_on).toEqual([])
    expect((await retrieved(tenant, backgroundUid)).uid).toBe(backgroundUid)

    // FOR THE SITE, NAMING A SITE THAT CANNOT BE WRITTEN TO. The hand-over
    // succeeds and carries the placement failure; the material is kept, unplaced.
    const failed = await handOver(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.png',
      type: 'image/png',
      role: 'site',
      slug: 'ac2016-no-such-site',
    })
    const failedUid = String(failed.uid)
    expect(failedUid).not.toBe('')
    expect(failed.site_asset).toBeNull()
    expect(String(failed.site_asset_error ?? '')).not.toBe('')
    const failedRow = await listed(tenant, failedUid)
    expect(failedRow.filename).toBe('wordmark.png')
    expect(failedRow.placed_on).toEqual([])
    expect((await retrieved(tenant, failedUid)).uid).toBe(failedUid)

    // FETCHED ON THE CLIENT'S BEHALF. The fetch takes no site — a slug sent
    // anyway is ignored — and records no placement.
    const fetchedResponse = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://competitor.example/about', slug: site.slug }),
      }),
      routerEnv(tenant),
      deps({
        fetch: (async () =>
          new Response('<html><body><p>Their story, at length.</p></body></html>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })) as unknown as typeof fetch,
      }),
    )
    expect(fetchedResponse.status).toBe(200)
    const fetched = (await fetchedResponse.json()) as Record<string, unknown>
    const fetchedUid = String(fetched.uid)
    expect(fetchedUid).not.toBe('')
    expect(fetched.site_asset ?? null).toBeNull()
    expect(await site.store.listAssets(site.slug)).toEqual(assetsBefore)
    const fetchedRow = await listed(tenant, fetchedUid)
    expect(fetchedRow.placed_on).toEqual([])
    expect(fetchedRow).not.toHaveProperty('site_slug')
  })

  it('test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none', async () => {
    const tenant = 'ac2017'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2017-site' })
    const sites = await tenantStore(tenant)

    // A PROMOTION THAT LANDS: exactly one new entry, the ordinary asset-add note,
    // naming the asset under the name the hand-over reported.
    const cursor = await cursorOf(sites, site.slug)
    const landed = await handOver(tenant, {
      bytes: bytesOf('a photograph of the kitchen'),
      name: 'kitchen.png',
      type: 'image/png',
      role: 'site',
      slug: site.slug,
    })
    expect(landed.site_asset).toBe('kitchen.png')
    const slice = await sites.changesSince(site.slug, cursor)
    expect(slice.changes).toHaveLength(1)
    expect(slice.changes[0].op).toBe('asset.add')
    expect(slice.changes[0].label).toBe(landed.site_asset)

    // A COLLIDING NAME: the entry names the name it LANDED as, not the one asked.
    const renamedCursor = await cursorOf(sites, site.slug)
    const renamed = await handOver(tenant, {
      bytes: bytesOf('a second photograph of the kitchen'),
      name: 'kitchen.png',
      type: 'image/png',
      role: 'site',
      slug: site.slug,
    })
    expect(renamed.site_asset).toBe('kitchen-2.png')
    const renamedSlice = await sites.changesSince(site.slug, renamedCursor)
    expect(renamedSlice.changes).toHaveLength(1)
    expect(renamedSlice.changes[0].op).toBe('asset.add')
    expect(renamedSlice.changes[0].label).toBe('kitchen-2.png')

    // REFUSED BY THE RIGHTS GATE: no new entry.
    const refusedCursor = await cursorOf(sites, site.slug)
    const refused = await handOver(tenant, {
      bytes: bytesOf('a competitor’s hero image'),
      name: 'theirs.png',
      type: 'image/png',
      role: 'reference',
      slug: site.slug,
    })
    expect(refused.republishable).toBe(false)
    expect(refused.site_asset).toBeNull()
    expect((await sites.changesSince(site.slug, refusedCursor)).changes).toHaveLength(0)

    // FAILED SOFTLY: the store refuses the write; the hand-over still succeeds,
    // and the journal records nothing.
    const softCursor = await cursorOf(sites, site.slug)
    const soft = await handOver(
      tenant,
      {
        bytes: bytesOf('the opening hours'),
        name: 'hours.png',
        type: 'image/png',
        role: 'site',
        slug: site.slug,
      },
      { store: async () => storeRefusingWrite(sites) },
    )
    expect(soft.site_asset).toBeNull()
    expect(String(soft.site_asset_error ?? '')).not.toBe('')
    expect((await sites.changesSince(site.slug, softCursor)).changes).toHaveLength(0)
  })
})
