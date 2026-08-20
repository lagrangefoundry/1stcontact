/**
 * BUG-27 — the capture reads BACKDROPS, and reads whole subtrees.
 *
 * Two blind spots put the same page beyond reproduction, and both were failures
 * of *what the extractor looks at* rather than of any downstream stage:
 *
 *  1. A backdrop — what a band paints behind its content, whether a
 *     `background-image` or a full-bleed `background-color` — was only ever read
 *     off a TOP-LEVEL band root. On a page-builder site the whole page is one
 *     wrapper and the panels are nested `<section>`s, so the hero photograph was
 *     absent from the manifest entirely and each panel's fill had to be inferred
 *     from the surfaces its runs sit on. The reproduction came out as flat
 *     colour while every value gate stayed green: with nothing captured, there
 *     was nothing to compare against.
 *
 *  2. A top-level band was qualified on its OWN in-flow height being >= 8px. A
 *     header whose children are absolutely positioned collapses to zero height
 *     while painting a full nav bar, so its whole subtree — logo and links —
 *     was dropped before extraction ran. (BUG-15 patched the case where EVERY
 *     top-level child collapses; this is the same failure when only one does,
 *     where that fallback never fires.)
 *
 * The fixes: a band's box is the painted extent of its subtree, and backdrops
 * are indexed document-wide. Both then flow through the existing field
 * projection → fold → `box` leaf → asset-localisation path.
 *
 * The regression guards matter as much as the fixes, because each is a way the
 * capture could start reporting things that are not there:
 *   - a full-bleed TRANSLUCENT fill is a scrim, already captured as the band's
 *     `overlay`; indexing it again paints it twice, and opaquely;
 *   - a narrower coloured box is a card, not a band;
 *   - a hidden off-screen block paints nothing and must not become (or inflate)
 *     a band.
 *
 * Part A drives the real `cmdCapturePage` against a committed fixture in real
 * headless Chromium. Part B drives the real `foldToL1` / `diffManifests` entry
 * points (no mocks, no browser).
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
  type Capture,
  type Field,
  type RawSignals,
} from '../tools/generate/src/cli'
import { foldToL1 } from '../tools/generate/src'
import {
  diffManifests,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()

// ── Part A — the capture sees the backdrops and the collapsed header ──────────

describe('story-d5de22a5 — AC-815/816 capture reads nested backdrops and whole subtrees (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> } | undefined
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    // Probe the browser BEFORE binding a socket. `serveDir` first meant that on a
    // runner which cannot listen on 127.0.0.1 the hook did not degrade to a skip —
    // it hard-failed (`listen EPERM`) and timed out, taking the whole file with it.
    // A file that cannot run is indistinguishable from a file with no ACs to a
    // name-index sweep, which is how AC-815's vacuous coverage stayed invisible.
    if (!browserOk) return
    server = await serveDir(FIXTURES)
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug27-cap-'))
    tmpDirs.push(cwd)
    const res = await cmdCapturePage(`${server.origin}/bug27-nested-backdrop.html`, { cwd })
    capture = res.capture
  }, 180000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  // `it.runIf`, not a wrapper that returns early: a wrapper reports PASS on a
  // runner with no Chromium, so these would read green — and fully covered —
  // wherever the browser is absent. A skip is honest; a vacuous pass is not.
  // (Same rule as bug24-scrim-alpha.test.ts:260-263.)
  const itA = (name: string, fn: (fields: Field[], capture: Capture) => void) =>
    it.runIf(browserOk)(name, () => {
      fn(capture!.sections.flatMap((s) => s.fields ?? []), capture!)
    })

  itA('test_UAT_AC816_nested_background_image_is_captured', (fields) => {
    // The hero photograph is a background-image on a nested element. Pre-fix no
    // field carried it and the manifest had no record of the image at all.
    const backdrops = fields.filter((f) => f.backgroundImageUrl)
    expect(backdrops.length, 'nested background-image captured').toBe(1)
    expect(backdrops[0].backgroundImageUrl).toMatch(/hero\.png$/)
    // Its box is the hero's, so the fold has real geometry to place it at.
    expect(backdrops[0].box?.width ?? 0).toBeGreaterThan(600)
    expect(Math.round(backdrops[0].box?.height ?? 0)).toBe(600)
  })

  itA('test_UAT_AC816_backdrop_carries_the_fill_beneath_its_image', (fields) => {
    // The hero layers its photograph over its own black fill at opacity .49 —
    // that black is what darkens it. Capturing the image without the fill under
    // it reproduces the photograph at full brightness.
    const hero = fields.find((f) => f.backgroundImageUrl)!
    expect(hero.surfaceFill).toBe('#000000')
    expect(hero.opacity).toBeCloseTo(0.49, 2)
  })

  itA('test_UAT_AC816_full_bleed_panel_fill_is_captured_but_a_card_is_not', (fields) => {
    // A nested full-bleed panel is a band: its fill is measured, not inferred.
    const fills = fields.filter((f) => !f.backgroundImageUrl && f.surfaceFill)
    expect(fills.map((f) => f.surfaceFill)).toContain('#7a7a7a')
    // The narrower card inside it is NOT a band — it is reconstructed from run
    // surfaces, and indexing every coloured box would bury the page's structure.
    expect(fills.map((f) => f.surfaceFill)).not.toContain('#ece6dd')
  })

  itA('test_UAT_AC816_translucent_scrim_is_not_indexed_as_a_backdrop', (fields) => {
    // A full-bleed translucent fill is a veil, and `overlayOf` already records it
    // as the band's `overlay` — which the fold layers ABOVE the image it veils.
    // Indexing it here as well would paint it twice and, because a fill's alpha
    // lives in the colour rather than in `opacity`, the copy would land opaque.
    const fills = fields.filter((f) => !f.backgroundImageUrl).map((f) => f.surfaceFill)
    expect(fills).not.toContain('#030717')
  })

  itA('test_UAT_AC815_collapsed_header_subtree_is_captured', (_fields, cap) => {
    // The header's own box is 0px tall; its nav bar is not. Pre-fix the whole
    // subtree was dropped, so neither the links nor the logo existed anywhere.
    // Read through `flattenCapture` — the nav links are a detected repeated
    // group, so they arrive as `items` rather than loose `content`.
    const texts = flattenCapture(cap).elements.map((e) => e.text)
    expect(texts).toContain('Meet the Chef')
    expect(texts).toContain('Our Services')
    const logo = cap.sections.flatMap((s) => s.fields ?? []).find((f) => f.alt === 'Chef logo')
    expect(logo, 'logo inside the collapsed header is captured').toBeDefined()
    expect(logo?.src).toMatch(/logo\.png$/)
  })

  itA('test_UAT_AC815_offscreen_block_does_not_become_or_inflate_a_band', (_fields, cap) => {
    // A block hidden at left:-33554430px paints nothing on the page. It must not
    // become a band, and the subtree walk must not union its box into one: an
    // unclamped union handed the page a section 33 million pixels wide.
    for (const s of cap.sections) {
      expect(s.box.x).toBeGreaterThanOrEqual(0)
      expect(s.box.width).toBeLessThanOrEqual(cap.viewport.width + 1)
    }
    const texts = cap.sections.flatMap((s) => s.content.map((r) => r.text))
    expect(texts.some((t) => t.includes('spam.example'))).toBe(false)
  })
})

// ── Part A′ — AC-815's geometry, headless (real EXTRACT_SCRIPT over jsdom) ────
//
// AC-815 is a geometry computation over element rects: band box = painted extent
// of the subtree, clamped to the document canvas. That needs no paint — only real
// rects — so the whole criterion runs headlessly through the real in-page script
// with layout stubbed per class (the REQ-72 / BUG-15 harness,
// req72-gradient-capture.test.ts:56-67). Part A above stays as the real-engine
// sibling; this is the coverage that exists on every runner.

type Box = [x: number, y: number, w: number, h: number]

const DOC_W = 1280
const DOC_H = 1600

const rect =(x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const cls = (this as Element).className || ''
    const b = boxByClass[cls]
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => DOC_W })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => DOC_H })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/**
 * One page carrying all four of AC-815's cases at once:
 *  - `.hdr` — a header with ZERO in-flow height whose absolutely-positioned nav
 *    paints a full 64px bar (the BUG-27 root cause);
 *  - `.carousel` — a band whose off-stage slide's border box runs 3300px wide
 *    under `overflow: hidden`, so it paints far less than it measures;
 *  - `.band` — a conventionally laid-out band, its child inside its own box;
 *  - `.spam` — a block parked at `left:-33554430px`, painting nothing.
 */
