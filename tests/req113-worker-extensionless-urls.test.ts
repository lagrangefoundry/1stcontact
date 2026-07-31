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
 * These UATs drive the Worker's real entry point over the bytes a real
 * `1c deploy` wrote, on a genuinely two-page site — the only shape where a page
 * that is not `index.html` exists to be addressed.
 *
 * Coverage: AC5 (both channels, GET and HEAD), AC6 (content-type from the key
 * served), AC7 (exact key wins; extensions never fall back), AC8 (trailing slash
 * is never eligible — REQ-109 relative-asset resolution), AC9 (grammar guards
 * unchanged).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { draftDir, writeJson } from '../tools/generate/src/store'
import {
  cmdDeploy,
  MemoryR2Client,
  manifestKey,
  type SiteManifest,
} from '../tools/generate/src/deploy'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

let cwd: string
let client: MemoryR2Client

const ctx = {
  get cwd() {
    return cwd
  },
  root: 'sites' as const,
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req113-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
  // The second page. Everything here turns on addressing a page that is NOT
  // `index.html`, which a single-page site simply does not have.
  writeJson(path.join(draftDir(ctx, SLUG), 'pages', 'whitepapers.json'), {
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
  })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** The R2 binding, faked over the bytes a real deploy wrote. */
class FakeBucket {
  constructor(private readonly objects: Map<string, Buffer>) {}

  async get(key: string) {
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return {
      key,
      size: buf.byteLength,
      httpEtag: `"${key.length}-${buf.byteLength}"`,
      body: new Blob([new Uint8Array(buf)]).stream(),
      text: async () => buf.toString('utf8'),
    }
  }

  async head(key: string) {
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
  }
}

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
    { SITES: new FakeBucket(client.objects) as unknown as R2Bucket },
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/** Deploy the site and return the draft snapshot id. */
async function deployDraft(): Promise<string> {
  const deployed = await cmdDeploy(SLUG, {
    cwd,
    client,
    now: '2026-07-30T12:00:00.000Z',
  })
  return deployed.sha
}

/**
 * Mint a revision and ship it. `publish` and `deploy` are two steps by design —
 * a published deploy with no live revision is refused — so both are needed
 * before a published URL can serve anything.
 */
async function deployPublished(): Promise<void> {
  cmdPublish(SLUG, { cwd, message: 'first' })
  await cmdDeploy(SLUG, {
    cwd,
    client,
    now: '2026-07-30T12:00:00.000Z',
    channel: 'published',
  })
  const raw = await client.get(manifestKey('sites', SLUG))
  const m = JSON.parse(raw as string) as SiteManifest
  // Guard the guard: a published channel with no live revision would 404 for
  // reasons that have nothing to do with this ticket.
  expect(m.live, 'site must have a live revision').not.toBeNull()
}

describe('REQ-113 — the Worker resolves extensionless page URLs', () => {
  it('test_UAT_FC_REQ-113_worker_serves_extensionless_draft_page', async () => {
    const sha = await deployDraft()

    // The URL the author actually writes in the nav — no `.html`.
    const res = await call(`/site/${SLUG}/draft/${sha}/whitepapers`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('WHITEPAPERS-MARKER')
    // AC6 — typed from the key that answered. `whitepapers` carries no
    // extension to guess from, so a naive read of the request path would send
    // the wrong MIME and the browser would offer a download.
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('test_UAT_FC_REQ-113_worker_serves_extensionless_published_page', async () => {
    // AC5 — the published channel takes the same path through `serve`, but it
    // resolves its prefix differently, so it is worth its own assertion rather
    // than an assumption.
    await deployPublished()

    const res = await call(`/site/${SLUG}/whitepapers`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('WHITEPAPERS-MARKER')
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('test_UAT_FC_REQ-113_worker_head_matches_get', async () => {
    // AC5 — HEAD is a separate branch in `serve`, so it can (and did) drift.
    const sha = await deployDraft()

    const head = await call(`/site/${SLUG}/draft/${sha}/whitepapers`, 'HEAD')
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toContain('text/html')
    expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0)
    expect(await head.text()).toBe('')
  })

  it('test_UAT_FC_REQ-113_exact_keys_win_and_extensions_never_fall_back', async () => {
    const sha = await deployDraft()
    const base = `/site/${SLUG}/draft/${sha}`

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
    // unstyled — the same failure the `redirect` route prevents at the snapshot
    // root. So this must stay a 404, not become a second URL for the page.
    const sha = await deployDraft()
    expect((await call(`/site/${SLUG}/draft/${sha}/whitepapers/`)).status).toBe(404)

    // Stated as the rule, so the reason survives a refactor of the route code.
    const withSlash = parseRoute(`/site/${SLUG}/draft/${sha}/whitepapers/`)
    const withoutSlash = parseRoute(`/site/${SLUG}/draft/${sha}/whitepapers`)
    expect(withSlash).toMatchObject({ kind: 'asset', htmlFallback: undefined })
    expect(withoutSlash).toMatchObject({ kind: 'asset', htmlFallback: 'whitepapers.html' })

    // And the URL that DOES serve the page resolves its assets against the
    // snapshot root, which is the whole point of excluding the slash.
    const pageUrl = new URL(`${ORIGIN}/site/${SLUG}/draft/${sha}/whitepapers`)
    expect(new URL('theme.css', pageUrl).pathname).toBe(`/site/${SLUG}/draft/${sha}/theme.css`)
  })

  it('test_UAT_FC_REQ-113_fallback_eligibility_is_a_pure_url_rule', () => {
    // AC9 — the fallback is decided before any bucket is touched, and it never
    // widens what the grammar already rejects. Only the LAST segment is examined
    // for an extension, so a dotted directory does not disable a clean page URL.
    const el = (p: string) => (parseRoute(p) as { htmlFallback?: string }).htmlFallback

    expect(el('/site/acme/whitepapers')).toBe('whitepapers.html')
    expect(el('/site/acme/draft/abcdef123456/whitepapers')).toBe('whitepapers.html')
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
