/**
 * BUG-24 — a translucent scrim (a colour WITH alpha) survives capture → fold → render.
 *
 * A hero photo is normally darkened by a full-bleed veil so the headline reads
 * over it. That veil is a *colour carrying its own alpha*, not element opacity —
 * `bg-slate-950/30`, which Tailwind v4 emits as
 * `color-mix(in oklab, var(--color-slate-950) 30%, transparent)` and the browser
 * computes to `oklab(… / .3)`.
 *
 * Two independent gaps dropped it, and the reproduction rendered the photo
 * unveiled (~30% too bright) with no veil node at all:
 *
 *   1. **Capture** — the scrim probe (`overlayOf`) matched the computed
 *      background against a raw `/rgba\(…\)/` regex. Every modern-syntax colour
 *      (`color-mix`, `oklab`, `oklch`, `color()`) failed that match, so the veil
 *      was skipped. It now resolves through `rgbaOf` — the same REQ-52 canvas
 *      probe every other colour in the capture already used — which understands
 *      any browser-accepted syntax and preserves alpha.
 *   2. **Fold** — `SectionValues.overlay` was projected all along but nothing
 *      folded it, so even a correctly-captured scrim could not round-trip. The
 *      section-background box now carries `axes.overlay`, and a section is folded
 *      when it paints an image OR a scrim.
 *
 * The renderer needed no change: it already layers `overlay` as an `#rrggbbaa`
 * gradient above the background image within one box.
 *
 * The UATs drive the real `cmdCapturePage` (real Chromium, real CSS colour
 * resolution), `foldToL1`, `renderL1Document` and `flattenCapture` entry points —
 * no internal mocking.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import {
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  type Capture,
  type RawSignals,
} from '../tools/generate/src/cli'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const LADDER = [320, 375, 768, 1024, 1280, 1440]
const HERO = 'https://cdn.example.com/hero.jpg'
const VEIL = { color: '#020618', opacity: 0.3 }

// ── Part A: fold + render (browser-free, always run) ──────────────────────────

/** A multi-viewport capture built from a per-width section list. */
function multiFrom(sectionsAt: (width: number) => SectionValues[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: [] as ValueElement[],
      sections: sectionsAt(width),
      viewport: { width, height: 1200 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The root box's direct children. */
function childrenOf(doc: ReturnType<typeof foldToL1>): Array<{ id?: string; axes?: Record<string, unknown> }> {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as never
}

describe('BUG-24 — a scrim folds onto the section background box', () => {
  it('test_UAT_FC_BUG-24_hero_scrim_folds_onto_the_section_background_box', () => {
    // A hero painting BOTH a photo and a veil over it — the motivating shape.
    const doc = foldToL1(
      multiFrom((width) => [
        {
          index: 0,
          overlay: { ...VEIL },
          contentAnchorRatio: null,
          backgroundImageUrl: HERO,
          box: { x: 0, y: 0, width, height: 600 },
        },
      ]),
    )
    const bg = childrenOf(doc).find((n) => n.id === 'section-bg-0')
    expect(bg, 'the hero section folds to a background box').toBeDefined()
    // Pre-fix the box existed but carried the image ALONE — the veil vanished.
    expect(bg!.axes?.backgroundImageUrl).toBe(HERO)
    expect(bg!.axes?.overlay).toEqual(VEIL)
  })

  it('test_UAT_FC_BUG-24_scrim_over_image_renders_as_a_translucent_layer_above_it', () => {
    // AC2 — the veil must render as a translucent layer OVER the photo, not as an
    // opaque fill that replaces it, and not beneath it.
    const doc = foldToL1(
      multiFrom((width) => [
        {
          index: 0,
          overlay: { ...VEIL },
          contentAnchorRatio: null,
          backgroundImageUrl: HERO,
          box: { x: 0, y: 0, width, height: 600 },
        },
      ]),
    )
    const { css } = renderL1Document(doc)
    // The colour keeps its alpha as an 8-digit hex — 0.3 → 0x4d.
    expect(css).toContain('#0206184d')
    // …and it is layered ABOVE the photo (background layers paint first-on-top).
    const layered = css.match(
      /background-image:\s*linear-gradient\(#0206184d, #0206184d\), url\("[^"]*hero\.jpg"\)/,
    )
    expect(layered, `scrim layered above the image in:\n${css.slice(0, 4000)}`).not.toBeNull()
  })

  it('test_UAT_FC_BUG-24_scrim_without_a_background_image_still_folds', () => {
    // The fold used to emit a section box ONLY when the band painted an image, so
    // a veil over a solid band had nowhere to live. Guards the widened predicate.
    const doc = foldToL1(
      multiFrom((width) => [
        {
          index: 0,
          overlay: { ...VEIL },
          contentAnchorRatio: null,
          box: { x: 0, y: 0, width, height: 600 },
        },
      ]),
    )
    const bg = childrenOf(doc).find((n) => n.id === 'section-bg-0')
    expect(bg, 'an image-less scrim section still folds to a box').toBeDefined()
    expect(bg!.axes?.overlay).toEqual(VEIL)
    expect(bg!.axes?.backgroundImageUrl).toBeUndefined()
  })

  it('test_UAT_FC_BUG-24_a_section_with_neither_image_nor_scrim_folds_no_box', () => {
    // The widened predicate must not start emitting a box for every plain band —
    // that would paint empty rectangles over the whole page.
    const doc = foldToL1(
      multiFrom((width) => [
        { index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 600 } },
      ]),
    )
    expect(childrenOf(doc).find((n) => n.id === 'section-bg-0')).toBeUndefined()
  })
})

// ── Part B: the probe's discrimination rules, browser-free ────────────────────

/**
 * The engine-independent half of AC-1316. Only a real browser resolves
 * `color-mix()` / `oklab()` / `oklch()` / `color()`, so those syntaxes are proved
 * in Part C. What does NOT depend on the engine is what the probe does once a
 * colour resolves: preserve a partial alpha, and refuse to record an opaque fill,
 * a fully transparent one, or an unparseable string as a scrim. Those run here,
 * over the real `EXTRACT_SCRIPT`, so this AC contributes assertions headlessly.
 */
describe('BUG-24 — the scrim probe discriminates (EXTRACT_SCRIPT under jsdom)', () => {
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

  /** One hero band carrying a full-bleed veil painted in `veilColor`. */
  const bandWithVeil = (veilColor: string): RawSignals =>
    extract(
      '<!doctype html><html><body>' +
        '<section class="hero" style="background-color: rgb(15, 23, 42)">' +
        `<div class="veil" style="background-color: ${veilColor}"></div>` +
        '<h1 class="title">Dreaming of healthier meals</h1>' +
        '</section></body></html>',
      { hero: [0, 0, 1280, 600], veil: [0, 0, 1280, 600], title: [80, 200, 600, 64] },
    )

  it('test_UAT_AC1316_a_translucent_veil_is_recorded_with_its_alpha_preserved', () => {
    // The whole point of the axis: a colour carrying its OWN alpha (not element
    // opacity) is the band's overlay, and the alpha survives capture.
    const overlay = bandWithVeil('rgba(2, 6, 24, 0.3)').bands[0].overlay
    expect(overlay, 'the veil is recorded as the band overlay').toBeTruthy()
    expect(overlay!.opacity).toBeCloseTo(0.3, 2)
    expect(overlay!.color.toLowerCase()).toBe('#020618')
  })

  it('test_UAT_AC1316_opaque_transparent_and_invalid_fills_are_not_scrims', () => {
    // An opaque fill is not a veil — it replaces what is behind it rather than
    // tinting it, so recording it as an overlay would double-paint the band.
    expect(bandWithVeil('rgb(2, 6, 24)').bands[0].overlay).toBeNull()
    // A fully transparent fill paints nothing, so it is not a veil either.
    expect(bandWithVeil('rgba(2, 6, 24, 0)').bands[0].overlay).toBeNull()
    // A string that is not a valid colour resolves to NOTHING rather than to a
    // default — the probe must not invent a scrim out of unparseable input.
    expect(bandWithVeil('not-a-colour').bands[0].overlay).toBeNull()
  })

  it('test_UAT_AC1316_a_veil_that_does_not_blanket_the_band_is_not_its_overlay', () => {
    // A scrim is full-bleed by definition. A small translucent chip inside the
    // band is a component's own tint, not the band's veil, so it must not be
    // promoted to the band overlay (the false-positive direction of the axis).
    const sig = extract(
      '<!doctype html><html><body>' +
        '<section class="hero" style="background-color: rgb(15, 23, 42)">' +
        '<span class="chip" style="background-color: rgba(2, 6, 24, 0.3)">New</span>' +
        '<h1 class="title">Dreaming of healthier meals</h1>' +
        '</section></body></html>',
      { hero: [0, 0, 1280, 600], chip: [80, 100, 120, 32], title: [80, 200, 600, 64] },
    )
    expect(sig.bands[0].overlay).toBeNull()
  })
})

// ── Part C: the capture actually reads a modern-syntax scrim (real Chromium) ───

const browserOk = await chromiumAvailable()

describe('BUG-24 capture resolves a colour-with-alpha scrim (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'bug24-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/bug24-scrim.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  // `it.runIf`, not a wrapper that returns early: a wrapper reports PASS on a
  // runner with no Chromium, so a genuinely broken scrim probe would read green
  // wherever the browser is absent. A skip is honest; a vacuous pass is not.
  const itB = it.runIf(browserOk)

  itB('test_UAT_AC1316_capture_records_a_color_mix_scrim_with_its_alpha', () => {
    // AC1 — the root cause. The fixture's veil is authored as
    // `color-mix(in oklab, #020618 30%, transparent)`; Chromium computes it to a
    // modern-syntax colour that the old rgba() regex could not parse, so the
    // scrim was recorded as null. It must now round-trip colour AND alpha.
    const sections = flattenCapture(capture!).sections
    const hero = sections.find((s) => s.overlay)
    expect(hero, `some section carries a scrim; got ${JSON.stringify(sections.map((s) => s.overlay))}`).toBeDefined()
    expect(hero!.overlay!.opacity).toBeCloseTo(0.3, 2)
    // Channels resolve through the canvas probe, which unpremultiplies a
    // translucent fill — allow a 1-level rounding tolerance per channel.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hero!.overlay!.color.slice(i, i + 2), 16))
    expect(Math.abs(r - 0x02)).toBeLessThanOrEqual(1)
    expect(Math.abs(g - 0x06)).toBeLessThanOrEqual(1)
    expect(Math.abs(b - 0x18)).toBeLessThanOrEqual(1)
  })

  itB('test_UAT_AC1316_capture_does_not_invent_a_scrim_on_a_plain_band', () => {
    // The probe must discriminate: the fixture's second band paints an opaque
    // solid and no veil, so it must stay overlay-free. Without this, "always
    // return a scrim" would pass the test above.
    const sections = flattenCapture(capture!).sections
    expect(sections.length).toBeGreaterThan(1)
    expect(sections.filter((s) => s.overlay).length).toBe(1)
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