const SUBTREE_PAGE = [
  '<!doctype html><html><body>',
  '<header class="hdr" style="position:relative">',
  '<nav class="nav" style="position:absolute;top:0;left:0">',
  '<img class="logo" src="/logo.png" alt="Chef logo">',
  '<span class="nav-a">Meet the Chef</span>',
  '<span class="nav-b">Our Services</span>',
  '</nav></header>',
  '<section class="carousel" style="overflow:hidden;background-color:rgb(20,20,20)">',
  '<div class="slide-on">On stage</div>',
  '<div class="slide-off">Off stage</div>',
  '</section>',
  '<section class="band" style="background-color:rgb(255,255,255)">',
  '<p class="copy">Conventional band copy</p>',
  '</section>',
  '<div class="spam" style="position:absolute"><span class="spam-link">visit spam.example now</span></div>',
  '</body></html>',
].join('')

const SUBTREE_BOXES: Record<string, Box> = {
  // The header's OWN box is 0px tall — this is the fact that dropped the subtree.
  hdr: [0, 0, DOC_W, 0],
  nav: [0, 0, DOC_W, 64],
  logo: [16, 12, 120, 40],
  'nav-a': [200, 20, 140, 24],
  'nav-b': [360, 20, 140, 24],
  carousel: [0, 64, DOC_W, 400],
  'slide-on': [0, 64, DOC_W, 400],
  // Overlaps the canvas at x=900 and runs to x=3300 — clipped, so it paints only
  // as far as the page. An unclamped union would box the band 3300px wide.
  'slide-off': [900, 64, 2400, 400],
  band: [0, 464, DOC_W, 300],
  copy: [40, 500, 600, 40],
  spam: [-33554430, 0, 200, 20],
  'spam-link': [-33554430, 0, 200, 20],
}

