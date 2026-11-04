import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { publishSite } from '../tools/generate/src/publish/publish'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs for story-d34eccd8 — **serving a published site**, the
 * criteria that can only be proved where the code actually runs: inside
 * workerd, against a real D1 database and a real R2 bucket, with a REAL PUBLISH
 * on the writing side.
 *
 *   AC-903  — a published URL serves the site's live revision, derived as the
 *             highest in its log, complete with every asset it references.
 *   AC-1423 — live is recorded in exactly one place: no index object sits beside
 *             the bytes, so nothing can disagree with the log.
 *   AC-1424 — the builder's published view redirects here, so published bytes
 *             have exactly one serving path.
 *   AC-2244 — the published address is `/site/<siteId>/`, the site's own opaque
 *             key, and a key for another business is not obtainable through a
 *             business's own store handle.
 *
 * THE ADDRESS IS THE KEY ([[REQ-190]]). `/site/<slug>/` used to carry a chosen
 * name and no business, resolved through a global claim row. The segment is now
 * the site's 128-bit key — the value the joins use — and the only way a caller
 * learns it is `TenantSiteStore.siteKey(slug)`, a lookup scoped to that
 * business. Every serving request below is built from that lookup.
 *
 * WHY workerd AND NOT NODE. All of these are claims about the RECORD rather than
 * about the URL grammar. "Live is the highest id in the log" is enforced by a
 * `MAX(id)` over a real table — a hand-written double answering that query would
 * be asserting the double. The grammar and header criteria that need none of
 * this are proved in `reconciliation-published-site-serving.test.ts`.
 *
 * BOTH WORKERS ARE DRIVEN through their own `fetch`. control-app publishes;
 * public-site serves what it published. Nothing below is a double except
 * control-app's `ASSETS` binding, which serves build artifacts and has nothing to
 * do with a publish.
 */

const TENANT = 'storyd34e-serve'
const OTHER_TENANT = 'storyd34e-other'
const PUBLIC_ORIGIN = 'https://1stcontact.io'

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

/** Drive the builder's own entry point — its `fetch`, its router, its bindings. */
const call = (path: string, init?: RequestInit): Promise<Response> =>
  controlApp.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), controlEnv())

/** Drive `public-site`'s own entry point, with its own bindings. */
async function serve(pathAndQuery: string, method = 'GET'): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await publicSite.fetch(
    new Request(`${PUBLIC_ORIGIN}${pathAndQuery}`, { method }),
    { SITES: env.SITES, DB: env.DB } as PublicEnv,
    ctx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/**
 * A site made only of L1, carrying `marker` as the copy on its home page.
 *
 * Built from the real scaffolder rather than written here: a hand-rolled
 * definition restates the schema, and one that drifts from the validator fails as
 * "this draft does not validate", which is a test asserting its own mistake. Only
 * the one text leaf is moved, which is what makes one revision distinguishable
 * from the next in a served body.
 */
function siteWith(marker: string, slug = nextSlug('storyd34e')) {
  const seed = siteSeed({ slug })
  const pages = Object.entries(seed.pages).map(([name, page]) => {
    const copy = page as Record<string, unknown>
    const l1 = copy.l1 as { root: { children: Array<{ text: string }> } }
    l1.root.children[0].text = marker
    return { name, page: copy }
  })
  return { slug: seed.slug, siteJson: seed.siteJson, pages, assets: [] as never[] }
}

async function importSite(payload: ReturnType<typeof siteWith>): Promise<void> {
  const res = await call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

async function publish(slug: string, message: string): Promise<number> {
  const res = await call('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, message }),
  })
  expect(res.status).toBe(200)
  const body = (await res.json()) as { id: number; published: boolean }
  expect(body.published).toBe(true)
  return body.id
}

/**
 * The site's opaque key, asked of the business's OWN store handle — the only
 * place a caller may learn it ([[REQ-190]]).
 */
async function siteKeyOf(slug: string, tenant = TENANT): Promise<string> {
  const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(tenant)
  const key = await store.siteKey(slug)
  expect(key, `${tenant} holds no site '${slug}'`).not.toBeNull()
  return key as string
}

/** Import and publish r1 of a fresh site carrying `marker`. */
async function publishedSite(
  marker: string,
  slug?: string,
): Promise<{ slug: string; key: string; id: number }> {
  const site = siteWith(marker, slug)
  await importSite(site)
  const id = await publish(site.slug, 'first')
  return { slug: site.slug, key: await siteKeyOf(site.slug), id }
}

/** A second business's handle, registered on first use (`createTenant` is idempotent). */
async function otherBusiness(): Promise<TenantSiteStore> {
  const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await root.createTenant({ id: OTHER_TENANT, name: OTHER_TENANT })
  return root.forTenant(OTHER_TENANT)
}

/** Give `store` a draft site `slug` carrying `marker`, without publishing it. */
async function draftIn(store: TenantSiteStore, slug: string, marker: string): Promise<void> {
  await store.createDraft(slug)
  const site = siteWith(marker, slug)
  await store.write(slug, { siteJson: site.siteJson, pages: site.pages })
}

/** Move the draft's copy to `marker` and publish it as the next revision. */
async function republish(slug: string, marker: string): Promise<number> {
  const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
  const pages = await store.readPages(slug)
  const page = structuredClone(pages[0].page) as Record<string, unknown>
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  await store.write(slug, { pages: [{ name: pages[0].name, page }] })
  return publish(slug, marker)
}

/** Every R2 key under `prefix`, sorted. */
async function keysUnder(prefix: string): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await env.SITES.list({ prefix, cursor })
    for (const object of page.objects) keys.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return keys.sort()
}

