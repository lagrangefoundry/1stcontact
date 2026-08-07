/**
 * STORY-d34eccd8 — "Serve a deployed snapshot": shareable previews and live
 * published sites reach a visitor.
 *
 * The *visitor half* of delivery. STORY-94 (`1c deploy`) ships a snapshot to
 * shared storage; this story is what happens when someone opens the URL it
 * returned. Before it, the public entry point answered every request with a
 * fixed greeting — nothing described how a deployed site reaches anyone.
 *
 *   AC-902  a preview URL renders its own snapshot complete — page and every
 *           asset it references
 *   AC-903  a published site URL serves whatever revision the site calls live,
 *           and follows it when that moves
 *   AC-904  a directory-shaped URL missing its trailing slash permanently
 *           redirects, query preserved — and that is correctness, not tidiness
 *   AC-905  only snapshots the deploy index references are servable; an orphan
 *           is unreachable
 *   AC-906  not-found is plain, never a listing, and never an existence oracle
 *   AC-907  empty / dot-shaped / separator-bearing / malformed URL components
 *           404 and reach no stored bytes
 *   AC-908  each response is typed from the object that answered
 *   AC-909  snapshot-addressed bytes are immutable; published carry a short TTL
 *   AC-910  every preview-channel response asks crawlers not to index it
 *   AC-911  repeat requests skip the store; not-found is never retained
 *   AC-912  the server is read-only: HEAD is served bodiless, writes are refused
 *   AC-913  the apex returns a holding response and never serves a site
 *   AC-914  a deploy colliding with the reserved preview segment is refused
 *
 * Every claim is observed at the HTTP boundary, through the Worker's real entry
 * point (`fetch(Request, Env, ExecutionContext)`), with the bucket seeded by a
 * real `1c deploy` run — so what is served is what the deploy pipeline genuinely
 * writes rather than a fixture that agrees with the implementation by
 * construction. R2 is faked at the binding, the one boundary we do not own;
 * every layer above it (route grammar, deploy index, header policy, edge cache)
 * is real.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { contentTypeFor as servedTypeFor } from '../apps/public-site/src/content-type'
import { SERVABLE_ROOT } from '../apps/public-site/src/site-store'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import { distDir, draftDir, readJson, writeJson } from '../tools/generate/src/store'
import {
  assertNoReservedSegment,
  cmdDeploy,
  collectSnapshotFiles,
  contentTypeFor as deployedTypeFor,
  MemoryR2Client,
  manifestKey,
  type SiteManifest,
  type SnapshotFile,
} from '../tools/generate/src/deploy'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'
/** A snapshot id shaped like a real one that no deploy will ever mint. */
const ABSENT_SHA = 'deadbeef0000'

let cwd: string
let client: MemoryR2Client

const ctx = {
  get cwd() {
    return cwd
  },
  root: 'sites' as const,
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-serve-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
  // Real asset bytes that travel through the render into `out/assets/`, so the
  // served page has an image and a font to reference besides its stylesheet.
  mkdirSync(path.join(draftDir(ctx, SLUG), 'assets'), { recursive: true })
  writeFileSync(
    path.join(draftDir(ctx, SLUG), 'assets', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
    'utf8',
  )
  writeFileSync(path.join(draftDir(ctx, SLUG), 'assets', 'body.woff2'), 'not-really-a-font', 'utf8')
  setHomePage('STARTER-MARKER')
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/**
 * Author the home page: one text leaf carrying `marker`, one image leaf, and a
 * font-face resource.
 *
 * Both asset references are authored ROOT-ABSOLUTE (`/assets/…`) exactly as a
 * real site authors them — REQ-109 relativizes them on emission, which is the
 * precondition this whole story rests on. Authoring them already-relative would
 * make the served page pass for the wrong reason.
 */
function setHomePage(marker: string): void {
  const file = path.join(draftDir(ctx, SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  page.l1 = {
    widths: [...STARTER_WIDTHS],
    background: '#ffffff',
    resources: {
      fonts: [{ family: 'Starter Sans', src: '/assets/body.woff2', weight: 400 }],
    },
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      align: 'center',
      distribution: 'center',
      padding: { topPx: 96, rightPx: 24, bottomPx: 96, leftPx: 24 },
      children: [
        {
          kind: 'text',
          id: 'placeholder',
          text: marker,
          axes: {
            color: '#111111',
            fontFamily: 'Starter Sans',
            fontSizePx: 48,
            fontWeight: 700,
            lineHeightPx: 56,
            textAlign: 'center',
          },
        },
        { kind: 'image', id: 'logo', src: '/assets/logo.svg', alt: 'logo' },
      ],
    },
  }
  writeJson(file, page)
}

/** Deploy through the real command, with shared storage faked at the boundary. */
function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: '2026-07-30T12:00:00.000Z', ...opts })
}

