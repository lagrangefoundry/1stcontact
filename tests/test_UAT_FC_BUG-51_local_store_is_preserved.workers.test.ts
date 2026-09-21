import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-51 — **the local store is preserved unless the operator says otherwise.**
 *
 * WHAT WAS LOST AND HOW. A demo site built through the builder came back as a
 * blank starter page. It had not been deleted: its change journal, its uploaded
 * asset, its audit trail and its chat transcript were all still there, and only
 * `site.json` and `home.json` had been replaced — by the scaffold `1c new`
 * emits. `sites.version` was 26 and `sites.counter` 16, so the row had never
 * been recreated; something had written over it. The path that can do that is
 * `POST /api/import`, which replaces rather than merges, and whose own docstring
 * called re-running it "the ordinary way to use it".
 *
 * WHY THESE ASSERTIONS ARE EVIDENCE. They run inside workerd, through the
 * Worker's own `fetch`, against the real D1 and R2 the deployed Worker uses, with
 * the schema applied from `db/migrations`. The refusal is proved the only way a
 * refusal about data loss can be: by reading the stored page back and comparing
 * it byte for byte with what was there before the attempt.
 *
 * THE COUNTER, NOT THE VERSION, is what the guard reads, and one case here exists
 * solely to hold that line: an ordinary publish-edit-publish loop must keep
 * working. `write` bumps `version` on every call including the import's own, so a
 * version guard would refuse the second copy-up of a site nobody had
 * touched in the builder. `counter` moves only through `appendChange`.
 */

/**
 * ONE BUSINESS PER CASE, WHICH [[REQ-236]] MADE NECESSARY RATHER THAN TIDY.
 *
 * Every case here used to share the tenant `bug51` and tell its sites apart by
 * the slug it pushed, because a payload NAMED its destination. The route
 * resolves its own target now — the receiving business's single site — so two
 * pushes into one business are two writes to one site, and the second case's
 * import would meet the first case's journalled change and be refused. Giving
 * each case its own business is what restores the isolation the slug used to
 * provide, and it is also what the route's own rule implies: a destination is a
 * business, so two destinations are two businesses.
 */
let businessSeq = 0
const nextBusiness = (): string => `bug51-${(businessSeq += 1)}`

function workerEnv(tenant: string, overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenant,
    // Loopback dev-open, as every other workerd suite here does it: Access is
    // unconfigured in the test runtime and would otherwise refuse every request
    // before the route under test ran.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (tenant: string, path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(tenant),
  )

/** A payload in exactly the shape a copy-up sends. */
function payloadFor(slug: string, heading?: string) {
  const seed = siteSeed({ slug })
  const pages = Object.entries(seed.pages).map(([name, page]) => ({
    name,
    page: heading === undefined ? page : { ...page, title: heading },
  }))
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages,
    assets: [] as { name: string; base64: string }[],
  }
}

