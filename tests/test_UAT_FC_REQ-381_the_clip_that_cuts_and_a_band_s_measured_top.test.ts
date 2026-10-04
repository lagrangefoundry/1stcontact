/**
 * REQ-381 — two things joyfulculinarycreations.com (iteration 8) showed, which
 * between them were every on-sample layout finding of a structural-failure round.
 *
 *  1. **The capture recorded the nearest overflow box, not the one that cuts.**
 *     Elementor/Swiper set `overflow: hidden` on every slide and on the `.swiper`
 *     around them. Each off-screen slide's copy was recorded against its own
 *     slide — which contains it — so the fold saw nothing escaping and built no
 *     clipping container, and the slides widened the page to 1700px.
 *  2. **A band whose bottom is not a section edge lost its height response.** The
 *     fold wrote a band's `viewportResponse` only when BOTH of its edges had been
 *     measured; `section-band-2` opens on a travelling section edge and closes
 *     mid-section, so it was pinned while every run on it moved.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, type RawRun, type RawSignals } from '../tools/generate/src/cli'
import { foldToL1 } from '../tools/generate/src'
import type { L1Document } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

// ── issue 1 — the extractor, in jsdom with stated geometry ───────────────────

type Rect = { x: number; y: number; w: number; h: number }

const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Mount HTML in jsdom and run the real extractor; `boxes` is what a browser would measure. */
function extract(bodyHtml: string, boxes: Record<string, Rect>): RawSignals {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  })
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    return domRect(b.x, b.y, b.w, b.h)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  ;(dom.window.Range.prototype as unknown as { getClientRects: () => DOMRect[] }).getClientRects = () => []
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])

/**
 * The testimonial swiper at 1280, with the reference's own numbers: the `.swiper`
 * at x 283.75 w 712.5, the visible slide inside it, the duplicate slide parked to
 * its left at x -439.25 — every one of them `overflow: hidden` — and an arrow that
 * is the swiper's direct content.
 */
const SWIPER_HTML = `
  <section id="s" style="background-color:#28542d;width:1280px;height:500px">
    <div id="swiper" style="overflow-x:hidden;overflow-y:hidden">
      <div id="wrapper">
        <div id="prev-slide" style="overflow-x:hidden;overflow-y:hidden">
          <p id="prev-copy" style="color:#ffffff">So fabulous, every single dish</p>
        </div>
        <div id="cur-slide" style="overflow-x:hidden;overflow-y:hidden">
          <p id="cur-copy" style="color:#ffffff">Nancy made our week so easy</p>
        </div>
      </div>
      <p id="arrow" style="color:#ffffff">Next</p>
    </div>
  </section>`
const SWIPER_BOXES: Record<string, Rect> = {
  s: { x: 0, y: 0, w: 1280, h: 500 },
  swiper: { x: 283.75, y: 40, w: 712.5, h: 332 },
  wrapper: { x: -439.25, y: 40, w: 2150, h: 332 },
  'prev-slide': { x: -439.25, y: 40, w: 713, h: 332 },
  'prev-copy': { x: -419.25, y: 80, w: 673, h: 60 },
  'cur-slide': { x: 283.75, y: 40, w: 713, h: 332 },
  'cur-copy': { x: 303.75, y: 80, w: 673, h: 60 },
  arrow: { x: 300, y: 300, w: 40, h: 40 },
}

const clipOfRun = (s: RawSignals, startsWith: string) =>
  runsOf(s).find((r) => r.text.startsWith(startsWith))?.clip as
    | { id: string; x: number; y: number; width: number; height: number }
    | null
    | undefined

describe('REQ-381 issue 1 — a run records the overflow ancestor that cuts it', () => {
  const signals = extract(SWIPER_HTML, SWIPER_BOXES)

  it('test_UAT_FC_REQ-381_an_off_screen_slide_records_the_swiper_that_cuts_it_not_its_own_slide', () => {
    const slide = clipOfRun(signals, 'So fabulous')
    const arrow = clipOfRun(signals, 'Next')
    expect(slide, 'the off-screen slide is recorded as clipped').toBeTruthy()
    expect(arrow, 'the arrow is clipped by the swiper').toBeTruthy()
    // The id the fold groups by: one with the arrow's, so one clipping container
    // holds the slide AND the arrows rather than none.
    expect(slide!.id).toBe(arrow!.id)
    // And the box is the swiper's — the edge the slide disappears at.
    expect(slide!.x).toBeCloseTo(283.75, 2)
    expect(slide!.width).toBeCloseTo(712.5, 2)
  })

  it('test_UAT_FC_REQ-381_content_that_fits_keeps_its_nearest_overflow_box', () => {
    // Nothing cuts the visible slide's copy, so the record is what it always was:
    // its own slide, which the fold reads as "clipped in no observable sense".
    const cur = clipOfRun(signals, 'Nancy made')
    const arrow = clipOfRun(signals, 'Next')
    expect(cur, 'still recorded').toBeTruthy()
    expect(cur!.id, 'its own slide, not the swiper').not.toBe(arrow!.id)
    expect(cur!.x).toBeCloseTo(283.75, 2)
    expect(cur!.width).toBeCloseTo(713, 2)
  })
})

