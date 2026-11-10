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
import { publishSite } from '../tools/generate/src/publish/publish'
import { applySchema, makeD1Site } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-ed976856 (image editing as a recipe), the four
 * criteria [[REQ-229]] added: **the recipe reaches the client's site**.
 *
 *   AC-2590 — promotion places the picture as it currently stands, and records
 *             the asset name it actually wrote (`placed_as`), per site.
 *   AC-2591 — a recipe change, from the client's route or the assistant's
 *             `edit_image`, replaces the bytes at the recorded name in one
 *             operation, and the client's route reports it per placement.
 *   AC-2592 — promoting an already-recorded picture again overwrites at its
 *             recorded name and mints no suffixed duplicate.
 *   AC-2593 — a recorded name the site no longer holds is reported, never
 *             re-added, and does not stop the other placements.
 *
 * Everything runs through the platform's own routes against real D1, real R2
 * and the real local `IMAGES` binding. That binding (Miniflare's) honours
 * `rotate`, `width` and `height` and silently drops trim and colour, so every
 * edit here is a quarter-turn `rotate`. Its effect can be checked from the
 * bytes alone: a 40×20 picture comes back 20×40.
 *
 * Every fact is read from the stores, not from the response that claims it.
 *
 * Two doubles are used. The describers, a model boundary that ingestion requires
 * and that nothing here asserts on. And, in AC-2590 only, a thin wrapper over the
 * real binding that counts transform requests, to prove an unedited picture
 * requests none.
 */

const APPLIED = applySchema()

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * The deployment's bindings. `images` is the real binding by default. `null`
 * models a deployment with no `[images]` binding. A wrapper can be passed in to
 * observe calls.
 */
function routerEnv(images: ImagesBinding | null = env.IMAGES as ImagesBinding): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ...(images ? { IMAGES: images } : {}),
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

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

/** The real binding, with every transform request counted. */
function countingImages(): { binding: ImagesBinding; transforms: () => number } {
  const real = env.IMAGES as ImagesBinding
  let inputs = 0
  const binding = {
    info: (stream: ReadableStream<Uint8Array>) => real.info(stream),
    input: (stream: ReadableStream<Uint8Array>) => {
      inputs++
      return real.input(stream)
    },
  }
  return { binding: binding as unknown as ImagesBinding, transforms: () => inputs }
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

async function png(width: number, height: number): Promise<Uint8Array> {
  return encodePng(raster(width, height))
}

/** A file dropped on the builder's overlay, onto the open site if `slug` is set. */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; role?: string; slug?: string },
  images?: ImagesBinding | null,
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: 'image/png' }))
  form.append('role', file.role ?? 'site')
  if (file.slug) form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(images),
    scopeOf(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  return (await response.json()) as Record<string, unknown>
}

