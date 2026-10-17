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
 * BUG-213 — **one Library picture, several framings on the site**.
 *
 * WHAT WAS BROKEN. `place_on_site` with a new `as` name handed back the file the
 * item was already placed as, so six placements of one montage were one file —
 * and a site file could not carry a crop of its own anyway, so even six files
 * would have been cropped alike by the next Library edit.
 *
 * ASSERTED WITH `rotate`, for REQ-229's reason: the local `IMAGES` binding
 * really performs a quarter turn and silently drops crops, so a framing is told
 * apart by the picture's width and height swapping — read off the store's own
 * bytes, never off a response.
 *
 * ONE DOUBLE: the describers, which are model boundaries miniflare cannot reach.
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

function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({ text: 'A montage of six salon photographs.', model: 'stub/vision-1' }),
  }
}

/** A solid picture with a differently-coloured corner. */
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

/** A 40×20 montage dropped on the open site — placed there as `montage.png`. */
async function uploadMontage(tenant: string, slug: string): Promise<string> {
  const form = new FormData()
  form.append(
    'file',
    new File([(await encodePng(raster(40, 20))) as unknown as BlobPart], 'montage.png', { type: 'image/png' }),
  )
  form.append('role', 'site')
  form.append('site', slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  const uploaded = (await response.json()) as Record<string, unknown>
  expect(uploaded.site_asset).toBe('montage.png')
  return String(uploaded.uid)
}

async function placements(tenant: string, uid: string): Promise<Record<string, unknown>[]> {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await tickets.get({ uid })).ticket.fields.placed_as as Record<string, unknown>[]
}

async function sizeOnSite(tenant: string, slug: string, name: string) {
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const bytes = await sites.readAsset(slug, name)
  expect(bytes, `no asset called '${name}' on '${slug}'`).not.toBeNull()
  const { width, height } = await decodePng(bytes as Uint8Array, name)
  return { width, height }
}

async function library(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  return libraryOperations(chatLibrary(tickets, sites, slug, imageRendererFor(routerEnv(), tenant) ?? undefined))
}

async function images(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const pictures = sessionPicturesFor(routerEnv(), scopeOf(tenant), sites, tickets)
  expect(pictures).not.toBeNull()
  return imageOperations(pictures!(slug))
}

const TURN = [{ op: 'rotate', degrees: 90 }]

beforeAll(async () => {
  await APPLIED
})

describe('BUG-213 — `as` gives a new copy', () => {
  it('test_UAT_FC_BUG-213_a_new_as_name_places_a_new_file_beside_the_first', async () => {
    const tenant = 'bug213-new'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213a' })
    const uid = await uploadMontage(tenant, site.slug)
    const ops = await library(tenant, site.slug)

    const placed = (await ops.place_on_site({ item: uid, as: 'team-shopfront.png' })) as Record<string, unknown>

    expect(placed.asset).toBe('team-shopfront.png')
    expect(placed.src).toBe('/assets/team-shopfront.png')
    const assets = await site.store.listAssets(site.slug)
    expect(assets).toContain('montage.png')
    expect(assets).toContain('team-shopfront.png')
    expect(await placements(tenant, uid)).toEqual([
      { slug: site.slug, name: 'montage.png' },
      { slug: site.slug, name: 'team-shopfront.png' },
    ])
    // The first file is untouched.
    expect(await sizeOnSite(tenant, site.slug, 'montage.png')).toEqual({ width: 40, height: 20 })
  })

  it('test_UAT_FC_BUG-213_an_as_naming_an_existing_copy_replaces_it_and_no_as_replaces_the_first', async () => {
    const tenant = 'bug213-again'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213b' })
    const uid = await uploadMontage(tenant, site.slug)
    const ops = await library(tenant, site.slug)
    await ops.place_on_site({ item: uid, as: 'chair.png' })

    const again = (await ops.place_on_site({ item: uid, as: 'chair.png' })) as Record<string, unknown>
    const plain = (await ops.place_on_site({ item: uid })) as Record<string, unknown>

    expect(again.asset).toBe('chair.png')
    expect(plain.asset).toBe('montage.png')
    const assets = (await site.store.listAssets(site.slug)).sort()
    expect(assets).toEqual(['chair.png', 'montage.png'])
    expect(await placements(tenant, uid)).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-213_six_placements_in_one_batch_all_land', async () => {
    const tenant = 'bug213-batch'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213c' })
    const uid = await uploadMontage(tenant, site.slug)
    const ops = await library(tenant, site.slug)
    const names = [1, 2, 3, 4, 5, 6].map((n) => `panel-${n}.png`)

    const placed = (await Promise.all(
      names.map((as) => ops.place_on_site({ item: uid, as })),
    )) as Record<string, unknown>[]

    expect(placed.map((p) => p.asset).sort()).toEqual(names)
    const assets = await site.store.listAssets(site.slug)
    for (const name of names) expect(assets).toContain(name)
    const recorded = (await placements(tenant, uid)).map((p) => p.name).sort()
    expect(recorded).toEqual(['montage.png', ...names].sort())
  })
})

