/**
 * Reconciliation UATs for story-d34eccd8 — **serving a published site**: a URL
 * names a site, and the revision record says which bytes answer it.
 *
 * These are the nine criteria that are claims about the ADDRESSING GRAMMAR and
 * the HEADER POLICY above the store, so they are proved here in Node against
 * bindings faked at the one boundary this repo does not own (R2 and D1). The
 * three that are claims about the runtime and the record itself — serving a live
 * revision derived from a real log, the absence of a second live pointer, and the
 * builder redirecting here — need genuine bindings and live in
 * `reconciliation-published-site-serving.workers.test.ts`.
 *
 *   AC-904 — the bare published root permanently redirects to the slashed form.
 *   AC-905 — the revision record, not the key space, is the authority.
 *   AC-906 — not-found is plain, opaque and identical across four causes.
 *   AC-907 — a malformed or traversal-shaped component 404s and reads nothing.
 *   AC-908 — the served type follows the key that answered.
 *   AC-909 — a short lifetime, never immutable, never a crawler directive.
 *   AC-911 — a warm request skips the store; a not-found is never retained.
 *   AC-912 — read-only: HEAD is bodiless, anything writing is refused.
 *   AC-913 — the apex is a holding response and never a site's content.
 *
 * NOTHING BELOW IS A HAND-BUILT SNAPSHOT. Every published byte comes out of a
 * REAL publish through `publishInto`, at keys the shared key builders decide, so
 * an assertion about what is served is an assertion about the product's own
 * render rather than about a string this file wrote. The Worker is driven only
 * through `fetch(Request, Env, ExecutionContext)` — its real entry point.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import {
  publishedOutPrefix,
  publishedSourcePrefix,
} from '../tools/generate/src/store/revision-model'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { emptyPublished, publishInto, type PublishedFixture } from './fixtures/published-site'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>'

let published: PublishedFixture

beforeEach(() => {
  published = emptyPublished()
})

/**
 * Run a real publish of `slug` carrying `marker` on its home page.
 *
 * The asset travels through the render into `out/assets/`, so the served page
 * references something besides its own stylesheet — a page that 200s while its
 * image 404s is a broken page, not a served one.
 */
async function publishRevision(marker: string, slug = SLUG): Promise<number> {
  const page = starterHomePage(slug) as unknown as Record<string, unknown>
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  const { id } = await publishInto(published, slug, {
    siteJson: starterSiteJson(slug) as unknown as Record<string, unknown>,
    pages: { 'home.json': page },
    assets: { 'logo.svg': new TextEncoder().encode(LOGO) },
  })
  return id
}

/** An R2 binding, structurally — the two verbs `public-site` uses. */
interface BucketLike {
  reads: number
  get(key: string): Promise<unknown>
  head(key: string): Promise<unknown>
}