function importSite(tenant: string, payload: Record<string, unknown>): Promise<Response> {
  return call(tenant, '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * Push a payload in and hand back the KEY it landed on ([[REQ-236]]).
 *
 * The route answers with `site` for exactly this reason: the name in the payload
 * means something only on the laptop it came from, so without reading the reply
 * a caller has no way to address what it just wrote.
 */
async function importInto(
  tenant: string,
  payload: Record<string, unknown>,
): Promise<{ status: number; site: string }> {
  const response = await importSite(tenant, payload)
  const body = (await response.json()) as { site?: string }
  return { status: response.status, site: body.site ?? '' }
}

/** The stored page, as bytes-equivalent JSON — what "unchanged" has to mean. */
async function storedPage(tenant: string, site: string, name = 'home.json'): Promise<unknown> {
  const store = await tenantStore(tenant)
  const pages = await store.readPages(site)
  return pages.find((p) => p.name === name)?.page ?? null
}

beforeAll(async () => {
  await applySchema()
})

describe('BUG-51 — an import never silently replaces work done in the builder', () => {
  it('lands on a site that does not exist yet', async () => {
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const res = await importSite(tenant, payloadFor(nextSlug()))
    expect(res.status).toBe(200)
    // `site` RIDES ALONG WITH THE COUNTS ([[REQ-236]]) — the key the push landed
    // on, which is the only thing in this reply the caller can address.
    const body = (await res.json()) as { pages: number; siteJson: boolean; site: string }
    expect(body).toMatchObject({ pages: 1, siteJson: true })
    expect(body.site).toBeTruthy()
    expect(await tenantStore(tenant).then((store) => store.siteKeys('site'))).toEqual([body.site])
  })

  it('lands again on a site only ever published from local — the ordinary loop', async () => {
    // THE CASE A VERSION GUARD WOULD HAVE BROKEN. This site's `version` is
    // already non-zero after the first import, because `write` bumps it. Its
    // `counter` is still zero, because nothing has been journalled. Publish,
    // edit locally, copy again is the loop the copy commands exist for and it
    // must not need a flag.
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const slug = nextSlug()
    const first = await importInto(tenant, payloadFor(slug))
    expect(first.status).toBe(200)

    const store = await tenantStore(tenant)
    expect(await store.counter(first.site)).toBe(0)

    // THE SECOND PUSH RESOLVES THE SAME TARGET WITHOUT BEING TOLD ([[REQ-236]]).
    // It lands on the business's existing site rather than minting a second one,
    // which is what makes "publish, edit locally, publish again" one site's loop
    // rather than a trail of them.
    const second = await importInto(tenant, payloadFor(slug, 'Second publish'))
    expect(second.status).toBe(200)
    expect(second.site).toBe(first.site)
    expect(await storedPage(tenant, first.site)).toMatchObject({ title: 'Second publish' })
  })

  it('is refused with 409, and the stored page is unchanged, once the builder has edited it', async () => {
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const slug = nextSlug()
    const landed = await importInto(tenant, payloadFor(slug, 'Built here'))
    expect(landed.status).toBe(200)

    // One journalled change is all it takes to make this site somebody's work.
    // `appendChange` is what a builder edit, an AI turn and a structured-edit
    // command all go through, which is why it is the signal being read.
    const store = await tenantStore(tenant)
    await store.appendChange(landed.site, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })
    expect(await store.counter(landed.site)).toBe(1)

    const before = await storedPage(tenant, landed.site)

    const res = await importSite(tenant, payloadFor(slug, 'Scaffold from a worktree'))
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string; slug: string; changes: number }
    // THE REFUSAL STILL NAMES THE SOURCE ([[REQ-236]]). `slug` is what the
    // operator typed on their own machine, and it is the only name in this
    // exchange they would recognise — so it is what the message reports back,
    // even though the destination it protected is addressed by a key.
    expect(body.slug).toBe(slug)
    expect(body.changes).toBe(1)
    // The refusal has to name what it protected. "Conflict" alone would leave the
    // operator to guess whether anything landed — which is the state BUG-51 left
    // them in for a day.
    expect(body.error).toContain('Nothing was written')

    // THE ASSERTION THE WHOLE TICKET IS ABOUT.
    expect(await storedPage(tenant, landed.site)).toEqual(before)
    expect(before).toMatchObject({ title: 'Built here' })
  })

  it('lands when the caller says force, which is the operator meaning it', async () => {
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const slug = nextSlug()
    const landed = await importInto(tenant, payloadFor(slug, 'Built here'))
    expect(landed.status).toBe(200)
    const store = await tenantStore(tenant)
    await store.appendChange(landed.site, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })

    expect((await importSite(tenant, payloadFor(slug, 'Scaffold from a worktree'))).status).toBe(409)

    const forced = await importSite(tenant, { ...payloadFor(slug, 'Forced'), force: true })
    expect(forced.status).toBe(200)
    expect(await storedPage(tenant, landed.site)).toMatchObject({ title: 'Forced' })
  })

  it('test_UAT_FC_REQ-236_a_push_into_a_business_holding_two_sites_is_refused', async () => {
    // THE AMBIGUITY THE PAYLOAD USED TO RESOLVE ([[REQ-236]]). A push named its
    // destination, so a business with any number of sites had an unambiguous one.
    // The route resolves its own target now, and "the business's single site" is
    // a sentence with no referent once there are two — so it refuses rather than
    // picking, which is the only answer that cannot silently overwrite the wrong
    // site.
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const store = await tenantStore(tenant)
    await store.createDraft('site')
    await store.createDraft('site')

    const res = await importSite(tenant, payloadFor(nextSlug(), 'Ambiguous'))
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string; sites: number }
    expect(body.sites).toBe(2)
    expect(body.error).toContain('Nothing was written')
  })

  it('test_UAT_FC_REQ-236_a_portal_is_not_a_destination_a_push_can_be_confused_by', async () => {
    // KIND NARROWS THE TARGET SEARCH, and this is why it has to. A business that
    // has authored a portal holds two rows; if the route counted them both it
    // would refuse every push from that business as ambiguous, over a page the
    // customer authored at `/account` and never meant as a publish destination.
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const store = await tenantStore(tenant)
    await store.createDraft('portal')

    const landed = await importInto(tenant, payloadFor(nextSlug(), 'Past the portal'))
    expect(landed.status).toBe(200)
    expect(await storedPage(tenant, landed.site)).toMatchObject({ title: 'Past the portal' })
    expect(await store.siteKeys('portal')).not.toContain(landed.site)
  })
})

