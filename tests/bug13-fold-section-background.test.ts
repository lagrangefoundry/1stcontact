/**
 * BUG-13 — section/band CSS `background-image`s fold to L1 `box` leaves.
 *
 * A page's hero + section imagery is painted as a `background-image` on the band
 * (a `<section>`/`<div>`), not as `<img>` elements. Before this fix the fold's
 * element iteration never saw it (0 of N elements carried an image `src`), so a
 * reproduction showed no imagery at all. Now:
 *
 *   - the capture projects a band's `background-image` into
 *     `SectionValues.backgroundImageUrl` + `box` (`flattenSignals` /
 *     `flattenCapture`), dropping unsafe-scheme URLs so the envelope never throws;
 *   - the fold matches those section entries across the sampled widths and emits
 *     one `box` per section carrying `axes.backgroundImageUrl` and a geometry
 *     keyframe track from the band boxes, placed beneath all content;
 *   - the renderer paints the URL as a cover-fitted, centered, non-tiling backdrop;
 *   - text geometry (`sampleFidelity`) is unchanged — the background boxes are not
 *     text.
 *
 * The UATs drive the real `foldToL1` / `renderL1Document` / `flattenSignals` /
 * `flattenCapture` / `sampleFidelityProbe` entry points over synthetic
 * multi-viewport captures (real components, no mocks).
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, sampleFidelityProbe } from '../tools/generate/src'
import {
  flattenCapture,
  flattenSignals,
  type MultiStateCapture,
  type SectionValues,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src/cli/capture'
import type { RawBand, RawSignals } from '../tools/generate/src/cli/capture/extract'
import type { Capture, Section } from '../tools/generate/src/cli/capture/types'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const HERO = 'https://cdn.example.com/hero.jpg'

/** A text run element at one width. */
function run(box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text: 'Headline', role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 24, fontWeight: 700, box, ...over }
}

