/**
 * STORY-66115f6b — "Clean page URLs": the link an author writes resolves the
 * same in local preview and on the deployed site.
 *
 * A page authored with slug `whitepapers` renders to `whitepapers.html`; the
 * link the author writes into the nav is `/whitepapers`. This story is the
 * mapping that makes that URL work — and specifically the *agreement* between
 * the only two places a site is ever served from. Either half alone is a trap:
 * the author sees the correct link fail in whichever environment is in front of
 * them and "fixes" it by baking `.html` into the site, which is the wrong fix at
 * the wrong layer, at permanent cost to every URL the site will ever have.
 *
 *   AC-915  local preview serves a slug-only page URL, as HTML
 *   AC-916  the deployed site serves it too — both addressing forms, GET & HEAD
 *   AC-917  an exact match always wins; nothing that resolved before moves
 *   AC-918  only the LAST segment decides eligibility; extensions never map
 *   AC-919  the mapping resolves a page that exists; it never invents one
 *   AC-920  a mapped response is typed from the page that answered
 *   AC-921  a page has exactly one clean URL, the slash-free one, so its
 *           document-relative asset references resolve at the snapshot root
 *   AC-922  in local preview the mapping cannot widen reach past confinement
 *   AC-923  on the deployed site a URL the grammar rejects never reaches it
 *
 * Both halves are observed at the boundary a visitor actually meets. Local
 * preview is driven over the preview server's real loopback address (and, where
 * a traversing request must survive client-side normalisation, over a raw
 * socket). The deployed half is driven through the Worker's real entry point
 * over bytes a real `1c publish` wrote. R2 and D1 are faked at the binding — the
 * one boundary we do not own; the route grammar, the store and the header policy
 * above them are all real.
 *
 * ONE CHANNEL SINCE REQ-149. The deployed half used to run against a sha-named
 * draft snapshot AND the live revision. Draft snapshots are gone with the deploy
 * manifest that indexed them (D7), so every case below addresses the published
 * URL — which is the one this story was always about: the link an author writes,
 * in production.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { startServe, type ServeHandle } from '../tools/generate/src/cli'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import {
  distDir,
  draftDir,
  fsSiteStore,
  publishedOutPrefix,
  readJson,
  writeJson,
} from '../tools/generate/src/store'
import { readDraftSnapshot } from '../tools/generate/src/publish/publish'
import { seedPublished, emptyPublished, type PublishedFixture } from './fixtures/published-site'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

/** Markers that make "which page answered?" observable in the response body. */
const HOME = 'HOME-MARKER'
const PAPERS = 'WHITEPAPERS-MARKER'
/** A page slugged `guides`, so `guides.html` and a `guides/` directory collide. */
const GUIDES_PAGE = 'GUIDES-PAGE-MARKER'
const GUIDES_INDEX = 'GUIDES-INDEX-MARKER'
/** Behind a directory whose NAME contains a dot — the eligibility edge. */
const DOTTED = 'DOTTED-DIR-MARKER'
/** A page file deliberately outside the served site's directory. */
const SECRET = 'SECRET-OUTSIDE-MARKER'

let cwd: string
let published: PublishedFixture
let handles: ServeHandle[] = []

const ctx = {
  get cwd() {
    return cwd
  },
  root: 'sites' as const,
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-clean-urls-'))
  published = emptyPublished()
  liveRevision = 0
  handles = []
  cmdNew(SLUG, { cwd })
  mkdirSync(path.join(draftDir(ctx, SLUG), 'assets'), { recursive: true })
  writeFileSync(
    path.join(draftDir(ctx, SLUG), 'assets', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
    'utf8',
  )
  authorPage('home', HOME)
  // The whole story turns on addressing a page that is NOT the entry page — a
  // single-page site has no slug to write into a nav.
  authorPage('whitepapers', PAPERS)
  authorPage('guides', GUIDES_PAGE)
})

