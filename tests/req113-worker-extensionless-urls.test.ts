/**
 * REQ-113 (scope extension) — the DEPLOYED Worker resolves extensionless URLs.
 *
 * The original ticket fixed `1c serve` on the premise that "Cloudflare Pages —
 * the deployment target — serves `whitepapers.html` at `/whitepapers`
 * automatically". That premise is false: `wrangler.toml` binds the `public-site`
 * Worker (REQ-111) to the apex and to `*.1stcontact.io/*`, and it serves every
 * byte out of R2 with the path tail used as a literal object key. So the clean
 * URL worked in preview and 404'd in production — the inverse of the reported
 * defect, and the ticket's actual goal (the two environments agree on the URL
 * the author writes) was never reached.
 *
 * These UATs drive the Worker's real entry point over the bytes a REAL PUBLISH
 * wrote, on a genuinely two-page site — the only shape where a page that is not
 * `index.html` exists to be addressed.
 *
 * ONE CHANNEL SINCE REQ-149. These cases used to run twice, once against a
 * sha-addressed draft snapshot and once against the live revision. Draft
 * snapshots are gone with the deploy manifest that indexed them (D7), so what is
 * left is the published channel — which is the one the ticket was always about:
 * the URL an author writes in the nav, in production.
 *
 * Coverage: AC5 (GET and HEAD), AC6 (content-type from the key served), AC7
 * (exact key wins; extensions never fall back), AC8 (trailing slash is never
 * eligible — REQ-109 relative-asset resolution), AC9 (grammar guards unchanged).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { emptyPublished, publishInto, type PublishedFixture } from './fixtures/published-site'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

let published: PublishedFixture

/**
 * The second page. Everything here turns on addressing a page that is NOT
 * `index.html`, which a single-page site simply does not have.
 */
const WHITEPAPERS = {
  id: 'whitepapers',
  slug: 'whitepapers',
  title: 'Whitepapers',
  modules: [],
  l1: {
    widths: [320, 768, 1440],
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'text', id: 'marker', text: 'WHITEPAPERS-MARKER' }],
    },
  },
} as unknown as Record<string, unknown>

beforeEach(async () => {
  published = emptyPublished()
  // A real publish renders these bytes; the fixture only puts them where
  // `public-site` looks. Nothing about the served page is written by hand.
  await publishInto(published, SLUG, {
    siteJson: starterSiteJson(SLUG) as unknown as Record<string, unknown>,
    pages: {
      'home.json': starterHomePage(SLUG) as unknown as Record<string, unknown>,
      'whitepapers.json': WHITEPAPERS,
    },
  })
})

/** Drive the Worker's real entry point for one request. */
async function call(pathAndQuery: string, method = 'GET'): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`, { method }),
    {
      SITES: published.bucket as unknown as R2Bucket,
      DB: published.db as unknown as D1Database,
    } as Env,
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

describe('REQ-113 — the Worker resolves extensionless page URLs', () => {
  it('test_UAT_FC_REQ-113_worker_serves_extensionless_published_page', async () => {
    // AC5 — the URL the author actually writes in the nav, with no `.html`.
    const res = await call(`/site/${SLUG}/whitepapers`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('WHITEPAPERS-MARKER')
    // AC6 — typed from the key that answered. `whitepapers` carries no extension
    // to guess from, so a naive read of the request path would send the wrong
    // MIME and the browser would offer a download.
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('test_UAT_FC_REQ-113_worker_head_matches_get', async () => {
    // AC5 — HEAD is a separate branch in `serve`, so it can (and did) drift.
    const head = await call(`/site/${SLUG}/whitepapers`, 'HEAD')
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toContain('text/html')
    expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0)
    expect(await head.text()).toBe('')
  })

  it('test_UAT_FC_REQ-113_exact_keys_win_and_extensions_never_fall_back', async () => {
    const base = `/site/${SLUG}`

    // AC7 — everything that resolves today still resolves the same way.
    const explicit = await call(`${base}/whitepapers.html`)
    expect(explicit.status).toBe(200)
    expect(await explicit.text()).toContain('WHITEPAPERS-MARKER')

    const root = await call(`${base}/`)
    expect(root.status).toBe(200)
    expect(root.headers.get('content-type')).toContain('text/html')

    const css = await call(`${base}/theme.css`)
    expect(css.status).toBe(200)
    expect(css.headers.get('content-type')).toContain('text/css')

    // AC7 — a path WITH an extension must never reach the fallback: a missing
    // asset stays a 404 rather than silently returning HTML under an image MIME.
    expect((await call(`${base}/assets/missing.svg`)).status).toBe(404)
    // …and an extensionless path with no page behind it is still a 404.
    expect((await call(`${base}/nope`)).status).toBe(404)
  })

  it('test_UAT_FC_REQ-113_trailing_slash_is_never_eligible', async () => {
    // AC8 — the load-bearing exclusion. Pages reference assets
    // document-relatively (REQ-109), so the request URL's DIRECTORY is what
    // `theme.css` resolves against. Serving the page at `…/whitepapers/` would
    // make every reference resolve one level too low and the page would load
    // unstyled — the same failure the `redirect` route prevents at the site
    // root. So this must stay a 404, not become a second URL for the page.
    expect((await call(`/site/${SLUG}/whitepapers/`)).status).toBe(404)

    // Stated as the rule, so the reason survives a refactor of the route code.
    const withSlash = parseRoute(`/site/${SLUG}/whitepapers/`)
    const withoutSlash = parseRoute(`/site/${SLUG}/whitepapers`)
    expect(withSlash).toMatchObject({ kind: 'asset', htmlFallback: undefined })
    expect(withoutSlash).toMatchObject({ kind: 'asset', htmlFallback: 'whitepapers.html' })

    // And the URL that DOES serve the page resolves its assets against the site
    // root, which is the whole point of excluding the slash.
    const pageUrl = new URL(`${ORIGIN}/site/${SLUG}/whitepapers`)
    expect(new URL('theme.css', pageUrl).pathname).toBe(`/site/${SLUG}/theme.css`)
  })

  it('test_UAT_FC_REQ-113_fallback_eligibility_is_a_pure_url_rule', () => {
    // AC9 — the fallback is decided before any bucket is touched, and it never
    // widens what the grammar already rejects. Only the LAST segment is examined
    // for an extension, so a dotted directory does not disable a clean page URL.
    const el = (p: string) => (parseRoute(p) as { htmlFallback?: string }).htmlFallback

    expect(el('/site/acme/whitepapers')).toBe('whitepapers.html')
    expect(el('/site/acme/v1.2/page')).toBe('v1.2/page.html')
    expect(el('/site/acme/about.html')).toBeUndefined()
    expect(el('/site/acme/assets/logo.svg')).toBeUndefined()

    // Traversal, bad encoding and invalid slugs still reject outright — the
    // fallback is never even considered, because there is no asset route to
    // carry it.
    for (const bad of [
      '/site/acme/../../etc/passwd',
      '/site/acme/%2e%2e/secret',
      '/site/acme/%zz/page',
      '/site/../page',
      '/notsite/acme/page',
    ]) {
      expect(parseRoute(bad).kind, bad).toBe('not-found')
    }
  })
})
