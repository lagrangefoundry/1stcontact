import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  bundleDirFor,
  chromiumAvailable,
  cmdCapturePage,
  reextractFromBundle,
  runCapturePipeline,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type ContentRun,
  type RawSignals,
} from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UATs for story-8f33f14c (REQ-12) — rendered-only reference
 * capture ([[DOC-13]]). One UAT per acceptance criterion (AC-459..AC-468),
 * asserting against the existing implementation at its external boundaries:
 * the `1c capture page` command (`cmdCapturePage`), the capture pipeline
 * (`runCapturePipeline`), and offline re-extraction (`reextractFromBundle`).
 *
 * The fidelity tests drive a REAL headless Chromium (via the Playwright driver)
 * against a committed golden fixture set served from an ephemeral loopback HTTP
 * server — no third-party site is ever contacted, and real HTTP responses mean
 * the intercept-and-cache path is genuinely exercised. Only the seam and
 * failure tests use a fake driver, to prove the CF-shaped BrowserDriver is
 * swappable and that there is no static fallback.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
}

/** Serve a directory over 127.0.0.1:0 (ephemeral); returns its origin + closer. */
async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** Every content run in a capture: band content + flattened item content. */
const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── shared golden capture: capture rich.html once, assert against it ──────────
let server: { origin: string; close: () => Promise<void> }
let cwd: string
let rich: Capture
let richBundleDir: string

beforeAll(async () => {
  server = await serveDir(FIXTURES)
  if (browserOk) {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac-capture-'))
    const res = await cmdCapturePage(`${server.origin}/rich.html`, { cwd })
    rich = res.capture
    richBundleDir = res.bundleDir
  }
}, 120000)

afterAll(async () => {
  await server?.close()
  if (cwd) rmSync(cwd, { recursive: true, force: true })
})

