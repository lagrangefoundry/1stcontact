import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { TenantSiteStore } from '../../tools/generate/src/store/d1r2-store'
import { applySchema, makeD1Site, tenantStore } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * story-1144410d — **what the answer actually does**, in workerd, end to end.
 *
 * WHAT THIS FILE PROVES AND WHAT ITS SIBLING DOES.
 * `reconciliation-material-upload-surface.test.ts` proves the SURFACE — the one
 * question, that it is raised only by a file drag, that it can be declined, and
 * that nothing is created without an answer. This one proves the CONTRACT the
 * answer is a request against: what the role writes into the rights record, what
 * "put it on the site" puts there, what happens when the name is taken or the
 * site cannot accept it, and what an answer the overlay could not have sent does.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and two real R2 buckets.
 * The blob is stored by the ticketing component's own `attach`, the material row
 * is written by its own validator, the asset is written by the site store's own
 * `write`. Nothing here reimplements a step in order to assert it, and the site
 * assertions read back through `readAsset` — which resolves `site_assets.r2_key`
 * against `SITES` alone — so "the bytes are on the site" is a claim about the
 * public bucket rather than about a row that names the private one.
 *
 * THE DOUBLES, AND WHY EACH IS A TRUE BOUNDARY:
 *
 *   - **the index seam**, counted rather than run. Miniflare has no local
 *     Workers AI, and no claim below is about embedding quality.
 *   - **the network**, for the one retrieval claim (AC-1583). The claim is about
 *     what provenance writes, not about anybody's HTTP server.
 *   - **one refusing site store**, for the half of AC-1581 that is about a store
 *     which accepts the site and then refuses the write with a message carrying a
 *     credential. That is a failure from BELOW — the shape `redact.ts` exists for
 *     — and there is no way to provoke it from a store that is working.
 *
 * The describer is left ABSENT rather than stubbed: no claim here is about a
 * description, and absent is the honest state for bytes nothing has looked at.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** Router deps with the index seam counted. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    ...over,
    indexed,
  }
}

/** POST a file to the upload entry point, exactly as the overlay does. */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
  d: RouterDeps = deps(),
  envOver: Partial<RouterEnv> = {},
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  if (file.role !== undefined) form.append('role', file.role)
  if (file.slug) form.append('slug', file.slug)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant, envOver),
    d,
  )
}

/** The Library's own list route — the "what does the client hold" measure. */
async function library(tenant: string): Promise<Array<Record<string, unknown>>> {
  const listed = await body(
    await route(new Request('https://app.test/api/material'), routerEnv(tenant), deps()),
  )
  return listed.material as Array<Record<string, unknown>>
}

