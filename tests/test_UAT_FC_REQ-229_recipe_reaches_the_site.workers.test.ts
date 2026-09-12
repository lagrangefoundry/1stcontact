import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { chatLibrary } from '../apps/control-app/src/library'
import { imageOperations } from '../tools/generate/src/cli/ai/image-core'
import { libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import { route, sessionPicturesFor, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { imageRendererFor } from '../apps/control-app/src/image-edit'
import type { Scope } from '../apps/control-app/src/scope'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema, makeD1Site } from './support/d1-site-factory'

/**
 * REQ-229 — **the client's crop reaches their site**.
 *
 * WHAT WAS BROKEN, IN ONE SENTENCE. A client cropped their logo in the Library,
 * saw it cropped there, published, and their site served the picture uncropped.
 * Nothing errored: promotion copied the stored bytes, `reviseRecipe` wrote
 * `fields.edits` and returned, and publish ladders whatever bytes it finds. Every
 * component behaved exactly as designed; what was missing was the seam.
 *
 * THE TWO HALVES THIS SUITE PROVES. **Promotion records the name it wrote** —
 * which `freeAssetName` may have altered — and **a recipe change replaces the
 * bytes at that name**. The record is also what tells a first placement from a
 * re-placement, so a second promotion overwrites rather than minting `logo-2.png`
 * while every page goes on serving the picture the client was trying to change.
 *
 * ASSERTED WITH `rotate`, DELIBERATELY. The `IMAGES` binding here is the real
 * API, backed locally by Miniflare's own implementation — which honours `rotate`,
 * `width` and `height` and **silently drops** trim and every colour adjustment.
 * A crop asserted in pixels would therefore pass against an uncropped picture.
 * A quarter turn is a transform the local renderer really performs, and its
 * result is checkable without trusting the renderer's own word: the picture's
 * width and height swap. So every case below puts a 40×20 picture on a site and
 * reads a 20×40 one back out of the store's own bytes.
 *
 * EVERY FACT IS READ OFF THE STORE, never off the response that claims it. A
 * route that returned the right envelope and wrote nothing would pass an
 * assertion on its own reply.
 *
 * ONE DOUBLE, NAMED WHERE IT IS USED: the describers, which are model boundaries
 * miniflare cannot reach and about which nothing here claims anything. Ingestion
 * requires one ([[REQ-173]]), so every case uploads against a configured
 * deployment.
 */

const APPLIED = applySchema()

const scopeOf = (businessId: string): Scope => ({ businessId })

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: env.IMAGES as ImagesBinding,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

/** The describers, doubled — see the header. Nothing here claims anything of them. */
function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({
      text: 'A warm photograph of a corner bakery at golden hour.',
      model: 'stub/vision-1',
    }),
  }
}

/** A solid picture with a differently-coloured corner, so a turn is visible. */
function raster(width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 40
    data[i * 3 + 1] = 90
    data[i * 3 + 2] = 160
  }
  data[0] = 250
  data[1] = 250
  data[2] = 250
  return { data, width, height, channels: 3 }
}

/** A real PNG of those pixels — the fixture this product's own codec writes. */
async function png(width: number, height: number): Promise<Uint8Array> {
  return encodePng(raster(width, height))
}

/** A file dropped on the builder's overlay, onto the site that is open. */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type?: string; role?: string; slug?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append(
    'file',
    new File([file.bytes as unknown as BlobPart], file.name, { type: file.type ?? 'image/png' }),
  )
  form.append('role', file.role ?? 'site')
  if (file.slug) form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

