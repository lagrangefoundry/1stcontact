import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { promoteToSiteAsset } from '../apps/control-app/src/material'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * BUG-47 — **the pill marks where the bytes went, not where they came from**.
 *
 * WHAT WENT WRONG. A client uploaded three files while a site was open — a PNG
 * on *"Put it on the site"*, a Markdown note and a PDF on *"Just for you to
 * read"* — and all three came back in the Library wearing the **On this site**
 * pill. The second area's own hint promises *"they won't appear on your site"*,
 * and the very next screen said they had.
 *
 * `site_slug` held WHICH SITE WAS OPEN WHEN THE FILE ARRIVED, because the
 * overlay sends the open site's slug with every upload — it is an instruction to
 * the promotion, conditional on the role. Three consumers read it as WHERE THE
 * BYTES ARE: the pill, the `Used on` field, and the "used on this site" filter.
 * The gate itself was never wrong — `promoteToSiteAsset` refuses anything that is
 * not `republishable`, so this was a display defect and never a leak — but the
 * display was wrong on the majority of rows.
 *
 * SO PLACEMENT IS RECORDED BY THE THING THAT PERFORMS IT. `placed_on` is written
 * inside `promoteToSiteAsset`, after the asset write returns, and by nothing
 * else. Everything below is a consequence of that one decision:
 *
 * 1. A file dropped on "just for you to read" never carries a placement, even
 *    though its upload named the open site.
 * 2. A promotion that FAILED leaves no placement — promotion fails softly and
 *    keeps the material, so a field written on the way in would badge every soft
 *    failure as a success.
 * 3. A promotion that landed records exactly the site it landed on.
 * 4. A material on two of the client's sites records both, and re-promoting to a
 *    site it is already on does not record it twice.
 *
 * The Library's own half — that the pill, the field and the filter now read this
 * one fact and therefore agree — is `test_UAT_FC_BUG-47_library_agrees`.
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

/** No describer; an indexer that only counts. Neither claim below is about them. */
/**
 * A stubbed digest describer, alongside whatever else a suite injects.
 *
 * INGESTION REQUIRES A DESCRIBER NOW ([[REQ-173]]): a material's body is a digest,
 * so a deployment that cannot reach a model has nothing to write and the route
 * refuses with a 503 rather than storing an undescribed row. Every suite that
 * uploads is therefore asserting about a CONFIGURED deployment, and says so here.
 */
function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document.', model: 'stub/digest-1' }),
  }
}

/**
 * One dropped file, through the real route.
 *
 * `slug` IS ALWAYS SENT, which is the point. The overlay has the open site and
 * passes it with every upload whichever area was chosen — so a suite that only
 * sent it for `site` uploads could not reproduce this bug at all.
 */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role: string; slug: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role)
  form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** The row the Library would draw for one uid. */
async function row(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const response = await route(
    new Request('https://app.test/api/material'),
    routerEnv(tenant),
    deps(),
  )
  const listed = (await response.json()) as { material: Array<Record<string, unknown>> }
  const found = listed.material.find((r) => r.uid === uid)
  if (!found) throw new Error(`${uid} is not in the tenant's material`)
  return found
}

beforeAll(async () => {
  await APPLIED
})

describe('BUG-47 — placement is where the bytes went', () => {
  it('test_UAT_FC_BUG-47_a_file_kept_for_reading_is_never_marked_as_on_the_site', async () => {
    // THE REPORTED SYMPTOM, EXACTLY. The upload names the open site — the overlay
    // always does — and the client chose the area whose hint promises the file
    // will not appear on their site. The row must not claim otherwise.
    const tenant = 'bug47-reference'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug47a' })

    const uploaded = await upload(tenant, {
      bytes: bytesOf('# Positioning\n\nWe are the only late-night bakery in the town.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
      slug: site.slug,
    })

    // Nothing was put on the site, and the row says nothing was.
    expect(uploaded.site_asset).toBeNull()
    expect((await row(tenant, String(uploaded.uid))).placed_on).toEqual([])
  })

  it('test_UAT_FC_BUG-47_a_promotion_that_landed_records_the_site_it_landed_on', async () => {
    const tenant = 'bug47-site'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug47b' })

    const uploaded = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
      role: 'site',
      slug: site.slug,
    })

    expect(uploaded.site_asset).toBe('wordmark.svg')
    expect((await row(tenant, String(uploaded.uid))).placed_on).toEqual([site.slug])
  })

  it('test_UAT_FC_BUG-47_a_promotion_that_failed_is_not_badged_as_one_that_landed', async () => {
    // THE SECOND DEFECT. Promotion fails softly and deliberately — the material is
    // stored, described and indexed before it runs, so a site store that refuses
    // the write must not turn that into "your file did not arrive". The failure is
    // reported in the envelope and the row is kept. What the row must NOT keep is
    // a claim that the bytes reached a site.
    const tenant = 'bug47-softfail'
    await makeD1Site({ tenantId: tenant, slug: 'bug47c' })

    const uploaded = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
      role: 'site',
      // A site of this tenant's that does not exist. The client's file survives;
      // the promotion does not.
      slug: 'bug47-no-such-site',
    })

    expect(uploaded.site_asset).toBeNull()
    expect(uploaded.site_asset_error).toBeTruthy()
    // KEPT — the upload is not lost by a promotion failure.
    const kept = await row(tenant, String(uploaded.uid))
    expect(kept.filename).toBe('wordmark.svg')
    // …and unbadged.
    expect(kept.placed_on).toEqual([])
  })

  it('test_UAT_FC_BUG-47_material_on_two_of_a_clients_sites_records_both_exactly_once', async () => {
    // PLACEMENT IS MANY-TO-MANY (DOC-38 §7.7, DOC-10 §4.1): one blob may back two
    // of a client's sites, which is the shape a scalar could not express. And a
    // client who drags the same logo onto the same site twice — because they
    // forgot — must not leave the row claiming two placements where there is one.
    const tenant = 'bug47-two-sites'
    const first = await makeD1Site({ tenantId: tenant, slug: 'bug47d' })
    const second = await makeD1Site({ tenantId: tenant, slug: 'bug47e' })

    const uploaded = await upload(tenant, {
      bytes: bytesOf('the logo'),
      name: 'logo.svg',
      type: 'image/svg+xml',
      role: 'site',
      slug: first.slug,
    })
    const uid = String(uploaded.uid)

    const tickets = await ticketStoreFor(routerEnv(tenant))
    await promoteToSiteAsset(tickets, second.store, { uid, slug: second.slug, name: 'logo.svg' })
    // The same site again — the repeat a client makes by accident.
    await promoteToSiteAsset(tickets, first.store, { uid, slug: first.slug, name: 'logo.svg' })

    expect((await row(tenant, uid)).placed_on).toEqual([first.slug, second.slug])
  })
})
