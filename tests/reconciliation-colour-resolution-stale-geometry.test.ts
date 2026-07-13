import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM, VirtualConsole } from 'jsdom'
import {
  chromiumAvailable,
  cmdCapturePage,
  diffManifests,
  EXTRACT_SCRIPT,
  flattenCapture,
  formatReport,
  type Capture,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-79e068e5 — capture/diff blind-spot fixes:
 * modern-CSS colour resolution and stale-reference geometry flagging (REQ-52,
 * commits 4b0282b4 and 3cd464e7).
 *
 * Two capabilities are proven here:
 *   (a) The capture colour resolver paints any browser-understood computed colour
 *       — including oklch/lab/lch/color() — onto a 1×1 canvas and reads back real
 *       sRGB bytes, so modern formats resolve to an accurate `#rrggbb` instead of
 *       the `#000000` colour-inferred sentinel, while genuinely transparent /
 *       unpaintable colours still fall back to that sentinel, and plain rgb()/
 *       rgba() still resolve where no 2D canvas exists (the jsdom fallback).
 *   (b) The values-diff flags box geometry present on exactly one side of a pair
 *       as a mismatch (never a silent OK), and the report prints a loud
 *       STALE-REFERENCE warning counting the reference objects with no geometry.
 *
 * Colour capture drives a REAL headless Chromium against a committed fixture
 * served from an ephemeral loopback server — no third-party site is contacted.
 * The canvas-less fallback and the geometry/report checks are browser-free.
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

// ── AC-589 / AC-590: modern-CSS colour resolution (real Chromium) ─────────────

describe('story-79e068e5 — capture resolves modern-CSS colours', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'story79-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req52-oklch.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_AC589_modern_css_colours_resolve_to_srgb_hex_not_inferred', () => {
    // AC-589: an oklch() text colour resolves to an accurate #rrggbb (its true
    // rendered sRGB), is NOT flagged colour-inferred, and the resulting comparison
    // surfaces a colour delta against a reproduction authoring a different colour —
    // the previously-hidden gap the #000000 sentinel + inferred-suppression buried.
    const expected = flattenCapture(capture)
    const blue = expected.elements.find((e) => e.text.includes('OKLCH blue'))
    const slate = expected.elements.find((e) => e.text.includes('OKLCH slate'))
    expect(blue, 'oklch blue run present').toBeDefined()
    expect(slate, 'oklch slate run present').toBeDefined()

    // Resolved to real sRGB — not the sentinel, not flagged inferred.
    expect(blue!.colorInferred).toBeFalsy()
    expect(slate!.colorInferred).toBeFalsy()
    expect(blue!.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(slate!.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(slate!.color).not.toBe('#000000')
    // Conversion is directionally correct: a blue oklch paints a blue-dominant
    // pixel; the slate body is dark but not literally black.
    const [br, bg, bb] = channels(blue!.color)
    expect(bb).toBeGreaterThan(br)
    expect(bb).toBeGreaterThan(bg)
    const [sr, sg, sb] = channels(slate!.color)
    expect(Math.max(sr, sg, sb), 'slate is dark').toBeLessThan(128)
    expect(sr + sg + sb, 'slate is not literally black').toBeGreaterThan(0)

    // A now-observable colour delta: change the slate colour in the reproduction
    // and the diff emits a `color` delta — it would have been suppressed had the
    // resolved reference stayed the low-confidence inferred sentinel.
    const actual: ValueManifest = {
      ...expected,
      source: 'draft:story79',
      elements: expected.elements.map((e) =>
        e.text.includes('OKLCH slate') ? { ...e, color: '#ff0000' } : e,
      ),
    }
    const report = diffManifests(expected, actual)
    const colourDelta = report.deltas.find(
      (d) => d.property === 'color' && d.text.includes('OKLCH slate'),
    )
    expect(colourDelta, 'resolved colour surfaces a comparison delta').toBeDefined()
    expect(colourDelta!.actual).toBe('#ff0000')
  })

  itB('test_UAT_AC590_transparent_colour_falls_back_to_sentinel_and_is_inferred', () => {
    // AC-590: a fully-transparent computed colour cannot resolve to an opaque
    // value, so the captured colour is the #000000 sentinel and the run is flagged
    // colour-inferred (low confidence) — preserving the prior transparent→inferred
    // contract. Contrast with a resolvable run whose flag is false.
    const els = flattenCapture(capture).elements
    const ghost = els.find((e) => e.text.includes('Transparent ghost'))
    const slate = els.find((e) => e.text.includes('OKLCH slate'))
    expect(ghost, 'ghost run present').toBeDefined()
    expect(ghost!.color).toBe('#000000')
    expect(ghost!.colorInferred).toBe(true)
    // The resolvable neighbour is NOT inferred — the sentinel is reserved for the
    // genuinely-unresolvable case, not applied wholesale.
    expect(slate!.colorInferred).toBeFalsy()
  })
})

// ── AC-591: rgb()/rgba() resolve without a rendering surface (jsdom) ───────────

describe('story-79e068e5 — colour resolution degrades gracefully without a canvas', () => {
  it('test_UAT_AC591_rgb_colours_resolve_to_hex_without_a_rendering_surface', () => {
    // AC-591: jsdom offers no 2D canvas (getContext('2d') → null), so the resolver
    // takes its legacy rgb()/rgba() regex fallback. A standard rgb() colour still
    // resolves to its #rrggbb, and a zero-alpha rgba() still yields the #000000
    // sentinel with the inferred flag set — colour resolution degrades gracefully
    // rather than failing wholesale when the primary paint path is absent.
    const html = `<!doctype html><html><body>
      <section style="background:#ffffff">
        <p style="color: rgb(49, 65, 88)">Slate body run</p>
        <p style="color: rgba(0, 0, 0, 0)">Transparent ghost run</p>
      </section></body></html>`
    // Swallow jsdom's "Not implemented: getContext" notice — it is expected here
    // (it is exactly what forces the canvas-less fallback) and not a failure.
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
    })
    const win = dom.window as unknown as { eval(s: string): unknown }
    const doc = dom.window.document
    // Confirm the precondition: no 2D rendering surface is available in this env.
    expect(doc.createElement('canvas').getContext('2d')).toBeNull()

    const R = (x: number, y: number, w: number, h: number) =>
      ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
    const rects = new Map<Element, ReturnType<typeof R>>()
    const put = (sel: string, r: ReturnType<typeof R>) => rects.set(doc.querySelector(sel)!, r)
    put('section', R(0, 0, 1280, 400))
    put('p:nth-of-type(1)', R(64, 48, 400, 24))
    put('p:nth-of-type(2)', R(64, 96, 400, 24))
    dom.window.Element.prototype.getBoundingClientRect = function () {
      return (rects.get(this) ?? R(64, 200, 200, 24)) as unknown as DOMRect
    }
    // jsdom reports scrollWidth/Height 0, which the visibility gate reads as
    // off-screen; give the document a real extent so the runs are captured.
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

    const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
    const runs = signals.bands.flatMap((b) => b.content)
    const slate = runs.find((r) => r.text.includes('Slate body'))
    const ghost = runs.find((r) => r.text.includes('Transparent ghost'))
    expect(slate, 'slate run captured').toBeDefined()
    expect(ghost, 'ghost run captured').toBeDefined()

    // rgb(49, 65, 88) → #314158, resolved without a canvas and not flagged inferred.
    expect(slate!.color).toBe('#314158')
    expect(slate!.colorInferred).toBeFalsy()
    // A zero-alpha rgba() is unresolvable → the #000000 sentinel, flagged inferred.
    expect(ghost!.color).toBe('#000000')
    expect(ghost!.colorInferred).toBe(true)
  })
})