afterEach(async () => {
  for (const h of handles) await new Promise<void>((res) => h.server.close(() => res()))
  rmSync(cwd, { recursive: true, force: true })
})

/**
 * Author one page carrying `marker` as its only text.
 *
 * Built from the scaffolded home page so the L1 document is a real valid one,
 * with the marker swapped in — a hand-built document could pass for the wrong
 * reason.
 */
function authorPage(slug: string, marker: string): void {
  const file = path.join(draftDir(ctx, SLUG), 'pages', `${slug === 'home' ? 'home' : slug}.json`)
  const base = readJson<Record<string, unknown>>(
    path.join(draftDir(ctx, SLUG), 'pages', 'home.json'),
  )
  writeJson(file, {
    ...base,
    id: slug,
    slug,
    title: marker,
    l1: {
      widths: [...STARTER_WIDTHS],
      background: '#ffffff',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          { kind: 'text', id: 'marker', text: marker },
          { kind: 'image', id: 'logo', src: '/assets/logo.svg', alt: 'logo' },
        ],
      },
    },
  })
}

// ── local preview ────────────────────────────────────────────────────────────

/**
 * Render the site and serve it exactly as `1c serve` does.
 *
 * Two objects are seeded into the rendered output afterwards: a `guides/`
 * directory with its own index page (so a directory and a same-named page file
 * genuinely collide) and a page under a dotted directory name. Neither shape is
 * one `renderSite` emits — rendered pages are flat — but both are shapes a URL
 * can name, and eligibility is a rule about the URL.
 */
async function preview(): Promise<ServeHandle> {
  await cmdRender(SLUG, { cwd, source: 'draft' })
  const dist = distDir(ctx, SLUG, 'draft')
  mkdirSync(path.join(dist, 'guides'), { recursive: true })
  writeFileSync(
    path.join(dist, 'guides', 'index.html'),
    `<!DOCTYPE html><html>${GUIDES_INDEX}</html>`,
    'utf8',
  )
  mkdirSync(path.join(dist, 'v1.2'), { recursive: true })
  writeFileSync(path.join(dist, 'v1.2', 'page.html'), `<!DOCTYPE html><html>${DOTTED}</html>`, 'utf8')
  const handle = await startServe(SLUG, { cwd, source: 'draft' })
  handles.push(handle)
  return handle
}

interface Served {
  status: number
  body: string
  type: string
}

/** One request over the preview server's real loopback address. */
async function local(handle: ServeHandle, p: string): Promise<Served> {
  const res = await fetch(new URL(p, handle.url))
  return {
    status: res.status,
    body: await res.text(),
    type: res.headers.get('content-type') ?? '',
  }
}

/**
 * One request with the request-target written LITERALLY onto the wire.
 *
 * `fetch` resolves `..` before a byte leaves the client, so a traversing path
 * driven through it never reaches the server as written. A raw socket is the
 * only way to put the actual attack shape in front of the confinement guard.
 */
function localRaw(handle: ServeHandle, target: string): Promise<Served> {
  const port = Number(new URL(handle.url).port)
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(`GET ${target} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`)
    })
    let raw = ''
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => {
      raw += chunk
    })
    socket.on('error', reject)
    socket.on('end', () => {
      const status = Number(/^HTTP\/1\.1 (\d+)/.exec(raw)?.[1])
      const split = raw.indexOf('\r\n\r\n')
      resolve({
        status,
        // Framing (chunked or not) is irrelevant here: what matters is whether
        // the bytes of a file outside the site appear at all.
        body: split >= 0 ? raw.slice(split + 4) : raw,
        type: /content-type: *([^\r\n]+)/i.exec(raw)?.[1] ?? '',
      })
    })
  })
}

// ── the deployed site ────────────────────────────────────────────────────────

/**
 * The R2 binding, faked over the bytes a real deploy wrote. Records every key it
 * was asked for, so a test can prove which candidates were tried — and that a
 * rejected URL was offered none at all.
 */
class FakeBucket {
  readonly readKeys: string[] = []

