import { afterEach, describe, expect, it } from 'vitest'
import { get as httpGet } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  reextractFromBundle,
  rewriteMirroredRefs,
  type BrowserDriver,
  type CapturedResponse,
  type RawSignals,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-d5de22a5 — AC-1607: an **offline re-extract**
 * resolves the document's font references to the bundle's own mirrored faces.
 *
 * Relationship to the free-coded evidence: `bug16-webfont-load-before-extract.test.ts`
 * carries five `test_UAT_FC_BUG-16_*` tests. Three are gated behind
 * `it.runIf(browserOk)`; the two that run without Chromium are
 * `…_rewrite_maps_mirrored_absolute_urls` (four assertions on the pure
 * `rewriteMirroredRefs` string function) and `…_extract_script_stays_synchronous`.
 * Neither exercises the **serving** layer — the part of the mechanism that decides
 * what a browser navigating the bundle actually receives.
 *
 * These tests drive the real `reextractFromBundle` entry point with a fake browser
 * seam that performs real loopback HTTP, so what is asserted is the bytes the
 * offline server hands back: the rewritten document, and the mirrored font actually
 * being reachable at the path the rewrite points to.
 *
 * SCOPE LIMIT, stated rather than implied: AC-1607's Verification also asks that the
 * runs report `fontLoaded: true`, that the captured family be the intended face, and
 * that glyph extents match an online extract within tolerance. Those are properties
 * of a real font-loading browser and cannot be measured without Chromium — they
 * remain covered only by `test_UAT_FC_BUG-16_reextract_serves_mirrored_crossorigin_webfont`,
 * which skips where no browser exists. This file closes the half that does not need one.
 */

const tmpDirs: string[] = []
function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

const FONT_URL = 'https://fonts.gstatic.invalid/s/alchemy/v1/alchemy.woff2'
const SHEET_URL = 'https://fonts.googleapis.invalid/css2?family=Alchemy:wght@600&display=swap'
const UNMIRRORED_URL = 'https://cdn.example.invalid/never-mirrored.woff2'

const RENDERED_HTML =
  `<!doctype html><html><head>` +
  `<link rel="stylesheet" href="${SHEET_URL}">` +
  `<style>@font-face{font-family:Alchemy;src:url(${FONT_URL}) format('woff2')}` +
  `@font-face{font-family:Ghost;src:url(${UNMIRRORED_URL}) format('woff2')}</style>` +
  `</head><body><h1 style="font-family:Alchemy">Dreaming of healthier meals</h1></body></html>`

const MIRRORED_CSS = `@font-face{font-family:Alchemy;src:url(${FONT_URL}) format('woff2')}`
const FONT_BYTES = 'MIRRORED-FONT-BYTES'

/**
 * A bundle whose `rendered.html` references a cross-origin webfont, and which
 * mirrors that font (and Google Fonts' extensionless `css2` stylesheet) under its
 * own `assets/`. `mirror: false` builds the same bundle with nothing mirrored.
 */
function bundle(opts: { mirror?: boolean } = {}): string {
  const dir = tmp('ac1607-bundle-')
  writeFileSync(path.join(dir, 'rendered.html'), RENDERED_HTML)
  if (opts.mirror !== false) {
    mkdirSync(path.join(dir, 'assets'), { recursive: true })
    writeFileSync(path.join(dir, 'assets', 'alchemy.woff2'), FONT_BYTES)
    writeFileSync(path.join(dir, 'assets', 'css2'), MIRRORED_CSS)
  }
  return dir
}

interface Fetched {
  status: number
  body: string
  contentType: string
}

/** A real loopback GET. Uses node:http directly so no proxy env var intercepts it. */
function fetchPath(origin: string, p: string): Promise<Fetched> {
  const url = new URL(p, origin)
  return new Promise((resolve, reject) => {
    httpGet({ hostname: url.hostname, port: url.port, path: url.pathname + url.search }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c as Buffer))
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString('utf8'),
          contentType: String(res.headers['content-type'] ?? ''),
        }),
      )
    }).on('error', reject)
  })
}

const FAKE_SIGNALS: RawSignals = {
  viewport: { width: 1280, height: 800 },
  bands: [],
  colorUsage: [],
  fontFaces: [],
  typeScale: [],
  spacingScalePx: [],
  containerMaxWidthPx: 720,
  images: [],
}

/**
 * A fake browser seam that, on navigate, performs the fetches a real browser would:
 * the document, then each subresource the served document names. What it records is
 * exactly what a browser would have been able to load offline.
 */
