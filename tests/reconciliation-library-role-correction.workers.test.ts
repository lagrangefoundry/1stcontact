import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { adoptCapture } from '../apps/control-app/src/capture-material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { bundleNameFor } from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { CaptureResult } from '../tools/generate/src/cli/capture/types'
import { syntheticCapture } from './support/reference-fixtures'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * Library (STORY-1500b111) — correcting what an upload is FOR, the CONTRACT
 * half, as reconciled in BUNDLE-41 (REQ-213).
 *
 * WHAT THIS FILE PROVES: the role route against real D1 and real R2. The
 * correction itself and its validation (AC-2458), the origin gate (AC-2459),
 * the placement a widening triggers (AC-2460), and the refusal of a narrowing
 * once the bytes are on a site (AC-2461). The panel half is
 * `reconciliation-library-role-correction.test.ts`.
 *
 * EVERY FACT IS READ BACK OFF THE TICKET STORE, never off the response alone,
 * so a route that answered correctly and wrote nothing would fail here.
 *
 * THE ONLY DOUBLES are the describers (model boundaries) and, for the one
 * soft-failure case, an R2 bucket that refuses writes, which cannot be
 * produced by arranging real data.
 */

const APPLIED = applySchema()

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

const digest: NonNullable<RouterDeps['describeText']> = async () => ({
  text: 'A note the client handed over.',
  model: 'stub/digest-1',
})
const vision: NonNullable<RouterDeps['describeImage']> = async () => ({
  text: 'A picture the client handed over.',
  model: 'stub/vision-1',
})

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return { index: async () => async () => {}, describeText: digest, describeImage: vision, ...over }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role: string; slug?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role)
  if (file.slug) form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  expect(response.status, 'the upload itself must succeed').toBe(200)
  return (await response.json()) as Record<string, unknown>
}

async function setRole(
  tenant: string,
  payload: Record<string, unknown>,
  over: Partial<RouterEnv> = {},
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(over),
    scopeOf(tenant),
    deps(),
  )
}

const json = async (r: Response) => (await r.json()) as Record<string, unknown>

async function stored(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await store.get({ uid })).ticket.fields
}

beforeAll(async () => {
  await APPLIED
})

describe('AC-2458 — an upload\'s role is corrected, and republishable is derived server-side', () => {
  it('test_UAT_AC2458_upload_role_corrects_both_ways_validates_and_derives_republishable', async () => {
    const tenant = 'ac2458-role'

    // WIDENING: an uploaded `reference` becomes `site`, `republishable` true.
    const background = await upload(tenant, {
      bytes: bytesOf('a photograph dropped in the wrong place'),
      name: 'shop.jpg',
      type: 'image/jpeg',
      role: 'reference',
    })
    expect(background.republishable).toBe(false)
    const widened = await setRole(tenant, { uid: background.uid, role: 'site' })
    expect(widened.status).toBe(200)
    expect(await json(widened)).toMatchObject({ uid: background.uid, role: 'site', republishable: true })
    expect(await stored(tenant, String(background.uid))).toMatchObject({ role: 'site', republishable: true })

    // NARROWING an unplaced site asset: `reference`, `republishable` false.
    const asset = await upload(tenant, {
      bytes: bytesOf('a competitor screenshot'),
      name: 'them.png',
      type: 'image/png',
      role: 'site',
    })
    const narrowed = await setRole(tenant, { uid: asset.uid, role: 'reference' })
    expect(narrowed.status).toBe(200)
    expect(await json(narrowed)).toMatchObject({ role: 'reference', republishable: false })

    // A `republishable` IN THE BODY HAS NO EFFECT.
    const asset2 = await upload(tenant, {
      bytes: bytesOf('another screenshot'),
      name: 'them-too.png',
      type: 'image/png',
      role: 'site',
    })
    const smuggled = await json(
      await setRole(tenant, { uid: asset2.uid, role: 'reference', republishable: true }),
    )
    expect(smuggled.republishable).toBe(false)
    expect(await stored(tenant, String(asset2.uid))).toMatchObject({
      role: 'reference',
      republishable: false,
    })

    // VALIDATED, NEVER COERCED: absent, misspelled, label-not-id → 400, unchanged.
    for (const payload of [
      { uid: background.uid },
      { uid: background.uid, role: 'Site' },
      { uid: background.uid, role: 'Background information' },
    ]) {
      const refused = await setRole(tenant, payload)
      expect(refused.status, JSON.stringify(payload)).toBe(400)
      expect(String((await json(refused)).error)).toMatch(/role must be/)
    }
    // A MISSING OR EMPTY uid → 400.
    expect((await setRole(tenant, { role: 'site' })).status).toBe(400)
    expect((await setRole(tenant, { uid: '', role: 'site' })).status).toBe(400)
    expect(await stored(tenant, String(background.uid))).toMatchObject({ role: 'site', republishable: true })

    // A uid NAMING NO MATERIAL is not-found, and the named record is untouched.
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const { ticket: brief } = await store.create({
      type: 'brief',
      title: 'The brief',
      body: 'Decisions so far.',
      fields: { site_slug: 'somewhere' },
    })
    expect((await setRole(tenant, { uid: brief.uid, role: 'site' })).status).toBe(404)
    expect((await store.get({ uid: brief.uid })).ticket.fields.role).toBeUndefined()
    expect((await store.get({ uid: brief.uid })).ticket.fields.republishable).toBeUndefined()
    expect((await setRole(tenant, { uid: 'material-does-not-exist', role: 'site' })).status).toBe(404)
  })
})