describe('story-d5de22a5 — AC-815 a band is boxed at its subtree, clamped to the canvas (headless)', () => {
  const signals = extract(SUBTREE_PAGE, SUBTREE_BOXES)
  /** Every text a band carries, whether loose content or a detected repeated group. */
  const textsOf = (b: RawSignals['bands'][number]) =>
    b.content.concat(...b.items).map((r) => (r as { text: string }).text)
  const bandAt = (y: number) => signals.bands.find((b) => Math.round(b.box.y) === y)

  it('test_UAT_AC815_collapsed_band_is_boxed_at_its_painted_subtree', () => {
    // Pre-fix the header was qualified on its own >=8px height, read 0, and the
    // whole subtree was dropped before extraction — unrecoverable downstream.
    const hdr = bandAt(0)
    expect(hdr, `collapsed header survives as a band; got ${JSON.stringify(signals.bands.map((b) => b.box))}`)
      .toBeDefined()
    // Boxed at what it paints — the nav bar — not at its own zero-height rect.
    expect(hdr!.box.height).toBe(64)
    expect(hdr!.box.width).toBe(DOC_W)
  })

  it('test_UAT_AC815_collapsed_band_subtree_reaches_the_manifest', () => {
    const hdr = bandAt(0)!
    expect(textsOf(hdr)).toContain('Meet the Chef')
    expect(textsOf(hdr)).toContain('Our Services')
    const logo = (hdr.fields ?? []).find((f) => (f as { alt?: string }).alt === 'Chef logo')
    expect(logo, 'logo inside the collapsed header is captured').toBeDefined()
    expect((logo as { src?: string }).src).toMatch(/logo\.png$/)
  })

  it('test_UAT_AC815_clipped_overflow_does_not_widen_a_band_past_the_document', () => {
    // The off-stage slide measures out to x=3300 but is clipped at the band edge.
    // scrollWidth/scrollHeight are the bound: overflow that really extends the
    // page grows them, overflow that is clipped does not.
    const car = bandAt(64)
    expect(car, 'carousel band captured').toBeDefined()
    expect(car!.box.x).toBe(0)
    expect(car!.box.width).toBe(DOC_W)
    expect(car!.box.x + car!.box.width).toBeLessThanOrEqual(DOC_W)
  })

  it('test_UAT_AC815_offscreen_block_yields_no_band_and_inflates_none', () => {
    // A subtree that paints nothing ON the page contributes no band at all.
    const spam = signals.bands.find((b) => textsOf(b).some((t) => t.includes('spam.example')))
    expect(spam, 'off-canvas block did not become a band').toBeUndefined()
    // …and it inflates no other band: every box stays on the canvas.
    for (const b of signals.bands) {
      expect(b.box.x).toBeGreaterThanOrEqual(0)
      expect(b.box.y).toBeGreaterThanOrEqual(0)
      expect(b.box.x + b.box.width).toBeLessThanOrEqual(DOC_W)
      expect(b.box.y + b.box.height).toBeLessThanOrEqual(DOC_H)
    }
  })

  it('test_UAT_AC815_a_conventional_band_box_is_unchanged', () => {
    // The other direction: measuring the subtree must leave an ordinary band
    // alone — its children are already inside its own box, so the union IS it.
    const band = bandAt(464)
    expect(band, 'conventional band captured').toBeDefined()
    expect([band!.box.x, band!.box.y, band!.box.width, band!.box.height]).toEqual([0, 464, DOC_W, 300])
  })
})

