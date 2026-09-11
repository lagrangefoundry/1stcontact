import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import {
  cachedRenderer,
  imageRendererFor,
  imagesRenderer,
  materialRecipes,
  r2Renditions,
} from '../apps/control-app/src/image-edit'
import { materialImageLibrary } from '../apps/control-app/src/material'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import {
  route,
  sessionPicturesFor,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { storeFor as siteStoreFor } from '../apps/control-app/src/store'
import type { Scope } from '../apps/control-app/src/scope'
import type { EditOp, ImageRenderer } from '../tools/generate/src/cli/image-recipe'
import type { StoredImage } from '../tools/generate/src/cli/image-library'
import { applySchema, makeD1Site } from './support/d1-site-factory'

/**
 * REQ-219 — **one renderer**: the recipe, applied by the Cloudflare Images
 * binding, against the real binding rather than a stand-in for it.
 *
 * WHAT THIS SUITE CAN AND CANNOT PROVE, stated up front because it shapes every
 * assertion below. The binding here is the real API, backed locally by
 * Miniflare's own implementation — which honours `rotate`, `width` and `height`
 * and **silently drops** trim, gravity and every colour adjustment. So:
 *
 *   - the transform CHAIN is asserted in the node suite, exactly, because that
 *     is where the logic is and a crop asserted in pixels here would pass
 *     against an uncropped image;
 *   - the BYTES are asserted here only for the operations the local renderer
 *     really performs, so what passes is a real transform and not a fixture;
 *   - everything around the renderer — the rendition cache and where it writes,
 *     the recipe on the record, the Library's two answers, the route — is fully
 *     exercised, because none of it depends on which pixels came back.
 *
 * A run against a deployed binding would additionally prove the crop and the
 * colour adjustments. Nothing here would have to change for it to.
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

/** A solid picture with a differently-coloured corner, so a turn is visible. */
function raster(width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 40
    data[i * 3 + 1] = 90
    data[i * 3 + 2] = 160
  }
  // One corner pixel, so a rotation is not merely a change of dimensions.
  data[0] = 250
  data[1] = 250
  data[2] = 250
  return { data, width, height, channels: 3 }
}

/** A real PNG of those pixels — the fixture this product's own codec writes. */
async function png(width: number, height: number): Promise<Uint8Array> {
  return encodePng(raster(width, height))
}

/** One picture in the client's Library, created the way ingestion creates one. */
async function libraryPicture(
  tickets: TicketStore,
  bytes: Uint8Array,
  filename = 'shopfront.png',
): Promise<string> {
  const { ticket } = await tickets.create({
    type: 'material',
    title: 'A wide shopfront at dusk',
    body: 'A photograph of a shopfront.',
    fields: {
      kind: 'image',
      rights: 'owned',
      republishable: true,
      exportable: false,
      origin: 'uploaded',
      role: 'site',
      filename,
      content_type: 'image/png',
    },
  })
  await tickets.attach({ uid: ticket.uid, bytes, filename, content_type: 'image/png' })
  return ticket.uid
}

function storedImage(uid: string): StoredImage {
  return {
    name: uid,
    where: 'library',
    mediaType: 'image/png',
    title: 'A wide shopfront at dusk',
    aliases: ['shopfront.png'],
  }
}

beforeAll(async () => {
  await APPLIED
})

// ── AC1 — the binding applies the recipe ─────────────────────────────────────

