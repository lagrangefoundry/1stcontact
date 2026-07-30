/**
 * REQ-111 — `public-site` serves deployed sites out of R2.
 *
 * `1c deploy` (REQ-110) put snapshots in a bucket, but the Worker in front of
 * that bucket was a stub returning a greeting: nothing had ever actually been
 * served. These UATs pin the serving contract through the Worker's real entry
 * point — `fetch(Request, Env, ExecutionContext)` — with the bucket seeded by a
 * real `1c deploy` run, so what is served is what the deploy pipeline genuinely
 * writes rather than a hand-built fixture that agrees with the implementation.
 *
 * R2 is faked at the binding, which is the one boundary we do not own; every
 * layer above it (route grammar, `SiteStore`, header policy, cache) is real.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { contentTypeFor } from '../apps/public-site/src/content-type'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { draftDir, readJson, writeJson } from '../tools/generate/src/store'
import {
  assertNoReservedSegment,
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
  cwd = mkdtempSync(path.join(tmpdir(), 'req111-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
  // An asset that travels through the render into `out/assets/`, so the served
  // page has something to reference besides its own stylesheet.
  mkdirSync(path.join(draftDir(ctx, SLUG), 'assets'), { recursive: true })
  writeFileSync(
    path.join(draftDir(ctx, SLUG), 'assets', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
    'utf8',
  )
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Set the home page's single L1 text leaf — the marker rendered into the HTML. */
function setPageText(marker: string): void {
  const file = path.join(draftDir(ctx, SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  writeJson(file, page)
}

function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: '2026-07-30T12:00:00.000Z', ...opts })
}

// ── the R2 binding, faked over the bytes a real deploy wrote ──────────────────

/** Counts reads so a test can prove a warm request never reached the store. */
class FakeBucket {
  reads = 0

  constructor(private readonly objects: Map<string, Buffer>) {}

  async get(key: string) {
    this.reads++
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
    this.reads++
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
  }
}

function bucket(): FakeBucket {
  return new FakeBucket(client.objects)
}

interface Fetched {
  res: Response
  bucket: FakeBucket
}

