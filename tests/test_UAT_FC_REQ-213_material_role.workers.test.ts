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
 * REQ-213 — **the client corrects what a piece of material is FOR**.
 *
 * WHAT THIS FILE IS FOR. The Library's rights block is read-only, and DOC-38
 * §10.1 is the reason: rights are inferred from provenance rather than asserted
 * by anyone. Exactly one row of that block was never inferred — for an UPLOAD,
 * *what it is for* is which of two drop areas a human chose (REQ-161) — and a
 * client who dropped their shopfront photograph on *"just for you to read"* had
 * no way to say so, and no way for the file to ever reach their site. This suite
 * is the contract half: what the correction does to the rights record, what it
 * does to the bytes, and the two ways it is refused. The jsdom suite beside it
 * proves the surface.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and two real R2
 * buckets, and every fact is read back off the ticket store's own record rather
 * than off the response that claims it. The capture in claim 3 is adopted by
 * `adoptCapture` from a bundle written by `writeBundle` — the real path — because
 * the claim is about material whose role came from somewhere the client is not,
 * and a hand-written ticket would prove only the hand.
 *
 * ONE DOUBLE PER CLAIM, EACH NAMED WHERE IT IS USED: the describers, which are
 * model boundaries miniflare cannot reach and about which nothing here claims
 * anything; and, for claim 7 alone, an R2 bucket that refuses to write — which
 * IS the claim, and cannot be produced any other way.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. BACKGROUND BECOMES AN ASSET, AND THE BYTES LAND ON THE SITE. The role
 *     changes, `republishable` is re-derived, and the file is in the site's asset
 *     library with `placed_on` recording it.
 *  2. AN ASSET THAT NEVER LANDED GOES BACK, and one that DID is refused — 409,
 *     because it is a conflict with the current state and not a permission.
 *  3. A ROLE NOBODY CHOSE IS NOT THE CLIENT'S TO CORRECT. Fetched and captured
 *     material are refused 403 — DOC-38 §5's gate, one step earlier.
 *  4. `republishable` IS DERIVED AND NEVER TAKEN FROM THE CALLER.
 *  5. A ROLE THE SELECT COULD NOT HAVE SENT IS REFUSED, NEVER COERCED.
 *  6. WITH NO SITE TO PLACE ON, THE CORRECTION STILL LANDS.
 *  7. A PLACEMENT THAT FAILS LEAVES THE CORRECTION STANDING, and says so.
 *  8. THE UPLOAD PATH IS UNCHANGED by sharing the placement with this one.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * The digest describer, doubled.
 *
 * INGESTION REQUIRES A DESCRIBER ([[REQ-173]]) — a material's body is a digest,
 * so a deployment that can describe nothing refuses the upload outright. Every
 * case here therefore uploads against a CONFIGURED deployment, and no claim below
 * is about the quality of what it wrote.
 */
const digest: NonNullable<RouterDeps['describeText']> = async () => ({
  text: 'A photograph of a shopfront, kept for the site.',
  model: 'stub/digest-1',
})

const vision: NonNullable<RouterDeps['describeImage']> = async () => ({
  text: 'A shopfront at dusk with the tables laid for service.',
  model: 'stub/vision-1',
})

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return { index: async () => async () => {}, describeText: digest, describeImage: vision, ...over }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
  d: RouterDeps = deps(),
  routerOver: Partial<RouterEnv> = {},
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  if (file.role !== undefined) form.append('role', file.role)
  if (file.slug) form.append('slug', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant, routerOver),
    scopeOf(tenant),
    d,
  )
  return (await response.json()) as Record<string, unknown>
}

/** The surface under test: one POST, returned whole so a status can be asserted. */
async function setRole(
  tenant: string,
  payload: Record<string, unknown>,
  routerOver: Partial<RouterEnv> = {},
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(tenant, routerOver),
    scopeOf(tenant),
    deps(),
  )
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

/**
 * The rights record as the STORE holds it, not as a response describes it.
 *
 * Every claim about what a correction did is read back through this. A route
 * that returned the right envelope and wrote nothing would pass an assertion on
 * its own reply.
 */