// ── AC-592 / AC-593: stale-reference geometry flagging (browser-free) ─────────

describe('story-79e068e5 — value-diff flags one-sided box geometry', () => {
  const el = (over: Partial<ValueElement>): ValueElement => ({
    text: 'A Different Approach',
    role: 'heading',
    color: '#000000',
    fontFamily: 'ui-sans-serif',
    fontSizePx: 36,
    fontWeight: 700,
    ...over,
  })
  const manifest = (source: string, element: ValueElement): ValueManifest => ({
    source,
    elements: [element],
    sections: [],
  })
  const box = { x: 108, y: 800, width: 900, height: 43 }
  const boxParam = (report: ReturnType<typeof diffManifests>) =>
    report.objects[0]?.params.find((p) => p.name === 'box')

  it('test_UAT_AC592_one_sided_box_geometry_is_flagged_not_silently_passed', () => {
    // AC-592: when box geometry is present on exactly one side of a pair the two
    // sides were never actually compared, so `box` must read as a mismatch — never
    // a silent OK. Both skew directions flag; a genuine both-sided comparison does
    // not false-flag.

    // Reference (stale) carries no box, reproduction does → mismatch.
    const staleRef = diffManifests(
      manifest('ref:stale', el({})),
      manifest('draft:x', el({ box: { ...box } })),
    )
    const staleBox = boxParam(staleRef)
    expect(staleBox?.expected).toBe('—')
    expect(staleBox?.actual).not.toBe('—')
    expect(staleBox?.mismatch, 'ref-missing-box flags').toBe(true)

    // The reverse skew — reference has geometry, reproduction has none → mismatch.
    const missingRepro = diffManifests(
      manifest('ref:fresh', el({ box: { ...box } })),
      manifest('draft:x', el({})),
    )
    const reverseBox = boxParam(missingRepro)
    expect(reverseBox?.expected).not.toBe('—')
    expect(reverseBox?.actual).toBe('—')
    expect(reverseBox?.mismatch, 'repro-missing-box flags').toBe(true)

    // Guard: both sides carry matching geometry → a real comparison, no false flag.
    const bothMatch = diffManifests(
      manifest('ref:fresh', el({ box: { ...box } })),
      manifest('draft:x', el({ box: { ...box } })),
    )
    expect(boxParam(bothMatch)?.mismatch, 'matching boxes are not flagged').toBe(false)
  })

  it('test_UAT_AC593_report_prints_loud_stale_reference_warning_with_count', () => {
    // AC-593: when paired reference objects carry no box geometry while their
    // reproduction matches do, the rendered report includes a prominent
    // STALE-REFERENCE warning stating the count and advising a re-capture because
    // position/width is not being verified. Absent when every object has geometry.
    const staleReport = diffManifests(
      manifest('ref:stale', el({})),
      manifest('draft:x', el({ box: { ...box } })),
    )
    const staleText = formatReport(staleReport)
    expect(staleText).toContain('STALE REFERENCE')
    expect(staleText).toContain('1 reference object(s) carry no box geometry')
    expect(staleText).toContain('re-capture the bundle')
    expect(staleText).toContain('position/width is NOT being verified')

    // A reference whose objects all carry geometry → no STALE-REFERENCE warning.
    const freshReport = diffManifests(
      manifest('ref:fresh', el({ box: { ...box } })),
      manifest('draft:x', el({ box: { ...box } })),
    )
    expect(formatReport(freshReport)).not.toContain('STALE REFERENCE')
  })
})

// ── local fixture server (mirrors req52-oklch-colour.test.ts) ─────────────────

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