// ── the R2 binding, faked over the bytes a real deploy wrote ──────────────────

/**
 * The R2 binding. Records every key it was asked for, so a test can prove both
 * that a warm request never reached the store and that a traversal-shaped
 * request never reached another snapshot's bytes.
 */
class FakeBucket {
  readonly readKeys: string[] = []
  /** Keys whose stored metadata deliberately disagrees with their extension. */
  readonly lyingMetadata = new Map<string, string>()

  constructor(private readonly objects: Map<string, Buffer>) {}

  get reads(): number {
    return this.readKeys.length
  }

  /** Keys read that name bytes inside a snapshot (not the deploy index). */
  get snapshotReads(): string[] {
    return this.readKeys.filter((k) => /\/(preview|rev)\//.test(k))
  }

  async get(key: string) {
    this.readKeys.push(key)
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return {
      key,
      size: buf.byteLength,
      httpEtag: `"${key.length}-${buf.byteLength}"`,
      httpMetadata: { contentType: this.lyingMetadata.get(key) },
      body: new Blob([new Uint8Array(buf)]).stream(),
      text: async () => buf.toString('utf8'),
    }
  }

  async head(key: string) {
    this.readKeys.push(key)
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return {
      key,
      size: buf.byteLength,
      httpEtag: `"${key.length}-${buf.byteLength}"`,
      httpMetadata: { contentType: this.lyingMetadata.get(key) },
    }
  }
}

function bucket(objects: Map<string, Buffer> = client.objects): FakeBucket {
  return new FakeBucket(objects)
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

/** Install a fake edge Cache API for the duration of `body`. */
async function withEdgeCache(body: () => Promise<void>): Promise<void> {
  const store = new Map<string, Response>()
  const globals = globalThis as { caches?: unknown }
  globals.caches = {
    default: {
      async match(req: Request) {
        return store.get(req.url)?.clone()
      },
      async put(req: Request, res: Response) {
        store.set(req.url, res)
      },
    },
  }
  try {
    await body()
  } finally {
    delete globals.caches
  }
}

/**
 * The site's deploy index, read back out of shared storage.
 *
 * Addressed under the root the Worker actually serves (BUG-31) rather than a
 * bare literal: the index is keyed by root on both sides, so a test that read
 * some other root would be asserting against a manifest nothing serves.
 */
async function deployIndex(): Promise<SiteManifest> {
  const raw = await client.get(manifestKey(SERVABLE_ROOT, SLUG))
  if (raw === null) throw new Error('no deploy index in shared storage')
  return JSON.parse(raw) as SiteManifest
}

function putDeployIndex(m: SiteManifest): void {
  client.objects.set(
    manifestKey(SERVABLE_ROOT, SLUG),
    Buffer.from(JSON.stringify(m, null, 2) + '\n', 'utf8'),
  )
}

/**
 * Every reference the document asks the browser to load, at every sink: markup
 * attributes AND the `url("…")` values inside the emitted stylesheets. Absolute,
 * protocol-relative and fragment references are excluded — they do not resolve
 * against the snapshot.
 */
function documentReferences(text: string): string[] {
  const found = new Set<string>()
  const add = (url: string) => {
    if (/^[a-z]+:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url === '') return
    found.add(url)
  }
  for (const m of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) add(m[1])
  for (const m of text.matchAll(/url\("([^"]*)"\)/g)) add(m[1])
  return [...found]
}

/** Status/type/body of a response, for byte-comparing two of them. */
async function shapeOf(res: Response) {
  return { status: res.status, type: res.headers.get('content-type'), body: await res.text() }
}

function headerMap(res: Response): Record<string, string> {
  const out: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    // The etag is derived from the object that answered, so it is meaningless
    // on a not-found and absent from all of them; nothing here filters it out.
    out[k] = v
  })
  return out
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('STORY — serve a deployed snapshot to a visitor', () => {
  it('test_UAT_AC902_preview_url_renders_its_own_snapshot_complete', async () => {
    setHomePage('PREVIEW-ONE')
    const first = await deploy()

    const base = `/site/${SLUG}/draft/${first.sha}/`
    const res = await get(base)

    // The entry page of THAT snapshot, typed as markup.
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const html = await res.text()
    expect(html).toContain('PREVIEW-ONE')
    expect(html).toContain('<title>')

    // Every reference the document makes — stylesheet, image, font — resolves
    // under the SAME preview address, with its own correct type. A page that
    // 200s while its stylesheet 404s is a broken page, not a served one.
    const refs = documentReferences(html)
    expect(refs).toContain('./theme.css')
    expect(refs).toContain('assets/logo.svg')
    expect(refs).toContain('assets/body.woff2')

    const seen = new Map<string, string>()
    for (const ref of refs) {
      const target = new URL(ref, `${ORIGIN}${base}`)
      const asset = await get(`${target.pathname}${target.search}`)
      expect(asset.status, `${ref} → ${target.pathname}`).toBe(200)
      expect(asset.headers.get('content-type'), ref).toBe(servedTypeFor(target.pathname))
      seen.set(ref, asset.headers.get('content-type') as string)
    }
    expect(seen.get('./theme.css')).toBe('text/css; charset=utf-8')
    expect(seen.get('assets/logo.svg')).toBe('image/svg+xml')
    expect(seen.get('assets/body.woff2')).toBe('font/woff2')

    // The stylesheet's own references resolve too — the emitted CSS is part of
    // the page, not a separate concern.
    const css = await get(`${base}theme.css`)
    for (const ref of documentReferences(await css.text())) {
      const target = new URL(ref, `${ORIGIN}${base}theme.css`)
      expect((await get(target.pathname)).status, `theme.css → ${ref}`).toBe(200)
    }

    // The bytes are that snapshot's, not some other revision of the same site:
    // deploy a second, different snapshot and the first URL is unmoved.
    setHomePage('PREVIEW-TWO')
    const second = await deploy()
    expect(second.sha).not.toBe(first.sha)
    expect(await (await get(base)).text()).toContain('PREVIEW-ONE')
    expect(await (await get(base)).text()).not.toContain('PREVIEW-TWO')
    expect(await (await get(`/site/${SLUG}/draft/${second.sha}/`)).text()).toContain('PREVIEW-TWO')
  })

  it('test_UAT_AC903_published_url_serves_and_follows_the_live_revision', async () => {
    setHomePage('REVISION-ONE')
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    // The published address names the site only — no revision segment anywhere.
    const url = `/site/${SLUG}/`
    expect(url).not.toMatch(/\/(draft|rev)\//)

    const first = await get(url)
    expect(first.status).toBe(200)
    expect(first.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const firstHtml = await first.text()
    expect(firstHtml).toContain('REVISION-ONE')

    // An asset the served page references resolves under the same address.
    for (const ref of documentReferences(firstHtml)) {
      const target = new URL(ref, `${ORIGIN}${url}`)
      expect((await get(target.pathname)).status, ref).toBe(200)
    }

    // A second revision goes live; the UNCHANGED URL follows it.
    setHomePage('REVISION-TWO')
    await cmdPublish(SLUG, { cwd, message: 'second' })
    await deploy({ channel: 'published' })
    expect((await deployIndex()).live).toBe(2)

    const second = await get(url)
    expect(second.status).toBe(200)
    const secondHtml = await second.text()
    expect(secondHtml).toContain('REVISION-TWO')
    expect(secondHtml).not.toContain('REVISION-ONE')

    // What is served follows the live pointer and nothing else: move it back and
    // the older revision returns, both snapshots still sitting in storage.
    putDeployIndex({ ...(await deployIndex()), live: 1 })
    expect(await (await get(url)).text()).toContain('REVISION-ONE')
  })

  it('test_UAT_AC904_bare_directory_url_permanently_redirects_and_preserves_the_query', async () => {
    setHomePage('SLASH-MARKER')
    const preview = await deploy()
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    for (const bare of [`/site/${SLUG}/draft/${preview.sha}`, `/site/${SLUG}`]) {
      const redirect = await get(bare)
      expect(redirect.status, bare).toBe(301)
      expect(redirect.headers.get('location'), bare).toBe(`${bare}/`)

      // The query rides across unchanged rather than being silently dropped.
      const withQuery = await get(`${bare}?utm=1&q=a%20b`)
      expect(withQuery.status, bare).toBe(301)
      expect(withQuery.headers.get('location'), bare).toBe(`${bare}/?utm=1&q=a%20b`)

      // Following it yields the entry page…
      const followed = await get(redirect.headers.get('location') as string)
      expect(followed.status, bare).toBe(200)
      const html = await followed.text()
      expect(html, bare).toContain('SLASH-MARKER')

      // …and every asset reference in that markup resolves against the FINAL
      // URL. Assets are document-relative (REQ-109), so this is the whole point.
      const refs = documentReferences(html)
      expect(refs.length, bare).toBeGreaterThan(0)
      for (const ref of refs) {
        const resolved = new URL(ref, `${ORIGIN}${bare}/`)
        expect((await get(resolved.pathname)).status, `${bare}/ → ${ref}`).toBe(200)
      }

      // Why the redirect exists rather than serving the bare form directly: the
      // very same references resolve ONE LEVEL TOO HIGH against the bare URL,
      // landing on addresses that are — correctly — nothing at all. (Followed to
      // their end, since a misresolved address can itself be directory-shaped.)
      for (const ref of refs) {
        const misresolved = new URL(ref, `${ORIGIN}${bare}`)
        expect(misresolved.pathname, ref).not.toBe(new URL(ref, `${ORIGIN}${bare}/`).pathname)
        let res = await get(misresolved.pathname)
        for (let hop = 0; res.status === 301 && hop < 4; hop++) {
          res = await get(res.headers.get('location') as string)
        }
        expect(res.status, `bare ${bare} → ${ref}`).toBe(404)
      }
    }
  })

  it('test_UAT_AC905_only_indexed_snapshots_are_servable', async () => {
    setHomePage('INDEXED')
    const indexed = await deploy()
    const indexedUrl = `/site/${SLUG}/draft/${indexed.sha}/`
    expect((await get(indexedUrl)).status).toBe(200)

    // An orphan: a complete snapshot's bytes in storage that no index entry
    // references — an interrupted upload, or one `--prune` has not yet swept.
    const orphanKey = `sites/${SLUG}/preview/${ABSENT_SHA}/out/index.html`
    client.objects.set(orphanKey, Buffer.from('<!doctype html>ORPHAN', 'utf8'))
    expect((await deployIndex()).previews.map((p) => p.sha)).not.toContain(ABSENT_SHA)

    const orphan = await call(`/site/${SLUG}/draft/${ABSENT_SHA}/`)
    expect(orphan.res.status).toBe(404)
    expect(await orphan.res.text()).not.toContain('ORPHAN')
    // The identifier from the URL was only ever looked UP in the index; the
    // orphan's location was never read.
    expect(orphan.bucket.snapshotReads).toEqual([])
    expect(orphan.bucket.readKeys).toEqual([manifestKey(SERVABLE_ROOT, SLUG)])
    // …and the indexed snapshot for the same site is unaffected.
    expect((await get(indexedUrl)).status).toBe(200)

    // Unlink a previously indexed preview: its URL stops serving even though
    // every one of its bytes is still sitting in storage.
    const before = await deployIndex()
    const previewKey = `sites/${SLUG}/preview/${indexed.sha}/out/index.html`
    expect(client.objects.has(previewKey)).toBe(true)
    putDeployIndex({ ...before, previews: [] })
    expect((await get(indexedUrl)).status).toBe(404)
    expect(client.objects.has(previewKey)).toBe(true)

    // The location actually read is the one the INDEX records, never a location
    // the URL named: the published address carries no identifier at all, and the
    // key read is the live revision's own prefix.
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })
    const published = await call(`/site/${SLUG}/`)
    expect(published.res.status).toBe(200)
    expect(published.bucket.snapshotReads).toEqual([`sites/${SLUG}/rev/0001/out/index.html`])
  })

  it('test_UAT_AC906_not_found_is_plain_and_never_an_existence_oracle', async () => {
    setHomePage('SECRET-CONTENT')
    const preview = await deploy() // a preview exists; nothing is published yet

    const cases = {
      unknownSite: '/site/nobody-here/',
      nothingPublished: `/site/${SLUG}/`,
      unknownSnapshot: `/site/${SLUG}/draft/${ABSENT_SHA}/`,
      missingObject: `/site/${SLUG}/draft/${preview.sha}/does-not-exist.css`,
    }
    const shapes = Object.fromEntries(
      await Promise.all(
        Object.entries(cases).map(async ([name, p]) => [name, await shapeOf(await get(p))]),
      ),
    ) as Record<keyof typeof cases, Awaited<ReturnType<typeof shapeOf>>>

    // All four are the same not-found, byte for byte.
    for (const [name, shape] of Object.entries(shapes)) {
      expect(shape.status, name).toBe(404)
      expect(shape.type, name).toBe('text/plain; charset=utf-8')
      expect(shape.body, name).toBe('Not Found')
      expect(shape, name).toEqual(shapes.unknownSite)
    }

    // Nothing from the store leaks into the body: no path, key, filename, count
    // or content of anything that does exist.
    for (const [name, shape] of Object.entries(shapes)) {
      for (const leak of [
        'sites/',
        'logo.svg',
        'theme.css',
        'index.html',
        'manifest',
        SLUG,
        preview.sha,
        'SECRET-CONTENT',
      ]) {
        expect(shape.body, `${name} must not leak ${leak}`).not.toContain(leak)
      }
      expect(shape.body).toBe('Not Found')
    }

    // Header-wise the four are identical too, save for the crawler directive —
    // which is a function of the CHANNEL the asker themselves chose in the URL,
    // not of anything in the store (AC-910 requires it on every preview
    // response). So the comparison that can leak existence is the WITHIN-channel
    // one, and both pairs are exactly equal.
    const headersOf = async (p: string) => headerMap(await get(p))
    expect(await headersOf(cases.unknownSite)).toEqual(await headersOf(cases.nothingPublished))
    expect(await headersOf(cases.unknownSnapshot)).toEqual(await headersOf(cases.missingObject))
    const published = await headersOf(cases.unknownSite)
    const draft = await headersOf(cases.unknownSnapshot)
    expect(Object.keys(draft).filter((k) => published[k] !== draft[k])).toEqual(['x-robots-tag'])

    // A directory-shaped path inside a real snapshot is a not-found, never a
    // listing of what sits beneath it.
    const dir = await shapeOf(await get(`/site/${SLUG}/draft/${preview.sha}/assets/`))
    expect(dir).toEqual(shapes.unknownSnapshot)
    expect(dir.body).not.toContain('logo.svg')
  })

  it('test_UAT_AC907_malformed_and_traversal_shaped_components_404_without_reading_bytes', async () => {
    setHomePage('REACHABLE')
    const preview = await deploy()

    // Forms that survive URL parsing and reach the grammar as written: an empty
    // segment, escaped separators, a NUL, malformed percent-encoding, and site /
    // snapshot identifiers outside the shapes the scheme permits.
    const rejected = [
      `/site/${SLUG}/draft/${preview.sha}//theme.css`, // empty segment
      `/site/${SLUG}//theme.css`,
      `/site/${SLUG}/draft/${preview.sha}/%2fetc%2fpasswd`, // escaped separator
      `/site/${SLUG}/draft/${preview.sha}/..%2fsource%2fsite.json`,
      `/site/${SLUG}/draft/${preview.sha}/%5c..%5ctheme.css`, // escaped backslash
      `/site/${SLUG}/draft/${preview.sha}/theme%00.css`, // NUL
      `/site/${SLUG}/draft/${preview.sha}/%zz`, // malformed percent-encoding
      `/site/${SLUG}/draft/%2e%2e%2f${SLUG}/index.html`,
      '/site/-not-a-slug/', // slug outside the permitted shape
      `/site/${'x'.repeat(200)}/`,
      `/site/${SLUG}/draft/not-hex/`, // snapshot id outside the permitted shape
      `/site/${SLUG}/draft/abc/`,
      `/site/${SLUG}/draft/`,
    ]
    for (const p of rejected) {
      const { res, bucket: b } = await call(p)
      expect(res.status, p).toBe(404)
      expect(await res.text(), p).toBe('Not Found')
      // Refused by the grammar: not one storage lookup was attempted.
      expect(b.readKeys, p).toEqual([])
    }

    // The grammar rejects the dot-shaped and empty components by name…
    for (const p of [
      '/site/acme/./index.html',
      '/site/acme/../index.html',
      '/site/acme/draft/../index.html',
      '/site//index.html',
      '/site/./',
      '/site/../',
    ]) {
      expect(parseRoute(p).kind, p).toBe('not-found')
    }

    // …and driven through the public entry point, where WHATWG URL parsing
    // collapses `.` / `..` (and their `%2e` spellings) before dispatch, they
    // still never steer a request at another site's or snapshot's bytes.
    for (const p of [
      `/site/${SLUG}/../manifest.json`,
      `/site/${SLUG}/%2e%2e/manifest.json`,
      `/site/${SLUG}/draft/${preview.sha}/../source/site.json`,
      `/site/${SLUG}/draft/${preview.sha}/%2E%2E/source/site.json`,
      `/site/${SLUG}/draft/${preview.sha}/./assets/../../source/site.json`,
    ]) {
      const { res, bucket: b } = await call(p)
      const final = res.status === 301 ? await get(res.headers.get('location') as string) : res
      expect(final.status, p).toBe(404)
      expect(await final.text(), p).toBe('Not Found')
      expect(b.snapshotReads, p).toEqual([])
    }

    // The control: a well-formed request in the same suite really does read.
    const ok = await call(`/site/${SLUG}/draft/${preview.sha}/theme.css`)
    expect(ok.res.status).toBe(200)
    expect(ok.bucket.snapshotReads).toEqual([
      `sites/${SLUG}/preview/${preview.sha}/out/theme.css`,
    ])
  })

  it('test_UAT_AC908_response_is_typed_from_the_object_that_answered', async () => {
    const preview = await deploy()
    const base = `/site/${SLUG}/draft/${preview.sha}/`
    const prefix = `sites/${SLUG}/preview/${preview.sha}/out`

    const expected: Record<string, string> = {
      'index.html': 'text/html; charset=utf-8',
      'theme.css': 'text/css; charset=utf-8',
      'app.js': 'text/javascript; charset=utf-8',
      'app.mjs': 'text/javascript; charset=utf-8',
      'site.json': 'application/json; charset=utf-8',
      'robots.txt': 'text/plain; charset=utf-8',
      'sitemap.xml': 'application/xml',
      'assets/logo.svg': 'image/svg+xml',
      'assets/hero.png': 'image/png',
      'assets/hero.jpg': 'image/jpeg',
      'assets/hero.jpeg': 'image/jpeg',
      'assets/spin.gif': 'image/gif',
      'assets/hero.webp': 'image/webp',
      'assets/hero.avif': 'image/avif',
      'favicon.ico': 'image/x-icon',
      'assets/body.woff2': 'font/woff2',
      'assets/body.woff': 'font/woff',
      'assets/body.ttf': 'font/ttf',
      'assets/body.otf': 'font/otf',
      // Not recognised, and no extension at all: served as generic binary
      // rather than guessed at.
      'download.bin': 'application/octet-stream',
      'LICENSE': 'application/octet-stream',
    }

    // Objects the starter render does not produce are seeded into the snapshot
    // the index already vouches for — what is under test is the mapping from the
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
      // The server and the deploy pipeline agree on the type for the extension —
      // the two tables live on opposite sides of a deployment boundary and are
      // pinned together here rather than by hope.
      if (type !== 'application/octet-stream') {
        expect(deployedTypeFor(rel), rel).toBe(type)
      }
    }

    // Recorded metadata is not consulted: an object stored with a deliberately
    // wrong content type is still served by its extension, so the same file is
    // typed identically however it was uploaded.
    const lying = bucket()
    for (const rel of ['index.html', 'theme.css', 'assets/logo.svg']) {
      lying.lyingMetadata.set(`${prefix}/${rel}`, 'application/x-wrong')
    }
    for (const rel of ['index.html', 'theme.css', 'assets/logo.svg']) {
      const res = (await call(`${base}${rel}`, { bucket: lying })).res
      expect(res.headers.get('content-type'), rel).toBe(expected[rel])
      expect(res.headers.get('content-type'), rel).not.toBe('application/x-wrong')
    }
  })

  it('test_UAT_AC909_snapshot_addresses_are_immutable_and_published_carry_a_short_ttl', async () => {
    const preview = await deploy()
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    // Snapshot-addressed: those bytes are named by their own content and can
    // never change, so they are cacheable for a long lifetime and immutable.
    for (const p of [
      `/site/${SLUG}/draft/${preview.sha}/`,
      `/site/${SLUG}/draft/${preview.sha}/theme.css`,
      `/site/${SLUG}/draft/${preview.sha}/assets/logo.svg`,
    ]) {
      const cache = (await get(p)).headers.get('cache-control')
      expect(cache, p).toBe('public, max-age=31536000, immutable')
      expect(cache, p).toContain('public')
      expect(cache, p).toContain('immutable')
    }

    // Published: not revision-scoped, so its meaning changes when a new revision
    // goes live — a short lifetime only, and never `immutable`.
    for (const p of [`/site/${SLUG}/`, `/site/${SLUG}/theme.css`, `/site/${SLUG}/assets/logo.svg`]) {
      const cache = (await get(p)).headers.get('cache-control')
      expect(cache, p).toBe('public, max-age=60')
      expect(cache, p).toContain('public')
      expect(cache, p).not.toContain('immutable')
      expect(Number(/max-age=(\d+)/.exec(cache as string)?.[1])).toBeLessThanOrEqual(60)
    }
  })

  it('test_UAT_AC910_every_preview_channel_response_is_marked_noindex', async () => {
    const preview = await deploy()
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })

    // Page, asset, the trailing-slash redirect, and the not-found — a preview is
    // private-by-URL, so a crawler that reached one is told so whatever it found.
    const draftUrls: Record<string, string> = {
      page: `/site/${SLUG}/draft/${preview.sha}/`,
      asset: `/site/${SLUG}/draft/${preview.sha}/theme.css`,
      redirect: `/site/${SLUG}/draft/${preview.sha}`,
      notFound: `/site/${SLUG}/draft/${preview.sha}/nope.css`,
    }
    const expectedStatus: Record<string, number> = {
      page: 200,
      asset: 200,
      redirect: 301,
      notFound: 404,
    }
    for (const [name, p] of Object.entries(draftUrls)) {
      const res = await get(p)
      expect(res.status, name).toBe(expectedStatus[name])
      expect(res.headers.get('x-robots-tag'), name).toBe('noindex')
    }

    // The published site is meant to be indexed — no directive on any of its
    // corresponding responses.
    const publishedUrls: Record<string, string> = {
      page: `/site/${SLUG}/`,
      asset: `/site/${SLUG}/theme.css`,
      redirect: `/site/${SLUG}`,
      notFound: `/site/${SLUG}/nope.css`,
    }
    for (const [name, p] of Object.entries(publishedUrls)) {
      const res = await get(p)
      expect(res.status, name).toBe(expectedStatus[name])
      expect(res.headers.get('x-robots-tag'), name).toBeNull()
    }
  })

