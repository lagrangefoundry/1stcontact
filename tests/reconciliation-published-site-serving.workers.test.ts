import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs for story-d34eccd8 — **serving a published site**, the
 * three criteria that can only be proved where the code actually runs: inside
 * workerd, against a real D1 database and a real R2 bucket, with a REAL PUBLISH
 * on the writing side.
 *
 *   AC-903  — a published URL serves the site's live revision, derived as the
 *             highest in its log, complete with every asset it references, and
 *             resolved through the claim that says whose log to read.
 *   AC-1423 — live is recorded in exactly one place: no index object sits beside
 *             the bytes, so nothing can disagree with the log.
 *   AC-1424 — the builder's published view redirects here, so published bytes
 *             have exactly one serving path.
 *
 * WHY workerd AND NOT NODE. All three are claims about the RECORD rather than
 * about the URL grammar. "Live is the highest id in the log" is enforced by a
 * `MAX(id)` over a real table joined through a real claim row — a hand-written
 * double answering that query would be asserting the double, and could not
 * express "a second account owns a site of this name" at all, because that is a
 * property of the primary key. The grammar and header criteria that need none of
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

/** Import and publish r1 of a fresh site carrying `marker`. */
async function publishedSite(marker: string): Promise<{ slug: string; id: number }> {
  const site = siteWith(marker)
  await importSite(site)
  return { slug: site.slug, id: await publish(site.slug, 'first') }
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

/** Drop revision `id` from the log, leaving its bytes in the bucket untouched. */
async function dropRevision(slug: string, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM site_revisions WHERE tenant_id = ? AND slug = ? AND id = ?')
    .bind(TENANT, slug, id)
    .run()
}

/**
 * A cache-defeating spelling of the same address.
 *
 * `public-site` stores every 200 in the edge Cache API, keyed by the whole
 * request URL, wherever a live one exists — so what these criteria are about is
 * the NEXT UNCACHED request, in the AC's own words, and this is how a test asks
 * for one explicitly rather than depending on whether the pool's `caches.default`
 * happens to retain anything (today it does not). The route grammar reads the
 * pathname alone, so the address being resolved is byte-for-byte the address
 * under test; only the cache key differs.
 *
 * Whether the edge cache honours the same policy is not this file's question —
 * `reconciliation-published-site-serving.test.ts` pins it against a cache that
 * really does retain (AC-911).
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
    const { slug } = await publishedSite('REVISION-ONE-COPY')

    const page = await serve(`/site/${slug}/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const html = await page.text()
    expect(html).toContain('REVISION-ONE-COPY')

    // A page that answers while its stylesheet does not is a broken page, not a
    // served one — so every reference the markup makes is resolved and demanded.
    const references = relativeReferences(html)
    expect(references.length, 'the page references nothing document-relative').toBeGreaterThan(0)
    for (const ref of references) {
      const resolved = new URL(ref, `${PUBLIC_ORIGIN}/site/${slug}/`)
      const asset = await serve(`${resolved.pathname}${resolved.search}`)
      expect(asset.status, ref).toBe(200)
    }
    // …and a named one carries its own correct type.
    const css = await serve(`/site/${slug}/theme.css`)
    expect(css.status).toBe(200)
    expect(css.headers.get('content-type')).toBe('text/css; charset=utf-8')
    expect((await css.text()).length).toBeGreaterThan(0)

    // LIVE IS DERIVED — the highest id in the log, computed on read. A second
    // revision changes what the SAME unchanged address returns, with nothing
    // else written to say so.
    const second = await republish(slug, 'REVISION-TWO-COPY')
    expect(second).toBe(2)
    expect(await (await serve(uncached(`/site/${slug}/`))).text()).toContain('REVISION-TWO-COPY')

    // Wind the log back and the earlier revision serves again, because the log
    // is the only thing consulted. Both revisions' bytes are still in the bucket
    // — a rollback here is a read-time consequence, not a delete.
    await dropRevision(slug, 2)
    expect(await (await serve(uncached(`/site/${slug}/`))).text()).toContain('REVISION-ONE-COPY')
    expect(await env.SITES.get(`sites/${slug}/rev/0001/out/index.html`)).not.toBeNull()
    expect(await env.SITES.get(`sites/${slug}/rev/0002/out/index.html`)).not.toBeNull()

    // A PUBLISHED ADDRESS IS GLOBAL, AND CLAIMED. The public URL carries no
    // account, so a second account owning a site of the same name must not
    // change what it resolves to — it resolves to the claiming account's log and
    // never to whichever account happened to sort first.
    const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await root.createTenant({ id: OTHER_TENANT, name: OTHER_TENANT })
    const other = await root.forTenant(OTHER_TENANT)
    await other.createDraft(slug)
    const impostor = siteWith('THE-OTHER-ACCOUNTS-COPY', slug)
    await other.write(slug, {
      siteJson: impostor.siteJson,
      pages: impostor.pages,
    })
    expect(await other.revisions(slug)).toHaveLength(0)

    const afterImpostor = await (await serve(uncached(`/site/${slug}/`))).text()
    expect(afterImpostor).toContain('REVISION-ONE-COPY')
    expect(afterImpostor).not.toContain('THE-OTHER-ACCOUNTS-COPY')
  })

  it('test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes', async () => {
    // AC-1423 — the per-site index object that used to sit beside a site's
    // stored bytes, recording its live revision and its revision list, does not
    // exist: nothing writes it and nothing reads it. What the published URL
    // serves therefore follows the log and only the log.
    const { slug } = await publishedSite('LOG-IS-THE-ONLY-RECORD')

    expect(await env.SITES.get(`sites/${slug}/manifest.json`)).toBeNull()
    expect(await env.SITES.get(`sites/${slug}/index.json`)).toBeNull()

    // Stronger than naming the object that used to be there: NOTHING sits beside
    // the revisions at all. Every key under the site is inside a revision.
    const afterFirst = await keysUnder(`sites/${slug}/`)
    expect(afterFirst.length).toBeGreaterThan(0)
    for (const key of afterFirst) {
      expect(key, 'an object sits beside the revisions').toMatch(
        new RegExp(`^sites/${slug}/rev/\\d{4}/`),
      )
    }

    // A second revision changes what is served with NO SECOND WRITE anywhere:
    // every key the publish added belongs to the new revision itself.
    expect(await republish(slug, 'THE-SECOND-REVISION')).toBe(2)
    expect(await (await serve(uncached(`/site/${slug}/`))).text()).toContain('THE-SECOND-REVISION')

    const afterSecond = await keysUnder(`sites/${slug}/`)
    const added = afterSecond.filter((key) => !afterFirst.includes(key))
    expect(added.length).toBeGreaterThan(0)
    for (const key of added) {
      expect(key, 'the publish wrote outside the new revision').toMatch(
        new RegExp(`^sites/${slug}/rev/0002/`),
      )
    }
    // And r1's own bytes were not rewritten on the way.
    for (const key of afterFirst) {
      expect(afterSecond, key).toContain(key)
    }

    // Removing the highest revision from the log returns the previous one to
    // service, with both revisions' bytes still present and untouched — proving
    // what is served is COMPUTED from the log rather than read from anywhere.
    await dropRevision(slug, 2)
    expect(await (await serve(uncached(`/site/${slug}/`))).text()).toContain(
      'LOG-IS-THE-ONLY-RECORD',
    )
    expect(await keysUnder(`sites/${slug}/`)).toEqual(afterSecond)
  })

  it('test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path', async () => {
    // AC-1424 — published bytes have exactly one serving path. The builder points
    // at it rather than serving a second copy: proxying would duplicate the
    // resolve-and-serve rules public-site owns, and re-deriving from today's
    // draft would show unpublished work at a published address.
    const { slug } = await publishedSite('THE-PUBLISHED-COPY')

    const root = await call(`/preview/${slug}/published/`)
    expect(root.status).toBe(302)
    expect(root.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/site/${slug}/`)
    // It never returns the bytes itself.
    expect(await root.text()).toBe('')

    // Any path beneath the view is carried across unchanged.
    for (const rel of ['theme.css', 'about.html', 'assets/logo.svg']) {
      const beneath = await call(`/preview/${slug}/published/${rel}`)
      expect(beneath.status, rel).toBe(302)
      expect(beneath.headers.get('location'), rel).toBe(`${PUBLIC_ORIGIN}/site/${slug}/${rel}`)
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
    const stillPublished = await (await serve(uncached(`/site/${slug}/`))).text()
    expect(stillPublished).toContain('THE-PUBLISHED-COPY')
    expect(stillPublished).not.toContain('UNPUBLISHED-WORK')

    // THE ACCEPTED COST, pinned so it cannot silently become a proxy again: a
    // site that has never published redirects all the same, and the visitor
    // receives public-site's ordinary not-found rather than a builder-shaped
    // message.
    const virgin = siteWith('NEVER-PUBLISHED-COPY')
    await importSite(virgin)
    const unpublished = await call(`/preview/${virgin.slug}/published/`)
    expect(unpublished.status).toBe(302)
    expect(unpublished.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/site/${virgin.slug}/`)

    const notFound = await serve(new URL(unpublished.headers.get('location') as string).pathname)
    expect(notFound.status).toBe(404)
    expect(notFound.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await notFound.text()).toBe('Not Found')
  })
})
