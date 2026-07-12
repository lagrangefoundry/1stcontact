import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  type Capture,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-52 — capture must resolve modern CSS colour formats.
 *
 * gigabytealchemy.ai is a Tailwind v4 site whose computed text `color` is
 * `oklch(...)`. The capture's colour resolver used an `rgb()`-only regex, so
 * every oklch run failed to parse, was flagged `colorInferred`, and fell back
 * to the `#000000` sentinel — 44 of 55 runs on that page. The values-diff then
 * suppressed colour entirely (inferred = low-confidence), so a real body-colour
 * gap was invisible. The fix paints each colour onto a 1x1 canvas and reads the
 * pixel, converting anything the browser understands (oklch/lab/lch/…) to real
 * sRGB bytes, while preserving the "fully transparent → inferred" contract.
 *
 * These drive a REAL headless Chromium against a committed fixture served from
 * an ephemeral loopback server — no third-party site is contacted.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** Parse `#rrggbb` → [r, g, b]. */
function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

describe('REQ-52 capture resolves oklch colours (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'req52-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req52-oklch.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-52_oklch_colour_resolved_not_inferred', () => {
    const els = flattenCapture(capture).elements
    const blue = els.find((e) => e.text.includes('OKLCH blue'))
    const slate = els.find((e) => e.text.includes('OKLCH slate'))
    expect(blue, 'oklch blue run present').toBeDefined()
    expect(slate, 'oklch slate run present').toBeDefined()

    // The core fix: an oklch colour is now resolvable — not flagged inferred and
    // not collapsed to the #000000 fallback.
    expect(blue?.colorInferred).toBeFalsy()
    expect(slate?.colorInferred).toBeFalsy()
    expect(blue?.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(slate?.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(slate?.color).not.toBe('#000000')
  })

  itB('test_UAT_FC_REQ-52_oklch_conversion_directionally_correct', () => {
    const els = flattenCapture(capture).elements
    const blue = els.find((e) => e.text.includes('OKLCH blue'))
    const slate = els.find((e) => e.text.includes('OKLCH slate'))
    // A blue oklch must paint a blue-dominant pixel (b greater than r and g),
    // proving the conversion is correct in direction, not arbitrary bytes.
    const [br, bg, bb] = channels(blue!.color)
    expect(bb, 'blue channel dominates').toBeGreaterThan(br)
    expect(bb, 'blue channel dominates').toBeGreaterThan(bg)
    // The slate body colour is dark (perceptually near-black) but not pure black.
    const [sr, sg, sb] = channels(slate!.color)
    expect(Math.max(sr, sg, sb), 'slate is dark').toBeLessThan(128)
    expect(sr + sg + sb, 'slate is not literally black').toBeGreaterThan(0)
  })

  itB('test_UAT_FC_REQ-52_transparent_still_inferred', () => {
    // Regression guard: a genuinely transparent fill (alpha 0) must remain
    // low-confidence, exactly as before — the canvas resolver returns null and
    // the run is flagged inferred.
    const els = flattenCapture(capture).elements
    const ghost = els.find((e) => e.text.includes('Transparent ghost'))
    expect(ghost, 'ghost run present').toBeDefined()
    expect(ghost?.colorInferred).toBe(true)
  })
})

// ── local fixture server (mirrors capture.test.ts / req35) ───────────────────

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