/** Drive the Worker's real entry point for one request. */
async function call(pathAndQuery: string, opts: { method?: string; bucket?: FakeBucket } = {}): Promise<Fetched> {
  const b = opts.bucket ?? bucket()
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`, { method: opts.method ?? 'GET' }),
    // The fake stands in for the R2 binding only; the store above it is real.
    { SITES: b as unknown as R2Bucket },
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return { res, bucket: b }
}

async function get(pathAndQuery: string): Promise<Response> {
  return (await call(pathAndQuery)).res
}

async function manifest(): Promise<SiteManifest> {
  const raw = await client.get(manifestKey(SLUG))
  if (raw === null) throw new Error('no manifest in R2')
  return JSON.parse(raw) as SiteManifest
}

function putManifest(m: SiteManifest): void {
  client.objects.set(manifestKey(SLUG), Buffer.from(JSON.stringify(m, null, 2) + '\n', 'utf8'))
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

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('REQ-111 — public-site serves deployed snapshots', () => {
  it('test_UAT_FC_REQ-111_serves_preview_snapshot', async () => {
    setPageText('PREVIEW-MARKER')
    const deployed = await deploy()

    const base = `/site/${SLUG}/draft/${deployed.sha}/`
    const res = await get(base)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')

    const html = await res.text()
    expect(html).toContain('PREVIEW-MARKER')
    expect(html).toContain('<title>')

    // The page is only served if everything it asks for is served too — a page
    // that 200s while its stylesheet 404s is a broken page, not a served one.
    const refs = relativeReferences(html)
    expect(refs).toContain('./theme.css')
    for (const ref of refs) {
      const target = new URL(ref, `${ORIGIN}${base}`)
      const asset = await get(`${target.pathname}${target.search}`)
      expect(asset.status, `asset ${ref} → ${target.pathname}`).toBe(200)
    }

    // Assets that ship with the snapshot but are not referenced are reachable too.
    const logo = await get(`${base}assets/logo.svg`)
    expect(logo.status).toBe(200)
    expect(logo.headers.get('content-type')).toBe('image/svg+xml')
    expect(await logo.text()).toContain('<svg')
  })

  it('test_UAT_FC_REQ-111_bare_path_redirects_to_trailing_slash', async () => {
    const deployed = await deploy()
    const bare = `/site/${SLUG}/draft/${deployed.sha}`

    const redirect = await get(bare)
    expect(redirect.status).toBe(301)
    expect(redirect.headers.get('location')).toBe(`${bare}/`)

    // Why it is load-bearing, not cosmetic: assets are document-relative
    // (REQ-109), so from the bare form `./theme.css` resolves one level too high
    // — to a path that is, correctly, nothing at all.
    const misresolved = new URL('./theme.css', `${ORIGIN}${bare}`)
    expect(misresolved.pathname).toBe(`/site/${SLUG}/draft/theme.css`)
    expect((await get(misresolved.pathname)).status).toBe(404)

    // After following the redirect, the same relative URL lands on the object.
    const followed = await get(redirect.headers.get('location') as string)
    expect(followed.status).toBe(200)
    const resolved = new URL('./theme.css', `${ORIGIN}${bare}/`)
    expect((await get(resolved.pathname)).status).toBe(200)

    // A query string survives the redirect rather than being silently dropped.
    const withQuery = await get(`${bare}?utm=1`)
    expect(withQuery.status).toBe(301)
    expect(withQuery.headers.get('location')).toBe(`${bare}/?utm=1`)

    // The published channel's site root redirects on the same rule.
    const site = await get(`/site/${SLUG}`)
    expect(site.status).toBe(301)
    expect(site.headers.get('location')).toBe(`/site/${SLUG}/`)
  })

  it('test_UAT_FC_REQ-111_serves_live_published_revision', async () => {
    setPageText('REVISION-ONE')
    cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    const first = await get(`/site/${SLUG}/`)
    expect(first.status).toBe(200)
    expect(await first.text()).toContain('REVISION-ONE')

    setPageText('REVISION-TWO')
    cmdPublish(SLUG, { cwd, message: 'second' })
    await deploy({ channel: 'published' })

    const second = await get(`/site/${SLUG}/`)
    expect(await second.text()).toContain('REVISION-TWO')

    // What is served follows `manifest.live` and nothing else: point it back at
    // the first revision and the first revision is what comes out, with both
    // snapshots still sitting in the bucket untouched.
    const m = await manifest()
    expect(m.live).toBe(2)
    putManifest({ ...m, live: 1 })
    expect(await (await get(`/site/${SLUG}/`)).text()).toContain('REVISION-ONE')

    // A live revision whose bytes were never uploaded is a 404, not a 500.
    putManifest({ ...m, live: 99 })
    expect((await get(`/site/${SLUG}/`)).status).toBe(404)
  })

  it('test_UAT_FC_REQ-111_immutable_cache_on_sha_paths', async () => {
    const preview = await deploy()
    cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    // A snapshot id names its own bytes, so those bytes can never change.
    const draft = await get(`/site/${SLUG}/draft/${preview.sha}/`)
    expect(draft.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect((await get(`/site/${SLUG}/draft/${preview.sha}/theme.css`)).headers.get('cache-control'))
      .toBe('public, max-age=31536000, immutable')

    // A published URL is not revision-scoped, so it gets the short TTL instead —
    // the accepted v1 wart, pinned here so it cannot drift into `immutable`.
    const published = await get(`/site/${SLUG}/`)
    expect(published.headers.get('cache-control')).toBe('public, max-age=60')
    expect(published.headers.get('cache-control')).not.toContain('immutable')
  })

  it('test_UAT_FC_REQ-111_draft_is_noindex', async () => {
    const preview = await deploy()
    cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    const draft = await get(`/site/${SLUG}/draft/${preview.sha}/`)
    expect(draft.headers.get('x-robots-tag')).toBe('noindex')

    // Every draft-channel response, not just the successful ones: a crawler that
    // reached a preview should be told so whatever it found there.
    expect((await get(`/site/${SLUG}/draft/${preview.sha}`)).headers.get('x-robots-tag'))
      .toBe('noindex')
    expect((await get(`/site/${SLUG}/draft/${preview.sha}/nope.css`)).headers.get('x-robots-tag'))
      .toBe('noindex')

    // The published site is meant to be indexed.
    expect((await get(`/site/${SLUG}/`)).headers.get('x-robots-tag')).toBeNull()
    expect((await get(`/site/${SLUG}/theme.css`)).headers.get('x-robots-tag')).toBeNull()
  })

  it('test_UAT_FC_REQ-111_unknown_slug_and_missing_object_404', async () => {
    const preview = await deploy() // a draft exists; nothing is published yet

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
    const unpublished = await shape(`/site/${SLUG}/`)
    expect(unknown.status).toBe(404)
    expect(unknown).toEqual(unpublished)
    expect(unknown.body).toBe('Not Found')

    // A missing object inside a real snapshot, an unknown snapshot id, and a
    // directory-shaped path all 404 — and none of them lists anything.
    for (const p of [
      `/site/${SLUG}/draft/${preview.sha}/does-not-exist.css`,
      `/site/${SLUG}/draft/${'0'.repeat(12)}/`,
      `/site/${SLUG}/draft/${preview.sha}/assets/`,
      `/site/${SLUG}/draft/`,
      `/site/${SLUG}/draft`,
    ]) {
      const res = await shape(p)
      expect(res.status, p).toBe(404)
      expect(res.body, p).toBe('Not Found')
      expect(res.body, p).not.toContain('logo.svg')
      expect(res.body, p).not.toContain('sites/')
    }

    // Nothing outside a snapshot's `out/` is addressable — not the manifest,
    // not the `source/` half of the artifact.
    //
    // Dot-segment traversal is normalised away by URL parsing before dispatch
    // (`..` and its `%2e%2e` spelling alike), so those attempts land on some
    // other harmless route rather than being rejected by name; what matters is
    // only that they never reach the object. `%2f` is *not* normalised, so that
    // spelling does reach the parser — and is refused there.
    for (const p of [
      `/site/${SLUG}/../manifest.json`,
      `/site/${SLUG}/%2e%2e/manifest.json`,
      `/site/${SLUG}/draft/${preview.sha}/%2e%2e/source/site.json`,
      `/site/${SLUG}/draft/${preview.sha}/..%2fsource%2fsite.json`,
      `/site/${SLUG}/draft/${preview.sha}//theme.css`,
    ]) {
      const res = await get(p)
      const final = res.status === 301 ? await get(res.headers.get('location') as string) : res
      expect(final.status, p).toBe(404)
      expect(await final.text(), p).toBe('Not Found')
    }
  })

  it('test_UAT_FC_REQ-111_content_types', async () => {
    const preview = await deploy()
    const base = `/site/${SLUG}/draft/${preview.sha}/`
    const prefix = `sites/${SLUG}/preview/${preview.sha}/out`

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
      'LICENSE': 'application/octet-stream',
    }

    // Objects the starter render does not produce are seeded directly into the
    // snapshot the manifest already vouches for — the mapping under test is the
    // served path's extension, not how the bytes got there.
    for (const rel of Object.keys(expected)) {
      if (!client.objects.has(`${prefix}/${rel}`)) {
        client.objects.set(`${prefix}/${rel}`, Buffer.from('x', 'utf8'))
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
    const preview = await deploy()
    const url = `/site/${SLUG}/draft/${preview.sha}/theme.css`

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
      const shared = bucket()
      const cold = await call(url, { bucket: shared })
      expect(cold.res.status).toBe(200)
      const readsAfterCold = shared.reads
      expect(readsAfterCold).toBeGreaterThan(0)

      const warm = await call(url, { bucket: shared })
      expect(warm.res.status).toBe(200)
      expect(await warm.res.text()).toBe(await cold.res.clone().text())
      // The whole point: a warm hit does not touch the store.
      expect(shared.reads).toBe(readsAfterCold)

      // A 404 is never cached — it is also the answer for "not deployed yet",
      // which stops being true the moment someone deploys.
      const missing = `/site/${SLUG}/draft/${preview.sha}/absent.css`
      await call(missing, { bucket: shared })
      const readsAfterMiss = shared.reads
      await call(missing, { bucket: shared })
      expect(shared.reads).toBeGreaterThan(readsAfterMiss)
    } finally {
      delete globals.caches
    }
  })

  it('test_UAT_FC_REQ-111_draft_segment_is_reserved', () => {
    // `draft` is the preview channel's first segment inside a site, so a
    // published snapshot may not contain a top-level entry of that name.
    expect(parseRoute('/site/acme/draft/abcdef123456/')).toEqual({
      kind: 'asset',
      slug: 'acme',
      channel: 'draft',
      ref: 'abcdef123456',
      path: 'index.html',
    })

    // Deploy refuses the collision outright, so it is impossible rather than
    // merely unlikely — and the operator who caused it sees the error, rather
    // than a visitor wondering why a page vanished.
    const file = (rel: string) => ({ rel, abs: `/tmp/${rel}`, bytes: 1 })
    expect(() =>
      assertNoReservedSegment([file('out/index.html'), file('out/draft/index.html')]),
    ).toThrow(/reserved/)
    expect(() => assertNoReservedSegment([file('out/index.html'), file('out/draft')])).toThrow(
      /reserved/,
    )

    // Names that merely start with it, and the `source/` half of the artifact,
    // are unaffected — the guard is about one exact top-level segment.
    expect(() =>
      assertNoReservedSegment([
        file('out/draft.html'),
        file('out/assets/draft/x.svg'),
        file('source/draft/site.json'),
      ]),
    ).not.toThrow()
  })

  it('test_UAT_FC_REQ-111_route_grammar', async () => {
    expect(parseRoute('/')).toEqual({ kind: 'apex' })
    expect(parseRoute('/site/acme/')).toEqual({
      kind: 'asset',
      slug: 'acme',
      channel: 'published',
      path: 'index.html',
    })
    expect(parseRoute('/site/acme/about.html')).toEqual({
      kind: 'asset',
      slug: 'acme',
      channel: 'published',
      path: 'about.html',
    })
    expect(parseRoute('/site/acme')).toEqual({
      kind: 'redirect',
      location: '/site/acme/',
      channel: 'published',
    })
    // Percent-encoding is decoded once, into the key — never twice, and never
    // into an extra path segment.
    expect(parseRoute('/site/acme/assets/my%20logo.svg')).toEqual({
      kind: 'asset',
      slug: 'acme',
      channel: 'published',
      path: 'assets/my logo.svg',
    })
    for (const bad of [
      '/site',
      '/site/',
      '/nope/acme/',
      '/site/acme/draft/',
      '/site/acme/draft/not-hex/',
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