async function post(
  tenant: string,
  path: string,
  payload: unknown,
  images?: ImagesBinding | null,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await route(
    new Request(`https://app.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(images),
    scopeOf(tenant),
    deps(),
  )
  return { status: response.status, body: (await response.json()) as Record<string, unknown> }
}

/** The material as the ticket store holds it. */
async function stored(tenant: string, uid: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await tickets.get({ uid })).ticket
}

/** Write fields on the material record directly, bypassing every route. */
async function patchRecord(tenant: string, uid: string, fields: Record<string, unknown>) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  await tickets.update({ uid, patch: { fields } })
}

async function assetBytes(tenant: string, slug: string, name: string): Promise<Uint8Array> {
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const bytes = await sites.readAsset(slug, name)
  expect(bytes, `no asset called '${name}' on '${slug}'`).not.toBeNull()
  return bytes as Uint8Array
}

async function sizeOnSite(tenant: string, slug: string, name: string) {
  const { width, height } = await decodePng(await assetBytes(tenant, slug, name), name)
  return { width, height }
}

/** The assistant's catalogue for one site, over this tenant's real stores. */
async function catalogue(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const renderer = imageRendererFor(routerEnv(), tenant)
  return libraryOperations(chatLibrary(tickets, sites, slug, renderer ?? undefined))
}

/** The assistant's `image` surface for one site, composed as a session composes it. */
async function assistantImages(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const pictures = sessionPicturesFor(routerEnv(), scopeOf(tenant), sites, tickets)
  expect(pictures).not.toBeNull()
  return imageOperations(pictures!(slug))
}

const QUARTER_TURN = [{ op: 'rotate', degrees: 90 }]

beforeAll(async () => {
  await APPLIED
})

describe('story-ed976856: the recipe reaches the site (REQ-229)', () => {
  it('test_UAT_AC2590_promotion_places_the_current_render_and_records_the_name_actually_written', async () => {
    // 1. A picture edited before promotion lands on the site as the render.
    const tenant = 'ac2590-render'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2590a' })
    const original = await png(40, 20)
    const material = await upload(tenant, { bytes: original, name: 'yard.png', role: 'reference' })
    const uid = String(material.uid)

    const edited = await post(tenant, '/api/material/recipe', { uid, recipe: QUARTER_TURN })
    expect(edited.status).toBe(200)
    expect(edited.body.republished).toEqual([])
    expect(await site.store.listAssets(site.slug)).not.toContain('yard.png')

    const promoted = await post(tenant, '/api/material/role', { uid, role: 'site' })
    expect(promoted.body.site_asset).toBe('yard.png')
    expect(await sizeOnSite(tenant, site.slug, 'yard.png')).toEqual({ width: 20, height: 40 })
    // The stored original is untouched.
    const stillOriginal = await route(
      new Request(`https://app.test/api/material/file?uid=${uid}&original=1`),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect(new Uint8Array(await stillOriginal.arrayBuffer())).toEqual(original)

    let record = await stored(tenant, uid)
    expect(record.fields.placed_as).toEqual([{ slug: site.slug, name: 'yard.png' }])
    expect(record.fields.placed_on).toEqual([site.slug])

    // A promotion to a second site records a second entry and keeps the first.
    const second = await makeD1Site({ tenantId: tenant, slug: 'ac2590b' })
    const placed = (await (await catalogue(tenant, second.slug)).place_on_site({
      item: uid,
    })) as Record<string, unknown>
    expect(placed.asset).toBe('yard.png')
    expect(await sizeOnSite(tenant, second.slug, 'yard.png')).toEqual({ width: 20, height: 40 })
    record = await stored(tenant, uid)
    expect(record.fields.placed_as).toEqual([
      { slug: site.slug, name: 'yard.png' },
      { slug: second.slug, name: 'yard.png' },
    ])
    expect(record.fields.placed_on).toEqual([site.slug, second.slug])

    // 2. A taken name: the recorded name is the free name that was written.
    const taken = 'ac2590-taken'
    const crowded = await makeD1Site({ tenantId: taken, slug: 'ac2590c' })
    await crowded.store.write(crowded.slug, { assets: [{ name: 'logo.png', bytes: await png(8, 8) }] })
    const logo = await upload(taken, { bytes: await png(40, 20), name: 'logo.png', slug: crowded.slug })
    expect(logo.site_asset).toBe('logo-2.png')
    const logoRecord = await stored(taken, String(logo.uid))
    expect(logoRecord.fields.placed_as).toEqual([{ slug: crowded.slug, name: 'logo-2.png' }])
    expect(logoRecord.fields.placed_as).not.toContainEqual({ slug: crowded.slug, name: 'logo.png' })
    expect((await sizeOnSite(taken, crowded.slug, 'logo.png')).width).toBe(8)

    // 3. An unedited picture lands byte-identical, and no transform is requested.
    const plain = 'ac2590-plain'
    const plainSite = await makeD1Site({ tenantId: plain, slug: 'ac2590d' })
    const counting = countingImages()
    const plainBytes = await png(40, 20)
    const unedited = await upload(
      plain,
      { bytes: plainBytes, name: 'plain.png', slug: plainSite.slug },
      counting.binding,
    )
    expect(unedited.site_asset).toBe('plain.png')
    expect(await assetBytes(plain, plainSite.slug, 'plain.png')).toEqual(plainBytes)
    expect(counting.transforms()).toBe(0)

    // 4. No renderer: promotion still succeeds and places the stored bytes,
    // even when the record carries a recipe.
    const bare = 'ac2590-bare'
    const bareSite = await makeD1Site({ tenantId: bare, slug: 'ac2590e' })
    const bareBytes = await png(40, 20)
    const bareMaterial = await upload(bare, { bytes: bareBytes, name: 'bare.png', role: 'reference' }, null)
    const bareUid = String(bareMaterial.uid)
    const bareEdit = await post(bare, '/api/material/recipe', { uid: bareUid, recipe: QUARTER_TURN }, null)
    expect(bareEdit.body.rendered).toBe(false)
    const barePromoted = await post(bare, '/api/material/role', { uid: bareUid, role: 'site' }, null)
    expect(barePromoted.body.site_asset).toBe('bare.png')
    expect(await assetBytes(bare, bareSite.slug, 'bare.png')).toEqual(bareBytes)
    expect((await stored(bare, bareUid)).fields.placed_as).toEqual([
      { slug: bareSite.slug, name: 'bare.png' },
    ])
  })

  it('test_UAT_AC2591_a_recipe_change_replaces_the_placed_bytes_at_the_recorded_name_and_reports_it', async () => {
    // 1. The client's recipe route.
    const tenant = 'ac2591-route'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2591a' })
    const material = await upload(tenant, { bytes: await png(40, 20), name: 'shopfront.png', slug: site.slug })
    const uid = String(material.uid)
    expect(material.site_asset).toBe('shopfront.png')

    // Publish the unedited picture first, so the frozen revision can be checked later.
    const first = await publishSite(site.store, site.slug, { message: 'before the edit' })
    expect(first.published).toBe(true)

    const pagesBefore = JSON.stringify(await site.store.readPages(site.slug))
    const assetsBefore = await site.store.listAssets(site.slug)
    const journalBefore = (await site.store.changesSince(site.slug)).changes.length

    const edited = await post(tenant, '/api/material/recipe', { uid, recipe: QUARTER_TURN })
    expect(edited.status).toBe(200)
    expect(edited.body.rendered).toBe(true)
    expect(edited.body.republished).toEqual([{ slug: site.slug, name: 'shopfront.png', replaced: true }])

    // Same names, new bytes at the recorded name, pages untouched.
    expect(await site.store.listAssets(site.slug)).toEqual(assetsBefore)
    expect(await sizeOnSite(tenant, site.slug, 'shopfront.png')).toEqual({ width: 20, height: 40 })
    expect(JSON.stringify(await site.store.readPages(site.slug))).toBe(pagesBefore)

    // One draft-journal entry, a replacement naming the asset.
    const changes = (await site.store.changesSince(site.slug)).changes
    const added = changes.slice(journalBefore)
    expect(added.map((c) => c.op)).toEqual(['asset.replace'])
    expect(added[0].label).toBe('shopfront.png')

    // The earlier published revision keeps its bytes; the next publish carries the edit.
    const frozen = await site.store.readRevision(site.slug, first.id)
    const frozenAsset = frozen?.assets.find((a) => a.name === 'shopfront.png')
    expect(frozenAsset).toBeDefined()
    expect((await decodePng(frozenAsset!.bytes, 'frozen')).width).toBe(40)
    const next = await publishSite(site.store, site.slug, { message: 'after the edit' })
    const fresh = await site.store.readRevision(site.slug, next.id)
    const freshAsset = fresh?.assets.find((a) => a.name === 'shopfront.png')
    expect(freshAsset).toBeDefined()
    expect(await decodePng(freshAsset!.bytes, 'fresh')).toMatchObject({ width: 20, height: 40 })

    // 2. The assistant's edit_image goes through the same propagation.
    const viaTool = 'ac2591-tool'
    const toolSite = await makeD1Site({ tenantId: viaTool, slug: 'ac2591b' })
    const terrace = await upload(viaTool, { bytes: await png(40, 20), name: 'terrace.png', slug: toolSite.slug })
    const toolAssets = await toolSite.store.listAssets(toolSite.slug)
    const toolJournal = (await toolSite.store.changesSince(toolSite.slug)).changes.length
    await (await assistantImages(viaTool, toolSite.slug)).edit_image({
      image: String(terrace.uid),
      edits: QUARTER_TURN,
    })
    expect(await sizeOnSite(viaTool, toolSite.slug, 'terrace.png')).toEqual({ width: 20, height: 40 })
    expect(await toolSite.store.listAssets(toolSite.slug)).toEqual(toolAssets)
    const toolChanges = (await toolSite.store.changesSince(toolSite.slug)).changes.slice(toolJournal)
    expect(toolChanges.some((c) => c.op === 'asset.replace' && c.label === 'terrace.png')).toBe(true)

    // 3. A picture never promoted gains no site asset.
    const never = 'ac2591-never'
    const neverSite = await makeD1Site({ tenantId: never, slug: 'ac2591c' })
    const neverAssets = await neverSite.store.listAssets(neverSite.slug)
    const reference = await upload(never, { bytes: await png(40, 20), name: 'notes.png', role: 'reference' })
    const neverEdit = await post(never, '/api/material/recipe', { uid: reference.uid, recipe: QUARTER_TURN })
    expect(neverEdit.status).toBe(200)
    expect(neverEdit.body.republished).toEqual([])
    expect(await neverSite.store.listAssets(neverSite.slug)).toEqual(neverAssets)

    // 4. No renderer: the recipe is stored, rendered false, republished empty,
    // and the site is unchanged.
    const bare = 'ac2591-bare'
    const bareSite = await makeD1Site({ tenantId: bare, slug: 'ac2591d' })
    const bareBytes = await png(40, 20)
    const placed = await upload(bare, { bytes: bareBytes, name: 'sign.png', slug: bareSite.slug }, null)
    expect(placed.site_asset).toBe('sign.png')
    const bareEdit = await post(bare, '/api/material/recipe', { uid: placed.uid, recipe: QUARTER_TURN }, null)
    expect(bareEdit.status).toBe(200)
    expect(bareEdit.body.rendered).toBe(false)
    expect(bareEdit.body.republished).toEqual([])
    expect((await stored(bare, String(placed.uid))).fields.edits).toEqual(QUARTER_TURN)
    expect(await assetBytes(bare, bareSite.slug, 'sign.png')).toEqual(bareBytes)
  })

  it('test_UAT_AC2592_promoting_a_recorded_picture_again_overwrites_at_its_name_and_mints_no_duplicate', async () => {
    const tenant = 'ac2592-again'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2592a' })
    const material = await upload(tenant, { bytes: await png(40, 20), name: 'logo.png', slug: site.slug })
    const uid = String(material.uid)
    expect(material.site_asset).toBe('logo.png')
    const assetsBefore = await site.store.listAssets(site.slug)

    // The recipe is written on the record only, so nothing propagates yet.
    await patchRecord(tenant, uid, { edits: QUARTER_TURN })
    expect((await sizeOnSite(tenant, site.slug, 'logo.png')).width).toBe(40)

    // Promote onto the same site again.
    const again = await post(tenant, '/api/material/role', { uid, role: 'site' })
    expect(again.status).toBe(200)
    expect(again.body.site_asset).toBe('logo.png')
    expect(await site.store.listAssets(site.slug)).toEqual(assetsBefore)
    expect(await site.store.listAssets(site.slug)).not.toContain('logo-2.png')
    expect(await sizeOnSite(tenant, site.slug, 'logo.png')).toEqual({ width: 20, height: 40 })

    const record = await stored(tenant, uid)
    expect(record.fields.placed_on).toEqual([site.slug])
    expect(record.fields.placed_as).toEqual([{ slug: site.slug, name: 'logo.png' }])

    // Placed before names were recorded (a slug in placed_on, no placed_as entry):
    // treated as a first placement, which takes a free name and records it.
    const legacy = 'ac2592-legacy'
    const legacySite = await makeD1Site({ tenantId: legacy, slug: 'ac2592b' })
    const old = await upload(legacy, { bytes: await png(40, 20), name: 'badge.png', slug: legacySite.slug })
    const oldUid = String(old.uid)
    expect(old.site_asset).toBe('badge.png')
    await patchRecord(legacy, oldUid, { placed_as: [] })
    expect((await stored(legacy, oldUid)).fields.placed_on).toEqual([legacySite.slug])

    const replaced = await post(legacy, '/api/material/role', { uid: oldUid, role: 'site' })
    expect(replaced.body.site_asset).toBe('badge-2.png')
    expect(await legacySite.store.listAssets(legacySite.slug)).toContain('badge-2.png')
    const legacyRecord = await stored(legacy, oldUid)
    expect(legacyRecord.fields.placed_on).toEqual([legacySite.slug])
    expect(legacyRecord.fields.placed_as).toEqual([{ slug: legacySite.slug, name: 'badge-2.png' }])
  })

  it('test_UAT_AC2593_a_recorded_name_gone_from_the_site_is_reported_and_never_re_added', async () => {
    // 1. One placement, its asset deleted from the site.
    const tenant = 'ac2593-gone'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2593a' })
    const material = await upload(tenant, { bytes: await png(40, 20), name: 'banner.png', slug: site.slug })
    const uid = String(material.uid)
    await site.store.write(site.slug, { removeAssets: ['banner.png'] })
    const assetsAfterDelete = await site.store.listAssets(site.slug)
    expect(assetsAfterDelete).not.toContain('banner.png')

    const edited = await post(tenant, '/api/material/recipe', { uid, recipe: QUARTER_TURN })
    expect(edited.status).toBe(200)
    const republished = edited.body.republished as Record<string, unknown>[]
    expect(republished).toHaveLength(1)
    expect(republished[0]).toMatchObject({ slug: site.slug, name: 'banner.png', replaced: false })
    expect(String(republished[0].error)).toMatch(/banner\.png.*is not in site/)
    expect(await site.store.listAssets(site.slug)).toEqual(assetsAfterDelete)
    expect((await stored(tenant, uid)).fields.edits).toEqual(QUARTER_TURN)

    // 2. Two placements, one gone: the other is still replaced.
    const pair = 'ac2593-pair'
    const kept = await makeD1Site({ tenantId: pair, slug: 'ac2593b' })
    const lost = await makeD1Site({ tenantId: pair, slug: 'ac2593c' })
    const both = await upload(pair, { bytes: await png(40, 20), name: 'mark.png', slug: kept.slug })
    const bothUid = String(both.uid)
    const onLost = (await (await catalogue(pair, lost.slug)).place_on_site({
      item: bothUid,
    })) as Record<string, unknown>
    expect(onLost.asset).toBe('mark.png')
    await lost.store.write(lost.slug, { removeAssets: ['mark.png'] })
    const lostAssets = await lost.store.listAssets(lost.slug)

    const pairEdit = await post(pair, '/api/material/recipe', { uid: bothUid, recipe: QUARTER_TURN })
    expect(pairEdit.status).toBe(200)
    const report = pairEdit.body.republished as Record<string, unknown>[]
    expect(report).toHaveLength(2)
    expect(report.find((r) => r.slug === kept.slug)).toEqual({
      slug: kept.slug,
      name: 'mark.png',
      replaced: true,
    })
    const missing = report.find((r) => r.slug === lost.slug)
    expect(missing).toMatchObject({ slug: lost.slug, name: 'mark.png', replaced: false })
    expect(String(missing?.error)).toMatch(/is not in site/)
    expect(await sizeOnSite(pair, kept.slug, 'mark.png')).toEqual({ width: 20, height: 40 })
    expect(await lost.store.listAssets(lost.slug)).toEqual(lostAssets)

    // 3. Through edit_image: the missing name is not re-added and the edit lands.
    const assistant = 'ac2593-tool'
    const toolSite = await makeD1Site({ tenantId: assistant, slug: 'ac2593d' })
    const pic = await upload(assistant, { bytes: await png(40, 20), name: 'porch.png', slug: toolSite.slug })
    await toolSite.store.write(toolSite.slug, { removeAssets: ['porch.png'] })
    const toolAssets = await toolSite.store.listAssets(toolSite.slug)
    const answer = (await (await assistantImages(assistant, toolSite.slug)).edit_image({
      image: String(pic.uid),
      edits: QUARTER_TURN,
    })) as Record<string, unknown>
    expect(answer.edits).toEqual(QUARTER_TURN)
    expect(await toolSite.store.listAssets(toolSite.slug)).toEqual(toolAssets)
    expect((await stored(assistant, String(pic.uid))).fields.edits).toEqual(QUARTER_TURN)
  })
})