// ── issue 2 — the fold, on a band that closes mid-section ────────────────────

const LADDER = [768, 1024, 1280] as const
const LADDER_H: Record<number, number> = { 768: 1024, 1024: 768, 1280: 800 }
const GREY = '#7a7a7a'
const WHITE = '#ffffff'

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  const el = {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 21 } } as ValueElement
}

/**
 * A `100vh` hero, then an 800px grey section whose top therefore travels 1:1 with
 * the viewport height. Inside it a grey-filled run opens a band, and a white
 * panel's run 260px further down opens the next fill group — so the grey band
 * closes there, mid-section, at a y no probe measured.
 */
function page(width: number, vh: number): StateProjection {
  const top = vh
  return {
    engine: 'chromium',
    viewport: { width, height: vh },
    state: 'rest',
    manifest: {
      source: `t:${width}x${vh}`,
      viewport: { width, height: vh },
      bodyBackground: WHITE,
      elements: [
        run({ text: 'Welcome in', box: { x: 24, y: 80, width: 400, height: 29 } }),
        run({
          text: 'How it works',
          surfaceFill: GREY,
          box: { x: 0, y: top + 100, width, height: 29 },
          surface: { self: false, box: { x: 0, y: top, width, height: 800 } } as never,
        }),
        run({
          text: 'Book a tasting',
          surfaceFill: WHITE,
          box: { x: 0, y: top + 360, width, height: 29 },
          surface: { self: false, box: { x: 0, y: top + 330, width, height: 300 } } as never,
        }),
      ],
      sections: [
        { index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: vh }, surfaceFill: null },
        { index: 1, overlay: null, contentAnchorRatio: null, box: { x: 0, y: top, width, height: 800 }, surfaceFill: GREY },
      ] as never,
    },
  } as StateProjection
}

function allNodes(doc: L1Document): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const walk = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

describe('REQ-381 issue 2 — a band keeps the response of the edge that was measured', () => {
  it('test_UAT_FC_REQ-381_a_band_whose_bottom_is_not_a_section_edge_translates_with_its_top', () => {
    const projections: StateProjection[] = []
    for (const w of LADDER) projections.push(page(w, LADDER_H[w]))
    for (const w of LADDER) projections.push(page(w, LADDER_H[w] + 200))
    const doc = foldToL1({ url: 'http://fixture.test/', notes: [], projections } as MultiStateCapture)

    type Kf = { at: number; y: number; height?: number; viewportResponse?: { yFactor?: number; heightFactor?: number } }
    const greyBand = allNodes(doc).find(
      (n) =>
        typeof n.id === 'string' &&
        (n.id as string).startsWith('section-band') &&
        JSON.stringify(n).toLowerCase().includes(GREY),
    )
    expect(greyBand, 'the grey band is folded').toBeTruthy()
    const keyframes = (greyBand!.geometry as { keyframes: Kf[] }).keyframes
    for (const w of LADDER) {
      const kf = keyframes.find((k) => k.at === w)!
      expect(kf, `a keyframe at ${w}`).toBeTruthy()
      // The band opens on the travelling edge — and closes mid-section, short of
      // the next edge, which is the shape that used to lose the response.
      expect(kf.y, `opens on the section edge at ${w}`).toBeCloseTo(LADDER_H[w], 0)
      expect(kf.y + (kf.height ?? 0), `closes before the section does at ${w}`).toBeLessThan(LADDER_H[w] + 800 - 1)
      expect(kf.viewportResponse?.yFactor, `translates with its top at ${w}`).toBe(1)
      expect(kf.viewportResponse?.heightFactor, `its height response is unknown at ${w}`).toBeUndefined()
    }
  })
})