async function stored(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const store = await ticketStoreFor(routerEnv(tenant), scopeOf(tenant))
  const { ticket } = await store.get({ uid })
  return ticket.fields
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-213 — background information becomes a site asset', () => {
  it('test_UAT_FC_REQ-213_background_becomes_an_asset_and_the_bytes_land_on_the_site', async () => {
    // THE CASE THE TICKET IS BUILT ON. The client dragged their shopfront
    // photograph onto the second drop area — "brand guidelines, notes, reports" —
    // and it is a picture they want visitors to see. Until this existed the file
    // was mechanically incapable of reaching their site: `classify` wrote
    // `republishable: false` from the role, and `promoteToSiteAsset` gates on it.
    const tenant = 'req213-widen'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req213a' })
    const created = await upload(tenant, {
      bytes: bytesOf('the shopfront at dusk'),
      name: 'shopfront.jpg',
      type: 'image/jpeg',
      role: 'reference',
      slug: site.slug,
    })
    expect(created.role).toBe('reference')
    expect(created.republishable).toBe(false)
    // It was not placed on the way in, and could not have been.
    expect(created.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).not.toContain('shopfront.jpg')

    const response = await setRole(tenant, { uid: created.uid, role: 'site' })
    expect(response.status).toBe(200)
    const corrected = await body(response)

    // THE ROLE CHANGED, AND `republishable` FOLLOWED IT. The bit is not the
    // client's to send — it is derived here by `classify`'s own rule, so the two
    // cannot come to disagree about what a role means.
    expect(corrected.role).toBe('site')
    expect(corrected.republishable).toBe(true)
    expect(await stored(tenant, String(created.uid))).toMatchObject({
      role: 'site',
      republishable: true,
    })

    // AND THE BYTES ARE ACTUALLY ON THE SITE, which is the half that makes the
    // correction mean anything. "Site asset" is not a label: until the file is in
    // the site's asset library the client has moved it between two folders of a
    // filing cabinet. Same `promoteToSiteAsset` the upload calls.
    expect(corrected.site_asset).toBe('shopfront.jpg')
    expect(await site.store.listAssets(site.slug)).toContain('shopfront.jpg')
    const bytes = await site.store.readAsset(site.slug, 'shopfront.jpg')
    expect(new TextDecoder().decode(bytes!)).toBe('the shopfront at dusk')

    // `placed_on` RECORDS IT, and the response carries the row as it is AFTER the
    // placement wrote — not the one the role change returned, which is one write
    // out of date in exactly this case. It is the field REQ-181's warning badge
    // reads, so a stale copy would badge a promotion that worked.
    expect(corrected.placed_on).toEqual([site.slug])
    expect(await stored(tenant, String(created.uid))).toMatchObject({ placed_on: [site.slug] })
  })

  it('test_UAT_FC_REQ-213_the_correction_never_overwrites_an_asset_already_on_the_site', async () => {
    // THE SAME COLLISION RULE THE UPLOAD HAS, because it is the same call. `write`
    // puts bytes at a name and says nothing about what was there, so a correction
    // that reused a taken name would silently change a picture that is live on the
    // client's site — from a surface whose whole promise is that it only adds.
    const tenant = 'req213-collide'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req213b' })
    await upload(tenant, {
      bytes: bytesOf('the first logo'),
      name: 'logo.png',
      type: 'image/png',
      role: 'site',
      slug: site.slug,
    })
    const second = await upload(tenant, {
      bytes: bytesOf('a different logo'),
      name: 'logo.png',
      type: 'image/png',
      role: 'reference',
      slug: site.slug,
    })

    const corrected = await body(await setRole(tenant, { uid: second.uid, role: 'site' }))
    expect(corrected.site_asset).toBe('logo-2.png')
    // The suffix goes BEFORE the extension, because the extension is what every
    // consumer reads the type from.
    expect(new TextDecoder().decode((await site.store.readAsset(site.slug, 'logo.png'))!)).toBe(
      'the first logo',
    )
    expect(new TextDecoder().decode((await site.store.readAsset(site.slug, 'logo-2.png'))!)).toBe(
      'a different logo',
    )
  })
})

