import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  MaterialRejectedError,
  NotRepublishableError,
  promoteToSiteAsset,
} from '../apps/control-app/src/material'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { REDACTED } from '../apps/control-app/src/redact'
import { applySchema, makeD1Site, tenantStore } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'

/**
 * Reconciliation UATs for story-aacb7060 — **site-asset promotion: only material
 * the client may publish reaches their public site**.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim is made either through the Worker's own
 * route table (`route()`, at the material entry point `POST /api/material`) or
 * through `promoteToSiteAsset` itself, which is the platform's only promotion
 * path and the function the route calls. Both run against a real D1 database and
 * two real R2 buckets supplied by `@cloudflare/vitest-pool-workers` — `BLOBS`,
 * the client's private material store, and `SITES`, the store the public Worker
 * serves published sites from. The site's asset library is read back through the
 * site store's own `listAssets`/`readAsset`, which is the same path a published
 * site resolves an asset by. Nothing here reimplements the gate, the name
 * selection or the byte copy in order to assert them.
 *
 * THE DOUBLES, AND WHY EACH IS AT A BOUNDARY WE DO NOT OWN. The vision describer
 * and the embedder are model seams — miniflare has no Workers AI to reach, and no
 * criterion in this story is about the quality of a description or of an
 * embedding. The index seam is the ingestion pipeline's own declared hook, wired
 * here to a counter so an upload does not need an embedder to succeed. The ONE
 * remaining stand-in is the site store in AC-1712's second half: it is
 * `RouterDeps.store`, the route table's declared host seam, wrapped in a proxy
 * that delegates everything to the real D1/R2 store and refuses only `write` —
 * because "the asset store refuses the write" is the criterion's own scenario and
 * there is no way to make real R2 refuse on demand. Its first half uses the real
 * store and a site that is genuinely not there, so the criterion is held to
 * against a real failure as well as a simulated one.
 *
 * WHERE THE COPY IS READ BACK FROM. The criteria about what landed enumerate the
 * two buckets and read the asset through the site store rather than trusting the
 * response envelope: an envelope that echoed its own input would satisfy a weaker
 * test while proving nothing about which side of the boundary the bytes are on.
 */

const APPLIED = applySchema()

const TENANT = 'storyaacb7060'

/**
 * The Anthropic key, as this deployment would hold it (REQ-146).
 *
 * Long enough to be a credential rather than a common word, which is the floor
 * `redactor` applies — a shorter value is ignored on purpose, so a test that used
 * one would prove the scrubber was never asked rather than that it worked.
 */
const SECRET = 'sk-ant-api03-storyaacb7060-not-a-real-key-0123456789'

/** The Worker's own bindings, as this route table's env. */
function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** Whatever the caller says, as bytes. */
function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/** Byte-identity, compared as values so a failure prints the difference. */
function asBytes(value: Uint8Array | null | undefined): number[] {
  return Array.from(value ?? new Uint8Array(0))
}

/**
 * Router deps with the two model seams stubbed and the index seam satisfied.
 *
 * Nothing in this story is about indexing; the hook is wired so an upload is not
 * reported as unindexed and the loud warning the pipeline emits for a deployment
 * with no indexer does not fire on every test.
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeImage: async () => ({ text: 'A mark\n\nA logotype on a plain ground.', model: 'stub/vision-1' }),
    ...over,
  }
}

/** A file handed to the platform's material entry point, as a dropped file arrives. */
async function handOver(
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  opts: { role?: string; slug?: string; deps?: RouterDeps; env?: Partial<RouterEnv> } = {},
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  if (opts.role !== undefined) form.append('role', opts.role)
  if (opts.slug !== undefined) form.append('slug', opts.slug)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(opts.env ?? {}),
    opts.deps ?? deps(),
  )
}

/** The JSON envelope an ingestion answered with. */
async function envelopeOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

/** Every R2 key under a prefix, so residency is ENUMERATED rather than assumed. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** What the platform says when asked for one piece of material, through the route. */
async function readBack(uid: string): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
    routerEnv(),
    deps(),
  )
}