describe('REQ-219 AC1 — the Cloudflare Images binding applies the recipe', () => {
  it('test_UAT_FC_REQ-219_a_quarter_turn_is_applied_by_the_binding', async () => {
    // THROUGH THE REAL BINDING API. `rotate` is one of the operations the local
    // implementation genuinely performs, so these are transformed pixels and not
    // the input handed back.
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    const source = await png(40, 20)
    const out = await renderer.render(source, 'image/png', [{ op: 'rotate', degrees: 90 }])

    expect(out.mediaType).toBe('image/png')
    // What the compiler said it would be…
    expect({ width: out.width, height: out.height }).toEqual({ width: 20, height: 40 })
    // …and what the bytes actually are.
    const decoded = await decodePng(out.bytes, 'rotated')
    expect({ width: decoded.width, height: decoded.height }).toEqual({ width: 20, height: 40 })
  })

  it('test_UAT_FC_REQ-219_a_resize_is_applied_by_the_same_call', async () => {
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    const out = await renderer.render(await png(40, 20), 'image/png', [
      { op: 'resize', width: 20 },
    ])
    expect({ width: out.width, height: out.height }).toEqual({ width: 20, height: 10 })
    const decoded = await decodePng(out.bytes, 'resized')
    expect({ width: decoded.width, height: decoded.height }).toEqual({ width: 20, height: 10 })
  })

  it('test_UAT_FC_REQ-219_a_picture_keeps_the_format_it_was_stored_as', async () => {
    // Re-encoding a client's logo into a format they did not choose is the kind
    // of quiet change noticed a month later on a printed brochure.
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    const out = await renderer.render(await png(40, 20), 'image/png', [
      { op: 'rotate', degrees: 180 },
    ])
    expect(out.mediaType).toBe('image/png')
  })

  it('test_UAT_FC_REQ-219_an_unedited_picture_pays_no_transform_at_all', async () => {
    // Every picture in the Library is in this state today, and none of them
    // should start paying for a renderer they do not use. The SAME bytes come
    // back — not an identity transform's re-encoding of them.
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    const source = await png(40, 20)
    const out = await renderer.render(source, 'image/png', [])
    expect(out.bytes).toBe(source)
    expect({ width: out.width, height: out.height }).toEqual({ width: 40, height: 20 })
  })

  it('test_UAT_FC_REQ-219_a_drawing_is_refused_rather_than_flattened', async () => {
    // An SVG has no fixed size in pixels, so a recipe written in fractions of it
    // has nothing to be a fraction of; a GIF may be animated and every transform
    // here would silently flatten it to one frame. Refused BEFORE anything is
    // written, so the assistant is told and redraws instead.
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    await expect(renderer.measure(await png(8, 8), 'image/svg+xml')).rejects.toThrow(
      /stored as itself rather than edited/,
    )
    await expect(renderer.measure(await png(8, 8), 'image/gif')).rejects.toThrow(
      /stored as itself rather than edited/,
    )
  })

  it('test_UAT_FC_REQ-219_a_delivery_width_is_not_an_edit', async () => {
    // Editorial versions are what the picture IS; delivery renditions are the
    // same picture at several widths. A width renders smaller and leaves the
    // recipe alone — and a width wider than the picture enlarges nothing.
    const renderer = imagesRenderer(env.IMAGES as ImagesBinding)
    const source = await png(40, 20)
    const smaller = await renderer.render(source, 'image/png', [], { width: 20 })
    expect((await decodePng(smaller.bytes, 'delivered')).width).toBe(20)
    const larger = await renderer.render(source, 'image/png', [], { width: 400 })
    expect(larger.bytes).toBe(source)
  })
})

// ── AC2 — renditions are content-addressed, and out of the sweep's way ───────

