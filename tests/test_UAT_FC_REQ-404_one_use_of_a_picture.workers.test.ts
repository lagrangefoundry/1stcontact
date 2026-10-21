import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { chatLibrary } from '../apps/control-app/src/library'
import { libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { imageRendererFor } from '../apps/control-app/src/image-edit'
import type { Scope } from '../apps/control-app/src/scope'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation } from '../tools/generate/src/cli/ai/delegation'
import { applySchema, ensureTenant, makeD1Site } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * REQ-404 — **one use of a picture, and a Library item behind every picture on
 * a site**: the origin's half.
 *
 * WHAT THIS FILE PROVES, in the ticket's order:
 *
 *  1. THE SITE TAB'S EDITOR OPENS ON ONE USE. `GET /api/site/picture` names the
 *     Library item behind the file the page points at, and the recipe that use
 *     shows — the item's own where the use has none.
 *  2. A CHANGE WRITES THAT USE'S OWN RECIPE. `POST /api/site/picture/recipe`
 *     re-renders that file alone; the Library item's recipe and every other copy
 *     — including a second use on the same page — are unchanged.
 *  3. A DRAWING IS A LIBRARY ITEM, and placing it records the placement
 *     ([[REQ-423]]: `draw_image` draws into the Library) — and every other road
 *     onto a site is catalogued too, because the door is the store's.
 *  4. THE BACKFILL CATALOGUES AN ORPHAN AND CHANGES NOTHING ON THE SITE.
 *  5. AN ORPHAN IS A LOUD FAULT, named, not a silent "not editable".
 *
 * ASSERTED WITH `rotate`, for REQ-229's reason: the local `IMAGES` binding really
 * performs a quarter turn and silently drops crops, so a framing is told apart by
 * the picture's width and height swapping — read off the store's own bytes.
 *
 * DOUBLES: the describers and the model, which are boundaries miniflare cannot
 * reach and about which nothing here claims anything.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'

const scopeOf = (businessId: string): Scope => ({ businessId })

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: env.IMAGES as ImagesBinding,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({ text: 'A salon chair by a window.', model: 'stub/vision-1' }),
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
  return { data, width, height, channels: 3 }
}

const TURN = [{ op: 'rotate', degrees: 90 }]

/** A drawing that passes the SVG envelope. */
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
  '<rect x="1" y="1" width="8" height="8" fill="#1a3a6b"/></svg>'