// ── Part B — the fold places a backdrop, and the diff can see one missing ─────

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const HERO = 'https://cdn.example.test/hero.jpg'

/** A text-free element carrying a captured backdrop. */
function backdrop(width: number, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text: '(generic)',
    role: 'generic',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'generic',
    backgroundImageUrl: HERO,
    box: { x: 0, y: 0, width, height: 600 },
    ...over,
  }
}

/** A styled text run. */
function run(width: number): ValueElement {
  return {
    text: 'Headline',
    role: 'heading',
    color: '#ffffff',
    fontFamily: 'Arial',
    fontSizePx: 48,
    fontWeight: 700,
    box: { x: 40, y: 220, width: width - 80, height: 60 },
  }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 1200 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function childrenOf(doc: ReturnType<typeof foldToL1>): Array<{
  kind: string
  id?: string
  axes?: Record<string, unknown>
}> {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as never
}

function manifest(elements: ValueElement[]): ValueManifest {
  return { source: 't', elements, sections: [], viewport: { width: 1280, height: 900 } }
}

describe('story-d5de22a5 — AC-816 a captured backdrop travels to the reproduction beneath content', () => {
  it('test_UAT_AC816_fold_emits_backdrop_box_with_url', () => {
    const doc = foldToL1(multiFrom((w) => [backdrop(w), run(w)]))
    const boxes = childrenOf(doc).filter((c) => c.kind === 'box' && c.axes?.backgroundImageUrl)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].axes?.backgroundImageUrl).toBe(HERO)
  })

  it('test_UAT_AC816_fold_paints_backdrop_beneath_content', () => {
    // The manifest lists every text-free element AFTER the runs of its band, so
    // a backdrop left in document order would paint the hero image OVER the
    // hero's own headline. It belongs in the background layer.
    const doc = foldToL1(multiFrom((w) => [run(w), backdrop(w)]))
    const kids = childrenOf(doc)
    const bgIndex = kids.findIndex((c) => c.axes?.backgroundImageUrl)
    const textIndex = kids.findIndex((c) => c.kind === 'text')
    expect(bgIndex).toBeGreaterThanOrEqual(0)
    expect(textIndex).toBeGreaterThan(bgIndex)
  })

  it('test_UAT_AC816_fold_carries_the_fill_and_veil_of_a_backdrop', () => {
    const doc = foldToL1(multiFrom((w) => [backdrop(w, { surfaceFill: '#000000', opacity: 0.49 }), run(w)]))
    const box = childrenOf(doc).find((c) => c.axes?.backgroundImageUrl)!
    expect(box.axes?.surfaceFill).toBe('#000000')
    expect(box.axes?.opacity).toBeCloseTo(0.49, 2)
  })

  it('test_UAT_AC816_fold_bounds_a_band_at_a_backdrop_edge', () => {
    // Style-scope segmentation only ever sees top-level bands, so a page whose
    // panels are all nested yields ONE section and no interior edge for the band
    // clamp to use. A backdrop marks a real surface change, so its edges bound a
    // band the same way a section edge does — without this the hero's fill, read
    // off the runs sitting on it, tiles far past the hero.
    const doc = foldToL1(
      multiFrom((w) => [
        backdrop(w, { surfaceFill: '#000000' }),
        // A full-width run ON the hero: its surface is the hero's black fill.
        { ...run(w), surfaceFill: '#000000', box: { x: 0, y: 220, width: w, height: 60 } },
        // …and one far below it, on the white page.
        { ...run(w), text: 'Below', surfaceFill: '#ffffff', box: { x: 0, y: 2000, width: w, height: 60 } },
      ]),
    )
    const bands = childrenOf(doc).filter(
      (c) => c.kind === 'box' && c.axes?.surfaceFill === '#000000' && !c.axes?.backgroundImageUrl,
    ) as unknown as Array<{ geometry: { keyframes: { at: number; y: number; height: number }[] } }>
    for (const b of bands) {
      const kf = b.geometry.keyframes.at(-1)!
      expect(kf.y + kf.height, 'black band stops at the backdrop edge').toBeLessThanOrEqual(601)
    }
  })
})