describe('REQ-236 — the guard BUG-51 put in createDraft, moved to the caller', () => {
  /**
   * WHAT BUG-51 WAS ACTUALLY PROTECTING, AND WHERE IT LIVES NOW.
   *
   * BUG-51 found `createDraft` throwing away information `INSERT OR IGNORE` had
   * always held — whether it inserted — so every caller followed it with an
   * unconditional `write` and the "or ignore" protected nothing. Its fix was to
   * return the boolean, and the guard became "seed only if the create happened".
   *
   * [[REQ-236]] REMOVES THE THING THAT MADE THAT POSSIBLE. With no slug there is
   * nothing to insert-or-ignore ON, so `createDraft` mints unconditionally and
   * has no "already existed" to report. The protection is not weakened, it is
   * MOVED: the caller asks `siteKeys` whether this business already holds a site
   * and creates only when it does not. That is a stronger guard than the one it
   * replaces, which could only see a collision on the single NAME it happened to
   * pass — this one sees every site the business has.
   *
   * The assertions below are BUG-51's own, re-expressed against the shape that
   * now carries its intent.
   */
  it('test_UAT_FC_REQ-236_createDraft_mints_a_fresh_site_every_time', async () => {
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const store = await tenantStore(tenant)

    const first = await store.createDraft()
    const second = await store.createDraft()

    // TWO CALLS, TWO SITES — the property that makes the caller-side guard
    // necessary rather than optional.
    expect(first).not.toBe(second)
    expect((await store.siteKeys('site')).sort()).toEqual([first, second].sort())
  })

  it('test_UAT_FC_REQ-236_seeding_only_when_the_business_holds_none_leaves_authored_work_alone', async () => {
    // THE `createStarterSite` SHAPE, exercised at the store level exactly as
    // BUG-51 exercised it: seed, and write the scaffold ONLY if there was nothing
    // there. Run twice over a site that has since been authored, the second run
    // must change nothing — and must not leave a second site behind either,
    // which is the new way this could go wrong.
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const store = await tenantStore(tenant)
    const seed = siteSeed({ slug: nextSlug() })

    const seedIfNone = async (): Promise<string> => {
      const held = await store.siteKeys('site')
      if (held.length > 0) return held[0]!
      const site = await store.createDraft('site')
      await store.write(site, {
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: [{ name: 'home.json', page: { id: 'home', title: 'Starter' } }],
      })
      return site
    }

    const site = await seedIfNone()
    await store.write(site, {
      pages: [{ name: 'home.json', page: { id: 'home', title: 'Authored' } }],
    })

    expect(await seedIfNone()).toBe(site)
    expect(await storedPage(tenant, site)).toMatchObject({ title: 'Authored' })
    expect(await store.siteKeys('site')).toEqual([site])
  })
})
