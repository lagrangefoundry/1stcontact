import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { publishSite } from '../tools/generate/src/publish/publish'
import { liveRevisionOf } from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-149 — publishing in the cloud, end to end, inside workerd.
 *
 * WHAT MAKES THESE WORTH ANYTHING. Every assertion runs against a REAL D1
 * database and a REAL R2 bucket, inside the runtime the deployed Workers use.
 * The whole ticket is the claim "a publish can happen with no filesystem
 * anywhere on the path", and a node-side test of the same functions would pass
 * while proving nothing about it — `cmdPublish` passed for a year and could not
 * run in a Worker.
 *
 * BOTH WORKERS ARE DRIVEN, through their own `fetch`. control-app publishes;
 * public-site serves what it published. That crossing is the ticket: the two
 * halves used to be joined by an operator running `1c deploy` on a laptop, and
 * are now joined by a D1 row and an R2 key that neither Worker restates.
 */

const TENANT = 'req149'
const OTHER_TENANT = 'req149-other'

function controlEnv(overrides: Partial<ControlEnv> = {}): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit, overrides?: Partial<ControlEnv>): Promise<Response> =>
  controlApp.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    controlEnv(overrides),
  )

/** Drive `public-site`'s own entry point, with its own bindings. */
async function serve(path: string, method = 'GET'): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await publicSite.fetch(
    new Request(`https://1stcontact.io${path}`, { method }),
    { SITES: env.SITES, DB: env.DB } as PublicEnv,
    ctx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/**
 * A site made only of L1, built from the real scaffolder rather than a fixture
 * written here — a hand-rolled definition would restate the schema, and one that
 * drifts from the validator fails as "this draft does not validate", which is a
 * test asserting its own mistake.
 */
function pureL1Site(slug = nextSlug('req149')) {
  const seed = siteSeed({ slug })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  }
}

async function importSite(payload: ReturnType<typeof pureL1Site>): Promise<void> {
  const res = await call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

async function publish(slug: string, message?: string): Promise<Response> {
  return call('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, message }),
  })
}

/** A site imported and published once. Returns its slug and live revision. */
/**
 * A published site, and BOTH of its names ([[REQ-190]]).
 *
 * The `slug` is what the business calls it and is what the builder's routes
 * take; the `siteKey` is what the PUBLIC address is made of and what every R2
 * key is built from. They used to be the same string, which is what made a
 * chosen name a key — so the two are returned separately here and each test
 * uses the one it actually means.
 */
async function publishedSite(): Promise<{ slug: string; id: number; siteKey: string }> {
  const site = pureL1Site()
  await importSite(site)
  const res = await publish(site.slug, 'first')
  expect(res.status).toBe(200)
  const body = (await res.json()) as { id: number; published: boolean }
  expect(body.published).toBe(true)
  return { slug: site.slug, id: body.id, siteKey: await siteKeyOf(site.slug) }
}

/** The site's key, asked of the store rather than assumed from the slug. */
async function siteKeyOf(slug: string, tenantId: string = TENANT): Promise<string> {
  const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(tenantId)
  const key = await store.siteKey(slug)
  expect(key, `no site '${slug}' in ${tenantId}`).not.toBeNull()
  return key!
}