describe('REQ-213 — and back again, until the bytes have landed', () => {
  it('test_UAT_FC_REQ-213_an_asset_that_never_landed_can_go_back_to_being_background', async () => {
    // THE OTHER MIS-DROP, and the one a two-option select has to be able to
    // undo: a competitor screenshot dropped on "things your visitors will see".
    // Nothing has been placed — this business has no site at all — so there is no
    // file live anywhere for the narrowing to contradict.
    const tenant = 'req213-narrow'
    const created = await upload(tenant, {
      bytes: bytesOf('a competitor screenshot'),
      name: 'them.png',
      type: 'image/png',
      role: 'site',
    })
    expect(created.republishable).toBe(true)

    const corrected = await body(await setRole(tenant, { uid: created.uid, role: 'reference' }))
    expect(corrected.role).toBe('reference')
    expect(corrected.republishable).toBe(false)
    expect(await stored(tenant, String(created.uid))).toMatchObject({
      role: 'reference',
      republishable: false,
    })

    // AND THE GATE IS NOW SHUT AGAINST IT. The narrowing is not cosmetic: it
    // restores DOC-38 §5's refusal, so the file is once again mechanically
    // incapable of reaching a published site.
    expect(corrected.site_asset).toBeNull()
  })

  it('test_UAT_FC_REQ-213_a_file_already_on_the_site_cannot_become_background_again', async () => {
    // `placed_on` SAYS THE BYTES ARE ON A SITE ([[BUG-47]]) AND THERE IS NO PATH
    // THAT TAKES ONE OFF. Allowing this would leave a row saying "just for me to
    // read" about a picture the client's own visitors are looking at, which is a
    // worse lie than a refusal — and the refusal has something they can do in it.
    const tenant = 'req213-placed'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req213c' })
    const created = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
      role: 'site',
      slug: site.slug,
    })
    expect(created.site_asset).toBe('wordmark.svg')

    const response = await setRole(tenant, { uid: created.uid, role: 'reference' })

    // 409 AND NOT 403, AND THE DIFFERENCE IS WHETHER IT COULD EVER SUCCEED. This
    // is a conflict with the material's CURRENT state — the same client may make
    // the same change the moment the file is off their site — so answering it as
    // a permission would tell them to stop trying.
    expect(response.status).toBe(409)
    const refusal = await body(response)
    expect(String(refusal.error)).toMatch(/already on your site/i)
    // IT SAYS WHAT TO DO, not merely what went wrong.
    expect(String(refusal.error)).toMatch(/take it off your site/i)
    expect(refusal.placed_on).toEqual([site.slug])

    // AND NOTHING MOVED. A refusal that had already written the role would leave
    // the record disagreeing with the answer the client was given.
    expect(await stored(tenant, String(created.uid))).toMatchObject({
      role: 'site',
      republishable: true,
    })
    expect(await site.store.listAssets(site.slug)).toContain('wordmark.svg')
  })
})

describe('REQ-213 — a role nobody chose is not the client\'s to correct', () => {
  it('test_UAT_FC_REQ-213_material_we_fetched_keeps_the_role_provenance_gave_it', async () => {
    // NOBODY WAS ASKED. `classify` writes `reference` / `third_party` /
    // `republishable: false` from the provenance alone, because something we
    // pulled on the client's behalf is by construction background to read rather
    // than something they handed us to publish. Letting this be edited would not
    // be a correction — it would be DOC-38 §5's gate opening from the outside,
    // which is the single most damaging action available in the system.
    const tenant = 'req213-fetched'
    const stub: typeof fetch = async () =>
      new Response('An industry report about bakeries.', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    const fetched = await body(
      await route(
        new Request('https://app.test/api/material/fetch', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com/report.txt' }),
        }),
        routerEnv(tenant),
        scopeOf(tenant),
        { ...deps(), fetch: stub },
      ),
    )
    expect(fetched.origin).toBe('fetched')
    expect(fetched.role).toBe('reference')

    const response = await setRole(tenant, { uid: fetched.uid, role: 'site' })

    // 403 AND NOT 400: the request is perfectly well formed and it is forbidden,
    // exactly as `NotRepublishableError` is — the same gate, one step earlier.
    expect(response.status).toBe(403)
    expect(String((await body(response)).error)).toMatch(/where it came from, not chosen/i)
    expect(await stored(tenant, String(fetched.uid))).toMatchObject({
      role: 'reference',
      republishable: false,
    })
  })

  it('test_UAT_FC_REQ-213_a_capture_keeps_the_role_the_captured_host_gave_it', async () => {
    // THE ORIGIN THAT IS NOT A NEAR MISS. A capture's role came from the captured
    // HOST, and a capture of the client's own old site is even `owned` and
    // republishable — so a gate written on `republishable` alone would let this
    // through. It is refused for a structural reason as well as a rights one: a
    // capture is 11–99 attachment records under one ticket and
    // `promoteToSiteAsset` takes the first, so "put it on the site" has no single
    // file to mean — and a capture carries no `filename` at all, which is why the
    // pane already drops that row from the rights block.
    const tenant = 'req213-captured'
    const tickets = await ticketStoreFor(routerEnv(tenant), scopeOf(tenant))
    const references = await r2ReferenceStore({
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    }).forTenant(tenant)

    const capture = { ...syntheticCapture(), url: 'https://theirs.example/', host: 'theirs.example' }
    const result: CaptureResult = {
      capture,
      screenshot: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      renderedHtml: '<html><body><h1>Theirs</h1></body></html>',
      rawHtml: '<html><body></body></html>',
      assetBytes: new Map(),
    }
    const name = bundleNameFor(capture)
    await writeBundle(references.bundle(name), result)
    // THE CLIENT'S OWN DOMAIN, so this capture is `owned` and republishable —
    // which is precisely the shape that makes the `origin` gate load-bearing.
    const adopted = await adoptCapture(
      tickets,
      references.bundle(name),
      { clientDomain: 'theirs.example' },
      { describeImage: vision },
    )
    expect(adopted.ticket.fields.origin).toBe('captured')
    expect(adopted.ticket.fields.role).toBe('reference')
    expect(adopted.ticket.fields.republishable).toBe(true)

    const response = await setRole(tenant, { uid: adopted.ticket.uid, role: 'site' })
    expect(response.status).toBe(403)
    expect(await stored(tenant, adopted.ticket.uid)).toMatchObject({ role: 'reference' })
  })
})

