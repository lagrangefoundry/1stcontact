/**
 * Capture-side gradient fidelity — the two axes where `1c capture` can be
 * silently wrong in a way the diff cannot detect.
 *
 *   AC-1307 (REQ-72) — every colour token inside a captured gradient is resolved
 *     IN THE BROWSER to a `#rrggbb` literal before the TS-side `normalizeGradient`
 *     parses the stops. Without it the stop regex (`#hex`/`rgb()` only) matches
 *     nothing, the gradient captures as direction-only (`135° []`), and that empty
 *     axis reads as a clean match against any reproduction.
 *   AC-1308 (REQ-62) — the recorded `surfaceGradient` is the NEAREST painting
 *     ancestor's, skipping a `background-clip: text` ancestor and stopping at the
 *     first opaque solid. Pick the wrong ancestor and both sides agree on a value
 *     that is not what paints.
 *
 * Boundary: every case runs the real `EXTRACT_SCRIPT` — the exact in-page script
 * Chromium evaluates — over a jsdom DOM with layout stubbed per element (the
 * BUG-15 / REQ-63 harness), then projects it through the real `flattenSignals`.
 * Nothing is mocked: the walk, the probe-element colour resolution and the stop
 * normalisation are the shipped code paths.
 *
 * One case needs a real engine: only a real browser resolves `oklch()`/`color-mix()`
 * (jsdom's `getComputedStyle` returns a modern-colour-space token verbatim), so the
 * oklch half of AC-1307 is browser-gated and skips where no Chromium is present.
 * The rgb()-token half below is engine-independent and always runs, so AC-1307
 * contributes assertions in a headless run.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  flattenSignals,
  type Capture,
  type RawSignals,
  type ValueElement,
} from '../tools/generate/src/cli'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const cls = (this as Element).className || ''
    const b = boxByClass[cls]
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/** Every captured run, raw (pre-normalisation) — carries the gradient CSS verbatim. */
interface RawGradientRun {
  text: string
  gradientCss?: string | null
  surfaceGradientCss?: string | null
}
const rawRuns = (s: RawSignals): RawGradientRun[] =>
  s.bands.flatMap((b) => b.content) as unknown as RawGradientRun[]
const rawRun = (s: RawSignals, sub: string): RawGradientRun => {
  const r = rawRuns(s).find((x) => x.text.includes(sub))
  expect(r, `raw run containing "${sub}" captured`).toBeDefined()
  return r as RawGradientRun
}
/** The same runs projected through the real values pipeline (normalised gradients). */
const el = (s: RawSignals, sub: string): ValueElement => {
  const e = flattenSignals(s, 'ref').elements.find((x) => x.text.includes(sub))
  expect(e, `projected element containing "${sub}" present`).toBeDefined()
  return e as ValueElement
}

// ── AC-1307 — gradient stop colours are hexified in-browser ──────────────────