describe('AC-2459 — fetched and captured material is refused 403; no recorded origin counts as uploaded', () => {
  it('test_UAT_AC2459_fetched_and_captured_roles_are_refused_403_unchanged_and_absent_origin_is_uploaded', async () => {
    const tenant = 'ac2459-origin'

    // FETCHED, through the real fetch route.
    const fetched = await json(
      await route(
        new Request('https://app.test/api/material/fetch', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com/report.txt' }),
        }),
        routerEnv(),
        scopeOf(tenant),
        {
          ...deps(),
          fetch: (async () =>
            new Response('An industry report.', {
              status: 200,
              headers: { 'content-type': 'text/plain' },
            })) as typeof fetch,
        },
      ),
    )
    expect(fetched.origin).toBe('fetched')
    const fetchedBefore = await stored(tenant, String(fetched.uid))

    for (const role of ['site', 'reference']) {
      const refused = await setRole(tenant, { uid: fetched.uid, role })
      expect(refused.status, role).toBe(403)
      const body = await json(refused)
      expect(String(body.error)).toMatch(/worked out from where it came from, not chosen/i)
      expect(body.uid).toBe(fetched.uid)
    }
    const fetchedAfter = await stored(tenant, String(fetched.uid))
    expect(fetchedAfter.role).toBe(fetchedBefore.role)
    expect(fetchedAfter.republishable).toBe(fetchedBefore.republishable)

    // CAPTURED, and OWNED + REPUBLISHABLE (the client's own old site).
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const references = await r2ReferenceStore({
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    }).forTenant(tenant)
    const capture = { ...syntheticCapture(), url: 'https://ours.example/', host: 'ours.example' }
    const result: CaptureResult = {
      capture,
      screenshot: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      renderedHtml: '<html><body><h1>Ours</h1></body></html>',
      rawHtml: '<html><body></body></html>',
      assetBytes: new Map(),
    }
    const name = bundleNameFor(capture)
    await writeBundle(references.bundle(name), result)
    const adopted = await adoptCapture(
      tickets,
      references.bundle(name),
      { clientDomain: 'ours.example' },
      { describeImage: vision },
    )
    expect(adopted.ticket.fields).toMatchObject({
      origin: 'captured',
      rights: 'owned',
      republishable: true,
    })
    for (const role of ['site', 'reference']) {
      const refused = await setRole(tenant, { uid: adopted.ticket.uid, role })
      expect(refused.status, role).toBe(403)
      expect((await json(refused)).uid).toBe(adopted.ticket.uid)
    }
    expect(await stored(tenant, adopted.ticket.uid)).toMatchObject({
      role: adopted.ticket.fields.role,
      republishable: true,
    })

    // AN UPLOAD IN THE SAME TENANT IS ACCEPTED — the gate is origin, not tenant
    // state. (Material with no recorded origin cannot be stored: `origin` is a
    // required field of the material pack, so the "absent reads as uploaded"
    // half of this criterion is a surface fact and is proved in the jsdom half.)
    const uploaded = await upload(tenant, {
      bytes: bytesOf('a logo'),
      name: 'logo.png',
      type: 'image/png',
      role: 'reference',
    })
    const accepted = await setRole(tenant, { uid: uploaded.uid, role: 'site' })
    expect(accepted.status).toBe(200)
    expect(await stored(tenant, String(uploaded.uid))).toMatchObject({ role: 'site', republishable: true })
  })
})