describe('1c capture page — rendered-only reference capture (story-8f33f14c / REQ-12)', () => {
  // AC-459 — capturing a page writes a complete self-contained bundle.
  itB('test_UAT_AC459_capture_writes_complete_self_contained_bundle', () => {
    expect(richBundleDir).toBe(bundleDirFor(cwd, { host: '127.0.0.1', path: '/rich.html' }))
    for (const f of ['capture.json', 'screenshot.full.png', 'rendered.html', 'raw.html']) {
      expect(existsSync(path.join(richBundleDir, f)), `${f} present`).toBe(true)
    }
    // Real PNG magic bytes — a genuine screenshot, not a stub.
    const sig = [...readFileSync(path.join(richBundleDir, 'screenshot.full.png')).subarray(0, 8)]
    expect(sig).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    // Every subresource mirrored: css, image, font all present under assets/.
    const assets = readdirSync(path.join(richBundleDir, 'assets'))
    expect(assets).toContain('theme.css')
    expect(assets).toContain('hero.png')
    expect(assets).toContain('heading-font.ttf')
    // The essence lists at least those mirrored assets.
    expect(rich.assets.length).toBeGreaterThanOrEqual(3)
  })

  // AC-460 — theme colors are the painted values with var() resolved.
  itB('test_UAT_AC460_theme_colors_are_painted_with_var_resolved', () => {
    // --brand: #1a73e8 is consumed only via var(); the painted hex must appear…
    const hexes = rich.theme.colors.map((c) => c.hex)
    expect(hexes).toContain('#1a73e8')
    // …and no unresolved var() reference may survive anywhere in the essence.
    expect(JSON.stringify(rich)).not.toContain('var(')
  })

  // AC-461 — section background images captured with their text-over overlay.
  itB('test_UAT_AC461_section_background_image_captured_with_overlay', () => {
    // The hero band is the first (dark) section; its bg image is applied by JS.
    const hero = rich.sections[0]
    expect(hero.background.kind).toBe('image')
    expect(hero.background.image).toMatch(/hero\.png$/)
    expect(hero.background.overlay).toBeDefined()
    expect(hero.background.overlay?.opacity).toBeCloseTo(0.55, 2)
    expect(hero.layout.textOverImage).toBe(true)
  })

  // AC-462 — hidden content is excluded from the capture.
  itB('test_UAT_AC462_hidden_content_is_excluded', () => {
    // display:none content and the off-screen drawer must be absent entirely.
    const json = JSON.stringify(rich)
    expect(json).not.toContain('SECRET_HIDDEN_DISPLAY_NONE')
    expect(json).not.toContain('SECRET_DRAWER_REGION_PICKER')
  })

  // AC-463 — visible text is captured verbatim with its exact painted styling.
  itB('test_UAT_AC463_visible_text_verbatim_with_painted_styling', () => {
    const runs = allRuns(rich)
    const texts = runs.map((r) => r.text)
    for (const expected of [
      'Bright Harbor Studio',
      'Design that ships on time',
      'What we do',
      'We craft calm, fast websites for small teams.',
      'Strategy',
      'Positioning and messaging.',
      'Build',
    ]) {
      expect(texts, `verbatim: ${expected}`).toContain(expected)
    }
    // Each run carries its own exact painted styling.
    const h1 = runs.find((r) => r.text === 'Bright Harbor Studio')
    expect(h1?.fontSizePx).toBe(44)
    expect(h1?.fontFamily).toBe('GoldHead')
    const h2 = runs.find((r) => r.text === 'What we do')
    expect(h2?.color).toBe('#1a73e8')
    expect(h2?.fontSizePx).toBe(32)
  })

  // AC-464 — pages are segmented into sections by style signature.
  itB('test_UAT_AC464_pages_segmented_by_style_signature', async () => {
    // Two style bands (dark image hero + light color content) → two segments.
    expect(rich.sections).toHaveLength(2)
    expect(rich.sections[0].background.kind).toBe('image')
    expect(rich.sections[1].background.kind).toBe('color')
    // A uniformly-styled page → exactly one segment.
    const uniformCwd = mkdtempSync(path.join(tmpdir(), 'ac-capture-u-'))
    try {
      const { capture } = await cmdCapturePage(`${server.origin}/uniform.html`, { cwd: uniformCwd })
      expect(capture.sections).toHaveLength(1)
    } finally {
      rmSync(uniformCwd, { recursive: true, force: true })
    }
  }, 60000)

  // AC-465 — post-JS rendered HTML and original raw HTML are both retained.
  itB('test_UAT_AC465_rendered_and_raw_html_both_retained', () => {
    const rendered = readFileSync(path.join(richBundleDir, 'rendered.html'), 'utf8')
    const raw = readFileSync(path.join(richBundleDir, 'raw.html'), 'utf8')
    // Post-JS DOM has the visible headline and the JS-applied inline background…
    expect(rendered).toContain('Bright Harbor Studio')
    expect(rendered).toContain('background-image')
    // …while the original server response painted neither the applied CSS: the
    // headline is present but `background-image` is absent from raw HTML — the
    // exact static blindness DOC-13 defeats.
    expect(raw).toContain('Bright Harbor Studio')
    expect(raw).not.toContain('background-image')
  })

  // AC-466 — a written bundle can be re-extracted offline with no network.
  itB('test_UAT_AC466_bundle_reextracts_offline_with_no_network', async () => {
    // Capture from a throwaway server, shut it down, then re-extract from the
    // bundle alone — proving the bundle is self-contained (no network).
    const local = await serveDir(FIXTURES)
    const reCwd = mkdtempSync(path.join(tmpdir(), 'ac-capture-r-'))
    try {
      const { bundleDir } = await cmdCapturePage(`${local.origin}/rich.html`, { cwd: reCwd })
      await local.close() // original site is now unreachable
      const result = await reextractFromBundle(bundleDir)
      // Same essence re-derived offline: resolved brand hex, an image-backed
      // first section, and the verbatim headline all survive.
      expect(result.capture.theme.colors.map((c) => c.hex)).toContain('#1a73e8')
      expect(result.capture.sections[0].background.kind).toBe('image')
      const texts = allRuns(result.capture).map((r) => r.text)
      expect(texts).toContain('Bright Harbor Studio')
    } finally {
      rmSync(reCwd, { recursive: true, force: true })
    }
  }, 120000)

  // AC-467 — capture runs against an injectable browser driver.
  it('test_UAT_AC467_capture_runs_against_injectable_driver', async () => {
    // A fake BrowserDriver — no real browser — proves the CF-shaped seam is
    // genuinely swappable and produces a correct essence from injected signals.
    const signals: RawSignals = {
      viewport: { width: 800, height: 600 },
      bands: [
        {
          box: { x: 0, y: 0, width: 800, height: 300 },
          backgroundColor: '#101820',
          backgroundImage: 'none',
          colorScheme: 'dark',
          fontFamily: 'Inter',
          textAlign: 'center',
          paddingTopPx: 40,
          paddingBottomPx: 40,
          content: [
            { role: 'heading', text: 'Fake Hero', color: '#ffffff', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 700 },
          ],
          items: [],
        },
      ],
      colorUsage: [
        { hex: '#ffffff', usage: 'text', freq: 1 },
        { hex: '#101820', usage: 'background', freq: 1 },
      ],
      fontFaces: [],
      typeScale: [40],
      spacingScalePx: [40],
      containerMaxWidthPx: 720,
      images: [],
    }
    class FakeDriver implements BrowserDriver {
      async navigate(): Promise<void> {}
      async screenshot(): Promise<Uint8Array> {
        return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
      }
      async query<T>(): Promise<T> {
        return signals as T
      }
      responses(): CapturedResponse[] {
        return []
      }
      async content(): Promise<string> {
        return '<html><body>Fake Hero</body></html>'
      }
      async close(): Promise<void> {}
    }

    let created = 0
    const result = await runCapturePipeline('http://example.test/', {
      driverFactory: async () => {
        created++
        return new FakeDriver()
      },
    })

    // The driver factory is invoked exactly once for a successful capture…
    expect(created).toBe(1)
    // …and the essence reflects the injected signals: host from the URL, one
    // section, the injected background color, and the injected content in HTML.
    expect(result.capture.host).toBe('example.test')
    expect(result.capture.sections).toHaveLength(1)
    expect(result.capture.theme.colors.map((c) => c.hex)).toContain('#101820')
    expect(result.renderedHtml).toContain('Fake Hero')
  })

  // AC-468 — browser failure retries then errors, never falling back to static.
  it('test_UAT_AC468_browser_failure_retries_then_errors_no_static_fallback', async () => {
    const url = 'http://example.test/always-fails'
    let attempts = 0
    class FailingDriver implements BrowserDriver {
      async navigate(): Promise<void> {
        throw new Error('navigation boom')
      }
      async screenshot(): Promise<Uint8Array> {
        return new Uint8Array()
      }
      async query<T>(): Promise<T> {
        return {} as T
      }
      responses(): CapturedResponse[] {
        return []
      }
      async content(): Promise<string> {
        return ''
      }
      async close(): Promise<void> {}
    }

    let captured: unknown
    let error: unknown
    try {
      captured = await runCapturePipeline(url, {
        retries: 2, // → 3 total attempts
        driverFactory: async () => {
          attempts++
          return new FailingDriver()
        },
      })
    } catch (err) {
      error = err
    }

    // It never silently degrades to a static path — no capture result returned.
    expect(captured).toBeUndefined()
    // It retried: more than one attempt was made (3, for retries=2).
    expect(attempts).toBe(3)
    // It rejected with an error naming the target URL and the attempt count.
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain(url)
    expect((error as Error).message).toContain('3 attempt(s)')
  })
})