/**
 * The real tenant store, refusing exactly one operation.
 *
 * A proxy rather than a hand-written fake: `listAssets`, `readAsset` and every
 * other call still reach real D1 and real R2, so the gate, the blob read and the
 * free-name lookup all run for real and only the final placement fails — which is
 * the shape of the failure the criterion is about.
 */
function storeRefusingWrite(real: TenantSiteStore, message: string): TenantSiteStore {
  return new Proxy(real, {
    get(target, property, receiver) {
      if (property === 'write') {
        return async () => {
          throw new Error(message)
        }
      }
      return Reflect.get(target, property, receiver) as unknown
    },
  })
}

beforeAll(async () => {
  await APPLIED
})

describe('story-aacb7060 — only material the client may publish reaches their site', () => {
  it('test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy', async () => {
    // THE PROMISE IS COMPLETED BY THE TIME THE HAND-OVER RETURNS (AC-1709). A
    // ticket in a store is not "on the site" — until the bytes are in the asset
    // library the client has dropped their logo into a filing cabinet.
    const sites = await tenantStore(TENANT)
    const site = await makeD1Site({ tenantId: TENANT, slug: 'ac1709-site' })
    const file = bytesOf('PNG\r\n\n the client’s own logotype')

    const publicBefore = await keysUnder(env.SITES as R2Bucket, '')
    const response = await handOver(file, 'logo.png', 'image/png', {
      role: 'site',
      slug: site.slug,
    })
    expect(response.status).toBe(200)
    const body = await envelopeOf(response)

    // The answer carries the material's identifier AND the name the asset landed
    // under — not a promise that something will happen later.
    expect(String(body.uid)).not.toBe('')
    expect(body.site_asset).toBe('logo.png')
    expect(body.site_asset_error).toBeUndefined()

    // ASKING THE SITE FOR ITS ASSETS LISTS THE REPORTED NAME.
    expect(await sites.listAssets(site.slug)).toContain('logo.png')

    // AND READING IT BACK YIELDS THE BYTES THAT WERE HANDED OVER. `readAsset`
    // resolves the site's asset against the PUBLIC store, which is what makes
    // this a copy on the public side rather than a pointer at the private one.
    expect(asBytes(await sites.readAsset(site.slug, 'logo.png'))).toEqual(asBytes(file))

    // The copy is a NEW object in the store the public internet is served from,
    // holding the bytes — so nothing about resolving it reaches the private store.
    const publicAfter = await keysUnder(env.SITES as R2Bucket, '')
    const added = publicAfter.filter((key) => !publicBefore.includes(key))
    expect(added.length).toBeGreaterThan(0)
    const copies = await Promise.all(added.map((key) => (env.SITES as R2Bucket).get(key)))
    const publicBytes = await Promise.all(
      copies.map(async (object) => new Uint8Array(await object!.arrayBuffer())),
    )
    expect(publicBytes.map(asBytes)).toContainEqual(asBytes(file))

    // THE CLIENT'S OWN MATERIAL IS UNCHANGED AND STILL PRIVATE: the record is
    // still listed as theirs, its rights record intact, and the original bytes
    // are still in the private store.
    const item = await readBack(String(body.uid))
    expect(item.status).toBe(200)
    const material = await envelopeOf(item)
    expect(material.uid).toBe(body.uid)
    expect(material.filename).toBe('logo.png')
    expect(material.rights).toBe('owned')
    expect(material.republishable).toBe(true)
    expect(material.role).toBe('site')

    const privateKeys = await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)
    const attachment = body.attachment as Record<string, unknown>
    const own = privateKeys.filter((key) => key.includes(String(attachment.uid)))
    expect(own).toHaveLength(1)
    const stored = await (env.BLOBS as R2Bucket).get(own[0])
    expect(asBytes(new Uint8Array(await stored!.arrayBuffer()))).toEqual(asBytes(file))
  })

  it('test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route', async () => {
    // THE DECISION COMES OFF THE RECORD, NOT OFF AN ARGUMENT (AC-1710). Proved
    // three ways: the function refuses it directly, the platform's own entry
    // point produces no asset from it, and the SAME inputs with a record that
    // does permit republishing succeed — so the outcome follows the record.
    const sites = await tenantStore(TENANT)
    const site = await makeD1Site({
      tenantId: TENANT,
      slug: 'ac1710-site',
      assets: { 'existing.png': bytesOf('an asset that was already live') },
    })
    const known = await sites.listAssets(site.slug)
    expect(known).toEqual(['existing.png'])

    // A file the client handed over saying it was ONLY FOR THE PLATFORM TO READ.
    // The hand-over SUCCEEDS — it is stored and findable — and produces no asset.
    const bytes = bytesOf('a competitor’s homepage, kept as reference')
    const reference = await handOver(bytes, 'competitor.png', 'image/png', {
      role: 'reference',
      slug: site.slug,
    })
    expect(reference.status).toBe(200)
    const referenceBody = await envelopeOf(reference)
    expect(String(referenceBody.uid)).not.toBe('')
    // ITS RECORD FORBIDS REPUBLISHING — written at ingestion, from what the
    // client said the file was for.
    expect(referenceBody.role).toBe('reference')
    expect(referenceBody.republishable).toBe(false)
    // NO SITE ASSET WAS PRODUCED, and the site is exactly what it was.
    expect(referenceBody.site_asset).toBeNull()
    expect(await sites.listAssets(site.slug)).toEqual(known)

    // The material is nonetheless stored and findable.
    const item = await readBack(String(referenceBody.uid))
    expect(item.status).toBe(200)
    expect((await envelopeOf(item)).uid).toBe(referenceBody.uid)

    // REFUSED BY THE PROMOTION PATH ITSELF, not merely un-routed: no caller can
    // assert its way past the record.
    const tickets = await ticketStoreFor(routerEnv())
    const refusal = await promoteToSiteAsset(tickets, sites, {
      uid: String(referenceBody.uid),
      slug: site.slug,
      name: 'competitor.png',
    }).catch((err: unknown) => err)
    // A RULE, not a malformed request and not a platform failure — its own class,
    // naming the material it refused.
    expect(refusal).toBeInstanceOf(NotRepublishableError)
    expect(refusal).not.toBeInstanceOf(MaterialRejectedError)
    expect((refusal as NotRepublishableError).uid).toBe(String(referenceBody.uid))
    // IN WORDS THAT TELL THE CLIENT WHERE IT CAME FROM AND WHAT THEY MAY DO.
    const said = (refusal as NotRepublishableError).message
    expect(said).toContain('cannot be published on a site')
    expect(said).toContain('came from somewhere else')
    expect(said).toContain('reference')
    // NOTHING WAS WRITTEN BEFORE THE REFUSAL.
    expect(await sites.listAssets(site.slug)).toEqual(known)

    // THE SAME INPUTS, A RECORD THAT PERMITS REPUBLISHING — and it lands. The
    // only thing that changed is what the material's own record says.
    const permitted = await handOver(bytes, 'competitor.png', 'image/png', {
      role: 'site',
      slug: site.slug,
    })
    expect(permitted.status).toBe(200)
    const permittedBody = await envelopeOf(permitted)
    expect(permittedBody.republishable).toBe(true)
    expect(permittedBody.site_asset).toBe('competitor.png')
    expect(await sites.listAssets(site.slug)).toContain('competitor.png')
  })

  it('test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched', async () => {
    // A PICTURE A VISITOR SEES TODAY CANNOT BE SILENTLY REPLACED (AC-1711).
    const sites = await tenantStore(TENANT)
    const site = await makeD1Site({ tenantId: TENANT, slug: 'ac1711-site' })
    const first = bytesOf('the logotype that is live on the site')
    const second = bytesOf('a different picture, dropped under the same name')

    const one = await envelopeOf(
      await handOver(first, 'logo.png', 'image/png', { role: 'site', slug: site.slug }),
    )
    expect(one.site_asset).toBe('logo.png')

    const two = await envelopeOf(
      await handOver(second, 'logo.png', 'image/png', { role: 'site', slug: site.slug }),
    )
    // A DISTINCT, DERIVED NAME — and the distinguishing suffix sits BEFORE the
    // extension, because the extension is what every consumer reads the type
    // from. `logo.png-2` would not be a PNG to a content-type lookup.
    expect(two.site_asset).not.toBe(one.site_asset)
    expect(two.site_asset).toBe('logo-2.png')
    expect(String(two.site_asset).endsWith('.png')).toBe(true)

    // THE SITE LISTS BOTH.
    const listed = await sites.listAssets(site.slug)
    expect(listed).toContain('logo.png')
    expect(listed).toContain('logo-2.png')

    // AND THE ONE THAT WAS ALREADY LIVE STILL RETURNS THE BYTES IT HAD BEFORE.
    expect(asBytes(await sites.readAsset(site.slug, 'logo.png'))).toEqual(asBytes(first))
    expect(asBytes(await sites.readAsset(site.slug, 'logo-2.png'))).toEqual(asBytes(second))
  })

  it('test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret', async () => {
    // "YOUR UPLOAD FAILED" WOULD BE BOTH UNTRUE AND UNRECOVERABLE (AC-1712): by
    // the time placement runs the material is already stored, described and
    // findable, so a placement failure is reported ON a successful hand-over.
    const embedder = stubEmbedder()
    const knowledge = await projectKnowledgeFor(routerEnv(), { embedder, defer: () => {} })
    const indexing = deps({ index: async () => async () => void (await knowledge.onMaterialWritten()) })

    // FIRST: THE NAMED SITE IS NOT AVAILABLE. A real store, a slug that is
    // genuinely not there — a real failure rather than a simulated one.
    const absent = await handOver(
      bytesOf('The awning is oxblood and the lettering is bone.'),
      'awning.png',
      'image/png',
      { role: 'site', slug: 'ac1712-no-such-site', deps: indexing },
    )
    // A SUCCESSFUL HAND-OVER, carrying the material's identifier.
    expect(absent.status).toBe(200)
    const absentBody = await envelopeOf(absent)
    const absentUid = String(absentBody.uid)
    expect(absentUid).not.toBe('')
    // IT STATES THAT NO SITE ASSET WAS PRODUCED, AND WHY.
    expect(absentBody.site_asset).toBeNull()
    const reason = String(absentBody.site_asset_error)
    expect(reason).not.toBe('')
    expect(reason).toContain('ac1712-no-such-site')

    // THE FILE IS NOT LOST: retrievable afterwards, and findable by search.
    const item = await readBack(absentUid)
    expect(item.status).toBe(200)
    expect((await envelopeOf(item)).uid).toBe(absentUid)
    expect((await knowledge.search('what colour is the awning')).map((hit) => hit.uid)).toContain(
      absentUid,
    )

    // SECOND: THE ASSET STORE REFUSES THE WRITE, with a failure carrying the
    // deployment's own credential — the one shape that looks like it escapes the
    // origin's redaction guarantee, because the response itself reports success.
    const site = await makeD1Site({ tenantId: TENANT, slug: 'ac1712-site' })
    const real = await tenantStore(TENANT)
    const refused = await handOver(
      bytesOf('The bread is baked overnight and the doors open at six.'),
      'hours.png',
      'image/png',
      {
        role: 'site',
        slug: site.slug,
        env: { ANTHROPIC_API_KEY: SECRET },
        deps: deps({
          index: async () => async () => void (await knowledge.onMaterialWritten()),
          store: async () =>
            storeRefusingWrite(real, `R2 PutObject rejected (authorization: Bearer ${SECRET})`),
        }),
      },
    )
    expect(refused.status).toBe(200)
    const refusedBody = await envelopeOf(refused)
    const refusedUid = String(refusedBody.uid)
    expect(refusedUid).not.toBe('')
    expect(refusedBody.site_asset).toBeNull()

    // A DESCRIPTION OF WHAT WENT WRONG — not a substitute for the file arriving.
    const scrubbed = String(refusedBody.site_asset_error)
    expect(scrubbed).toContain('R2 PutObject rejected')
    // AND CARRYING NO PLATFORM SECRET, even though the envelope reports success.
    expect(scrubbed).not.toContain(SECRET)
    expect(scrubbed).toContain(REDACTED)

    // The file is not lost here either.
    const kept = await readBack(refusedUid)
    expect(kept.status).toBe(200)
    expect((await envelopeOf(kept)).uid).toBe(refusedUid)
    expect((await knowledge.search('when do the doors open')).map((hit) => hit.uid)).toContain(
      refusedUid,
    )
    // And nothing landed on the site it could not be placed on.
    expect(await real.listAssets(site.slug)).not.toContain('hours.png')
  })

  it('test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears', async () => {
    // AN ASSET WITH NO BYTES BEHIND IT IS A BROKEN PICTURE ON A LIVE PAGE
    // (AC-1713). Two shapes of "nothing to publish", told apart in words, each
    // leaving the site's asset library exactly as it was.
    const sites = await tenantStore(TENANT)
    const site = await makeD1Site({
      tenantId: TENANT,
      slug: 'ac1713-site',
      assets: { 'existing.png': bytesOf('an asset that was already live') },
    })
    const known = await sites.listAssets(site.slug)
    const tickets = await ticketStoreFor(routerEnv())

    // A RECORD THAT PERMITS REPUBLISHING BUT HAS NO FILE ATTACHED TO IT.
    const { ticket } = await tickets.create({
      type: 'material',
      title: 'A record with nothing behind it',
      body: 'Described, but never attached.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'image',
        role: 'site',
        filename: 'ghost.png',
      },
    })
    const empty = await promoteToSiteAsset(tickets, sites, {
      uid: ticket.uid,
      slug: site.slug,
      name: 'ghost.png',
    }).catch((err: unknown) => err)
    expect(empty).toBeInstanceOf(MaterialRejectedError)
    const emptySaid = (empty as MaterialRejectedError).message
    expect(emptySaid).toContain('nothing to publish')
    // AND IT NAMES THE MATERIAL IN QUESTION.
    expect(emptySaid).toContain(ticket.uid)
    // NO ASSET OF ANY NAME APPEARED.
    expect(await sites.listAssets(site.slug)).toEqual(known)

    // A RECORD NAMING BYTES THAT ARE NO LONGER IN STORAGE — what a sweep that
    // collected a still-named blob leaves behind.
    const privateBefore = await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)
    const uploaded = await envelopeOf(
      await handOver(bytesOf('a picture that will go missing'), 'gone.png', 'image/png', {
        role: 'site',
      }),
    )
    const uploadedUid = String(uploaded.uid)
    expect(uploaded.republishable).toBe(true)
    // No slug was named, so nothing was placed and the site is still untouched.
    expect(uploaded.site_asset).toBeNull()
    expect(await sites.listAssets(site.slug)).toEqual(known)

    const privateAfter = await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)
    const added = privateAfter.filter((key) => !privateBefore.includes(key))
    expect(added).toHaveLength(1)
    await (env.BLOBS as R2Bucket).delete(added[0])

    const missing = await promoteToSiteAsset(tickets, sites, {
      uid: uploadedUid,
      slug: site.slug,
      name: 'gone.png',
    }).catch((err: unknown) => err)
    expect(missing).toBeInstanceOf(MaterialRejectedError)
    const missingSaid = (missing as MaterialRejectedError).message
    // REPORTED AS THE FILE NO LONGER BEING THERE — distinct from the material
    // not existing, and distinct from the record that never had one.
    expect(missingSaid).toContain('no longer in storage')
    expect(missingSaid).not.toContain('nothing to publish')
    expect(missingSaid).toContain(uploadedUid)
    // AGAIN, NOTHING WAS WRITTEN TO THE SITE.
    expect(await sites.listAssets(site.slug)).toEqual(known)
  })
})