/** Drive the Worker's real entry point for one request. */
async function call(
  pathAndQuery: string,
  opts: { method?: string; bucket?: BucketLike } = {},
): Promise<Response> {
  const bucket = opts.bucket ?? published.bucket
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`, { method: opts.method ?? 'GET' }),
    {
      SITES: bucket as unknown as R2Bucket,
      DB: published.db as unknown as D1Database,
    } as Env,
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

const get = (pathAndQuery: string): Promise<Response> => call(pathAndQuery)

/** Status, type and body — the whole of what a 404 is allowed to say. */
async function shapeOf(res: Response): Promise<{
  status: number
  headers: Array<[string, string]>
  body: string
}> {
  return {
    status: res.status,
    headers: [...res.headers.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    body: await res.text(),
  }
}

/**
 * Every DOCUMENT-RELATIVE URL the page asks the browser to load.
 *
 * Root-relative and absolute references are excluded deliberately: the redirect
 * criterion is about references whose meaning depends on the requested URL's
 * directory, and an `/…`-rooted one has no such dependence to break.
 */
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

/** Follow one permanent redirect, if that is what came back. */
async function settle(res: Response): Promise<Response> {
  if (res.status !== 301 && res.status !== 302) return res
  return get(res.headers.get('location') as string)
}

describe('story-d34eccd8 — serving a published site', () => {
  it('test_UAT_AC913_the_apex_holds_and_never_serves_a_site', async () => {
    // AC-913 — the root is reserved for a marketing site that does not exist
    // yet, so it answers a holding response and nothing else. With a real site
    // published in the same store, none of that site's content may appear: the
    // apex must not quietly become "whichever site sorted first".
    await publishRevision('APEX-MUST-NOT-SHOW-THIS')

    const apex = await get('/')
    expect(apex.status).toBe(200)
    expect(apex.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    const body = await apex.text()
    expect(body).toBe('Hello from 1stcontact.io')
    expect(body).not.toContain('APEX-MUST-NOT-SHOW-THIS')
    expect(body).not.toContain(SLUG)
    expect(body).not.toContain('<html')

    // A query string does not turn the apex into anything else.
    const queried = await get('/?utm_source=newsletter')
    expect(queried.status).toBe(200)
    expect(queried.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await queried.text()).toBe('Hello from 1stcontact.io')

    // And the same holding response is what an empty store answers with, so the
    // apex does not depend on there being anything published at all.
    published = emptyPublished()
    const empty = await get('/')
    expect(empty.status).toBe(200)
    expect(await empty.text()).toBe('Hello from 1stcontact.io')
  })

  it('test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form', async () => {
    // AC-904 — correctness, not tidiness. Rendered pages reference their assets
    // document-relatively (REQ-109) so a revision is relocatable under any path
    // prefix; served at the BARE root every one of those references resolves a
    // level too high, giving an unstyled page. The redirect is the only thing
    // standing between the two, so this pins both halves: the slashed form
    // resolves them, and the bare form provably does not.
    await publishRevision('TRAILING-SLASH-MARKER')
    const bare = `/site/${SLUG}`

    const redirect = await get(bare)
    expect(redirect.status).toBe(301)
    expect(redirect.headers.get('location')).toBe(`${bare}/`)

    // The query survives rather than being silently dropped on the way.
    const queried = await get(`${bare}?utm=1&page=2`)
    expect(queried.status).toBe(301)
    expect(queried.headers.get('location')).toBe(`${bare}/?utm=1&page=2`)

    const followed = await settle(redirect)
    expect(followed.status).toBe(200)
    const html = await followed.text()
    expect(html).toContain('TRAILING-SLASH-MARKER')

    const references = relativeReferences(html)
    expect(references.length, 'the page references nothing document-relative').toBeGreaterThan(0)

    for (const ref of references) {
      // Resolved against the FINAL url, every reference lands on its object.
      const good = new URL(ref, `${ORIGIN}${bare}/`)
      const served = await get(`${good.pathname}${good.search}`)
      expect(served.status, `${ref} from the slashed root`).toBe(200)

      // Resolved against the BARE url, the address it produces serves nothing —
      // which is precisely why the redirect exists.
      const misresolved = new URL(ref, `${ORIGIN}${bare}`)
      expect(misresolved.pathname, ref).not.toBe(good.pathname)
      const missed = await settle(await get(`${misresolved.pathname}${misresolved.search}`))
      expect(missed.status, `${ref} from the bare root`).toBe(404)
    }
  })

  it('test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach', async () => {
    // AC-905 — the guarantee is compositional: the only untrusted value that
    // reaches a key is the slug, which the grammar has already constrained to a
    // plain name, and every other part is a server-side constant or a value the
    // record itself supplied. Three consequences, asserted rather than assumed.
    const live = await publishRevision('RECORDED-REVISION')
    expect(live).toBe(1)

    // (1) BYTES NOBODY VOUCHED FOR ARE UNREACHABLE. An interrupted publish, or
    // one nobody swept, leaves rendered output at the key shape a revision
    // occupies with no record naming it. No URL the grammar admits reaches it —
    // there is no revision component in a published address to aim at one.
    const ghostRevision = publishedOutPrefix(SLUG, 2)
    published.bucket.objects.set(
      `${ghostRevision}/index.html`,
      Buffer.from('<html>GHOST-REVISION</html>', 'utf8'),
    )
    const ghostSite = publishedOutPrefix('ghost-site', 1)
    published.bucket.objects.set(
      `${ghostSite}/index.html`,
      Buffer.from('<html>GHOST-SITE</html>', 'utf8'),
    )

    const stillLive = await get(`/site/${SLUG}/`)
    expect(stillLive.status).toBe(200)
    const liveBody = await stillLive.text()
    expect(liveBody).toContain('RECORDED-REVISION')
    expect(liveBody).not.toContain('GHOST-REVISION')

    // A site whose bytes are in the bucket but which no record claims resolves
    // to nothing at all.
    expect((await get('/site/ghost-site/')).status).toBe(404)

    // (2) ONLY THE RENDERED HALF IS ADDRESSABLE. Each revision also ships the
    // frozen definition it was rendered from — the only copy of what the
    // definition looked like at r1, and what makes a checkout possible. It is
    // genuinely in the bucket…
    const source = publishedSourcePrefix(SLUG, live)
    expect(published.bucket.objects.has(`${source}/site.json`)).toBe(true)
    expect(published.bucket.objects.has(`${source}/pages/home.json`)).toBe(true)

    // …and no address the grammar admits reaches it, because the composed key
    // ends at `out/`. The dot-segment spellings are normalised away by URL
    // parsing before dispatch, so they land on some other harmless route; the
    // `%2f` spellings survive normalisation and are refused by the parser; the
    // verbatim storage location is not under the site segment at all. What
    // matters is only that none of them returns the definition.
    for (const attempt of [
      `/site/${SLUG}/../rev/0001/source/site.json`,
      `/site/${SLUG}/%2e%2e/source/site.json`,
      `/site/${SLUG}/..%2fsource%2fsite.json`,
      `/site/${SLUG}/%2e%2e%2fsource%2fpages%2fhome.json`,
      `/site/${SLUG}/.%2e/source/site.json`,
      `/${publishedSourcePrefix(SLUG, live)}/site.json`,
      `/${publishedOutPrefix(SLUG, live)}/index.html`,
    ]) {
      const res = await settle(await get(attempt))
      expect(res.status, attempt).toBe(404)
      const body = await res.text()
      expect(body, attempt).toBe('Not Found')
      expect(body, attempt).not.toContain('"pages"')
    }

    // (3) A RECORD VOUCHING FOR ABSENT BYTES IS A NOT-FOUND, NOT AN ERROR.
    // Reporting a storage inconsistency to a visitor who cannot act on it would
    // also leak that the site exists.
    published.db.live.set(SLUG, 99)
    const orphaned = await get(`/site/${SLUG}/`)
    expect(orphaned.status).toBe(404)
    expect(await orphaned.text()).toBe('Not Found')
  })

  it('test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes', async () => {
    // AC-906 — there is one addressing form, so an unknown site, a known site
    // that never published, a path naming no object, and a directory-shaped path
    // must be indistinguishable in status, headers and body alike. Any
    // difference between them is an oracle a stranger can query.
    await publishRevision('A-REAL-PUBLISHED-SITE')

    // A site that genuinely exists on the draft side and has never published, so
    // the second case is real rather than a relabelled unknown slug.
    const drafted = memorySiteStore()
    drafted.seed('never-published', {
      siteJson: starterSiteJson('never-published') as unknown as Record<string, unknown>,
      pages: { 'home.json': starterHomePage('never-published') as unknown as Record<string, unknown> },
    })
    published.drafts.set('never-published', drafted)
    expect(drafted.slugs()).toContain('never-published')

    const causes = {
      'unknown site': '/site/nobody-has-this/',
      'known but never published': '/site/never-published/',
      'no such object in the live revision': `/site/${SLUG}/does-not-exist.css`,
      'a directory-shaped path inside it': `/site/${SLUG}/assets/`,
    }

    const shapes: Array<[string, Awaited<ReturnType<typeof shapeOf>>]> = []
    for (const [label, path] of Object.entries(causes)) {
      shapes.push([label, await shapeOf(await get(path))])
    }

    const [, reference] = shapes[0]
    expect(reference.status).toBe(404)
    expect(reference.body).toBe('Not Found')
    expect(reference.headers).toEqual([['content-type', 'text/plain; charset=utf-8']])
    for (const [label, shape] of shapes) {
      expect(shape, label).toEqual(reference)
    }

    // And it never enumerates what does exist — not the filenames of the site
    // that is published, not a storage key, not a count.
    for (const [label, shape] of shapes) {
      expect(shape.body, label).not.toContain('logo.svg')
      expect(shape.body, label).not.toContain('theme.css')
      expect(shape.body, label).not.toContain('index.html')
      expect(shape.body, label).not.toContain('sites/')
      expect(shape.body, label).not.toContain(SLUG)
    }
  })

  it('test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read', async () => {
    // AC-907 — the grammar rejects BEFORE it reads, so a traversal-shaped
    // address cannot steer a request at another site, at another revision, or at
    // the store's own bookkeeping. The instrumented bucket is what makes "rejects
    // before it reads" an observation rather than a claim.
    await publishRevision('GRAMMAR-MARKER')
    // An object whose name contains a space, so the encoding rule can be shown to
    // be about SHAPE and not about encoding as such.
    published.bucket.objects.set(
      `${publishedOutPrefix(SLUG, 1)}/assets/my logo.svg`,
      Buffer.from(LOGO, 'utf8'),
    )

    const malformed = [
      // An empty segment.
      `/site/${SLUG}//theme.css`,
      // Dot-shaped segments, in the spellings that survive URL normalisation and
      // in the ones that do not (those land on another route, which must also
      // reach nothing).
      `/site/${SLUG}/%2e%2e/theme.css`,
      `/site/${SLUG}/.%2e/source/site.json`,
      `/site/${SLUG}/../../etc/passwd`,
      // An escaped path separator, either slash.
      `/site/${SLUG}/assets%2flogo.svg`,
      `/site/${SLUG}/assets%5Clogo.svg`,
      // A NUL.
      `/site/${SLUG}/theme%00.css`,
      // Malformed percent-encoding.
      `/site/${SLUG}/%zz`,
      `/site/${SLUG}/assets/%e0%a4%a.svg`,
      // Site names outside the shapes the addressing scheme permits.
      '/site//',
      '/site/',
      '/site',
      '/site/-leading-dash/',
      '/site/bad!name/',
      `/site/${'x'.repeat(65)}/`,
      // A path that does not begin with the segment every site is served under.
      '/nope/acme/',
      '/sites/acme/rev/0001/out/index.html',
    ]

    const readsBefore = published.bucket.reads
    for (const path of malformed) {
      const res = await settle(await get(path))
      expect(res.status, path).toBe(404)
      expect(await res.text(), path).toBe('Not Found')
    }
    // Not one of them reached stored bytes.
    expect(published.bucket.reads, 'a rejected address read the store').toBe(readsBefore)

    // A well-formed request in the same suite DOES read, so the counter above is
    // measuring something. Each component is decoded exactly once, so a single
    // encoded space survives into the key it names rather than being rejected.
    const spaced = await get(`/site/${SLUG}/assets/my%20logo.svg`)
    expect(spaced.status).toBe(200)
    expect(await spaced.text()).toContain('<svg')
    expect(published.bucket.reads).toBeGreaterThan(readsBefore)
  })

  it('test_UAT_AC908_the_served_type_follows_the_key_that_answered', async () => {
    // AC-908 — the type is derived from the extension of the key that ANSWERED,
    // never from the requested path and never from metadata whoever wrote the
    // object happened to record.
    const live = await publishRevision('CONTENT-TYPE-MARKER')
    const prefix = publishedOutPrefix(SLUG, live)

    const expected: Record<string, string> = {
      'index.html': 'text/html; charset=utf-8',
      'theme.css': 'text/css; charset=utf-8',
      'app.js': 'text/javascript; charset=utf-8',
      'module.mjs': 'text/javascript; charset=utf-8',
      'site.json': 'application/json; charset=utf-8',
      'robots.txt': 'text/plain; charset=utf-8',
      'sitemap.xml': 'application/xml',
      'app.webmanifest': 'application/manifest+json',
      'assets/logo.svg': 'image/svg+xml',
      'assets/hero.png': 'image/png',
      'assets/hero.jpg': 'image/jpeg',
      'assets/hero.jpeg': 'image/jpeg',
      'assets/spin.gif': 'image/gif',
      'assets/hero.webp': 'image/webp',
      'assets/hero.avif': 'image/avif',
      'favicon.ico': 'image/x-icon',
      'assets/body.woff': 'font/woff',
      'assets/body.woff2': 'font/woff2',
      'assets/body.ttf': 'font/ttf',
      'assets/body.otf': 'font/otf',
      // Not recognised, and none at all: generic binary rather than a guess.
      'download.bin': 'application/octet-stream',
      LICENSE: 'application/octet-stream',
    }

    // Kinds the starter render does not itself emit are seeded straight into the
    // revision the record already vouches for: what is under test is the mapping
    // from the served key's extension, not how the bytes reached the store.
    for (const rel of Object.keys(expected)) {
      if (!published.bucket.objects.has(`${prefix}/${rel}`)) {
        published.bucket.objects.set(`${prefix}/${rel}`, Buffer.from('x', 'utf8'))
      }
    }

    for (const [rel, type] of Object.entries(expected)) {
      const res = await get(`/site/${SLUG}/${rel}`)
      expect(res.status, rel).toBe(200)
      expect(res.headers.get('content-type'), rel).toBe(type)
    }

    // A request resolved through the extensionless fallback carries the type of
    // the object that ACTUALLY answered — HTML — not a guess from the path,
    // which has no extension to guess from.
    published.bucket.objects.set(
      `${prefix}/whitepapers.html`,
      Buffer.from('<html>FALLBACK</html>', 'utf8'),
    )
    const fallback = await get(`/site/${SLUG}/whitepapers`)
    expect(fallback.status).toBe(200)
    expect(fallback.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await fallback.text()).toContain('FALLBACK')

    // And the same file is typed identically however it was written: a bucket
    // that records a deliberately wrong content type on every object changes
    // nothing about what is served.
    const mislabelled: BucketLike = {
      reads: 0,
      async get(key: string) {
        this.reads += 1
        const buf = published.bucket.objects.get(key)
        if (buf === undefined) return null
        return {
          key,
          size: buf.byteLength,
          httpEtag: `"${key.length}-${buf.byteLength}"`,
          httpMetadata: { contentType: 'application/x-deliberately-wrong' },
          body: new Blob([new Uint8Array(buf)]).stream(),
          text: async () => buf.toString('utf8'),
        }
      },
      async head(key: string) {
        this.reads += 1
        const buf = published.bucket.objects.get(key)
        if (buf === undefined) return null
        return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
      },
    }
    for (const rel of ['index.html', 'theme.css', 'assets/logo.svg']) {
      const res = await call(`/site/${SLUG}/${rel}`, { bucket: mislabelled })
      expect(res.status, rel).toBe(200)
      expect(res.headers.get('content-type'), rel).toBe(expected[rel])
    }
    expect(mislabelled.reads).toBeGreaterThan(0)
  })

  it('test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable', async () => {
    // AC-909 — a published address is not revision-scoped: its meaning changes
    // when a new revision goes live. So it may declare itself publicly cacheable
    // only briefly, and never immutable — which would strand a visitor on a
    // revision that no longer exists.
    await publishRevision('FRESHNESS-MARKER')

    const page = await get(`/site/${SLUG}/`)
    const asset = await get(`/site/${SLUG}/theme.css`)
    for (const [label, res] of [
      ['entry page', page],
      ['asset', asset],
    ] as const) {
      expect(res.status, label).toBe(200)
      const cacheControl = res.headers.get('cache-control')
      expect(cacheControl, label).toBe('public, max-age=60')
      expect(cacheControl, label).not.toContain('immutable')

      // A published site is meant to be indexed. The ask-not-to-index directive
      // belonged to the draft-preview channel that was removed, and a stray one
      // surviving its channel would silently deindex every customer's site.
      expect(res.headers.get('x-robots-tag'), label).toBeNull()
    }
  })

  it('test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained', async () => {
    // AC-911 — the freshness policy has a cache that follows it. A repeat
    // request for an address that already answered is served without reading the
    // store again; a not-found is never retained, so a URL that 404ed because
    // nothing was published there begins serving the moment a publish makes it
    // real, with no wait and no manual invalidation.
    await publishRevision('CACHE-MARKER')

    const entries = new Map<string, Response>()
    const globals = globalThis as { caches?: unknown }
    globals.caches = {
      default: {
        async match(req: Request) {
          return entries.get(req.url)?.clone()
        },
        async put(req: Request, res: Response) {
          entries.set(req.url, res)
        },
      },
    }

    try {
      const url = `/site/${SLUG}/theme.css`

      const cold = await get(url)
      expect(cold.status).toBe(200)
      const coldBody = await cold.clone().text()
      const readsAfterCold = published.bucket.reads
      expect(readsAfterCold).toBeGreaterThan(0)

      const warm = await get(url)
      expect(warm.status).toBe(cold.status)
      expect(await warm.text()).toBe(coldBody)
      expect([...warm.headers.entries()].sort()).toEqual([...cold.headers.entries()].sort())
      // The whole point: a warm hit does not touch the store.
      expect(published.bucket.reads, 'a warm request read the store').toBe(readsAfterCold)

      // A not-found is read again every time — a retained one would show up here
      // as no further read.
      const missing = `/site/${SLUG}/absent.css`
      expect((await get(missing)).status).toBe(404)
      const readsAfterMiss = published.bucket.reads
      expect((await get(missing)).status).toBe(404)
      expect(published.bucket.reads, 'a 404 was retained').toBeGreaterThan(readsAfterMiss)

      // And the consequence that matters: an address for a site that has
      // published nothing starts serving as soon as a publish makes it real.
      const late = '/site/late-arrival/'
      expect((await get(late)).status).toBe(404)
      await publishRevision('LATE-ARRIVAL-MARKER', 'late-arrival')
      const now = await get(late)
      expect(now.status).toBe(200)
      expect(await now.text()).toContain('LATE-ARRIVAL-MARKER')
    } finally {
      delete globals.caches
    }
  })

  it('test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless', async () => {
    // AC-912 — fetching and header-only fetching are served; anything that would
    // write is refused and says what is allowed.
    await publishRevision('READ-ONLY-MARKER')
    const url = `/site/${SLUG}/`

    const full = await get(url)
    const head = await call(url, { method: 'HEAD' })
    expect(head.status).toBe(full.status)
    expect(head.headers.get('content-type')).toBe(full.headers.get('content-type'))
    expect(head.headers.get('cache-control')).toBe(full.headers.get('cache-control'))
    // Plus the object's length, and no body at all.
    const body = await full.text()
    expect(head.headers.get('content-length')).toBe(String(Buffer.byteLength(body, 'utf8')))
    expect(await head.text()).toBe('')

    // A header-only request for a URL that names nothing is the same not-found
    // its full-request counterpart gets.
    const missingHead = await call(`/site/${SLUG}/nothing-here.css`, { method: 'HEAD' })
    expect(missingHead.status).toBe(404)
    expect(missingHead.headers.get('content-type')).toBe('text/plain; charset=utf-8')

    // Anything that would write is refused, names the permitted set, and never
    // reaches the store to find out whether the address was real.
    const readsBefore = published.bucket.reads
    const queriesBefore = published.db.queries
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const res = await call(url, { method })
      expect(res.status, method).toBe(405)
      expect(res.headers.get('allow'), method).toBe('GET, HEAD')
      expect(await res.text(), method).toBe('Method Not Allowed')
    }
    expect(published.bucket.reads).toBe(readsBefore)
    expect(published.db.queries).toBe(queriesBefore)
  })
})