/**
 * Drop revision `id` from the log, leaving its bytes in the bucket untouched.
 *
 * The log is keyed by the site's key alone ([[REQ-190]]): no child table
 * records the business or the slug any more.
 */
async function dropRevision(siteKey: string, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM site_revisions WHERE site_id = ? AND id = ?')
    .bind(siteKey, id)
    .run()
}

/**
 * A cache-defeating spelling of the same address.
 *
 * `public-site` stores every 200 in the edge Cache API, keyed by the whole
 * request URL, wherever a live one exists — so what these criteria are about is
 * the NEXT UNCACHED request, in the AC's own words, and this is how a test asks
 * for one explicitly rather than depending on whether the pool's `caches.default`
 * happens to retain anything. The route grammar reads the pathname alone, so the
 * address being resolved is byte-for-byte the address under test; only the cache
 * key differs.
 */
let uncachedCounter = 0
const uncached = (path: string): string => `${path}?uncached=${(uncachedCounter += 1)}`

/** Every DOCUMENT-RELATIVE URL the page asks the browser to load. */
function relativeReferences(html: string): string[] {
  const found = new Set<string>()
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1]
    if (url === '' || /^[a-z]+:/i.test(url) || url.startsWith('//') || url.startsWith('#')) continue
    if (url.startsWith('/')) continue
    found.add(url)
  }
  return [...found]
}

