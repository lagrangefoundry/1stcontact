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
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import {
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  type Capture,
} from '../tools/generate/src/cli'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

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

// ── Part B: the capture actually reads a modern-syntax scrim (real Chromium) ───

describe('BUG-24 capture resolves a colour-with-alpha scrim (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (await chromiumAvailable()) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'bug24-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/bug24-scrim.html`, fsReferenceStore(cwd))
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

  itB('test_UAT_FC_BUG-24_capture_records_a_color_mix_scrim_with_its_alpha', () => {
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

  itB('test_UAT_FC_BUG-24_capture_does_not_invent_a_scrim_on_a_plain_band', () => {
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