async function post(tenant: string, path: string, payload: unknown): Promise<Record<string, unknown>> {
  const response = await route(
    new Request(`https://app.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** The ticket as the STORE holds it, not as a response describes it. */
async function stored(tenant: string, uid: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await tickets.get({ uid })).ticket
}

/** How big the picture on the site actually is, measured from its own bytes. */
async function sizeOnSite(
  tenant: string,
  slug: string,
  name: string,
): Promise<{ width: number; height: number }> {
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const bytes = await sites.readAsset(slug, name)
  expect(bytes, `no asset called '${name}' on '${slug}'`).not.toBeNull()
  const { width, height } = await decodePng(bytes as Uint8Array, name)
  return { width, height }
}

/** The assistant's catalogue, over this tenant's real stores. */
async function catalogue(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const renderer = imageRendererFor(routerEnv(), tenant)
  return libraryOperations(chatLibrary(tickets, sites, slug, renderer ?? undefined))
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-229 — promotion records the name, and a recipe change replaces those bytes', () => {
  it('test_UAT_FC_REQ-229_promotion_records_the_asset_name_it_wrote', async () => {
    // THE POINTER THE WHOLE DESIGN RESTS ON. `placed_on` said a logo reached a
    // site and never said what it was CALLED there — and promotion does not
    // always use the name it was asked for, because `freeAssetName` renames on
    // collision. Without the name there is nothing for a later edit to write
    // back to, which is why this is half the ticket rather than bookkeeping.
    const tenant = 'req229-name'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229a' })
    // Something already called `logo.png`, so the promotion has to rename.
    await site.store.write(site.slug, {
      assets: [{ name: 'logo.png', bytes: await png(8, 8) }],
    })

    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'logo.png',
      slug: site.slug,
    })

    // The rename happened, and the envelope says so.
    expect(uploaded.site_asset).toBe('logo-2.png')

    // AND THE RECORD REMEMBERS IT. This is the fact that did not exist before.
    const ticket = await stored(tenant, String(uploaded.uid))
    expect(ticket.fields.placed_as).toEqual([{ slug: site.slug, name: 'logo-2.png' }])
    // `placed_on` still answers "which sites", unchanged, because every consumer
    // of it — the pill, the `Used on` field, the filter — is asking only that.
    expect(ticket.fields.placed_on).toEqual([site.slug])

    // The first picture is untouched: recording a name is not permission to
    // overwrite somebody else's.
    expect((await sizeOnSite(tenant, site.slug, 'logo.png')).width).toBe(8)
  })

  it('test_UAT_FC_REQ-229_a_recipe_change_replaces_the_bytes_at_that_name', async () => {
    // THE SEAM THE EPIC'S TITLE BROKE AT. The client crops; the site serves the
    // crop. Same name, same handle on every page that references it, and no
    // second file in the bucket.
    const tenant = 'req229-replace'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229b' })
    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'shopfront.png',
      slug: site.slug,
    })
    expect(uploaded.site_asset).toBe('shopfront.png')
    expect((await sizeOnSite(tenant, site.slug, 'shopfront.png')).width).toBe(40)

    const before = (await site.store.changesSince(site.slug)).changes.length
    const edited = await post(tenant, '/api/material/recipe', {
      uid: uploaded.uid,
      recipe: [{ op: 'rotate', degrees: 90 }],
    })

    // THE EDIT REPORTS WHERE IT LANDED, per placement — so a crop that did not
    // reach a site says so on the turn it happens.
    expect(edited.republished).toEqual([
      { slug: site.slug, name: 'shopfront.png', replaced: true },
    ])

    // THE BYTES ON THE SITE ARE THE EDITED ONES. A quarter turn swaps the sides.
    expect(await sizeOnSite(tenant, site.slug, 'shopfront.png')).toEqual({ width: 20, height: 40 })

    // AND NOTHING WAS MINTED. Re-promoting through the add path would have left
    // `shopfront-2.png` in the bucket and every page still on the original.
    expect(await site.store.listAssets(site.slug)).toContain('shopfront.png')
    expect(await site.store.listAssets(site.slug)).not.toContain('shopfront-2.png')

    // IT WENT THROUGH THE DRAFT'S ORDINARY WRITE PATH, so the assistant is told a
    // picture changed on the turn it changes, exactly as it is told one arrived.
    const changes = (await site.store.changesSince(site.slug)).changes
    expect(changes.length).toBeGreaterThan(before)
    const record = changes[changes.length - 1]
    expect(record.op).toBe('asset.replace')
    expect(record.label).toBe('shopfront.png')
    expect(record.actor).toBe('client')

    // THE ORIGINAL IS KEPT FOREVER — the recipe is the version mechanism, and it
    // is the only one. The material's own bytes are what was uploaded.
    const original = await route(
      new Request(`https://app.test/api/material/file?uid=${uploaded.uid}&original=1`),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect((await decodePng(new Uint8Array(await original.arrayBuffer()), 'original')).width).toBe(40)
  })

  it('test_UAT_FC_REQ-229_promotion_applies_a_recipe_the_material_already_carried', async () => {
    // THE OTHER ORDER, WHICH HAD THE IDENTICAL SYMPTOM. A client uploads a
    // photograph to read, crops it, and only then decides it belongs on the site.
    // REQ-219 settled that the recipe is applied AT PROMOTION; promotion copied
    // the stored bytes, so the picture arrived uncropped by the same seam.
    const tenant = 'req229-carried'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229c' })
    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'yard.png',
      role: 'reference',
    })

    // Cropped while it is still nobody's site asset: nothing to re-promote yet.
    const edited = await post(tenant, '/api/material/recipe', {
      uid: uploaded.uid,
      recipe: [{ op: 'rotate', degrees: 90 }],
    })
    expect(edited.republished).toEqual([])

    // Now it is for the site. The bytes that cross the bucket boundary are the
    // render, not the original.
    const corrected = await post(tenant, '/api/material/role', {
      uid: uploaded.uid,
      role: 'site',
    })
    expect(corrected.site_asset).toBe('yard.png')
    expect(await sizeOnSite(tenant, site.slug, 'yard.png')).toEqual({ width: 20, height: 40 })
  })

  it('test_UAT_FC_REQ-229_a_second_placement_replaces_rather_than_minting_a_name', async () => {
    // THE TWO DOORS, TOLD APART BY THE RECORD. A material with no recorded name
    // takes a free one; a material that already records one overwrites it. This
    // is the case a client produces by accident — dragging the same logo again
    // because they forgot — and the one a re-promotion produces every time.
    const tenant = 'req229-second'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229d' })
    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'wordmark.png',
      slug: site.slug,
    })
    expect(uploaded.site_asset).toBe('wordmark.png')

    // The assistant places it again, through its own operation.
    const ops = await catalogue(tenant, site.slug)
    const placed = (await ops.place_on_site({ item: String(uploaded.uid) })) as Record<string, unknown>

    expect(placed.asset).toBe('wordmark.png')
    expect(placed.src).toBe('/assets/wordmark.png')
    // ONE FILE, NOT TWO. `wordmark-2.png` would be an orphan in the bucket and a
    // page still pointing at bytes nobody is editing.
    const assets = await site.store.listAssets(site.slug)
    expect(assets.filter((name) => name.startsWith('wordmark'))).toEqual(['wordmark.png'])
    // And the record still names exactly one placement on this site.
    const ticket = await stored(tenant, String(uploaded.uid))
    expect(ticket.fields.placed_as).toEqual([{ slug: site.slug, name: 'wordmark.png' }])
  })

  it('test_UAT_FC_REQ-229_a_replacement_that_finds_nothing_reports_rather_than_repairs', async () => {
    // IT DOES NOT INVENT A NAME. If the asset is gone — an operator deleted it, a
    // push overwrote the site — the material's record is stale, and silently
    // re-adding the picture would put back something somebody removed.
    const tenant = 'req229-stale'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229e' })
    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'banner.png',
      slug: site.slug,
    })
    expect(uploaded.site_asset).toBe('banner.png')

    // Somebody removes it from the site.
    await site.store.write(site.slug, { removeAssets: ['banner.png'] })
    expect(await site.store.listAssets(site.slug)).not.toContain('banner.png')

    const edited = await post(tenant, '/api/material/recipe', {
      uid: uploaded.uid,
      recipe: [{ op: 'rotate', degrees: 90 }],
    })

    // REPORTED, per placement, in the client's own answer.
    const republished = edited.republished as Record<string, unknown>[]
    expect(republished).toHaveLength(1)
    expect(republished[0]).toMatchObject({ slug: site.slug, name: 'banner.png', replaced: false })
    expect(String(republished[0].error)).toContain('nothing to replace')

    // NOT REPAIRED — the picture stays removed.
    expect(await site.store.listAssets(site.slug)).not.toContain('banner.png')

    // AND THE EDIT ITSELF LANDED. The recipe is the truth about the material; a
    // site that could not be reached is a smaller fact than that.
    expect((await stored(tenant, String(uploaded.uid))).fields.edits).toEqual([
      { op: 'rotate', degrees: 90 },
    ])
    expect(edited.rendered).toBe(true)
  })

  it('test_UAT_FC_REQ-229_an_edit_the_assistant_makes_reaches_the_site_too', async () => {
    // ONE FACT, TWO PRODUCERS. The modal and `edit_image` both write the recipe
    // on the record, and REQ-228 has just put the catalogue in the assistant's
    // hands. A propagation that fired for one and not the other would re-open
    // this ticket's own gap on the surface the product leads with.
    const tenant = 'req229-assistant'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req229f' })
    const uploaded = await upload(tenant, {
      bytes: await png(40, 20),
      name: 'terrace.png',
      slug: site.slug,
    })
    expect((await sizeOnSite(tenant, site.slug, 'terrace.png')).width).toBe(40)

    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const sites = await storeFor(routerEnv(), scopeOf(tenant))
    const pictures = sessionPicturesFor(routerEnv(), scopeOf(tenant), sites, tickets)
    expect(pictures).not.toBeNull()

    await imageOperations(pictures!(site.slug)).edit_image({
      image: String(uploaded.uid),
      edits: [{ op: 'rotate', degrees: 90 }],
    })

    expect(await sizeOnSite(tenant, site.slug, 'terrace.png')).toEqual({ width: 20, height: 40 })
    expect(await site.store.listAssets(site.slug)).not.toContain('terrace-2.png')
  })
})