  it('test_UAT_AC911_repeat_requests_skip_the_store_and_not_found_is_never_retained', async () => {
    const preview = await deploy()

    await withEdgeCache(async () => {
      const shared = bucket()
      const url = `/site/${SLUG}/draft/${preview.sha}/theme.css`

      const cold = await call(url, { bucket: shared })
      expect(cold.res.status).toBe(200)
      const coldBody = await cold.res.clone().text()
      const coldHeaders = headerMap(cold.res)
      const readsAfterCold = shared.reads
      expect(readsAfterCold).toBeGreaterThan(0)

      // Same status, headers and body — and not one further read of the store.
      const warm = await call(url, { bucket: shared })
      expect(warm.res.status).toBe(cold.res.status)
      expect(headerMap(warm.res)).toEqual(coldHeaders)
      expect(await warm.res.text()).toBe(coldBody)
      expect(shared.reads).toBe(readsAfterCold)
    })

    // A not-found is never retained: the URL that answered 404 because nothing
    // was deployed there begins serving the moment a deploy makes it real, with
    // no wait and no manual invalidation.
    await withEdgeCache(async () => {
      const url = `/site/${SLUG}/`
      expect((await get(url)).status).toBe(404)

      setHomePage('NOW-PUBLISHED')
      await cmdPublish(SLUG, { cwd, message: 'first' })
      await deploy({ channel: 'published' })

      const now = await get(url)
      expect(now.status).toBe(200)
      expect(await now.text()).toContain('NOW-PUBLISHED')
    })
  })

