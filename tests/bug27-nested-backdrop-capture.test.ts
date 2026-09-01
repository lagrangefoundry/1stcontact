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
import { chromiumAvailable, cmdCapturePage, flattenCapture, type Capture, type Field } from '../tools/generate/src/cli'
import { foldToL1 } from '../tools/generate/src'
import {
  diffManifests,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

// ── Part A — the capture sees the backdrops and the collapsed header ──────────

describe('story-d5de22a5 — AC-815/816 capture reads nested backdrops and whole subtrees (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (await chromiumAvailable()) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'bug27-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/bug27-nested-backdrop.html`, fsReferenceStore(cwd))
      capture = res.capture
    }
  }, 180000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  const itA = (name: string, fn: (fields: Field[], capture: Capture) => void) =>
    it(name, () => {
      if (!capture) return // Chromium unavailable — skip silently
      fn(capture.sections.flatMap((s) => s.fields ?? []), capture)
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