async function readFile(tenant: string, uid: string): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material/file?uid=${encodeURIComponent(uid)}`),
    routerEnv(tenant),
    deps(),
  )
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

const text = (bytes: Uint8Array | null) => (bytes ? new TextDecoder().decode(bytes) : null)

beforeAll(async () => {
  await APPLIED
})

// ── AC-1573: the answer decides the rights ───────────────────────────────────

describe('story-1144410d — the answer decides what may be done with the file', () => {
  it('test_UAT_AC1573_for_the_site_stays_publishable_and_just_to_read_becomes_material_no_site_may_carry', async () => {
    // THE CASE THE STORY IS BUILT ON. A JPEG may be a hero photograph destined
    // for the site or a screenshot of a competitor that must never be published:
    // identical bytes, identical type, opposite rights. Nothing in the bytes
    // separates them, which is why the client is asked — and asked this and
    // nothing else.
    const tenant = 'story-1144410d-rights'
    const site = await makeD1Site({ tenantId: tenant, slug: 'rights' })
    const bytes = bytesOf('the same picture, wanted for two different things')
    const before = await site.store.listAssets(site.slug)

    const forSite = await body(
      await upload(tenant, {
        bytes,
        name: 'shot.png',
        type: 'image/png',
        role: 'site',
        slug: site.slug,
      }),
    )
    const toRead = await body(
      await upload(tenant, {
        bytes,
        name: 'shot.png',
        type: 'image/png',
        role: 'reference',
        slug: site.slug,
      }),
    )

    // TWO SEPARATE RECORDS with opposite publishability recorded on them.
    expect(forSite.uid).not.toBe(toRead.uid)
    expect(forSite.role).toBe('site')
    expect(forSite.republishable).toBe(true)
    expect(toRead.role).toBe('reference')
    expect(toRead.republishable).toBe(false)

    // BOTH ARE KEPT AND BOTH COME BACK. The answer changes the rights, not
    // whether the file is stored — a client who marks a document private has not
    // asked us to lose it.
    for (const created of [forSite, toRead]) {
      const file = await readFile(tenant, String(created.uid))
      expect(file.status, String(created.uid)).toBe(200)
      expect(await file.text()).toBe('the same picture, wanted for two different things')
    }

    // THE SITE ANSWER IS ACCEPTED…
    expect(forSite.site_asset).toBe('shot.png')
    expect(await site.store.listAssets(site.slug)).toContain('shot.png')

    // …AND THE READING ANSWER CANNOT REACH A SITE AT ALL. Not "is not routed
    // there": `promoteToSiteAsset` gates on the ticket's own `republishable`,
    // which the ROLE wrote, so the refusal survives any caller. Both files were
    // offered to the same open site in the same way; only one arrived.
    expect(toRead.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).toHaveLength(before.length + 1)

    // The rights the client was never asked about are unchanged by either answer
    // ([[DOC-38]] §10.1): still inferred from provenance, still not exportable.
    for (const created of [forSite, toRead]) {
      expect(created.rights).toBe('owned')
      expect(created.origin).toBe('uploaded')
      expect(created.exportable).toBe(false)
    }
  })
})

// ── AC-1579: "put it on the site" means the bytes are on the site ────────────

describe('story-1144410d — placement is immediate, and it names what it did', () => {
  it('test_UAT_AC1579_a_site_answer_with_a_site_open_is_on_that_site_when_the_answer_returns', async () => {
    // A ticket in a store is not "on the site": until the bytes are in the
    // asset library the client has dropped their logo into a filing cabinet.
    const tenant = 'story-1144410d-place'
    const site = await makeD1Site({ tenantId: tenant, slug: 'placed' })

    const created = await body(
      await upload(tenant, {
        bytes: bytesOf('the logo'),
        name: 'logo.png',
        type: 'image/png',
        role: 'site',
        slug: site.slug,
      }),
    )

    // BY THE TIME THE REQUEST ANSWERS, not queued for a later step nobody has
    // specified — which is also what makes a dropped logo pickable in the same
    // second.
    expect(created.site_asset).toBe('logo.png')
    expect(await site.store.listAssets(site.slug)).toContain('logo.png')

    // A COPY HELD BY THE SITE, servable from it. `readAsset` resolves
    // `site_assets.r2_key` against `SITES`, the bucket the public Worker is bound
    // to — so bytes coming back here are bytes the public site can serve. A row
    // pointing into `BLOBS` would 404, and making it resolve would mean handing
    // the public Worker a binding on the client's private material.
    expect(text(await site.store.readAsset(site.slug, String(created.site_asset)))).toBe('the logo')

    // AND THE MATERIAL RECORD REMAINS IN THE CLIENT'S LIBRARY. Placement adds a
    // copy to the site; it does not move the file out of the Library.
    const rows = await library(tenant)
    const row = rows.find((r) => r.uid === created.uid)
    expect(row).toBeTruthy()
    expect(row!.filename).toBe('logo.png')
    expect(row!.site_slug).toBe(site.slug)
    expect((await readFile(tenant, String(created.uid))).status).toBe(200)
  })

  // ── AC-1580: a taken name yields a free variant ─────────────────────────────

  it('test_UAT_AC1580_placing_a_file_never_replaces_an_asset_already_on_the_site', async () => {
    // `write` puts bytes at a name and says nothing about what was there, so
    // without a free name a second `logo.png` would silently change a picture
    // that is live on the client's site — from a surface whose whole promise is
    // that it only ADDS.
    const tenant = 'story-1144410d-collide'
    const site = await makeD1Site({ tenantId: tenant, slug: 'collide' })

    const placed: string[] = []
    for (const contents of ['the first logo', 'a different logo', 'a third logo']) {
      const created = await body(
        await upload(tenant, {
          bytes: bytesOf(contents),
          name: 'logo.png',
          type: 'image/png',
          role: 'site',
          slug: site.slug,
        }),
      )
      placed.push(String(created.site_asset))
    }

    // A FREE VARIANT EACH TIME, never the first name reused — and the suffix goes
    // BEFORE the extension, because the extension is what every consumer reads
    // the type from.
    expect(placed).toEqual(['logo.png', 'logo-2.png', 'logo-3.png'])
    expect(new Set(placed).size).toBe(3)
    for (const name of placed) expect(name).toMatch(/\.png$/)

    // THE ASSET ALREADY LIVE ON THE SITE IS BYTE-FOR-BYTE UNCHANGED.
    expect(text(await site.store.readAsset(site.slug, 'logo.png'))).toBe('the first logo')
    // …and the reported name is the one it was ACTUALLY stored under, which is
    // the only name the client can then use to find it.
    expect(text(await site.store.readAsset(site.slug, 'logo-2.png'))).toBe('a different logo')
    expect(text(await site.store.readAsset(site.slug, 'logo-3.png'))).toBe('a third logo')
  })

  // ── AC-1581: a placement that fails ────────────────────────────────────────

  it('test_UAT_AC1581_a_placement_that_fails_is_reported_alongside_a_kept_file', async () => {
    // The material is stored, described and indexed by the time placement runs.
    // A site store that refuses the write must not turn that into "your file did
    // not arrive" — the client would upload it again, and the second copy would
    // fail for the same reason.
    const tenant = 'story-1144410d-unplaced'
    const wired = deps()

    const created = await body(
      await upload(
        tenant,
        {
          bytes: bytesOf('a logo for a site that is not there'),
          name: 'logo.png',
          type: 'image/png',
          role: 'site',
          slug: 'no-such-site',
        },
        wired,
      ),
    )

    // THE UPLOAD ITSELF STILL SUCCEEDS.
    expect(created.uid).toBeTruthy()
    expect(created.republishable).toBe(true)
    expect(wired.indexed).toEqual([String(created.uid)])

    // NO ASSET NAME, AND A NAMED REASON — both, so the client learns the file is
    // kept and learns why it is not on the site yet.
    expect(created.site_asset).toBeNull()
    expect(String(created.site_asset_error)).toContain('no-such-site')

    // THE RECORD AND ITS BYTES EXIST AFTERWARDS.
    expect((await library(tenant)).map((r) => r.uid)).toContain(created.uid)
    const file = await readFile(tenant, String(created.uid))
    expect(file.status).toBe(200)
    expect(await file.text()).toBe('a logo for a site that is not there')

    // ── AND THE REASON CARRIES NO CONFIGURATION SECRETS ────────────────────
    // The hazard is never the code that means well: it is a layer below putting
    // the request it tried to send into the error it threw. This is a 200
    // carrying a caught message, which is the one shape that looks like it
    // escapes the scrubber — so the scrubber has to travel with the envelope.
    const SECRET = 'sk-ant-not-a-real-key-000000'
    const real = await tenantStore(tenant)
    const refusing = {
      ...real,
      write: async () => {
        throw new Error(`upstream rejected bearer ${SECRET} while writing the asset`)
      },
    } as unknown as TenantSiteStore

    const leaky = await body(
      await upload(
        tenant,
        {
          bytes: bytesOf('another logo'),
          name: 'other.png',
          type: 'image/png',
          role: 'site',
          slug: 'no-such-site',
        },
        deps({ store: async () => refusing }),
        { ANTHROPIC_API_KEY: SECRET },
      ),
    )
    expect(leaky.uid).toBeTruthy()
    expect(leaky.site_asset).toBeNull()
    const reason = String(leaky.site_asset_error)
    expect(reason).not.toContain(SECRET)
    // Still a reason, not a blanked string: the diagnostics survive the scrub.
    expect(reason).toContain('while writing the asset')
    expect(reason).toContain('[redacted]')
  })
})

// ── AC-1582: an answer outside the two offered ───────────────────────────────

describe('story-1144410d — an answer that is neither', () => {
  it('test_UAT_AC1582_an_answer_outside_the_two_offered_is_refused_by_name_and_creates_nothing', async () => {
    // Both silent readings are wrong in a way nobody would notice: coercing to
    // `site` publishes something the client marked private, and coercing to
    // `reference` quietly withholds a hero photograph they meant to publish.
    const tenant = 'story-1144410d-refused'
    const store = await ticketStoreFor(routerEnv(tenant))
    const wired = deps()

    for (const answer of ['Site', 'reference ', 'both', 'private', '']) {
      const response = await upload(
        tenant,
        { bytes: bytesOf('x'), name: 'x.png', type: 'image/png', role: answer },
        wired,
      )
      expect(response.status, answer).toBe(400)
      // REFUSED BY NAME: the message says what the two permitted answers are, so
      // the caller can correct it rather than guess.
      const error = String((await body(response)).error)
      expect(error, answer).toContain("'site'")
      expect(error, answer).toContain("'reference'")
    }

    // AND NOTHING WAS CREATED — no record, no stored bytes, no placement. The
    // refusal happens before ingestion, so there is nothing to sweep up after.
    expect(await library(tenant)).toHaveLength(0)
    expect((await store.list({ type: 'material', limit: 'all' })).tickets).toHaveLength(0)
    expect(wired.indexed).toEqual([])
  })
})

// ── AC-1583: no answer at all ────────────────────────────────────────────────

describe('story-1144410d — the answer narrows, and never widens', () => {
  it('test_UAT_AC1583_a_file_arriving_with_no_answer_keeps_the_rights_its_provenance_decided', async () => {
    // This route is the pipeline's entry point as well as the overlay's target,
    // so a caller that predates the question must land on provenance's answer
    // exactly as it did. The guarantee that a human chose belongs to the overlay
    // — which has no drop target that is not one of the two answers — and is not
    // something the route can assert on anybody's behalf.
    const tenant = 'story-1144410d-silent'
    const store = await ticketStoreFor(routerEnv(tenant))

    const silent = await body(
      await upload(tenant, {
        bytes: bytesOf('a photograph handed over with no answer'),
        name: 'unspoken.jpg',
        type: 'image/jpeg',
      }),
    )

    // THE CLIENT'S OWN MATERIAL, PUBLISHABLE — [[DOC-38]] §10.1's row for an
    // upload, unchanged. Accepted, not refused: the question narrows these
    // rights when it is answered and is not a new gate when it is not.
    expect(silent.rights).toBe('owned')
    expect(silent.origin).toBe('uploaded')
    expect(silent.republishable).toBe(true)
    expect(silent.exportable).toBe(false)
    const ticket = (await store.get({ uid: String(silent.uid) })).ticket
    expect(ticket.fields).toHaveProperty('republishable', true)
    expect(ticket.fields).toHaveProperty('rights', 'owned')

    // …and it is identical to what the "put it on the site" answer records, which
    // is what "the answer narrows, never widens" means concretely: the widest
    // answer available adds nothing an unanswered upload did not already have.
    const answered = await body(
      await upload(tenant, {
        bytes: bytesOf('the same photograph, with an answer'),
        name: 'spoken.jpg',
        type: 'image/jpeg',
        role: 'site',
      }),
    )
    for (const key of ['rights', 'republishable', 'exportable', 'origin', 'role']) {
      expect(silent[key], key).toEqual(answered[key])
    }

    // ── AND MATERIAL WE RETRIEVED STAYS READING-ONLY WHATEVER ANSWER COMES ──
    // Publishing bytes out of something we pulled on a client's behalf is the one
    // scenario where our own automation would be the proximate cause of
    // infringement — so `fetched` is reference-only by construction, and the
    // retrieval route has no answer to give it in the first place.
    const fetched = await body(
      await route(
        new Request('https://app.test/api/material/fetch', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com/theirs.txt', role: 'site' }),
        }),
        routerEnv(tenant),
        deps({
          fetch: async () =>
            new Response('someone else’s industry report', {
              status: 200,
              headers: { 'content-type': 'text/plain' },
            }),
        }),
      ),
    )
    expect(fetched.origin).toBe('fetched')
    expect(fetched.role).toBe('reference')
    expect(fetched.republishable).toBe(false)
    expect(fetched.rights).toBe('third_party')
    // The permissions INVERT with provenance — neither derives from the other.
    expect(fetched.exportable).toBe(true)
  })
})