/** A multi-viewport capture whose bands carry a background image per width. */
function multiFrom(
  sectionsAt: (width: number) => SectionValues[],
  elementsAt: (width: number) => ValueElement[] = () => [],
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: elementsAt(width),
      sections: sectionsAt(width),
      viewport: { width, height: 1200 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The root box's direct children. */
function childrenOf(doc: ReturnType<typeof foldToL1>): Array<{ kind: string; id?: string; axes?: Record<string, unknown> }> {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as never
}

/** A hero section carrying a background image at a given width (band spans the viewport). */
function heroSection(width: number, url = HERO): SectionValues {
  return {
    index: 0,
    overlay: null,
    contentAnchorRatio: null,
    backgroundImageUrl: url,
    box: { x: 0, y: 0, width, height: 600 },
  }
}

/** A minimal RawBand carrying a CSS background-image. */
function rawBand(over: Partial<RawBand> = {}): RawBand {
  return {
    box: { x: 0, y: 0, width: 1280, height: 600 },
    backgroundColor: null,
    backgroundImage: `url("${HERO}")`,
    colorScheme: 'light',
    fontFamily: 'Arial',
    textAlign: 'left',
    paddingTopPx: 0,
    paddingBottomPx: 0,
    overlay: null,
    contentAnchorRatio: null,
    content: [],
    items: [],
    fields: [],
    ...over,
  }
}

describe('BUG-13 — section/band background images fold to L1 boxes', () => {
  it('test_UAT_FC_BUG-13_section_background_emits_box_with_url', () => {
    const doc = foldToL1(multiFrom((w) => [heroSection(w)], (w) => [run({ x: 40, y: 200, width: w - 80, height: 60 })]))
    const bgBoxes = childrenOf(doc).filter((c) => c.kind === 'box' && c.axes?.backgroundImageUrl)
    expect(bgBoxes).toHaveLength(1)
    expect(bgBoxes[0].axes?.backgroundImageUrl).toBe(HERO)
    expect(bgBoxes[0].id).toBe('section-bg-0')
  })

  it('test_UAT_FC_BUG-13_section_background_painted_beneath_content', () => {
    // The background box must be the FIRST child so every content leaf paints over it.
    const doc = foldToL1(multiFrom((w) => [heroSection(w)], (w) => [run({ x: 40, y: 200, width: w - 80, height: 60 })]))
    const kids = childrenOf(doc)
    const bgIndex = kids.findIndex((c) => c.axes?.backgroundImageUrl)
    const textIndex = kids.findIndex((c) => c.kind === 'text')
    expect(bgIndex).toBeGreaterThanOrEqual(0)
    expect(textIndex).toBeGreaterThan(bgIndex)
    expect(bgIndex).toBe(0)
  })

  it('test_UAT_FC_BUG-13_section_background_carries_geometry_track', () => {
    // Band spans each viewport width → a keyframe per sampled width.
    const doc = foldToL1(multiFrom((w) => [heroSection(w)], (w) => [run({ x: 40, y: 200, width: w - 80, height: 60 })]))
    const bg = childrenOf(doc).find((c) => c.axes?.backgroundImageUrl) as unknown as {
      geometry: { keyframes: { at: number; width: number; height: number }[] }
    }
    expect(bg.geometry.keyframes.map((k) => k.at)).toEqual(LADDER)
    expect(bg.geometry.keyframes.at(-1)!.width).toBe(1440)
    expect(bg.geometry.keyframes[0].height).toBe(600)
  })

  it('test_UAT_FC_BUG-13_render_paints_cover_background_image', () => {
    const doc = foldToL1(multiFrom((w) => [heroSection(w)], (w) => [run({ x: 40, y: 200, width: w - 80, height: 60 })]))
    const { css } = renderL1Document(doc)
    expect(css).toContain(`url("${HERO}")`)
    expect(css).toContain('background-size: cover')
    expect(css).toContain('background-repeat: no-repeat')
  })

  it('test_UAT_FC_BUG-13_flatten_signals_projects_band_background', () => {
    const signals: RawSignals = {
      viewport: { width: 1280, height: 1200 },
      bands: [rawBand()],
      colorUsage: [],
      fontFaces: [],
      typeScale: [],
      spacingScalePx: [],
      containerMaxWidthPx: null,
      images: [],
    }
    const manifest = flattenSignals(signals, 'draft:test')
    expect(manifest.sections[0].backgroundImageUrl).toBe(HERO)
    expect(manifest.sections[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 600 })
  })

  it('test_UAT_FC_BUG-13_unsafe_scheme_background_is_dropped', () => {
    // A `data:`/`javascript:` background must never reach the fold (it would fail
    // the envelope URL allowlist and throw). It is dropped at projection time.
    const signals: RawSignals = {
      viewport: { width: 1280, height: 1200 },
      bands: [rawBand({ backgroundImage: 'url("data:image/png;base64,AAAA")' })],
      colorUsage: [],
      fontFaces: [],
      typeScale: [],
      spacingScalePx: [],
      containerMaxWidthPx: null,
      images: [],
    }
    const manifest = flattenSignals(signals, 'draft:test')
    expect(manifest.sections[0].backgroundImageUrl).toBeUndefined()
    // REQ-88 — the section BOX is plain geometry (carried for every section so the
    // fold can bound a band at a real section edge) and holds no URL, so it is not
    // what this guard is about. The security property is that no section-background
    // box is EMITTED for an unsafe scheme — assert that directly.
    const doc = foldToL1(
      multiFrom(
        () => manifest.sections,
        (w) => [run({ x: 40, y: 200, width: w - 80, height: 60 })],
      ),
    )
    expect(childrenOf(doc).some((n) => (n.id ?? '').startsWith('section-bg-'))).toBe(false)
  })

  it('test_UAT_FC_BUG-13_gradient_only_band_gets_no_background_box', () => {
    // A gradient / solid band paints no image → no section-background box.
    const signals: RawSignals = {
      viewport: { width: 1280, height: 1200 },
      bands: [rawBand({ backgroundImage: 'linear-gradient(90deg, #fff, #000)' })],
      colorUsage: [],
      fontFaces: [],
      typeScale: [],
      spacingScalePx: [],
      containerMaxWidthPx: null,
      images: [],
    }
    const manifest = flattenSignals(signals, 'draft:test')
    expect(manifest.sections[0].backgroundImageUrl).toBeUndefined()
  })

  it('test_UAT_FC_BUG-13_flatten_capture_projects_image_section', () => {
    const section = {
      box: { x: 0, y: 0, width: 1280, height: 600 },
      screenshot: { x: 0, y: 0, width: 1280, height: 600 },
      background: { kind: 'image', image: '/assets/hero.jpg' },
      layout: { textOverImage: true, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null },
      content: [],
      items: [],
      fields: [],
    } as unknown as Section
    const capture = {
      url: 'http://x/',
      host: 'x',
      path: '/',
      capturedAt: '',
      viewport: { width: 1280, height: 1200 },
      theme: { subScales: {} },
      sections: [section],
      assets: [],
    } as unknown as Capture
    const manifest = flattenCapture(capture)
    expect(manifest.sections[0].backgroundImageUrl).toBe('/assets/hero.jpg')
    expect(manifest.sections[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 600 })
  })

  it('test_UAT_FC_BUG-13_sample_fidelity_unchanged_by_section_background', () => {
    // Text geometry is the fidelity oracle; adding a section background must not
    // perturb it — the background box is not text.
    const els = (w: number): ValueElement[] => [run({ x: 40, y: 200, width: w - 80, height: 60 })]
    const withBg = foldToL1(multiFrom((w) => [heroSection(w)], els))
    const withoutBg = foldToL1(multiFrom(() => [], els))
    const oracle = multiFrom((w) => [heroSection(w)], els)
    const fWith = sampleFidelityProbe(withBg, oracle)
    const fWithout = sampleFidelityProbe(withoutBg, oracle)
    expect(fWith.pass).toBe(true)
    expect(fWith.maxDelta).toBeCloseTo(fWithout.maxDelta, 5)
  })
})