describe('story-d34eccd8 — serving a published site, over real bindings', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC903_a_published_url_serves_the_live_revision_whole', async () => {
    // AC-903 — the published address names the SITE only, never a revision, and
    // returns the entry page of whatever revision that site currently calls live.
    const { slug, key } = await publishedSite('REVISION-ONE-COPY')

    const page = await serve(`/site/${key}/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const html = await page.text()
    expect(html).toContain('REVISION-ONE-COPY')

    // A page that answers while its stylesheet does not is a broken page, not a
    // served one — so every reference the markup makes is resolved and demanded.
    const references = relativeReferences(html)
    expect(references.length, 'the page references nothing document-relative').toBeGreaterThan(0)
    for (const ref of references) {
      const resolved = new URL(ref, `${PUBLIC_ORIGIN}/site/${key}/`)
      const asset = await serve(`${resolved.pathname}${resolved.search}`)
      expect(asset.status, ref).toBe(200)
    }
    // …and a named one carries its own correct type.
    const css = await serve(`/site/${key}/theme.css`)
    expect(css.status).toBe(200)
    expect(css.headers.get('content-type')).toBe('text/css; charset=utf-8')
    expect((await css.text()).length).toBeGreaterThan(0)

    // LIVE IS DERIVED — the highest id in the log, computed on read. A second
    // revision changes what the SAME unchanged address returns, with nothing
    // else written to say so.
    const second = await republish(slug, 'REVISION-TWO-COPY')
    expect(second).toBe(2)
    expect(await (await serve(uncached(`/site/${key}/`))).text()).toContain('REVISION-TWO-COPY')

    // Wind the log back and the earlier revision serves again, because the log
    // is the only thing consulted. Both revisions' bytes are still in the bucket
    // — a rollback here is a read-time consequence, not a delete.
    await dropRevision(key, 2)
    expect(await (await serve(uncached(`/site/${key}/`))).text()).toContain('REVISION-ONE-COPY')
    expect(await env.SITES.get(`sites/${key}/rev/0001/out/index.html`)).not.toBeNull()
    expect(await env.SITES.get(`sites/${key}/rev/0002/out/index.html`)).not.toBeNull()

    // THE ADDRESS RESOLVES TO EXACTLY ONE SITE'S LOG, BY CONSTRUCTION. A second
    // business holding a site of the same slug — first as a draft, then
    // published — changes nothing about what this key serves: no claim is
    // consulted, and the other site lives under a different key entirely.
    const other = await otherBusiness()
    await draftIn(other, slug, 'THE-OTHER-ACCOUNTS-COPY')
    expect(await other.revisions(slug)).toHaveLength(0)
    const draftOnly = await (await serve(uncached(`/site/${key}/`))).text()
    expect(draftOnly).toContain('REVISION-ONE-COPY')
    expect(draftOnly).not.toContain('THE-OTHER-ACCOUNTS-COPY')

    await publishSite(other, slug, { message: 'theirs' })
    const otherKey = await siteKeyOf(slug, OTHER_TENANT)
    expect(otherKey).not.toBe(key)
    const afterOtherPublish = await (await serve(uncached(`/site/${key}/`))).text()
    expect(afterOtherPublish).toContain('REVISION-ONE-COPY')
    expect(afterOtherPublish).not.toContain('THE-OTHER-ACCOUNTS-COPY')
  })

  it('test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes', async () => {
    // AC-1423 — the per-site index object that used to sit beside a site's
    // stored bytes, recording its live revision and its revision list, does not
    // exist: nothing writes it and nothing reads it. What the published URL
    // serves therefore follows the log and only the log.
    const { slug, key } = await publishedSite('LOG-IS-THE-ONLY-RECORD')

    expect(await env.SITES.get(`sites/${key}/manifest.json`)).toBeNull()
    expect(await env.SITES.get(`sites/${key}/index.json`)).toBeNull()

    // Stronger than naming the object that used to be there: NOTHING sits beside
    // the revisions at all. Every key under the site is inside a revision.
    const afterFirst = await keysUnder(`sites/${key}/`)
    expect(afterFirst.length).toBeGreaterThan(0)
    for (const object of afterFirst) {
      expect(object, 'an object sits beside the revisions').toMatch(
        new RegExp(`^sites/${key}/rev/\\d{4}/`),
      )
    }

    // A second revision changes what is served with NO SECOND WRITE anywhere:
    // every key the publish added belongs to the new revision itself.
    expect(await republish(slug, 'THE-SECOND-REVISION')).toBe(2)
    expect(await (await serve(uncached(`/site/${key}/`))).text()).toContain('THE-SECOND-REVISION')

    const afterSecond = await keysUnder(`sites/${key}/`)
    const added = afterSecond.filter((object) => !afterFirst.includes(object))
    expect(added.length).toBeGreaterThan(0)
    for (const object of added) {
      expect(object, 'the publish wrote outside the new revision').toMatch(
        new RegExp(`^sites/${key}/rev/0002/`),
      )
    }
    // And r1's own bytes were not rewritten on the way.
    for (const object of afterFirst) {
      expect(afterSecond, object).toContain(object)
    }

    // Removing the highest revision from the log returns the previous one to
    // service, with both revisions' bytes still present and untouched — proving
    // what is served is COMPUTED from the log rather than read from anywhere.
    await dropRevision(key, 2)
    expect(await (await serve(uncached(`/site/${key}/`))).text()).toContain(
      'LOG-IS-THE-ONLY-RECORD',
    )
    expect(await keysUnder(`sites/${key}/`)).toEqual(afterSecond)
  })

  it('test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path', async () => {
    // AC-1424 — published bytes have exactly one serving path. The builder points
    // at it rather than serving a second copy: proxying would duplicate the
    // resolve-and-serve rules public-site owns, and re-deriving from today's
    // draft would show unpublished work at a published address.
    const { slug, key } = await publishedSite('THE-PUBLISHED-COPY')

    const root = await call(`/preview/${slug}/published/`)
    expect(root.status).toBe(302)
    expect(root.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/site/${key}/`)
    // It never returns the bytes itself.
    expect(await root.text()).toBe('')

    // Any path beneath the view is carried across unchanged.
    for (const rel of ['theme.css', 'about.html', 'assets/logo.svg']) {
      const beneath = await call(`/preview/${slug}/published/${rel}`)
      expect(beneath.status, rel).toBe(302)
      expect(beneath.headers.get('location'), rel).toBe(`${PUBLIC_ORIGIN}/site/${key}/${rel}`)
    }

    // Following the redirect serves the published revision.
    const followed = await serve(new URL(root.headers.get('location') as string).pathname)
    expect(followed.status).toBe(200)
    expect(await followed.text()).toContain('THE-PUBLISHED-COPY')

    // AND IT IS NEVER RE-DERIVED FROM THE DRAFT. Move the draft without
    // publishing: the builder still redirects rather than rendering, and the
    // address it points at still serves the PUBLISHED copy.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    const pages = await store.readPages(slug)
    const edited = structuredClone(pages[0].page) as Record<string, unknown>
    ;(edited.l1 as { root: { children: Array<{ text: string }> } }).root.children[0].text =
      'UNPUBLISHED-WORK'
    await store.write(slug, { pages: [{ name: pages[0].name, page: edited }] })

    const again = await call(`/preview/${slug}/published/`)
    expect(again.status).toBe(302)
    expect(await again.text()).toBe('')
    const stillPublished = await (await serve(uncached(`/site/${key}/`))).text()
    expect(stillPublished).toContain('THE-PUBLISHED-COPY')
    expect(stillPublished).not.toContain('UNPUBLISHED-WORK')

    // THE ACCEPTED COST, pinned so it cannot silently become a proxy again: a
    // site that has never published redirects all the same, and the visitor
    // receives public-site's ordinary not-found rather than a builder-shaped
    // message.
    const virgin = siteWith('NEVER-PUBLISHED-COPY')
    await importSite(virgin)
    const virginKey = await siteKeyOf(virgin.slug)
    const unpublished = await call(`/preview/${virgin.slug}/published/`)
    expect(unpublished.status).toBe(302)
    expect(unpublished.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/site/${virginKey}/`)

    const notFound = await serve(new URL(unpublished.headers.get('location') as string).pathname)
    expect(notFound.status).toBe(404)
    expect(notFound.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await notFound.text()).toBe('Not Found')
  })

  it('test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable', async () => {
    // AC-2244 — the segment is the site's opaque KEY, the value the database
    // joins on, and never the slug the operator calls the site.
    const { slug, key } = await publishedSite('KEY-ADDRESSED-COPY', 'home')
    expect(key).not.toBe(slug)
    expect(key).toMatch(/^site_[0-9a-f]{32}$/)

    const byKey = await serve(`/site/${key}/`)
    expect(byKey.status).toBe(200)
    expect(await byKey.text()).toContain('KEY-ADDRESSED-COPY')

    // The slug in the key's position names nothing: the same plain not-found as
    // any other unknown address.
    const bySlug = await serve(uncached(`/site/${slug}/`))
    expect(bySlug.status).toBe(404)
    expect(bySlug.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await bySlug.text()).toBe('Not Found')

    // A SECOND BUSINESS ALSO PUBLISHES `home`. Two keys, each serving its own
    // content — neither address can reach the other's site.
    const other = await otherBusiness()
    await draftIn(other, 'home', 'OTHER-BUSINESS-HOME')
    expect((await publishSite(other, 'home', { message: 'theirs' })).published).toBe(true)
    const otherKey = await siteKeyOf('home', OTHER_TENANT)
    expect(otherKey).not.toBe(key)
    const ours = await (await serve(uncached(`/site/${key}/`))).text()
    const theirs = await (await serve(uncached(`/site/${otherKey}/`))).text()
    expect(ours).toContain('KEY-ADDRESSED-COPY')
    expect(ours).not.toContain('OTHER-BUSINESS-HOME')
    expect(theirs).toContain('OTHER-BUSINESS-HOME')
    expect(theirs).not.toContain('KEY-ADDRESSED-COPY')

    // A KEY FOR ANOTHER BUSINESS IS NOT OBTAINABLE THROUGH THIS HANDLE. A slug
    // only the other business holds answers no key from ours — and so the
    // builder's published view, which resolves through that same handle, is a
    // 404 rather than a redirect to the other business's site.
    const theirsOnly = nextSlug('storyd34e-theirs')
    await draftIn(other, theirsOnly, 'ONLY-THE-OTHER-BUSINESS')
    await publishSite(other, theirsOnly, { message: 'theirs only' })
    expect(await other.siteKey(theirsOnly)).not.toBeNull()
    const ourHandle = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    expect(await ourHandle.siteKey(theirsOnly)).toBeNull()
    expect(await ourHandle.siteKeys()).not.toContain(await other.siteKey(theirsOnly))

    const refused = await call(`/preview/${theirsOnly}/published/`)
    expect(refused.status).toBe(404)
    expect(refused.headers.get('location')).toBeNull()

    // …while a slug this business does hold redirects to its key-addressed URL.
    const held = await call(`/preview/${slug}/published/`)
    expect(held.status).toBe(302)
    expect(held.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/site/${key}/`)
  })
})
