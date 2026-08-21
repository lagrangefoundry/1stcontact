/**
 * REQ-111 — `public-site` serves published sites out of R2.
 *
 * The Worker in front of the bucket was once a stub returning a greeting;
 * nothing had ever actually been served. These UATs pin the serving contract
 * through the Worker's real entry point — `fetch(Request, Env, ExecutionContext)`
 * — with the bucket seeded by a REAL PUBLISH, so what is served is what the
 * publish path genuinely produces rather than a hand-built fixture that agrees
 * with the implementation.
 *
 * R2 and D1 are faked at the BINDING, which is the one boundary this repo does
 * not own; every layer above them (route grammar, `SiteStore`, header policy,
 * cache) is real. The end-to-end path over genuine bindings — publish in
 * control-app, serve from public-site — is
 * `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts`.
 *
 * ONE CHANNEL SINCE REQ-149. Half of these cases addressed sha-named draft
 * snapshots. Those are gone with the deploy manifest that indexed them (D7), and
 * so is the manifest itself: D1 is the only record of what is live, which is why
 * "point `live` at an older revision" below is a database row rather than a
 * rewritten JSON object.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { contentTypeFor } from '../apps/public-site/src/content-type'
import { publishedOutPrefix } from '../tools/generate/src/store/revision-model'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import {
  emptyPublished,
  publishInto,
  type FakeBucket,
  type PublishedFixture,
} from './fixtures/published-site'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>'

let published: PublishedFixture

beforeEach(() => {
  published = emptyPublished()
})

/** The home page with its single L1 text leaf set to `marker`. */
function homePage(marker: string): Record<string, unknown> {
  const page = starterHomePage(SLUG) as unknown as Record<string, unknown>
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  return page
}

/**
 * Publish revision `n` of the site with `marker` on its home page.
 *
 * An asset travels through the render into `out/assets/`, so the served page has
 * something to reference besides its own stylesheet — a page that 200s while its
 * image 404s is a broken page, not a served one.
 */
async function publishRevision(marker: string): Promise<number> {
  const { id } = await publishInto(published, SLUG, {
    siteJson: starterSiteJson(SLUG) as unknown as Record<string, unknown>,
    pages: { 'home.json': homePage(marker) },
    assets: { 'logo.svg': new TextEncoder().encode(LOGO) },
  })
  return id
}

interface Fetched {
  res: Response
  bucket: FakeBucket
}