describe('BUG-213 — a placed file is framed on its own', () => {
  it('test_UAT_FC_BUG-213_editing_one_copy_changes_that_file_alone_over_the_original', async () => {
    const tenant = 'bug213-frame'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213d' })
    const uid = await uploadMontage(tenant, site.slug)
    const ops = await library(tenant, site.slug)
    await ops.place_on_site({ item: uid, as: 'left.png' })
    await ops.place_on_site({ item: uid, as: 'right.png' })
    const edit = await images(tenant, site.slug)

    const out = (await edit.edit_image({ image: 'left.png', edits: TURN })) as Record<string, unknown>

    expect(out.original).toEqual({ width: 40, height: 20 })
    expect(out.size).toEqual({ width: 20, height: 40 })
    expect(await sizeOnSite(tenant, site.slug, 'left.png')).toEqual({ width: 20, height: 40 })
    expect(await sizeOnSite(tenant, site.slug, 'right.png')).toEqual({ width: 40, height: 20 })
    expect(await sizeOnSite(tenant, site.slug, 'montage.png')).toEqual({ width: 40, height: 20 })

    // THE RECIPE IS OVER THE ORIGINAL, NOT THE ALREADY-TURNED FILE: sending the
    // same recipe again leaves the file as it is rather than turning it twice.
    await edit.edit_image({ image: 'left.png', edits: TURN })
    expect(await sizeOnSite(tenant, site.slug, 'left.png')).toEqual({ width: 20, height: 40 })

    const left = (await edit.list_image_edits({ image: 'left.png' })) as Record<string, unknown>
    const right = (await edit.list_image_edits({ image: 'right.png' })) as Record<string, unknown>
    expect(left.edits).toEqual(TURN)
    expect(left.original).toEqual({ width: 40, height: 20 })
    expect(right.edits).toEqual([])
    // The Library item's own recipe is untouched.
    const item = (await edit.list_image_edits({ image: uid })) as Record<string, unknown>
    expect(item.edits).toEqual([])
  })

  it('test_UAT_FC_BUG-213_a_library_edit_reaches_only_the_copies_that_follow_it', async () => {
    const tenant = 'bug213-follow'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213e' })
    const uid = await uploadMontage(tenant, site.slug)
    const ops = await library(tenant, site.slug)
    await ops.place_on_site({ item: uid, as: 'framed.png' })
    await ops.place_on_site({ item: uid, as: 'follows.png' })
    const edit = await images(tenant, site.slug)
    // `framed.png` takes a framing of its own: the picture as it arrived.
    await edit.edit_image({ image: 'framed.png', edits: [] })

    await edit.edit_image({ image: uid, edits: TURN })

    expect(await sizeOnSite(tenant, site.slug, 'montage.png')).toEqual({ width: 20, height: 40 })
    expect(await sizeOnSite(tenant, site.slug, 'follows.png')).toEqual({ width: 20, height: 40 })
    expect(await sizeOnSite(tenant, site.slug, 'framed.png')).toEqual({ width: 40, height: 20 })
  })

  it('test_UAT_FC_BUG-213_a_site_file_with_no_origin_is_still_not_editable', async () => {
    const tenant = 'bug213-orphan'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug213f' })
    await site.store.write(site.slug, { assets: [{ name: 'drawn.png', bytes: await encodePng(raster(8, 8)) }] })
    const edit = await images(tenant, site.slug)

    const error = await edit.edit_image({ image: 'drawn.png', edits: TURN }).catch((e: unknown) => e)

    expect((error as { code?: string }).code).toBe('NOT_EDITABLE')
    expect(await sizeOnSite(tenant, site.slug, 'drawn.png')).toEqual({ width: 8, height: 8 })
  })
})