describe('REQ-149 — publish in the cloud', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-149_publish_mints_renders_and_stores_with_no_filesystem', async () => {
    // AC-1. The route that answered 501 for two tickets now mints a revision,
    // renders it and writes it to R2 — inside workerd, where there is no
    // filesystem to fall back on. r1 because the log starts empty and live is
    // the highest id, never a stored pointer.
    const site = pureL1Site()
    await importSite(site)

    const res = await publish(site.slug, 'launch')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      id: number
      published: boolean
      changes: { added: string[] }
      url: string
    }
    expect(body.id).toBe(1)
    expect(body.published).toBe(true)
    // Every path is `added` on a first publish, and the change list names the
    // store's own keys — `site.json`, `pages/home.json` — not a filesystem's.
    expect(body.changes.added).toContain('site.json')
    expect(body.changes.added).toContain('pages/home.json')
    // THE URL IS BUILT FROM THE SITE'S KEY, NOT ITS SLUG ([[REQ-190]]). The slug
    // is what this business calls the site and means nothing outside it; the
    // published address is the key, which names exactly one site by
    // construction and is why there is no claim to make.
    const siteKey = await siteKeyOf(site.slug)
    expect(siteKey).not.toBe(site.slug)
    expect(body.url).toBe(`https://1stcontact.io/site/${siteKey}/`)

    // The rendered bytes really are in the bucket, under the revision's own key.
    const html = await env.SITES.get(`sites/${siteKey}/rev/0001/out/index.html`)
    expect(html).not.toBeNull()
    expect(await html!.text()).toContain('theme.css')

    // `source/` travels with `out/`, so R2 holds a COMPLETE revision — this is
    // the only copy of what the definition looked like at r1, and it is what
    // makes a checkout possible at all.
    const frozen = await env.SITES.get(`sites/${siteKey}/rev/0001/source/site.json`)
    expect(frozen).not.toBeNull()
  })

  it('test_UAT_FC_REQ-149_public_site_serves_the_published_revision_from_d1', async () => {
    // AC-2. public-site resolves the live revision through its existing seam,
    // now reading D1 instead of a manifest object — and the interface it reads
    // through did not change, which is what the seam was for.
    const { siteKey } = await publishedSite()

    const res = await serve(`/site/${siteKey}/`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await res.text()).toContain('theme.css')

    // The page is only served if what it asks for is served too: a page that
    // 200s while its stylesheet 404s is a broken page, not a served one.
    const css = await serve(`/site/${siteKey}/theme.css`)
    expect(css.status).toBe(200)
    expect((await css.text()).length).toBeGreaterThan(0)

    // AC-9 — no manifest object exists any more. D1 is the only record, so
    // there is nothing in the bucket that could disagree with it.
    expect(await env.SITES.get(`sites/${siteKey}/manifest.json`)).toBeNull()
  })

  it('test_UAT_FC_REQ-149_publishing_an_unchanged_draft_is_a_no_op', async () => {
    // AC-3 / D1. Publish is a toolbar button now and buttons get pressed twice;
    // a second press must not mint a revision that describes no difference.
    const { slug, id } = await publishedSite()

    const again = await publish(slug, 'a different message entirely')
    expect(again.status).toBe(200)
    const body = (await again.json()) as { id: number; published: boolean }
    expect(body.published).toBe(false)
    expect(body.id).toBe(id)

    // And the log really is unmoved — the no-op is a decision not to write,
    // not a write that happened to produce the same answer.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    expect(await store.revisions(slug)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-149_history_is_readable_and_checkout_is_forward_only', async () => {
    // AC-4. Checking out an older revision does not rewind the log: it
    // re-parents the DRAFT, so the next publish mints a NEW highest id and
    // records what it descended from.
    const { slug } = await publishedSite()
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)

    // A second revision, so there is a history to check out FROM.
    const pages = await store.readPages(slug)
    const edited = structuredClone(pages[0].page) as Record<string, unknown>
    ;(edited as { title?: string }).title = 'Second'
    await store.write(slug, { pages: [{ name: pages[0].name, page: edited }] })
    const second = await publishSite(store, slug, { message: 'second' })
    expect(second.id).toBe(2)
    expect(second.published).toBe(true)

    // The log carries what the toolbar needs to show, over the wire.
    const listed = await call(`/api/revisions?slug=${slug}`)
    expect(listed.status).toBe(200)
    const history = (await listed.json()) as Array<{ id: number; message: string }>
    // Newest first, because that is the order the question is asked in.
    expect(history.map((r) => r.id)).toEqual([2, 1])
    expect(history[0].message).toBe('second')

    // Roll back by checking out r1, then publishing: r3, based on r1.
    const { checkoutRevision } = await import('../tools/generate/src/publish/publish')
    await checkoutRevision(store, slug, 1)
    expect(await store.draftBase(slug)).toBe(1)

    const third = await publishSite(store, slug, { message: 'rollback' })
    expect(third.id).toBe(3)
    const entries = await store.revisions(slug)
    expect(liveRevisionOf(entries)).toBe(3)
    expect(entries.find((r) => r.id === 3)!.basedOn).toBe(1)

    // Forward-only means r2 is still there and still readable — a rollback adds
    // a revision, it never removes one.
    expect(await store.readRevision(slug, 2)).not.toBeNull()
  })

  it('test_UAT_FC_REQ-149_an_invalid_draft_publishes_nothing', async () => {
    // AC-5. Validation happens before any write, so a broken draft costs the
    // author an error message and costs the published site nothing at all.
    const { slug, siteKey } = await publishedSite()
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)

    await store.write(slug, { siteJson: { nonsense: true } })

    const res = await publish(slug, 'this cannot work')
    expect(res.status).toBe(400)
    expect((await res.json()) as { error: string }).toHaveProperty('error')

    // Nothing was minted, and the live site is exactly what it was.
    expect(await store.revisions(slug)).toHaveLength(1)
    const served = await serve(`/site/${siteKey}/`)
    expect(served.status).toBe(200)
  })

  /**
   * REQ-149's SLUG CLAIM IS GONE, AND ITS PROPERTY INVERTED ([[REQ-190]]).
   *
   * The test that stood here asserted AC-8 / D2: a second business publishing a
   * slug the first already held was refused before a byte was written, because
   * `/site/<slug>/` was the public grammar and without a claim tenant B would
   * have silently overwritten tenant A's live site.
   *
   * BOTH HALVES OF THAT WERE THE SAME DEFECT. The overwrite was real, and the
   * claim genuinely prevented it — but it prevented it by making a name a key,
   * which cost the second business a name it could do nothing about and told it,
   * by refusing, that another business on the deployment already had one. The
   * published address is the site's own key now, so there is nothing to overwrite
   * and nothing to claim.
   *
   * The property that replaces it is the positive one, and it is REQ-190's:
   * `test_UAT_FC_REQ-190_two_businesses_each_publish_a_site_called_home`. AC-8's
   * real content — a refused publish leaves the live site untouched — is still
   * proved above by `test_UAT_FC_REQ-149_an_invalid_draft_publishes_nothing`.
   */

  it('test_UAT_FC_REQ-149_the_builder_redirects_the_published_channel_to_public_site', async () => {
    // D4. One serving path for published bytes. The builder does not proxy them:
    // that would duplicate the resolve-and-serve logic public-site owns.
    const { slug, siteKey } = await publishedSite()

    const res = await call(`/preview/${slug}/published/`)
    expect(res.status).toBe(302)
    // The builder's own routes take the SLUG, because that is what the operator
    // typed; what it redirects to is built from the KEY ([[REQ-190]]).
    expect(res.headers.get('location')).toBe(`https://1stcontact.io/site/${siteKey}/`)
  })

  it('test_UAT_FC_REQ-149_build_artifacts_serve_when_the_store_has_no_tenant', async () => {
    // AC-10. `/builder/*` and `/webui/*` are BUILD ARTIFACTS — they have nothing
    // to do with a tenant and must not depend on one.
    //
    // They used to. The router opened a tenant-scoped store before any route
    // matched, so on a store with no tenant row `forTenant` refused and every
    // asset answered 503. The document itself is served earlier, so the operator
    // got a page that loaded 200 with every module in its import graph dead —
    // a blank builder, with the reason reachable only in devtools.
    //
    // `nobody` is deliberately a tenant that does not exist: this asserts the
    // asset path never opens a store at all, not that it opens one successfully.
    const asset = await call('/builder/main.js', undefined, { TENANT_ID: 'nobody' })
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe('asset:/builder/main.js')

    // The API routes still refuse an UNOPENABLE store, still say why, and still
    // do it with the SAME STATUS as before — deferring the store moved when it
    // is opened, and must not change what an unopenable one means. 503: the
    // deployment is misconfigured, which is not the same as the server breaking
    // on a request.
    //
    // THE PROBE CHANGED, AND ONLY THE PROBE (BUG-36). This used to name a
    // tenant that did not exist. That is no longer an unopenable store: the
    // configured tenant is registered on first use, because a deployment whose
    // migrations have run and whose `tenants` table is empty is every NEW
    // deployment, and refusing it left the builder dead until someone published
    // from a laptop. An unset `TENANT_ID` is the case that is still genuinely
    // unopenable — there is no name to register — so it is what proves the
    // property AC-10 is actually about.
    const refused = await call('/api/sites', undefined, { TENANT_ID: '' })
    expect(refused.status).toBe(503)
    expect(await refused.text()).toContain('TENANT_ID is not configured')
  })

  it('test_UAT_FC_REQ-149_the_site_listing_reports_the_live_revision', async () => {
    // The selector said `latest: null` for every site while the store held no
    // revisions. There is something true to say now, and it is derived from the
    // log rather than read from a column.
    const { slug, id } = await publishedSite()

    const res = await call('/api/sites')
    expect(res.status).toBe(200)
    const sites = (await res.json()) as Array<{ slug: string; latest: number | null }>
    expect(sites.find((s) => s.slug === slug)?.latest).toBe(id)
  })
})