describe('REQ-213 — the request is validated, never coerced', () => {
  it('test_UAT_FC_REQ-213_republishable_is_derived_from_the_role_and_never_taken_from_the_caller', async () => {
    // `promoteToSiteAsset` GATES ON THIS BIT, so a caller-supplied value would be
    // the gate handing over its own key: a client could mark their competitor
    // screenshot publishable and then ask for it to be placed.
    const tenant = 'req213-derived'
    const created = await upload(tenant, {
      bytes: bytesOf('a competitor screenshot'),
      name: 'them.png',
      type: 'image/png',
      role: 'site',
    })

    const corrected = await body(
      await setRole(tenant, { uid: created.uid, role: 'reference', republishable: true }),
    )
    expect(corrected.republishable).toBe(false)
    expect(await stored(tenant, String(created.uid))).toMatchObject({ republishable: false })
  })

  it('test_UAT_FC_REQ-213_a_role_the_select_could_not_have_sent_is_refused_never_coerced', async () => {
    // THE SAME TWO SILENT ALTERNATIVES THE UPLOAD ROUTE REFUSES, and they are
    // wrong in the same two ways: falling back to `site` publishes something the
    // client marked private, and falling back to `reference` withholds a
    // photograph they meant to put on their site.
    const tenant = 'req213-validate'
    const created = await upload(tenant, {
      bytes: bytesOf('a picture'),
      name: 'pic.png',
      type: 'image/png',
      role: 'site',
    })

    const misspelled = await setRole(tenant, { uid: created.uid, role: 'Site' })
    expect(misspelled.status).toBe(400)
    expect(String((await body(misspelled)).error)).toMatch(/role must be/)

    // ABSENT IS ALSO A REFUSAL, WHICH IS WHERE THIS DIFFERS FROM THE UPLOAD.
    // That route is a pipeline entry point and has callers that predate the
    // question; this one has only a person who picked one of two options, so a
    // missing role is a malformed request rather than a default to fall back on.
    const absent = await setRole(tenant, { uid: created.uid })
    expect(absent.status).toBe(400)
    expect(String((await body(absent)).error)).toMatch(/role must be/)

    const noUid = await setRole(tenant, { role: 'reference' })
    expect(noUid.status).toBe(400)

    // A uid THAT NAMES ANOTHER KIND OF THING IS 404 AND NOT 403 — the same answer
    // the read routes and the description write give (REQ-161), so this does not
    // become an oracle for which uids exist in the tenant. It matters here more
    // than on a read: this route writes `republishable`, and without the check a
    // uid off the wire could put that field on a ticket that is not material at
    // all.
    const store = await ticketStoreFor(routerEnv(tenant), scopeOf(tenant))
    const { ticket: brief } = await store.create({
      type: 'brief',
      title: 'The brief',
      body: 'Decisions taken so far.',
      fields: { site_slug: 'somewhere' },
    })
    const otherKind = await setRole(tenant, { uid: brief.uid, role: 'site' })
    expect(otherKind.status).toBe(404)
    expect((await store.get({ uid: brief.uid })).ticket.fields.republishable).toBeUndefined()

    // AND NOTHING WAS WRITTEN BY ANY OF THEM.
    expect(await stored(tenant, String(created.uid))).toMatchObject({
      role: 'site',
      republishable: true,
    })
  })
})