describe('story-d5de22a5 — AC-817 a background image is compared by mirrored basename', () => {
  it('test_UAT_AC817_values_diff_counts_a_missing_background_image', () => {
    // With nothing captured there was nothing to compare, so a page reproduced
    // as flat colour scored zero defects on this axis.
    const expected = manifest([backdrop(1280)])
    const actual = manifest([backdrop(1280, { backgroundImageUrl: undefined })])
    const deltas = diffManifests(expected, actual).deltas.filter((d) => d.property === 'backgroundImage')
    expect(deltas).toHaveLength(1)
    expect(deltas[0].expected).toBe('hero.jpg')
    expect(deltas[0].actual).toBe('(none)')
  })

  it('test_UAT_AC817_values_diff_matches_the_mirrored_asset_by_basename', () => {
    // The two sides legitimately name the same bytes differently: the reference
    // carries the captured origin URL, our render the site-local mirror that
    // `localizeAssets` wrote. Comparing them verbatim would report every
    // correctly-reproduced image as a defect.
    const expected = manifest([backdrop(1280)])
    const actual = manifest([backdrop(1280, { backgroundImageUrl: '/assets/hero.jpg' })])
    const deltas = diffManifests(expected, actual).deltas.filter((d) => d.property === 'backgroundImage')
    expect(deltas).toHaveLength(0)
  })

  it('test_UAT_AC817_values_diff_counts_the_wrong_asset', () => {
    const expected = manifest([backdrop(1280)])
    const actual = manifest([backdrop(1280, { backgroundImageUrl: '/assets/other.jpg' })])
    const deltas = diffManifests(expected, actual).deltas.filter((d) => d.property === 'backgroundImage')
    expect(deltas).toHaveLength(1)
    expect(deltas[0].actual).toBe('other.jpg')
  })
})

// ── local static file server for the fixtures ────────────────────────────────

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
