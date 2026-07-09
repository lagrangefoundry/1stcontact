import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromiumAvailable, cmdCapturePage, flattenCapture, type Capture } from '../tools/generate/src/cli'

/**
 * UATs for REQ-36 (round 6) — the capture pipeline settles below-fold
 * lazy/animated content before the screenshot, so `screenshot.full.png` and
 * every downstream pixel gate include the whole page rather than blank slots.
 *
 * Root cause of the round-5 blind spots (wrong card image, missing quote-band
 * portrait, missing "How It Works" text box): `reducedMotion:'reduce'` freezes
 * motion but not the *triggers* — Elementor lazy images and `fadeIn` blocks stay
 * unrequested / `.elementor-invisible` until their IntersectionObserver fires on
 * scroll, and the page was never scrolled. `settlePage()` closes that.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const driverSrc = readFileSync(
  fileURLToPath(new URL('../tools/generate/src/cli/capture/playwright-driver.ts', import.meta.url)),
  'utf8',
)

// ── Part A: source-level guarantees (browser-free, always run) ────────────────

describe('REQ-36 capture settle — driver behaviour', () => {
  it('test_UAT_FC_REQ-36_capture_settles_before_response_drain', () => {
    // The settle must run inside open(), before the response-drain loop, so
    // lazy subresources requested during the scroll mirror into the bundle.
    const settleAt = driverSrc.indexOf('this.settlePage()')
    const drainAt = driverSrc.indexOf('for (const resp of pending)')
    expect(settleAt).toBeGreaterThan(-1)
    expect(drainAt).toBeGreaterThan(-1)
    expect(settleAt).toBeLessThan(drainAt)
  })

  it('test_UAT_FC_REQ-36_capture_settle_reveals_animated_and_promotes_lazy', () => {
    // Reveals Elementor's pre-animation hidden state so `fadeIn` text is not
    // captured at opacity 0.
    expect(driverSrc).toMatch(/\.elementor-invisible\{[^}]*visibility:visible!important/)
    expect(driverSrc).toMatch(/animation-duration:0s!important/)
    // Scrolls the full height to trip lazy-load / entrance observers.
    expect(driverSrc).toMatch(/scrollTo\(0, y\)/)
    expect(driverSrc).toMatch(/document\.body\.scrollHeight/)
    // Promotes residual lazy images to eager and waits for them to decode.
    expect(driverSrc).toMatch(/img\.loading = 'eager'/)
    expect(driverSrc).toMatch(/img\.complete/)
    expect(driverSrc).toMatch(/waitForLoadState\('networkidle'\)/)
  })
})

// ── Part B: the capture actually reveals below-fold content (real Chromium) ────

describe('REQ-36 capture reveals below-fold lazy/animated content (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (await chromiumAvailable()) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'req36-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req36-lazy.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  const itB = (name: string, fn: () => void) =>
    it(name, () => {
      if (!capture) return // Chromium unavailable — skip silently
      fn()
    })

  itB('test_UAT_FC_REQ-36_capture_below_fold_fadein_text_is_present', () => {
    // The "How it works" heading is inside a `.elementor-invisible` block far
    // below the fold. Pre-fix (no scroll, observer never fires) it stays hidden
    // and never enters the projection; the settle step reveals it.
    const heading = flattenCapture(capture!).elements.find((e) => e.text === 'How it works')
    expect(heading, 'below-fold fadeIn heading present in capture').toBeDefined()
    expect(heading?.box?.height ?? 0).toBeGreaterThan(0)
  })

  itB('test_UAT_FC_REQ-36_capture_below_fold_lazy_image_is_present', () => {
    // The lazy image below the fold is requested only once scrolled into view.
    const imgs = flattenCapture(capture!).elements.filter(
      (e) => e.accessibleName === 'lazy chef photo' || e.a11yRole === 'img',
    )
    expect(imgs.length, 'below-fold lazy image present in capture').toBeGreaterThan(0)
  })
})

// ── local static file server for the fixture bundle ───────────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
}

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