describe('REQ-219 AC2 — nothing is recomputed that has not changed', () => {
  /** The real renderer, counting how often it is actually asked to transform. */
  function counted(): { renderer: ImageRenderer; calls: () => number } {
    const real = imagesRenderer(env.IMAGES as ImagesBinding)
    let calls = 0
    return {
      calls: () => calls,
      renderer: {
        measure: real.measure,
        async render(bytes, mediaType, recipe, opts) {
          calls++
          return real.render(bytes, mediaType, recipe, opts)
        },
      },
    }
  }

  it('test_UAT_FC_REQ-219_the_same_recipe_is_rendered_once', async () => {
    const tenant = 'req219-cache'
    const { renderer, calls } = counted()
    const cached = cachedRenderer(renderer, r2Renditions(env.BLOBS as R2Bucket, tenant))
    const source = await png(40, 20)
    const recipe: EditOp[] = [{ op: 'rotate', degrees: 90 }]

    const first = await cached.render(source, 'image/png', recipe)
    const second = await cached.render(source, 'image/png', recipe)

    expect(calls()).toBe(1)
    // A CACHE HIT ANSWERS THE SAME SHAPE A MISS DOES — the dimensions travel
    // with the bytes, so a caller cannot tell which it got.
    expect(second.bytes).toEqual(first.bytes)
    expect({ width: second.width, height: second.height }).toEqual({ width: 20, height: 40 })
    expect(second.mediaType).toBe('image/png')

    // ADDRESSED ON THE RECIPE AND THE WIDTH TOO, not on the original alone.
    await cached.render(source, 'image/png', [{ op: 'rotate', degrees: 180 }])
    expect(calls()).toBe(2)
    await cached.render(source, 'image/png', recipe, { width: 10 })
    expect(calls()).toBe(3)
  })

  it('test_UAT_FC_REQ-219_renditions_are_kept_out_of_the_ticket_stores_keyspace', async () => {
    // THE STORAGE DECISION WORTH A TEST. The ticketing component's orphan sweep
    // lists every key under `t/<tenant>/` and deletes whatever no attachment
    // record names — and a rendition is by construction a key no record names.
    // Writing one there would put a cache into a collector's input, and the
    // failure would be a picture going blank an hour after it was cropped.
    const tenant = 'req219-prefix'
    const cached = cachedRenderer(
      imagesRenderer(env.IMAGES as ImagesBinding),
      r2Renditions(env.BLOBS as R2Bucket, tenant),
    )
    await cached.render(await png(40, 20), 'image/png', [{ op: 'rotate', degrees: 90 }])

    const ours = await (env.BLOBS as R2Bucket).list({ prefix: `rendition/${tenant}/` })
    expect(ours.objects.length).toBe(1)
    // TENANT-PREFIXED even though the address is already a content hash: a
    // global content address is an existence oracle across the barrier.
    const other = await (env.BLOBS as R2Bucket).list({ prefix: 'rendition/someone-else/' })
    expect(other.objects.length).toBe(0)
    // And nothing at all in the swept keyspace.
    const swept = await (env.BLOBS as R2Bucket).list({ prefix: 't/' })
    for (const object of swept.objects) expect(object.key).not.toContain('rendition')
  })
})

// ── AC3 — the recipe lives on the record, and the bytes never change ─────────