class FetchingDriver implements BrowserDriver {
  document?: Fetched
  readonly subresources = new Map<string, Fetched>()
  async navigate(url: string): Promise<void> {
    const origin = new URL(url).origin
    this.document = await fetchPath(origin, '/')
    // Every root-relative reference the served document names — i.e. everything a
    // browser would resolve against this loopback origin rather than the network:
    // `href="/x"` / `src="/x"` attributes and CSS `url(/x)` references alike.
    const REFS = /(?:href|src)\s*=\s*["']?(\/[^\s"'>]+)|url\(\s*["']?(\/[^\s"')]+)/g
    for (const m of this.document.body.matchAll(REFS)) {
      const ref = m[1] ?? m[2]
      if (ref) this.subresources.set(ref, await fetchPath(origin, ref))
    }
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array()
  }
  async query<T>(): Promise<T> {
    return FAKE_SIGNALS as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return this.document?.body ?? ''
  }
  async close(): Promise<void> {}
  shotViewport?: Viewport
}

async function reextract(dir: string): Promise<FetchingDriver> {
  let driver!: FetchingDriver
  await reextractFromBundle(dir, {
    driverFactory: async () => {
      driver = new FetchingDriver()
      return driver
    },
  })
  return driver
}

describe('story-d5de22a5 — AC-1607 offline re-extract serves the mirrored faces', () => {
  it('test_UAT_AC1607_served_document_points_font_references_at_the_mirror', async () => {
    const driver = await reextract(bundle())
    const html = driver.document!.body

    // Neither mirrored absolute URL survives in the served document: offline, each
    // would be a fetch to an origin the loopback server cannot reach, and the
    // intended @font-face would simply never load.
    expect(html).not.toContain(FONT_URL)
    expect(html).not.toContain('fonts.googleapis.invalid')
    // Each is rewritten to the bundle's own copy, by basename.
    expect(html).toContain('/alchemy.woff2')
    expect(html).toContain('href="/css2"')

    // A URL the bundle does NOT mirror is left exactly as authored — no rewrite is
    // fabricated for a path the bundle does not carry, so it fails as honestly as
    // it did before.
    expect(html).toContain(UNMIRRORED_URL)
  })

  it('test_UAT_AC1607_the_rewritten_paths_actually_resolve_to_the_mirrored_bytes', async () => {
    // The rewrite is only worth anything if the path it points at serves the mirror.
    // This is the half the pure string test cannot reach.
    const driver = await reextract(bundle())

    const font = driver.subresources.get('/alchemy.woff2')
    expect(font, 'the served document named the mirrored font').toBeDefined()
    expect(font!.status).toBe(200)
    expect(font!.body).toBe(FONT_BYTES)

    // Google Fonts' stylesheet mirrors as an extensionless basename; a browser
    // rejects a stylesheet whose MIME is not text/css, so it must be served as CSS…
    const sheet = driver.subresources.get('/css2')
    expect(sheet!.status).toBe(200)
    expect(sheet!.contentType).toContain('text/css')
    // …and the rewrite applies inside that mirrored CSS too, so the @font-face src
    // it carries also points at the mirror rather than the dead origin.
    expect(sheet!.body).toContain('/alchemy.woff2')
    expect(sheet!.body).not.toContain(FONT_URL)
  })

  it('test_UAT_AC1607_a_bundle_mirroring_nothing_is_served_unchanged', async () => {
    // "Assert a bundle that mirrors no matching asset is served unchanged." Stated
    // over a whole document rather than one URL: with no `assets/` directory the
    // mirrored set is empty and the served bytes must equal the file on disk.
    const dir = bundle({ mirror: false })
    const driver = await reextract(dir)

    expect(driver.document!.body).toBe(readFileSync(path.join(dir, 'rendered.html'), 'utf8'))
    expect(driver.document!.body).toContain(FONT_URL)
    expect(driver.document!.body).toContain(SHEET_URL)
    // Nothing was rewritten, so the document names no loopback-relative subresource.
    expect(driver.subresources.size).toBe(0)
  })

  it('test_UAT_AC1607_rewriting_is_keyed_on_basename_and_touches_nothing_else', async () => {
    // The precision the "served unchanged" clause depends on, at the function the
    // server applies. A mirrored basename is rewritten wherever it appears; an
    // unmirrored one is untouched even when it sits in the same text.
    const mirrored = new Set(['alchemy.woff2'])
    const text = `a(${FONT_URL}) b(${UNMIRRORED_URL})`

    expect(rewriteMirroredRefs(text, mirrored)).toBe(`a(/alchemy.woff2) b(${UNMIRRORED_URL})`)
    // An empty mirror set is the identity — the property the bundle-level test above
    // relies on.
    expect(rewriteMirroredRefs(RENDERED_HTML, new Set())).toBe(RENDERED_HTML)
  })
})