async function call(
  tenant: string,
  path: string,
  init?: { method?: string; payload?: unknown },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await route(
    new Request(`${ORIGIN}${path}`, {
      method: init?.method ?? (init?.payload === undefined ? 'GET' : 'POST'),
      ...(init?.payload === undefined
        ? {}
        : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(init.payload) }),
    }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return { status: response.status, body: (await response.json()) as Record<string, unknown> }
}

/** A 40×20 photograph dropped on the open site — placed there as `chair.png`. */
async function uploadChair(tenant: string, slug: string): Promise<string> {
  const form = new FormData()
  form.append(
    'file',
    new File([(await encodePng(raster(40, 20))) as unknown as BlobPart], 'chair.png', { type: 'image/png' }),
  )
  form.append('role', 'site')
  form.append('site', slug)
  const response = await route(
    new Request(`${ORIGIN}/api/material`, { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  const uploaded = (await response.json()) as Record<string, unknown>
  expect(uploaded.site_asset).toBe('chair.png')
  return String(uploaded.uid)
}

async function material(tenant: string, uid: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await tickets.get({ uid })).ticket
}

async function materialRows(tenant: string): Promise<Record<string, unknown>[]> {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const { tickets: rows } = await tickets.list({ type: 'material', limit: 'all' })
  return rows.map((t) => ({ uid: t.uid, ...t.fields }))
}

async function sizeOnSite(tenant: string, slug: string, name: string) {
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const bytes = await sites.readAsset(slug, name)
  expect(bytes, `no asset called '${name}' on '${slug}'`).not.toBeNull()
  return decodePng(bytes as Uint8Array, name).then(({ width, height }) => ({ width, height }))
}

async function placeAs(tenant: string, slug: string, uid: string, as: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const ops = libraryOperations(chatLibrary(tickets, sites, slug, imageRendererFor(routerEnv(), tenant) ?? undefined))
  await ops.place_on_site({ item: uid, as })
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-404 — the photo editor over one use of a picture', () => {
  it('test_UAT_FC_REQ-404_the_editor_opens_on_the_item_and_the_recipe_that_use_shows', async () => {
    const tenant = 'req404-open'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404a' })
    const uid = await uploadChair(tenant, site.slug)
    // The Library item is already cropped — turned — before the editor opens.
    expect((await call(tenant, '/api/material/recipe', { payload: { uid, recipe: TURN } })).status).toBe(200)

    const opened = await call(tenant, `/api/site/picture?site=${site.slug}&name=chair.png`)

    expect(opened.status).toBe(200)
    expect(opened.body.uid).toBe(uid)
    expect(opened.body.label).toBe((await material(tenant, uid)).fields.label)
    expect(opened.body.label).toMatch(/^IMAGE-\d+$/)
    // A use with no recipe of its own starts from the material's.
    expect(opened.body.edits).toEqual(TURN)
    expect(opened.body.own).toBe(false)
    expect(opened.body.editable).toBe(true)
  })

  it('test_UAT_FC_REQ-404_a_change_writes_that_use_alone_and_leaves_the_item_and_other_copies', async () => {
    const tenant = 'req404-write'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404b' })
    const uid = await uploadChair(tenant, site.slug)
    // Two uses of one Library item on the site.
    await placeAs(tenant, site.slug, uid, 'chair-left.png')

    const saved = await call(tenant, '/api/site/picture/recipe', {
      payload: { site: site.slug, name: 'chair-left.png', recipe: TURN },
    })

    expect(saved.status).toBe(200)
    expect(saved.body.rendered).toBe(true)
    expect(saved.body.edits).toEqual(TURN)
    expect(saved.body.own).toBe(true)
    // ONE item behind both uses: the door does not catalogue a Library
    // placement a second time.
    expect(await materialRows(tenant)).toHaveLength(1)
    // That file is re-rendered; the other use is as it was.
    expect(await sizeOnSite(tenant, site.slug, 'chair-left.png')).toEqual({ width: 20, height: 40 })
    expect(await sizeOnSite(tenant, site.slug, 'chair.png')).toEqual({ width: 40, height: 20 })
    // The recipe is on THIS placement; the Library item's own is untouched.
    const ticket = await material(tenant, uid)
    expect(ticket.fields.edits ?? []).toEqual([])
    const placed = ticket.fields.placed_as as Record<string, unknown>[]
    expect(placed.find((p) => p.name === 'chair-left.png')?.edits).toEqual(TURN)
    expect(placed.find((p) => p.name === 'chair.png')?.edits).toBeUndefined()
    // And a later Library edit does not reach the use framed on its own.
    await call(tenant, '/api/material/recipe', { payload: { uid, recipe: [{ op: 'rotate', degrees: 180 }] } })
    expect(await sizeOnSite(tenant, site.slug, 'chair-left.png')).toEqual({ width: 20, height: 40 })
  })

  it('test_UAT_FC_REQ-404_a_refused_recipe_leaves_the_use_as_it_was', async () => {
    const tenant = 'req404-refuse'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404c' })
    const uid = await uploadChair(tenant, site.slug)

    const refused = await call(tenant, '/api/site/picture/recipe', {
      payload: { site: site.slug, name: 'chair.png', recipe: [{ op: 'crop', left: 0.6, right: 0.6 }] },
    })

    expect(refused.status).toBeGreaterThanOrEqual(400)
    const placed = (await material(tenant, uid)).fields.placed_as as Record<string, unknown>[]
    expect(placed.find((p) => p.name === 'chair.png')?.edits).toBeUndefined()
    expect(await sizeOnSite(tenant, site.slug, 'chair.png')).toEqual({ width: 40, height: 20 })
  })
})

describe('REQ-404 — every picture on a site has a Library item', () => {
  it('test_UAT_FC_REQ-404_a_drawing_is_a_library_item_and_placing_it_records_the_placement', async () => {
    const tenant = 'req404-draw'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404d' })
    const opened = await call(tenant, '/api/ai/session', { payload: { site: site.slug } })
    expect(opened.status).toBe(200)
    // [[REQ-423]] — drawn into the Library, then placed by its filename (an alias
    // the catalogue resolves), under the shipped configuration.
    setModelClient(
      scriptedClient([
        calls('draw_image', { name: 'wordmark', svg: MARK, description: 'A navy square mark.' }),
        calls('place_on_site', { item: 'wordmark.svg' }),
        says('Done.'),
      ]),
    )
    const streamed = await route(
      new Request(`${ORIGIN}/api/ai/prompt`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: opened.body.sessionId, text: 'Draw us a mark.' }),
      }),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    await streamed.text()

    expect(await site.store.listAssets(site.slug)).toContain('wordmark.svg')
    const items = (await materialRows(tenant)).filter((row) =>
      (row.placed_as as Record<string, unknown>[] | undefined)?.some(
        (p) => p.slug === site.slug && p.name === 'wordmark.svg',
      ),
    )
    expect(items).toHaveLength(1)
    expect(items[0].origin).toBe('generated')
    expect(items[0].kind).toBe('image')
    expect(items[0].placed_on).toEqual([site.slug])
    // And the Site tab finds it — a drawing, so not offered the photo editor.
    const picture = await call(tenant, `/api/site/picture?site=${site.slug}&name=wordmark.svg`)
    expect(picture.status).toBe(200)
    expect(picture.body.uid).toBe(items[0].uid)
    expect(picture.body.editable).toBe(false)
  })

  it('test_UAT_FC_REQ-404_a_picture_imported_onto_a_site_is_catalogued_once', async () => {
    const tenant = 'req404-import'
    await ensureTenant(tenant)
    const seed = siteSeed({ slug: 'req404e' })
    const bytes = await encodePng(raster(8, 8))
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)

    const imported = await call(tenant, '/api/import', {
      payload: {
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [{ name: 'shopfront.png', base64: btoa(binary) }],
      },
    })

    expect(imported.status).toBe(200)
    const slug = String(imported.body.site)
    const items = (await materialRows(tenant)).filter((row) =>
      (row.placed_as as Record<string, unknown>[] | undefined)?.some(
        (p) => p.slug === slug && p.name === 'shopfront.png',
      ),
    )
    expect(items).toHaveLength(1)
    expect(items[0].origin).toBe('site')
  })

  it('test_UAT_FC_REQ-404_the_backfill_catalogues_an_orphan_and_leaves_the_site_identical', async () => {
    const tenant = 'req404-backfill'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404f' })
    const uid = await uploadChair(tenant, site.slug)
    // An orphan: written past the door, as every picture was before it existed.
    const orphan = await encodePng(raster(8, 8))
    await site.store.write(site.slug, { assets: [{ name: 'orphan.png', bytes: orphan }] })
    const before = {
      siteJson: JSON.stringify(await site.store.readSiteJson(site.slug)),
      pages: JSON.stringify(await site.store.readPages(site.slug)),
      assets: (await site.store.listAssets(site.slug)).sort(),
    }

    const backfilled = await call(tenant, '/api/library/backfill', { payload: {} })

    expect(backfilled.status).toBe(200)
    const created = backfilled.body.created as Record<string, unknown>[]
    expect(created.map((c) => c.asset)).toEqual(['orphan.png'])
    expect(created[0].slug).toBe(site.slug)
    expect(created[0].label).toMatch(/^IMAGE-\d+$/)
    const item = await material(tenant, String(created[0].uid))
    expect(item.fields.placed_as).toEqual([{ slug: site.slug, name: 'orphan.png' }])
    expect(item.fields.origin).toBe('site')
    // The already-catalogued picture is not catalogued again.
    expect(created.some((c) => c.uid === uid)).toBe(false)
    // Nothing on the site changed.
    expect(JSON.stringify(await site.store.readSiteJson(site.slug))).toBe(before.siteJson)
    expect(JSON.stringify(await site.store.readPages(site.slug))).toBe(before.pages)
    expect((await site.store.listAssets(site.slug)).sort()).toEqual(before.assets)
    expect(await site.store.readAsset(site.slug, 'orphan.png')).toEqual(orphan)
    // A second pass finds nothing left to do.
    const again = await call(tenant, '/api/library/backfill', { payload: {} })
    expect(again.body.created).toEqual([])
  })

  it('test_UAT_FC_REQ-404_a_site_picture_with_no_library_item_is_an_error_naming_the_asset', async () => {
    const tenant = 'req404-orphan'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req404g' })
    await site.store.write(site.slug, { assets: [{ name: 'stray.png', bytes: await encodePng(raster(8, 8)) }] })

    const opened = await call(tenant, `/api/site/picture?site=${site.slug}&name=stray.png`)
    const saved = await call(tenant, '/api/site/picture/recipe', {
      payload: { site: site.slug, name: 'stray.png', recipe: TURN },
    })

    for (const answer of [opened, saved]) {
      expect(answer.status).toBe(404)
      expect(answer.body.code).toBe('NOT_IN_LIBRARY')
      expect(answer.body.asset).toBe('stray.png')
      expect(String(answer.body.error)).toContain('stray.png')
    }
    expect(await sizeOnSite(tenant, site.slug, 'stray.png')).toEqual({ width: 8, height: 8 })
  })
})