/** Drive the Worker's real entry point for one request. */
async function call(
  pathAndQuery: string,
  opts: { method?: string; bucket?: FakeBucket } = {},
): Promise<Fetched> {
  const b = opts.bucket ?? published.bucket
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`, { method: opts.method ?? 'GET' }),
    {
      SITES: b as unknown as R2Bucket,
      DB: published.db as unknown as D1Database,
    } as Env,
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return { res, bucket: b }
}

async function get(pathAndQuery: string): Promise<Response> {
  return (await call(pathAndQuery)).res
}

/** Every document-relative URL the page asks the browser to load. */
function relativeReferences(html: string): string[] {
  const found = new Set<string>()
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1]
    if (/^[a-z]+:/i.test(url) || url.startsWith('//') || url.startsWith('#')) continue
    found.add(url)
  }
  return [...found]
}

describe('REQ-111 — public-site serves published sites', () => {
  it('test_UAT_FC_REQ-111_serves_live_published_revision', async () => {
    await publishRevision('PUBLISHED-MARKER')

    const res = await get(`/site/${SLUG}/`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')

    const html = await res.text()
    expect(html).toContain('PUBLISHED-MARKER')
    expect(html).toContain('<title>')

    // The page is only served if everything it asks for is served too.
    const references = relativeReferences(html)
    expect(references.length).toBeGreaterThan(0)
    for (const ref of references) {
      const target = new URL(ref, `${ORIGIN}/site/${SLUG}/`)
      expect((await get(target.pathname)).status, ref).toBe(200)
    }

    const logo = await get(`/site/${SLUG}/assets/logo.svg`)
    expect(logo.status).toBe(200)
    expect(logo.headers.get('content-type')).toBe('image/svg+xml')
    expect(await logo.text()).toContain('<svg')
  })

  it('test_UAT_FC_REQ-111_live_is_the_highest_revision_and_never_a_stored_pointer', async () => {
    await publishRevision('REVISION-ONE')
    const first = await get(`/site/${SLUG}/`)
    expect(first.status).toBe(200)
    expect(await first.text()).toContain('REVISION-ONE')

    await publishRevision('REVISION-TWO')
    expect(await (await get(`/site/${SLUG}/`)).text()).toContain('REVISION-TWO')

    // What is served follows the LOG and nothing else — live is `MAX(id)`,
    // derived, never a pointer that could disagree with what it points into
    // (DOC-12 §4, REQ-149 D5). Wind the log back and the older revision serves,
    // with both snapshots still in the bucket untouched.
    expect(published.db.live.get(SLUG)).toBe(2)
    published.db.live.set(SLUG, 1)
    expect(await (await get(`/site/${SLUG}/`)).text()).toContain('REVISION-ONE')

    // A live revision whose bytes were never uploaded is a 404, not a 500.
    published.db.live.set(SLUG, 99)
    expect((await get(`/site/${SLUG}/`)).status).toBe(404)
  })

  it('test_UAT_FC_REQ-111_bare_path_redirects_to_trailing_slash', async () => {
    await publishRevision('PUBLISHED-MARKER')
    const bare = `/site/${SLUG}`

    const redirect = await get(bare)
    expect(redirect.status).toBe(301)
    expect(redirect.headers.get('location')).toBe(`${bare}/`)

    // Why it is load-bearing, not cosmetic: assets are document-relative
    // (REQ-109), so from the bare form `./theme.css` resolves one level too high
    // — out of the site entirely, to `/site/theme.css`, which the grammar reads
    // as a SITE called `theme.css`. It redirects once and then 404s, because no
    // such site is published. The stylesheet is not what comes back, which is
    // the whole point.
    const misresolved = new URL('./theme.css', `${ORIGIN}${bare}`)
    expect(misresolved.pathname).toBe('/site/theme.css')
    const missed = await get(misresolved.pathname)
    expect(missed.status).toBe(301)
    expect((await get(missed.headers.get('location') as string)).status).toBe(404)

    // After following the redirect, the same relative URL lands on the object.
    const followed = await get(redirect.headers.get('location') as string)
    expect(followed.status).toBe(200)
    const resolved = new URL('./theme.css', `${ORIGIN}${bare}/`)
    expect((await get(resolved.pathname)).status).toBe(200)

    // A query string survives the redirect rather than being silently dropped.
    const withQuery = await get(`${bare}?utm=1`)
    expect(withQuery.status).toBe(301)
    expect(withQuery.headers.get('location')).toBe(`${bare}/?utm=1`)
  })

  it('test_UAT_FC_REQ-111_published_urls_get_the_short_ttl', async () => {
    await publishRevision('PUBLISHED-MARKER')

    // A published URL is not revision-scoped, so it cannot be cached immutably —
    // the accepted v1 wart, pinned here so it cannot drift into `immutable` and
    // strand a visitor on a revision that no longer exists.
    const res = await get(`/site/${SLUG}/`)
    expect(res.headers.get('cache-control')).toBe('public, max-age=60')
    expect(res.headers.get('cache-control')).not.toContain('immutable')
    expect((await get(`/site/${SLUG}/theme.css`)).headers.get('cache-control')).toBe(
      'public, max-age=60',
    )

    // A published site is meant to be indexed. `noindex` belonged to the draft
    // previews REQ-149 removed, and must not survive as a stray header.
    expect(res.headers.get('x-robots-tag')).toBeNull()
  })

  it('test_UAT_FC_REQ-111_unknown_slug_and_missing_object_404', async () => {
    await publishRevision('PUBLISHED-MARKER')

    async function shape(p: string) {
      const res = await get(p)
      return {
        status: res.status,
        type: res.headers.get('content-type'),
        body: await res.text(),
      }
    }

    // A site that does not exist and a site with nothing published are the same
    // answer — otherwise the 404 becomes an oracle for which slugs are taken.
    const unknown = await shape('/site/nobody-here/')
    const unpublished = await shape('/site/never-published/')
    expect(unknown.status).toBe(404)
    expect(unknown).toEqual(unpublished)
    expect(unknown.body).toBe('Not Found')

    // A missing object inside a real site and a directory-shaped path both 404 —
    // and neither lists anything.
    for (const p of [
      `/site/${SLUG}/does-not-exist.css`,
      `/site/${SLUG}/assets/`,
      `/site/${SLUG}/assets`,
    ]) {
      const res = await shape(p)
      expect(res.status, p).toBe(404)
      expect(res.body, p).toBe('Not Found')
      expect(res.body, p).not.toContain('logo.svg')
      expect(res.body, p).not.toContain('sites/')
    }

    // NOTHING OUTSIDE A REVISION'S `out/` IS ADDRESSABLE — in particular not the
    // `source/` half, which holds the definition the render came from.
    //
    // Dot-segment traversal is normalised away by URL parsing before dispatch
    // (`..` and its `%2e%2e` spelling alike), so those attempts land on some
    // other harmless route rather than being rejected by name; what matters is
    // only that they never reach the object. `%2f` is *not* normalised, so that
    // spelling does reach the parser — and is refused there.
    for (const p of [
      `/site/${SLUG}/../rev/0001/source/site.json`,
      `/site/${SLUG}/%2e%2e/source/site.json`,
      `/site/${SLUG}/..%2fsource%2fsite.json`,
      `/site/${SLUG}//theme.css`,
    ]) {
      const res = await get(p)
      const final = res.status === 301 ? await get(res.headers.get('location') as string) : res
      expect(final.status, p).toBe(404)
      expect(await final.text(), p).toBe('Not Found')
    }
  })

  it('test_UAT_FC_REQ-111_content_types', async () => {
    const id = await publishRevision('PUBLISHED-MARKER')
    const base = `/site/${SLUG}/`
    const prefix = publishedOutPrefix(SLUG, id)

    const expected: Record<string, string> = {
      'index.html': 'text/html; charset=utf-8',
      'theme.css': 'text/css; charset=utf-8',
      'app.js': 'text/javascript; charset=utf-8',
      'assets/logo.svg': 'image/svg+xml',
      'assets/hero.png': 'image/png',
      'assets/hero.jpg': 'image/jpeg',
      'assets/hero.webp': 'image/webp',
      'assets/body.woff2': 'font/woff2',
      'site.json': 'application/json; charset=utf-8',
      'favicon.ico': 'image/x-icon',
      'robots.txt': 'text/plain; charset=utf-8',
      'download.bin': 'application/octet-stream',
      LICENSE: 'application/octet-stream',
    }

    // Objects the starter render does not produce are seeded directly into the
    // revision D1 already vouches for — the mapping under test is the served
    // path's extension, not how the bytes got there.
    for (const rel of Object.keys(expected)) {
      if (!published.bucket.objects.has(`${prefix}/${rel}`)) {
        published.bucket.objects.set(`${prefix}/${rel}`, Buffer.from('x', 'utf8'))
      }
    }

    for (const [rel, type] of Object.entries(expected)) {
      const res = await get(`${base}${rel}`)
      expect(res.status, rel).toBe(200)
      expect(res.headers.get('content-type'), rel).toBe(type)
      // The pure mapping and the served header are the same answer.
      expect(contentTypeFor(rel), rel).toBe(type)
    }
  })

  it('test_UAT_FC_REQ-111_warm_requests_are_served_from_cache', async () => {
    await publishRevision('PUBLISHED-MARKER')
    const url = `/site/${SLUG}/theme.css`

    const store = new Map<string, Response>()
    const fake = {
      default: {
        async match(req: Request) {
          return store.get(req.url)?.clone()
        },
        async put(req: Request, res: Response) {
          store.set(req.url, res)
        },
      },
    }
    const globals = globalThis as { caches?: unknown }
    globals.caches = fake
    try {
      const shared = published.bucket
      const cold = await call(url, { bucket: shared })
      expect(cold.res.status).toBe(200)
      const readsAfterCold = shared.reads
      expect(readsAfterCold).toBeGreaterThan(0)

      const warm = await call(url, { bucket: shared })
      expect(warm.res.status).toBe(200)
      expect(await warm.res.text()).toBe(await cold.res.clone().text())
      // The whole point: a warm hit does not touch the store.
      expect(shared.reads).toBe(readsAfterCold)

      // A 404 is never cached — it is also the answer for "not published yet",
      // which stops being true the moment someone publishes.
      const missing = `/site/${SLUG}/absent.css`
      await call(missing, { bucket: shared })
      const readsAfterMiss = shared.reads
      await call(missing, { bucket: shared })
      expect(shared.reads).toBeGreaterThan(readsAfterMiss)
    } finally {
      delete globals.caches
    }
  })

  it('test_UAT_FC_REQ-111_route_grammar', async () => {
    expect(parseRoute('/')).toEqual({ kind: 'apex' })
    expect(parseRoute('/site/acme/')).toEqual({
      kind: 'asset',
      slug: 'acme',
      path: 'index.html',
    })
    expect(parseRoute('/site/acme/about.html')).toMatchObject({
      kind: 'asset',
      slug: 'acme',
      path: 'about.html',
    })
    expect(parseRoute('/site/acme')).toEqual({
      kind: 'redirect',
      location: '/site/acme/',
    })
    // Percent-encoding is decoded once, into the key — never twice, and never
    // into an extra path segment.
    expect(parseRoute('/site/acme/assets/my%20logo.svg')).toMatchObject({
      kind: 'asset',
      slug: 'acme',
      path: 'assets/my logo.svg',
    })

    // `draft` is an ORDINARY SEGMENT again (REQ-149 D7): the preview channel
    // that reserved it is gone, so a published site may hold a page of that name
    // and it addresses like any other. (`/site/acme/draft/` resolves to the key
    // `draft`, not `draft/index.html` — a nested directory URL has never had the
    // index mapping the SITE ROOT gets, which predates this ticket and is not
    // changed by it.)
    expect(parseRoute('/site/acme/draft/')).toMatchObject({
      kind: 'asset',
      slug: 'acme',
      path: 'draft',
    })
    expect(parseRoute('/site/acme/draft/abcdef123456/')).toMatchObject({
      kind: 'asset',
      slug: 'acme',
      path: 'draft/abcdef123456',
    })

    for (const bad of [
      '/site',
      '/site/',
      '/nope/acme/',
      '/site/../etc/',
      '/site/acme/%2fetc/passwd',
      '/site/acme/%zz',
      '/site/acme//theme.css',
    ]) {
      expect(parseRoute(bad).kind, bad).toBe('not-found')
    }

    // The apex is held back until the marketing site exists, and the server is
    // read-only: there is no write surface to reach.
    const apex = await get('/')
    expect(apex.status).toBe(200)
    expect(await apex.text()).toBe('Hello from 1stcontact.io')
    expect((await call('/site/acme/', { method: 'POST' })).res.status).toBe(405)
    expect((await call('/site/acme/', { method: 'DELETE' })).res.status).toBe(405)
  })
})