  it('test_UAT_AC912_server_is_read_only_head_is_bodiless_and_writes_are_refused', async () => {
    const preview = await deploy()
    const url = `/site/${SLUG}/draft/${preview.sha}/theme.css`

    const full = await get(url)
    const fullBody = await full.text()
    const head = await get2(url, 'HEAD')

    // Same status, type and freshness as the full request…
    expect(head.status).toBe(full.status)
    expect(head.headers.get('content-type')).toBe(full.headers.get('content-type'))
    expect(head.headers.get('cache-control')).toBe(full.headers.get('cache-control'))
    // …plus the object's length, and no body.
    expect(head.headers.get('content-length')).toBe(String(Buffer.byteLength(fullBody, 'utf8')))
    expect(await head.text()).toBe('')

    // A header-only request for a URL that names nothing is the same not-found
    // as its full-request counterpart.
    const missing = `/site/${SLUG}/draft/${preview.sha}/absent.css`
    expect((await get2(missing, 'HEAD')).status).toBe((await get(missing)).status)
    expect((await get2(missing, 'HEAD')).status).toBe(404)
    expect((await get2(`/site/nobody-here/`, 'HEAD')).status).toBe(404)

    // Anything that would write is refused, with the permitted set named — and
    // no store read is performed for it.
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const { res, bucket: b } = await call(url, { method })
      expect(res.status, method).toBe(405)
      expect(res.headers.get('allow'), method).toBe('GET, HEAD')
      expect(b.readKeys, method).toEqual([])
    }
  })

  it('test_UAT_AC913_apex_returns_a_holding_response_and_never_serves_a_site', async () => {
    setHomePage('SITE-CONTENT-MARKER')
    const preview = await deploy()
    await cmdPublish(SLUG, { cwd, message: 'first' })
    await deploy({ channel: 'published' })
    // The store really does hold a deployed AND published site.
    expect((await deployIndex()).live).toBe(1)
    expect((await get(`/site/${SLUG}/`)).status).toBe(200)
    expect((await get(`/site/${SLUG}/draft/${preview.sha}/`)).status).toBe(200)

    for (const p of ['/', '/?utm=1']) {
      const res = await get(p)
      expect(res.status, p).toBe(200)
      expect(res.headers.get('content-type'), p).toBe('text/plain; charset=utf-8')
      const body = await res.text()
      expect(body, p).toBe('Hello from 1stcontact.io')
      // Not one byte of any deployed site appears at the root.
      expect(body, p).not.toContain('SITE-CONTENT-MARKER')
      expect(body, p).not.toContain('<!DOCTYPE')
      expect(body, p).not.toContain(SLUG)
    }

    // …and the same holding response with no sites in the store at all.
    const empty = (await call('/', { bucket: bucket(new Map()) })).res
    expect(empty.status).toBe(200)
    expect(empty.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await empty.text()).toBe('Hello from 1stcontact.io')
  })

  it('test_UAT_AC914_deploy_colliding_with_the_reserved_preview_segment_is_refused', async () => {
    // A real snapshot's file list, taken from a real deploy — the gate's actual
    // input, not a hand-built shape.
    const deployed = await deploy()
    const real = collectSnapshotFiles(distDir(ctx, SLUG, 'draft'), draftDir(ctx, SLUG))
    expect(real.map((f) => f.rel)).toContain('out/index.html')
    expect(() => assertNoReservedSegment(real)).not.toThrow()

    const file = (rel: string): SnapshotFile => ({ rel, abs: path.join(cwd, rel), bytes: 1 })

    // A top-level entry of the reserved name is refused, and the refusal names
    // the offending entry, names the reserved segment, and says why the entry
    // would otherwise be unreachable.
    for (const clash of ['out/draft/index.html', 'out/draft']) {
      let message = ''
      expect(() => {
        try {
          assertNoReservedSegment([...real, file(clash)])
        } catch (err) {
          message = (err as Error).message
          throw err
        }
      }, clash).toThrow(/reserved/)
      expect(message, clash).toContain(clash)
      expect(message, clash).toContain("'draft'")
      expect(message, clash).toContain('reserved')
      expect(message, clash).toContain('unreachable')
      expect(message, clash).toContain(`/site/<slug>/draft/<sha>/`)
    }

    // The name one level deeper, and a top-level entry that merely SHARES the
    // prefix, proceed normally — the guard is one exact top-level segment.
    expect(() =>
      assertNoReservedSegment([
        ...real,
        file('out/draft.html'),
        file('out/drafts/index.html'),
        file('out/assets/draft/logo.svg'),
        file('source/draft/site.json'),
      ]),
    ).not.toThrow()

    // …and those same shapes really do deploy and really do serve, driven all
    // the way through the real command: a page slugged `draft` renders to
    // `out/draft.html`, and an asset one level deeper lands at
    // `out/assets/draft/logo.svg`.
    const home = path.join(draftDir(ctx, SLUG), 'pages', 'home.json')
    const page = readJson<Record<string, unknown>>(home)
    writeJson(path.join(draftDir(ctx, SLUG), 'pages', 'draft.json'), {
      ...page,
      id: 'draft-page',
      slug: 'draft',
      title: 'Draft',
    })
    mkdirSync(path.join(draftDir(ctx, SLUG), 'assets', 'draft'), { recursive: true })
    writeFileSync(
      path.join(draftDir(ctx, SLUG), 'assets', 'draft', 'logo.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
      'utf8',
    )

    const next = await deploy()
    expect(next.sha).not.toBe(deployed.sha)
    const prefix = `sites/${SLUG}/preview/${next.sha}/out`
    expect(client.objects.has(`${prefix}/draft.html`)).toBe(true)
    expect(client.objects.has(`${prefix}/assets/draft/logo.svg`)).toBe(true)

    // Both remain addressable — the reserved segment shadows neither.
    const base = `/site/${SLUG}/draft/${next.sha}/`
    expect((await get(`${base}draft.html`)).status).toBe(200)
    expect((await get(`${base}assets/draft/logo.svg`)).status).toBe(200)

    // WHY the gate is stated and proved at its own entry point rather than
    // through a deploy attempt, pinned rather than assumed: the deploy's own
    // render refuses nested output outright (REQ-109 flatness), so no site
    // definition can put a top-level `draft/` DIRECTORY into `out/` for the gate
    // to catch. This is a real deploy attempt through the real command, and it
    // ships nothing. The day rendered output gains nesting this assertion fails —
    // which is the signal to prove the reserved-segment gate end-to-end instead.
    writeJson(path.join(draftDir(ctx, SLUG), 'pages', 'nested.json'), {
      ...page,
      id: 'nested-page',
      slug: 'draft/index',
      title: 'Nested',
    })
    const storedBefore = [...client.objects.keys()].sort()
    await expect(deploy()).rejects.toThrow(/slug 'draft\/index' is nested/)
    expect([...client.objects.keys()].sort()).toEqual(storedBefore)
  })
})

/** A request by method other than GET, through the same real entry point. */
async function get2(pathAndQuery: string, method: string): Promise<Response> {
  return (await call(pathAndQuery, { method })).res
}