describe('AC-2460 — widening places the bytes on the business\'s one site; otherwise not placed, not failed', () => {
  it('test_UAT_AC2460_widening_places_on_the_one_site_and_zero_several_or_failing_sites_leave_the_role_changed', async () => {
    // ONE SITE: placed there, resolved by the server (no slug in the request).
    const one = 'ac2460-one'
    const site = await makeD1Site({ tenantId: one, slug: 'ac2460a' })
    const mis = await upload(one, {
      bytes: bytesOf('the shopfront at dusk'),
      name: 'shopfront.jpg',
      type: 'image/jpeg',
      role: 'reference',
    })
    expect(await site.store.listAssets(site.slug)).not.toContain('shopfront.jpg')
    const placed = await setRole(one, { uid: mis.uid, role: 'site' })
    expect(placed.status).toBe(200)
    const placedRow = await json(placed)
    expect(placedRow.site_asset).toBe('shopfront.jpg')
    expect(placedRow.placed_on).toEqual([site.slug])
    expect(await site.store.listAssets(site.slug)).toContain('shopfront.jpg')
    expect(new TextDecoder().decode((await site.store.readAsset(site.slug, 'shopfront.jpg'))!)).toBe(
      'the shopfront at dusk',
    )
    expect(await stored(one, String(mis.uid))).toMatchObject({ role: 'site', placed_on: [site.slug] })

    // NARROWING NEVER PLACES: an unplaced asset narrowed writes nothing to the site.
    const asset = await upload(one, {
      bytes: bytesOf('a note'),
      name: 'note.png',
      type: 'image/png',
      role: 'site',
    })
    const assetsBefore = await site.store.listAssets(site.slug)
    const narrowed = await json(await setRole(one, { uid: asset.uid, role: 'reference' }))
    expect(narrowed.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).toEqual(assetsBefore)

    // ZERO SITES: 200, role changed, nothing placed, no error, honestly unplaced.
    const none = 'ac2460-none'
    const homeless = await upload(none, {
      bytes: bytesOf('a logo before any site'),
      name: 'logo.svg',
      type: 'image/svg+xml',
      role: 'reference',
    })
    const zero = await setRole(none, { uid: homeless.uid, role: 'site' })
    expect(zero.status).toBe(200)
    const zeroRow = await json(zero)
    expect(zeroRow).toMatchObject({ role: 'site', republishable: true, site_asset: null, placed_on: [] })
    expect(zeroRow.site_asset_error).toBeUndefined()
    expect(await stored(none, String(homeless.uid))).toMatchObject({ role: 'site' })

    // SEVERAL SITES: the server will not guess — not placed, not failed.
    const many = 'ac2460-many'
    const first = await makeD1Site({ tenantId: many, slug: 'ac2460b' })
    const second = await makeD1Site({ tenantId: many, slug: 'ac2460c' })
    const ambiguous = await upload(many, {
      bytes: bytesOf('which site?'),
      name: 'which.png',
      type: 'image/png',
      role: 'reference',
    })
    const several = await setRole(many, { uid: ambiguous.uid, role: 'site' })
    expect(several.status).toBe(200)
    const severalRow = await json(several)
    expect(severalRow).toMatchObject({ role: 'site', site_asset: null, placed_on: [] })
    expect(severalRow.site_asset_error).toBeUndefined()
    expect(await first.store.listAssets(first.slug)).not.toContain('which.png')
    expect(await second.store.listAssets(second.slug)).not.toContain('which.png')

    // A PLACEMENT THAT FAILS: 200, role stands, failure reported beside it.
    const soft = 'ac2460-soft'
    const softSite = await makeD1Site({ tenantId: soft, slug: 'ac2460d' })
    const doomed = await upload(soft, {
      bytes: bytesOf('will not land'),
      name: 'doomed.png',
      type: 'image/png',
      role: 'reference',
    })
    const refuses = new Proxy(env.SITES as R2Bucket, {
      get(target, prop, receiver) {
        if (prop === 'put') {
          return async () => {
            throw new Error('the site bucket is not accepting writes')
          }
        }
        return Reflect.get(target, prop, receiver)
      },
    }) as R2Bucket
    const failed = await setRole(soft, { uid: doomed.uid, role: 'site' }, { SITES: refuses })
    expect(failed.status).toBe(200)
    const failedRow = await json(failed)
    expect(failedRow).toMatchObject({ role: 'site', republishable: true, site_asset: null, placed_on: [] })
    expect(String(failedRow.site_asset_error)).toMatch(/not accepting writes/)
    expect(await stored(soft, String(doomed.uid))).toMatchObject({ role: 'site', republishable: true })
    expect(await softSite.store.listAssets(softSite.slug)).not.toContain('doomed.png')
  })
})

describe('AC-2461 — narrowing a placed material is refused 409 and changes nothing', () => {
  it('test_UAT_AC2461_narrowing_a_placed_upload_is_refused_409_naming_uid_and_placed_on_and_nothing_moves', async () => {
    const tenant = 'ac2461-placed'
    const site = await makeD1Site({ tenantId: tenant, slug: 'ac2461a' })
    const live = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
      role: 'site',
      slug: site.slug,
    })
    expect(live.site_asset).toBe('wordmark.svg')
    const before = await stored(tenant, String(live.uid))
    expect(before.placed_on).toEqual([site.slug])

    const refused = await setRole(tenant, { uid: live.uid, role: 'reference' })
    expect(refused.status).toBe(409)
    const body = await json(refused)
    expect(String(body.error)).toMatch(/live where your visitors can see it/i)
    expect(String(body.error)).toMatch(/take it off your site first/i)
    expect(body.uid).toBe(live.uid)
    expect(body.placed_on).toEqual([site.slug])

    const after = await stored(tenant, String(live.uid))
    expect(after).toMatchObject({ role: 'site', republishable: true, placed_on: [site.slug] })
    expect(await site.store.listAssets(site.slug)).toContain('wordmark.svg')
  })
})