describe('REQ-219 AC3 — the original is kept forever', () => {
  it('test_UAT_FC_REQ-219_a_recipe_is_a_field_on_the_material_record', async () => {
    const tenant = 'req219-field'
    await makeD1Site({ tenantId: tenant, slug: 'req219a' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const uid = await libraryPicture(tickets, await png(40, 20))

    const recipes = materialRecipes(tickets)
    // ABSENCE READS AS THE EMPTY RECIPE, so every picture that predates the
    // field is unedited rather than unknown, and nothing needs migrating.
    expect(await recipes.read(uid)).toEqual([])

    await recipes.write(uid, [{ op: 'crop', left: 0.2, right: 0.2, top: 0, bottom: 0 }])
    expect(await recipes.read(uid)).toEqual([
      { op: 'crop', left: 0.2, right: 0.2, top: 0, bottom: 0 },
    ])
  })

  it('test_UAT_FC_REQ-219_editing_changes_the_recipe_and_never_the_stored_bytes', async () => {
    // THE PROPERTY THE WHOLE MODEL EXISTS FOR. What the client handed over is
    // still there, byte for byte, after the picture has been cropped, turned and
    // desaturated — so any past state stays reachable by editing an operation.
    const tenant = 'req219-original'
    await makeD1Site({ tenantId: tenant, slug: 'req219b' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)

    await materialRecipes(tickets).write(uid, [
      { op: 'crop', left: 0.1, top: 0, right: 0.1, bottom: 0 },
      { op: 'rotate', degrees: 90 },
      { op: 'adjust', saturation: 0 },
    ])

    const { attachments } = await tickets.attachments({ uid })
    const stored = await tickets.blobs!.get(attachments[0].uid)
    expect(stored).toEqual(source)
  })
})

// ── AC4 — the assistant's view, and the builder's ────────────────────────────

describe('REQ-219 AC4 — the picture as it currently stands', () => {
  it('test_UAT_FC_REQ-219_the_assistant_sees_the_picture_with_its_recipe_applied', async () => {
    // REQ-218 declared `original` and left it as the seam this fills. `false` is
    // the picture as it stands; `true` is what the crop took away, which is a
    // real question and has to stay reachable.
    const tenant = 'req219-look'
    await makeD1Site({ tenantId: tenant, slug: 'req219c' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)
    await materialRecipes(tickets).write(uid, [{ op: 'rotate', degrees: 90 }])

    const renderer = imageRendererFor(routerEnv(), tenant)!
    const library = materialImageLibrary(tickets, renderer)
    const picture = { ...storedImage(uid) }

    const current = await library.read(picture, { original: false })
    expect((await decodePng(current, 'current')).width).toBe(20)

    const original = await library.read(picture, { original: true })
    expect(original).toEqual(source)
  })

  it('test_UAT_FC_REQ-219_without_a_renderer_every_picture_is_its_own_original', async () => {
    // A deployment with no `[images]` binding has no way to apply a recipe and
    // no way to have written one, so both answers are the same bytes — which is
    // exactly what this returned before recipes existed, not a degraded mode.
    const tenant = 'req219-norenderer'
    await makeD1Site({ tenantId: tenant, slug: 'req219d' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)
    await materialRecipes(tickets).write(uid, [{ op: 'rotate', degrees: 90 }])

    expect(imageRendererFor({ BLOBS: env.BLOBS as R2Bucket }, tenant)).toBeNull()
    const library = materialImageLibrary(tickets)
    expect(await library.read(storedImage(uid), { original: false })).toEqual(source)
  })

  it('test_UAT_FC_REQ-219_a_deployment_with_no_binding_composes_no_editing_surface', async () => {
    // NULL RATHER THAN A SURFACE THAT THROWS. The manual never mentions editing,
    // so the model cannot propose, apologise for, or probe for a capability the
    // session has not got — the same shape a missing browser already has. The
    // session still opens and every other tool keeps working.
    const tenant = 'req219-nobinding'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req219f' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const store = await siteStoreFor(routerEnv(), scopeOf(tenant))

    const withBinding = sessionPicturesFor(routerEnv(), scopeOf(tenant), store, tickets)
    expect(withBinding).not.toBeNull()
    expect(withBinding!(site.slug).recipes.library).toBeDefined()
    // And the site's own half carries no recipe store at all, which is what the
    // refusal for a site file is made of.
    expect(withBinding!(site.slug).recipes.site).toBeUndefined()

    const withoutBinding = { ...routerEnv(), IMAGES: undefined } as RouterEnv
    expect(sessionPicturesFor(withoutBinding, scopeOf(tenant), store, tickets)).toBeNull()
  })

  it('test_UAT_FC_REQ-219_the_builder_is_served_the_current_state_and_the_original', async () => {
    // The Library's existing detail pane shows the edited picture with no change
    // of its own, and REQ-220's modal has the route it needs — including the
    // "before" the client will want to see beside it.
    const tenant = 'req219-route'
    await makeD1Site({ tenantId: tenant, slug: 'req219e' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)
    await materialRecipes(tickets).write(uid, [{ op: 'rotate', degrees: 90 }])

    const deps: RouterDeps = {}
    const current = await route(
      new Request(`https://app.test/api/material/file?uid=${uid}`),
      routerEnv(),
      scopeOf(tenant),
      deps,
    )
    expect(current.status).toBe(200)
    const currentBytes = new Uint8Array(await current.arrayBuffer())
    expect((await decodePng(currentBytes, 'route-current')).width).toBe(20)

    const before = await route(
      new Request(`https://app.test/api/material/file?uid=${uid}&original=1`),
      routerEnv(),
      scopeOf(tenant),
      deps,
    )
    expect(new Uint8Array(await before.arrayBuffer())).toEqual(source)
  })
})