describe('AC-1307 — gradient stop colours resolve to #rrggbb at capture time', () => {
  /**
   * A panel gradient and a text-fill wordmark gradient, both authored in a colour
   * format `normalizeGradient`'s stop regex cannot read on its own. `rgb()` stands
   * in for the modern spaces here because it is the one non-hex form jsdom's
   * `getComputedStyle` resolves — the browser-gated case below runs the same
   * assertions over real `oklch()`/`color-mix()` stops.
   */
  const NON_HEX = [
    '<!doctype html><html><body>',
    '<section class="band" style="background-color: rgb(232, 223, 211)">',
    '<div class="panel" style="background-image: linear-gradient(135deg, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 100%)">',
    '<p class="run">What We are exploring</p>',
    '<h1 class="wordmark" style="background-image: linear-gradient(90deg, rgb(255, 140, 66) 0%, rgb(255, 107, 53) 100%); background-clip: text">Gigabyte Alchemy</h1>',
    '</div></section></body></html>',
  ].join('')

  const BOXES: Record<string, Box> = {
    band: [0, 0, 1280, 400],
    panel: [40, 40, 1200, 320],
    run: [60, 60, 600, 48],
    wordmark: [60, 140, 600, 64],
  }

  it('test_UAT_AC1307_non_hex_stops_capture_as_hex_in_painted_order', () => {
    const sig = extract(NON_HEX, BOXES)

    // The panel surface gradient: stops populated, in painted order, each #rrggbb.
    expect(el(sig, 'exploring').surfaceGradient?.stops).toEqual([
      { color: '#f1f5f9', position: 0 },
      { color: '#e2e8f0', position: 100 },
    ])
    // The resolution applies to BOTH captured declarations — the text-fill
    // (background-clip: text) gradient is hexified by the same path.
    expect(el(sig, 'Gigabyte Alchemy').gradient?.stops).toEqual([
      { color: '#ff8c42', position: 0 },
      { color: '#ff6b35', position: 100 },
    ])
  })

  it('test_UAT_AC1307_direction_and_stop_positions_are_left_untouched', () => {
    const sig = extract(NON_HEX, BOXES)

    // Only colour TOKENS are rewritten: the raw captured CSS keeps its direction
    // and its stop offsets byte-for-byte, with the colours swapped in place.
    expect(rawRun(sig, 'exploring').surfaceGradientCss).toBe(
      'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    )
    expect(rawRun(sig, 'Gigabyte Alchemy').gradientCss).toBe(
      'linear-gradient(90deg, #ff8c42 0%, #ff6b35 100%)',
    )
    // …and the direction survives normalisation as the captured angle.
    expect(el(sig, 'exploring').surfaceGradient?.angleDeg).toBe(135)
    expect(el(sig, 'Gigabyte Alchemy').gradient?.angleDeg).toBe(90)
  })

  it('test_UAT_AC1307_already_hex_stops_and_non_gradients_pass_through_unchanged', () => {
    const html = [
      '<!doctype html><html><body>',
      '<section class="band" style="background-color: rgb(232, 223, 211)">',
      '<div class="panel" style="background-image: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)">',
      '<p class="run">Already hex</p>',
      '</div>',
      '<div class="plain" style="background-color: rgb(255, 255, 255)"><p class="prun">No gradient here</p></div>',
      '</section></body></html>',
    ].join('')
    const sig = extract(html, {
      band: [0, 0, 1280, 400],
      panel: [40, 40, 1200, 160],
      run: [60, 60, 600, 48],
      plain: [40, 220, 1200, 160],
      prun: [60, 240, 600, 48],
    })

    // An already-parseable `#hex` gradient is captured verbatim…
    expect(rawRun(sig, 'Already hex').surfaceGradientCss).toBe(
      'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    )
    expect(el(sig, 'Already hex').surfaceGradient?.stops).toEqual([
      { color: '#f1f5f9', position: 0 },
      { color: '#e2e8f0', position: 100 },
    ])
    // …and a declaration that is not a gradient is not rewritten into one.
    expect(el(sig, 'No gradient here').surfaceGradient ?? null).toBeNull()
  })
})

// ── AC-1307 — the same claim over real modern colour spaces (real engine) ─────

describe('AC-1307 — modern colour spaces, real Chromium capture', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'req72-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/gradient-oklch.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  itB('test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex', () => {
    const elements = flattenCapture(capture).elements
    const panelRun = elements.find((e) => e.text.includes('Exploring'))
    expect(panelRun, 'panel body run present').toBeDefined()

    // The panel gradient is authored in oklch(); pre-REQ-72 it captured as
    // `135° []` — an empty stop list that matches ANY reproduction.
    const surfaceStops = panelRun?.surfaceGradient?.stops ?? []
    expect(surfaceStops.length).toBe(2)
    for (const s of surfaceStops) expect(s.color).toMatch(/^#[0-9a-f]{6}$/)
    // Direction and the authored stop offsets survive the resolution untouched.
    expect(panelRun?.surfaceGradient?.angleDeg).toBe(135)
    expect(surfaceStops.map((s) => s.position)).toEqual([0, 100])

    // The text-fill (background-clip: text) declaration is resolved by the same
    // path — the AC requires BOTH captured declarations, not just the surface.
    const wm = elements.find((e) => e.text === 'Gigabyte Alchemy')
    expect(wm, 'wordmark run present').toBeDefined()
    const textStops = wm?.gradient?.stops ?? []
    expect(textStops.length).toBe(2)
    for (const s of textStops) expect(s.color).toMatch(/^#[0-9a-f]{6}$/)
  })
})

// ── AC-1308 — which ancestor's gradient is recorded ──────────────────────────

describe('AC-1308 — the captured surface gradient is the nearest painting ancestor′s', () => {
  const OUTER = 'linear-gradient(90deg, rgb(1, 2, 3) 0%, rgb(4, 5, 6) 100%)'
  const INNER = 'linear-gradient(135deg, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 100%)'

  it('test_UAT_AC1308_nearest_gradient_ancestor_wins', () => {
    const sig = extract(
      '<!doctype html><html><body>' +
        '<section class="band" style="background-color: rgb(232, 223, 211)">' +
        `<div class="outer" style="background-image: ${OUTER}">` +
        `<div class="inner" style="background-image: ${INNER}">` +
        '<p class="run">Nested panels</p>' +
        '</div></div></section></body></html>',
      { band: [0, 0, 1280, 400], outer: [20, 20, 1240, 360], inner: [40, 40, 1200, 320], run: [60, 60, 600, 48] },
    )
    // The INNER panel is what paints behind the run; the outer one never shows.
    expect(el(sig, 'Nested panels').surfaceGradient).toEqual({
      angleDeg: 135,
      stops: [
        { color: '#f1f5f9', position: 0 },
        { color: '#e2e8f0', position: 100 },
      ],
    })
  })

  it('test_UAT_AC1308_text_fill_ancestor_is_skipped_not_recorded_as_a_surface', () => {
    // The wordmark's own gradient is clipped to its glyphs — it is that run's text
    // paint (captured separately as `gradient`), never the surface behind it. The
    // walk must pass over it and record the panel underneath.
    const sig = extract(
      '<!doctype html><html><body>' +
        '<section class="band" style="background-color: rgb(232, 223, 211)">' +
        `<div class="inner" style="background-image: ${INNER}">` +
        '<h1 class="wordmark" style="background-image: linear-gradient(90deg, rgb(255, 140, 66) 0%, rgb(255, 107, 53) 100%); background-clip: text">Gigabyte Alchemy</h1>' +
        '</div></section></body></html>',
      { band: [0, 0, 1280, 400], inner: [40, 40, 1200, 320], wordmark: [60, 60, 600, 64] },
    )
    const wm = el(sig, 'Gigabyte Alchemy')
    // The recorded surface is the PANEL's 135° sweep, not the wordmark's own 90°.
    expect(wm.surfaceGradient?.angleDeg).toBe(135)
    expect(wm.surfaceGradient?.stops.map((s) => s.color)).toEqual(['#f1f5f9', '#e2e8f0'])
    // …and the text-fill gradient is still captured, on its own axis.
    expect(wm.gradient?.angleDeg).toBe(90)
    expect(wm.gradient?.stops.map((s) => s.color)).toEqual(['#ff8c42', '#ff6b35'])
  })

  it('test_UAT_AC1308_walk_stops_at_the_first_opaque_solid', () => {
    // An opaque card between the run and a gradient section: the gradient is
    // behind an opaque fill, so it never shows through and is not the surface.
    const sig = extract(
      '<!doctype html><html><body>' +
        `<section class="band" style="background-image: ${INNER}">` +
        '<div class="card" style="background-color: rgb(255, 255, 255)">' +
        '<p class="run">Behind an opaque card</p>' +
        '</div></section></body></html>',
      { band: [0, 0, 1280, 400], card: [40, 40, 1200, 320], run: [60, 60, 600, 48] },
    )
    expect(el(sig, 'Behind an opaque card').surfaceGradient ?? null).toBeNull()
  })

  it('test_UAT_AC1308_no_gradient_ancestor_records_none', () => {
    // No gradient anywhere in the chain records NO surface gradient — not an
    // empty or default one, which would read as a present-but-blank axis.
    const sig = extract(
      '<!doctype html><html><body>' +
        '<section class="band" style="background-color: rgb(232, 223, 211)">' +
        '<div class="card" style="background-color: rgb(255, 255, 255)">' +
        '<p class="run">Plain solid surface</p>' +
        '</div></section></body></html>',
      { band: [0, 0, 1280, 400], card: [40, 40, 1200, 320], run: [60, 60, 600, 48] },
    )
    const plain = el(sig, 'Plain solid surface')
    expect(plain.surfaceGradient ?? null).toBeNull()
    // The solid surface is still captured on its own axis — "no gradient" is a
    // statement about the gradient axis only.
    expect(plain.surfaceFill?.toLowerCase()).toBe('#ffffff')
  })
})

// ── local fixture server (mirrors the REQ-62 sibling) ────────────────────────

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

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