describe('REQ-213 — placement is soft, and the correction is not', () => {
  it('test_UAT_FC_REQ-213_with_no_site_to_place_on_the_correction_still_lands', async () => {
    // A BUSINESS WITH NO SITE HAS NOWHERE TO PUT A PICTURE AND HAS DONE NOTHING
    // WRONG. The role change is what the client asked for and it stands; the row
    // then honestly reports that the bytes are not on a site, which is exactly
    // what REQ-181's warning badge is for. Failing the request instead would
    // refuse a correction for a reason that is not about the correction.
    const tenant = 'req213-nosite'
    const created = await upload(tenant, {
      bytes: bytesOf('a logo, uploaded before there was a site'),
      name: 'logo.svg',
      type: 'image/svg+xml',
      role: 'reference',
    })

    const response = await setRole(tenant, { uid: created.uid, role: 'site' })
    expect(response.status).toBe(200)
    const corrected = await body(response)
    expect(corrected.role).toBe('site')
    expect(corrected.republishable).toBe(true)
    // NOT PLACED, AND NOT AN ERROR EITHER — there was no site to refuse.
    expect(corrected.site_asset).toBeNull()
    expect(corrected.site_asset_error).toBeUndefined()
    expect(corrected.placed_on).toEqual([])
    expect(await stored(tenant, String(created.uid))).toMatchObject({ role: 'site' })
  })

  it('test_UAT_FC_REQ-213_a_placement_that_fails_leaves_the_correction_standing_and_says_so', async () => {
    // THE ROLE CHANGE HAS ALREADY LANDED BY THE TIME PLACEMENT RUNS, so a site
    // store that refuses the write must not be reported as the correction not
    // happening. It is NAMED rather than swallowed — the pane can say what did
    // and did not happen — and `placed_on` stays empty, because the record is
    // written after the asset write returns and only rows whose bytes reached a
    // site may claim one (BUG-47).
    const tenant = 'req213-softfail'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req213d' })
    const created = await upload(tenant, {
      bytes: bytesOf('a picture that will not land'),
      name: 'doomed.png',
      type: 'image/png',
      role: 'reference',
    })

    // THE ONE DOUBLE IN THIS FILE THAT IS NOT A MODEL BOUNDARY, and it IS the
    // claim: a bucket that refuses to write cannot be produced by arranging real
    // data. Reads are the real bucket's, so the slug lookup and the collision
    // check behave exactly as they do in production and only the write fails.
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

    const response = await setRole(tenant, { uid: created.uid, role: 'site' }, { SITES: refuses })
    expect(response.status).toBe(200)
    const corrected = await body(response)

    expect(corrected.role).toBe('site')
    expect(corrected.republishable).toBe(true)
    expect(await stored(tenant, String(created.uid))).toMatchObject({
      role: 'site',
      republishable: true,
    })

    expect(corrected.site_asset).toBeNull()
    expect(String(corrected.site_asset_error)).toMatch(/not accepting writes/)
    expect(corrected.placed_on).toEqual([])
    expect(await site.store.listAssets(site.slug)).not.toContain('doomed.png')
  })
})

describe('REQ-213 — the upload path is unchanged by sharing the placement', () => {
  it('test_UAT_FC_REQ-213_an_upload_still_places_its_bytes_and_still_refuses_a_reference_role', async () => {
    // `placeOnSite` NOW HAS TWO CALLERS AND TAKES THE THREE FACTS IT READS rather
    // than an `Ingested`. That refactor is invisible or it is a regression in the
    // path every uploaded file takes, so both of its branches are asserted here
    // through the upload route itself — the gate, and the placement.
    const tenant = 'req213-upload'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req213e' })

    const forSite = await upload(tenant, {
      bytes: bytesOf('the hero photograph'),
      name: 'hero.jpg',
      type: 'image/jpeg',
      role: 'site',
      slug: site.slug,
    })
    expect(forSite.site_asset).toBe('hero.jpg')
    expect(await site.store.listAssets(site.slug)).toContain('hero.jpg')

    const toRead = await upload(tenant, {
      bytes: bytesOf('a positioning note'),
      name: 'positioning.txt',
      type: 'text/plain',
      role: 'reference',
      slug: site.slug,
    })
    expect(toRead.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).not.toContain('positioning.txt')
  })
})