  constructor(private readonly objects: Map<string, Buffer>) {}

  /** Keys read that name bytes inside a revision's rendered output. */
  get snapshotReads(): string[] {
    return this.readKeys.filter((k) => k.includes('/rev/'))
  }

  async get(key: string) {
    this.readKeys.push(key)
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
    this.readKeys.push(key)
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
  }
}

interface Fetched {
  res: Response
  bucket: FakeBucket
}

/** Drive the Worker's real entry point for one request. */
async function call(pathAndQuery: string, method = 'GET'): Promise<Fetched> {
  const bucket = new FakeBucket(published.bucket.objects)
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`, { method }),
    {
      SITES: bucket as unknown as R2Bucket,
      DB: published.db as unknown as D1Database,
    },
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return { res, bucket }
}

async function get(pathAndQuery: string, method = 'GET'): Promise<Response> {
  return (await call(pathAndQuery, method)).res
}

/**
 * Publish the site, and put what publishing produced where `public-site` looks.
 *
 * A REAL publish against the filesystem store renders the bytes; the fixture
 * only relocates them, at keys the shared key builders decide. So "the deployed
 * site serves the page" is a claim about the product's own render rather than
 * about markup this file wrote — which is what the deploy-driven fixture bought
 * before `1c deploy` was removed.
 */
let liveRevision = 0

async function publishToBucket(): Promise<void> {
  const store = fsSiteStore(ctx)
  const result = await cmdPublish(SLUG, { cwd, message: 'first' })
  // Guard the guard: a published site with no live revision would 404 for
  // reasons that have nothing to do with this story.
  expect(result.id, 'site must have a live revision').toBeGreaterThan(0)
  liveRevision = result.id

  const source = await readDraftSnapshot(store, SLUG)
  const out = new Map<string, string>()
  for (const rel of listRendered(distDir(ctx, SLUG, 'published'))) {
    out.set(rel, readFileSync(path.join(distDir(ctx, SLUG, 'published'), rel), 'utf8'))
  }
  seedPublished(published, SLUG, result.id, { source, out })
}

/** Every rendered file under `dir`, as store-relative paths. */
function listRendered(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) out.push(...listRendered(path.join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out
}

/** The stored key of one object inside the live revision's rendered output. */
function publishedKey(rel: string): string {
  return `${publishedOutPrefix(SLUG, liveRevision)}/${rel}`
}

function storedText(key: string): string {
  const buf = published.bucket.objects.get(key)
  if (buf === undefined) throw new Error(`no object at ${key}`)
  return buf.toString('utf8')
}

/**
 * Every reference the document asks the browser to load. Absolute,
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

/** Nothing a rejected or missing URL returns may be page markup. */
function expectNoPageMarkup(body: string, label: string): void {
  for (const marker of [HOME, PAPERS, GUIDES_PAGE, GUIDES_INDEX, DOTTED, '<!DOCTYPE', '<html']) {
    expect(body, `${label} must not return page markup (${marker})`).not.toContain(marker)
  }
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('STORY — a clean page URL resolves the same in preview and in production', () => {
  it('test_UAT_AC915_local_preview_serves_a_slug_only_page_url_as_html', async () => {
    const handle = await preview()
    const dist = distDir(ctx, SLUG, 'draft')

    // The rendered file really does carry the extension, and nothing named by
    // the bare slug exists on disk — so the URL below can only work by mapping.
    expect(existsSync(path.join(dist, 'whitepapers.html'))).toBe(true)
    expect(existsSync(path.join(dist, 'whitepapers'))).toBe(false)

    const res = await local(handle, '/whitepapers')

    expect(res.status).toBe(200)
    expect(res.type).toContain('text/html')
    // The page rendered for THAT slug, byte for byte — not merely some page.
    expect(res.body).toContain(PAPERS)
    expect(res.body).not.toContain(HOME)
    expect(res.body).toBe(readFileSync(path.join(dist, 'whitepapers.html'), 'utf8'))
  })

  it('test_UAT_AC916_deployed_site_serves_the_slug_only_url_on_both_forms_and_for_head', async () => {
    await publishToBucket()

    // Snapshot-addressed preview.
    const draftRes = await get(`/site/${SLUG}/whitepapers`)
    expect(draftRes.status).toBe(200)
    const draftBody = await draftRes.text()
    expect(draftBody).toContain(PAPERS)
    expect(draftBody).not.toContain(HOME)
    expect(draftBody).toBe(storedText(publishedKey('whitepapers.html')))

    // The published address resolves its prefix differently, so it earns its own
    // assertion rather than an assumption.
    const publishedRes = await get(`/site/${SLUG}/whitepapers`)
    expect(publishedRes.status).toBe(200)
    const publishedBody = await publishedRes.text()
    expect(publishedBody).toContain(PAPERS)
    expect(publishedBody).not.toContain(HOME)
    expect(`/site/${SLUG}/whitepapers`).not.toMatch(/\/(draft|rev)\//)

    // HEAD is a separate branch through the server, so it can (and did) drift.
    const head = await get(`/site/${SLUG}/whitepapers`, 'HEAD')
    expect(head.status).toBe(draftRes.status)
    expect(head.headers.get('content-type')).toBe(draftRes.headers.get('content-type'))
    expect(head.headers.get('content-type')).toContain('text/html')
    expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0)
    expect(Number(head.headers.get('content-length'))).toBe(Buffer.byteLength(draftBody, 'utf8'))
    expect(await head.text()).toBe('')
  })

  it('test_UAT_AC917_an_exact_match_always_wins_in_both_environments', async () => {
    const handle = await preview()
    const dist = distDir(ctx, SLUG, 'draft')

    // The collision the precedence rule is about really exists on disk: a page
    // file and a directory of the same name.
    expect(existsSync(path.join(dist, 'guides.html'))).toBe(true)
    expect(existsSync(path.join(dist, 'guides', 'index.html'))).toBe(true)

    const cases: { label: string; url: string; file: string; type: string }[] = [
      { label: 'explicit .html', url: '/whitepapers.html', file: 'whitepapers.html', type: 'text/html' },
      { label: 'site root', url: '/', file: 'index.html', type: 'text/html' },
      { label: 'trailing-slash directory', url: '/guides/', file: 'guides/index.html', type: 'text/html' },
      { label: 'bare directory', url: '/guides', file: 'guides/index.html', type: 'text/html' },
      { label: 'asset with its own extension', url: '/assets/logo.svg', file: 'assets/logo.svg', type: 'image/svg+xml' },
    ]
    for (const c of cases) {
      const res = await local(handle, c.url)
      expect(res.status, c.label).toBe(200)
      expect(res.type, c.label).toContain(c.type)
      expect(res.body, c.label).toBe(readFileSync(path.join(dist, c.file), 'utf8'))
    }
    // Specifically: the bare directory serves the DIRECTORY's index page, not the
    // same-named page file the mapping would otherwise reach for.
    const bare = await local(handle, '/guides')
    expect(bare.body).toContain(GUIDES_INDEX)
    expect(bare.body).not.toContain(GUIDES_PAGE)

    // The deployed half. Same claim, and additionally: the mapping is a genuine
    // last resort — an exactly-matching key is the ONLY lookup performed.
    await publishToBucket()
    const base = `/site/${SLUG}`
    const deployed: { label: string; url: string; rel: string; type: string }[] = [
      { label: 'explicit .html', url: `${base}/whitepapers.html`, rel: 'whitepapers.html', type: 'text/html' },
      { label: 'snapshot root', url: `${base}/`, rel: 'index.html', type: 'text/html' },
      { label: 'stylesheet', url: `${base}/theme.css`, rel: 'theme.css', type: 'text/css' },
      { label: 'asset', url: `${base}/assets/logo.svg`, rel: 'assets/logo.svg', type: 'image/svg+xml' },
    ]
    for (const c of deployed) {
      const { res, bucket } = await call(c.url)
      expect(res.status, c.label).toBe(200)
      expect(res.headers.get('content-type'), c.label).toContain(c.type)
      expect(await res.text(), c.label).toBe(storedText(publishedKey(c.rel)))
      expect(bucket.snapshotReads, c.label).toEqual([publishedKey(c.rel)])
    }
  })

  it('test_UAT_AC918_only_the_last_segment_decides_eligibility', async () => {
    const handle = await preview()

    // A missing asset stays a not-found, rather than returning page markup under
    // an image or stylesheet type.
    for (const url of ['/assets/missing.svg', '/theme-missing.css']) {
      const res = await local(handle, url)
      expect(res.status, url).toBe(404)
      expectNoPageMarkup(res.body, `local ${url}`)
    }
    // …while a DOTTED intermediate segment does not disable the clean URL for a
    // page beneath it.
    const dotted = await local(handle, '/v1.2/page')
    expect(dotted.status).toBe(200)
    expect(dotted.type).toContain('text/html')
    expect(dotted.body).toContain(DOTTED)

    // The deployed half. Seeded directly into the snapshot the index already
    // vouches for: what is under test is the URL rule, not how bytes got there.
    await publishToBucket()
    const base = `/site/${SLUG}`
    published.bucket.objects.set(
      publishedKey('v1.2/page.html'),
      Buffer.from(`<!DOCTYPE html><html>${DOTTED}</html>`, 'utf8'),
    )

    for (const rel of ['assets/missing.svg', 'nope.html', 'theme-missing.css']) {
      const { res, bucket } = await call(`${base}/${rel}`)
      expect(res.status, rel).toBe(404)
      expect(await res.text(), rel).toBe('Not Found')
      // Not eligible at all: the exact key was the only candidate tried, so no
      // `.html` sibling could have been returned under the asset's type.
      expect(bucket.snapshotReads, rel).toEqual([publishedKey(rel)])
      expect(parseRoute(`${base}/${rel}`), rel).toMatchObject({ htmlFallback: undefined })
    }

    const deployedDotted = await call(`${base}/v1.2/page`)
    expect(deployedDotted.res.status).toBe(200)
    expect(deployedDotted.res.headers.get('content-type')).toContain('text/html')
    expect(await deployedDotted.res.text()).toContain(DOTTED)
    expect(parseRoute(`${base}/v1.2/page`)).toMatchObject({ htmlFallback: 'v1.2/page.html' })
  })

  it('test_UAT_AC919_a_slug_only_url_with_no_page_behind_it_still_returns_not_found', async () => {
    const handle = await preview()

    // At the site root, and beneath a directory that really exists.
    for (const url of ['/nope', '/guides/missing']) {
      const res = await local(handle, url)
      expect(res.status, url).toBe(404)
      expectNoPageMarkup(res.body, `local ${url}`)
    }

    await publishToBucket()
    const base = `/site/${SLUG}`
    for (const rel of ['nope', 'assets/nope']) {
      const { res, bucket } = await call(`${base}/${rel}`)
      expect(res.status, rel).toBe(404)
      expect(await res.text(), rel).toBe('Not Found')
      // The mapping really was consulted and still found nothing — it resolves a
      // page that exists, it never invents one.
      expect(bucket.snapshotReads, rel).toEqual([
        publishedKey(rel),
        publishedKey(`${rel}.html`),
      ])
    }
  })

  it('test_UAT_AC920_a_mapped_response_is_typed_from_the_page_that_answered', async () => {
    // An extensionless request path offers nothing to type from, so a naive read
    // of the request would send the wrong type and the browser would download it.
    expect(path.extname('/whitepapers')).toBe('')

    const handle = await preview()
    expect((await local(handle, '/whitepapers')).type).toContain('text/html')

    await publishToBucket()
    const forms = [`/site/${SLUG}/whitepapers`, `/site/${SLUG}/whitepapers`]
    for (const url of forms) {
      for (const method of ['GET', 'HEAD']) {
        const res = await get(url, method)
        expect(res.status, `${method} ${url}`).toBe(200)
        expect(res.headers.get('content-type'), `${method} ${url}`).toContain('text/html')
      }
    }

    // The assertion discriminates: a non-HTML asset served by exact match still
    // declares its own type, in both environments.
    expect((await local(handle, '/assets/logo.svg')).type).toContain('image/svg+xml')
    const base = `/site/${SLUG}`
    expect((await get(`${base}/theme.css`)).headers.get('content-type')).toContain('text/css')
    expect((await get(`${base}/assets/logo.svg`)).headers.get('content-type')).toContain(
      'image/svg+xml',
    )
  })

  it('test_UAT_AC921_a_page_has_one_clean_url_and_it_is_the_slash_free_one', async () => {
    await publishToBucket()
    const base = `/site/${SLUG}`

    // A directory-shaped URL is never eligible: a page gets exactly one clean
    // address, not a second one that would break every asset on it.
    const slashed = await get(`${base}/whitepapers/`)
    expect(slashed.status).toBe(404)
    expectNoPageMarkup(await slashed.text(), 'slash-terminated form')

    const res = await get(`${base}/whitepapers`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain(PAPERS)

    // Every reference the page makes is document-relative, so the request URL's
    // DIRECTORY is what each resolves against. Against the slash-free URL that
    // directory is the snapshot root — and each reference really is servable.
    const refs = documentReferences(html)
    expect(refs).toContain('./theme.css')
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      const resolved = new URL(ref, `${ORIGIN}${base}/whitepapers`)
      // Directly under the snapshot root — not one level deeper.
      expect(resolved.pathname, ref).toBe(`${base}/${ref.replace(/^\.\//, '')}`)
      expect((await get(resolved.pathname)).status, ref).toBe(200)
    }
    expect((await get(`${base}/theme.css`)).headers.get('content-type')).toContain('text/css')

    // …and this is why the slash form must never become a second address: against
    // it the very same references land one level too low, on nothing at all.
    for (const ref of refs) {
      const misresolved = new URL(ref, `${ORIGIN}${base}/whitepapers/`)
      expect(misresolved.pathname, ref).toBe(`${base}/whitepapers/${ref.replace(/^\.\//, '')}`)
      expect((await get(misresolved.pathname)).status, ref).toBe(404)
    }
  })

  it('test_UAT_AC922_local_preview_confinement_is_unchanged_by_the_mapping', async () => {
    const handle = await preview()

    // A page file lying OUTSIDE the served site's directory, at two depths above
    // it — exactly what a traversing request would be reaching for.
    const outside = [
      path.join(handle.rootDir, '..', 'secret.html'),
      path.join(handle.rootDir, '..', '..', 'secret.html'),
      path.join(cwd, 'secret.html'),
    ]
    for (const file of outside) writeFileSync(file, `<!DOCTYPE html><html>${SECRET}</html>`, 'utf8')
    // The control: those files really are there and really do carry the marker,
    // so a passing assertion below is not vacuous.
    for (const file of outside) {
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file, 'utf8')).toContain(SECRET)
      expect(file.startsWith(handle.rootDir)).toBe(false)
    }

    // Written literally onto the wire so the traversal survives to the server:
    // extensionless and explicit, from the root and from a nested path.
    const traversals = [
      '/../secret',
      '/../secret.html',
      '/../../secret',
      '/../../secret.html',
      '/guides/../../secret',
      '/guides/../../../secret.html',
      '/assets/../../secret',
    ]
    for (const target of traversals) {
      const res = await localRaw(handle, target)
      expect([403, 404], `${target} (raw)`).toContain(res.status)
      expect(res.body, `${target} (raw)`).not.toContain(SECRET)
    }
    // And the percent-encoded spellings, over a real client.
    for (const target of ['/%2e%2e/secret', '/%2e%2e/secret.html', '/guides/%2e%2e/%2e%2e/secret']) {
      const res = await local(handle, target)
      expect([403, 404], target).toContain(res.status)
      expect(res.body, target).not.toContain(SECRET)
    }

    // Confinement did not cost the capability: the clean URL inside the site
    // still resolves in the very same server.
    const inside = await local(handle, '/whitepapers')
    expect(inside.status).toBe(200)
    expect(inside.body).toContain(PAPERS)
  })

  it('test_UAT_AC923_a_url_the_address_grammar_rejects_never_reaches_the_mapping', async () => {
    await publishToBucket()
    const base = `/site/${SLUG}`

    // Every one of these reaches the grammar as written, and every one is shaped
    // so its last segment carries NO extension — i.e. it would be eligible if it
    // were well formed at all.
    const rejected = [
      `${base}//whitepapers`, // empty component
      `${base}/%2fetc%2fpasswd`, // escaped separator
      `${base}/..%2fsecret`, // escaped separator behind a dot pair
      `${base}/%5c..%5cwhitepapers`, // escaped backslash
      `${base}/whitepapers%00`, // NUL
      `${base}/%zz`, // malformed percent-encoding
      `/site/-not-a-slug/whitepapers`, // site name outside the permitted shape
      `/site/${'x'.repeat(200)}/whitepapers`,
      `/notsite/${SLUG}/whitepapers`,
    ]
    for (const p of rejected) {
      const { res, bucket } = await call(p)
      expect(res.status, p).toBe(404)
      expect(await res.text(), p).toBe('Not Found')
      expectNoPageMarkup(await (await get(p)).text(), p)
      // Rejected outright: no candidate was ever offered, so not one storage
      // lookup was attempted.
      expect(bucket.readKeys, p).toEqual([])
      const route = parseRoute(p)
      expect(route.kind, p).toBe('not-found')
      expect((route as { htmlFallback?: string }).htmlFallback, p).toBeUndefined()
    }

    // `draft` NO LONGER GUARDS ANYTHING (REQ-149 D7). It used to prefix the
    // preview channel, so `…/draft/not-hex/…` was rejected for carrying a
    // malformed snapshot id. The channel is gone, so the segment is ordinary:
    // it addresses a page like any other, and a site may legitimately have one.
    expect(parseRoute(`${base}/draft/not-hex/whitepapers`)).toMatchObject({
      kind: 'asset',
      slug: SLUG,
      path: 'draft/not-hex/whitepapers',
    })

    // Dot-shaped and empty components are rejected by the grammar by name — URL
    // parsing collapses them before dispatch, so they are stated here directly.
    for (const p of [
      `/site/${SLUG}/./whitepapers`,
      `/site/${SLUG}/../whitepapers`,
      `/site//whitepapers`,
      `/site/${SLUG}/draft/./whitepapers`,
    ]) {
      const route = parseRoute(p)
      expect(route.kind, p).toBe('not-found')
      expect((route as { htmlFallback?: string }).htmlFallback, p).toBeUndefined()
    }

    // …and driven through the public entry point, where that collapsing happens,
    // they still never steer a request at any snapshot's bytes.
    for (const p of [
      `/site/${SLUG}/../whitepapers`,
      `/site/${SLUG}/%2e%2e/whitepapers`,
      `${base}/../whitepapers`,
      `${base}/./assets/../../whitepapers`,
    ]) {
      const { res, bucket } = await call(p)
      const final = res.status === 301 ? await get(res.headers.get('location') as string) : res
      expect(final.status, p).toBe(404)
      expectNoPageMarkup(await final.text(), p)
      expect(bucket.snapshotReads, p).toEqual([])
    }

    // The control: a well-formed slug-only URL in the same suite really does
    // reach the mapping and really does serve the page.
    const ok = await call(`${base}/whitepapers`)
    expect(ok.res.status).toBe(200)
    expect(await ok.res.text()).toContain(PAPERS)
  })
})
