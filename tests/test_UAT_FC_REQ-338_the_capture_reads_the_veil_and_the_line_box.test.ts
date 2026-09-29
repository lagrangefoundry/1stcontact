/**
 * REQ-338 issues 5–8 — four things the extractor read WRONGLY rather than not at
 * all, which is why they cost more than a missing axis: a plausible wrong value
 * travels the whole pipeline and nothing downstream can tell it from a right one.
 *
 * - **issue 5** — a band's `overlay` was read off whatever painted a translucent
 *   colour over 60% of it, INCLUDING a box that contains the band. A box
 *   containing the band paints behind it and can never be its veil: CSS puts an
 *   ancestor's fill under the band's own. joyfulculinarycreations.com's vegetable
 *   band declares `background-color: #FFFFFF17` on the section itself, and that
 *   0.0902 alpha is exactly the `{#ffffff, 0.09}` the bundle recorded — while the
 *   `.elementor-background-overlay` child that really paints it (`#141E14BA` at
 *   `opacity: .92` with `mix-blend-mode: darken`, an effective 0.67) was recorded
 *   nowhere in the bundle at all. 13.96% of that page's diff mass.
 * - **issue 6** — run text was normalised with `/\s+/g`, and JavaScript's `\s`
 *   includes U+00A0. HTML collapses five characters and the non-breaking space is
 *   not one of them, so 15 of them became ordinary spaces and the reproduction
 *   broke lines the reference cannot break: 460.38px of first-line text against
 *   the reference's 373.08px, a HIGH `renderedTextBox` delta with both sides
 *   reporting the same box, the same font and the same two-line height.
 * - **issue 7** — `lineHeightPx` was the run's OWN computed `line-height`, and a
 *   line box is the maximum of that and the strut of the block holding it. An
 *   inline `<span>` at `font-size: 18px` with no line-height of its own resolves
 *   to 18 and sits on a 24px line box; three HIGH `renderedTextBox` deltas
 *   (94 vs 76, 70 vs 58, 46 vs 40) with identical font, width and wrap points.
 * - **issue 8** — a clip ancestor's id was a SEQUENCE NUMBER assigned on first
 *   sight, per page evaluation, so it numbered clipping ancestors in the order
 *   that viewport happened to reach them. A phone shows one carousel slide where
 *   a desktop shows three, so `id: 5` was a photograph's own rounded crop at
 *   320px and a testimonial slide 1400px away at 1280px. The fold read one
 *   width's id against another width's box and a 162px photograph landed at
 *   `(-332, -1424)` inside a 713×332 clipping container — erased, and reported
 *   present by every coverage proxy.
 *
 * These run the REAL `EXTRACT_SCRIPT` under jsdom, the way BUG-10's and BUG-22's
 * UATs do. jsdom does no layout, so the fixtures supply the boxes and the line
 * fragments a browser would measure — every value under test is then read by the
 * extractor's own code from the same computed styles a browser presents.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  staleCaptureAxes,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli'

type Rect = { x: number; y: number; w: number; h: number }

const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/**
 * Mount HTML in jsdom and run the real extractor.
 *
 * `boxes` is keyed by element id — jsdom lays nothing out, so the fixture states
 * the geometry a browser would have measured. `lineRects` does the same for the
 * line fragments a Range yields, which is what issue 7's pitch is measured from.
 */
function extract(
  bodyHtml: string,
  boxes: Record<string, Rect>,
  lineRects: Record<string, Rect[]> = {},
): RawSignals {
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
  // jsdom's Range has no `getClientRects` at all. A browser's yields ONE RECT PER
  // LINE FRAGMENT, which is the measurement issue 7's pitch is derived from.
  ;(dom.window.Range.prototype as unknown as { getClientRects: () => DOMRect[] }).getClientRects =
    function (this: { startContainer: Node }) {
      const node = this.startContainer
      const el = (node.nodeType === 1 ? node : node.parentElement) as Element | null
      const rects = el ? lineRects[el.id] : undefined
      return (rects ?? []).map((r) => domRect(r.x, r.y, r.w, r.h))
    }
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])

// ── issue 5 fixture — the vegetable band ─────────────────────────────────────
//
// The section paints its own `#FFFFFF17` (alpha 0.0902) plus the photograph; the
// dedicated overlay child paints `#141E14BA` (alpha 0.729) at `opacity: .92`
// with `mix-blend-mode: darken`. Both blanket the band. Only the child is the
// veil — the section CONTAINS the band, so it paints behind it.
const VEG_HTML = `
  <section id="veg" style="background-color:rgba(255,255,255,0.09);background-image:url(market-vegetables.jpg);width:1280px;height:400px">
    <div id="veil" style="background-color:rgba(20,30,20,0.729);opacity:0.92;mix-blend-mode:darken;width:1280px;height:400px"></div>
    <p id="veg-copy" style="color:#ffffff">It&rsquo;s not just about eating your&nbsp;veggies.</p>
  </section>`
const VEG_BOXES: Record<string, Rect> = {
  veg: { x: 0, y: 0, w: 1280, h: 400 },
  veil: { x: 0, y: 0, w: 1280, h: 400 },
  'veg-copy': { x: 40, y: 150, w: 600, h: 40 },
}

describe('REQ-338 issue 5 — a band overlay is the veil painted OVER it', () => {
  const band = extract(VEG_HTML, VEG_BOXES).bands[0]

  it('test_UAT_FC_REQ-338_the_overlay_is_the_veil_child_not_the_band_s_own_translucent_fill', () => {
    expect(band, 'the vegetable band is captured').toBeTruthy()
    // `#ffffff @ 0.09` is the section's own background-color. It paints UNDER the
    // band's image, and recording it as the veil over the band is a contradiction
    // no correct extractor can produce.
    expect(band.overlay?.color, 'the veil is the dark scrim, not the section fill').toBe('#141e14')
  })

  it('test_UAT_FC_REQ-338_the_veil_s_opacity_is_its_colour_alpha_times_the_element_s_own_opacity', () => {
    // A page-builder overlay splits the two routinely, and either half alone is
    // not what paints: 0.729 × 0.92 = 0.67.
    expect(band.overlay?.opacity).toBeCloseTo(0.67, 2)
  })

  it('test_UAT_FC_REQ-338_the_veil_s_blend_mode_travels_with_it', () => {
    // `darken` at 0.67 and `normal` at 0.67 paint different pixels over the same
    // photograph. Alpha-only compositing lifted the band's darkest pixels by
    // ~55/255 across 13.96% of the page's diff mass.
    expect(band.overlay?.blendMode).toBe('darken')
  })
})

describe('REQ-338 issue 6 — non-breaking whitespace is layout, not formatting', () => {
  const runs = runsOf(extract(VEG_HTML, VEG_BOXES))

  it('test_UAT_FC_REQ-338_a_non_breaking_space_survives_run_text_normalisation', () => {
    const copy = runs.find((r) => r.text.startsWith('It'))
    expect(copy, 'the run is captured').toBeTruthy()
    expect(
      [...copy!.text].filter((c) => c.charCodeAt(0) === 0x00a0),
      'the U+00A0 the page cannot break at survives',
    ).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-338_ordinary_whitespace_is_still_collapsed_and_trimmed', () => {
    // The collapse itself is not the defect — the CHARACTER SET was. HTML
    // collapses space, tab, newline, carriage return and form feed, and nothing
    // else; a run that kept its source indentation would be a different bug.
    const runs2 = runsOf(
      extract(
        `<section id="s" style="background-color:#ffffff;width:1280px;height:200px">
           <p id="p">   Weekly   meals,
              cooked in your own kitchen   </p>
         </section>`,
        { s: { x: 0, y: 0, w: 1280, h: 200 }, p: { x: 0, y: 20, w: 600, h: 40 } },
      ),
    )
    expect(runs2.find((r) => r.text.includes('Weekly'))!.text).toBe('Weekly meals, cooked in your own kitchen')
  })
})

describe('REQ-338 issue 7 — lineHeightPx is the line box the glyphs sit on', () => {
  it('test_UAT_FC_REQ-338_a_run_reports_the_measured_pitch_of_its_line_boxes', () => {
    // The run styles its own `line-height: 18px`; the block holding it has a 24px
    // strut, so the line boxes are 24px apart and the browser's own Range rects
    // say so. The old read took the run's computed value and a four-line
    // paragraph came out 18px short per gap.
    const runs = runsOf(
      extract(
        `<section id="s" style="background-color:#ffffff;width:1280px;height:400px">
           <span id="strut" style="font-size:18px;line-height:18px;color:#111111">For expecting mothers, and small groups for kids and adults.</span>
         </section>`,
        { s: { x: 0, y: 0, w: 1280, h: 400 }, strut: { x: 856, y: 40, w: 162, h: 94 } },
        { strut: [
          { x: 856, y: 45, w: 162, h: 22 },
          { x: 856, y: 69, w: 150, h: 22 },
          { x: 856, y: 93, w: 158, h: 22 },
          { x: 856, y: 117, w: 120, h: 22 },
        ] },
      ),
    )
    const run = runs.find((r) => r.text.startsWith('For expecting'))!
    expect(run.lineHeightPx, 'the reference ink rows are 24px apart, not 18').toBe(24)
  })

  it('test_UAT_FC_REQ-338_a_single_line_run_falls_back_to_its_own_computed_line_height', () => {
    // There is no pitch to measure with one line, and the two values are
    // indistinguishable there — so the measurement must not invent one.
    const runs = runsOf(
      extract(
        `<section id="s" style="background-color:#ffffff;width:1280px;height:200px">
           <span id="one" style="font-size:18px;line-height:23.8px;color:#111111">In home service or delivery</span>
         </section>`,
        { s: { x: 0, y: 0, w: 1280, h: 200 }, one: { x: 40, y: 20, w: 300, h: 24 } },
        { one: [{ x: 40, y: 20, w: 300, h: 22 }] },
      ),
    )
    expect(runs.find((r) => r.text.startsWith('In home'))!.lineHeightPx).toBeCloseTo(23.8, 2)
  })
})

describe('REQ-338 issue 8 — a clip ancestor is identified by its place in the document', () => {
  // Two clipping ancestors, in document order: a carousel, then a photograph's
  // own rounded crop. `hideFirst` suppresses the carousel's runs, which is what
  // a narrower viewport does to a slider — and what used to change the NUMBERING.
  const clipPage = (hideFirst: boolean): RawSignals =>
    extract(
      `<section id="s" style="background-color:#ffffff;width:1280px;height:600px">
         <div id="carousel" style="overflow-x:hidden;overflow-y:hidden">
           <p id="slide" style="color:#111111${hideFirst ? ';display:none' : ''}">Joyful Culinary Creations</p>
         </div>
         <div id="crop" style="overflow-x:hidden;overflow-y:hidden">
           <p id="caption" style="color:#111111">Dreaming of healthier meals</p>
         </div>
       </section>`,
      {
        s: { x: 0, y: 0, w: 1280, h: 600 },
        carousel: { x: 300, y: 40, w: 713, h: 332 },
        slide: { x: 320, y: 60, w: 400, h: 24 },
        crop: { x: 674, y: 400, w: 162, h: 162 },
        caption: { x: 680, y: 410, w: 150, h: 24 },
      },
    )

  const idOf = (s: RawSignals, startsWith: string): string | undefined =>
    runsOf(s).find((r) => r.text.startsWith(startsWith))?.clip?.id as string | undefined

  it('test_UAT_FC_REQ-338_a_clip_id_is_the_ancestor_s_document_path', () => {
    const id = idOf(clipPage(false), 'Dreaming')
    expect(id, 'the caption is cut off by its own crop').toBeTruthy()
    // A `.`-joined chain of child indices, not a counter — the shape is what
    // makes it the same string at every viewport.
    expect(id).toMatch(/^\d+(\.\d+)*$/)
  })

  it('test_UAT_FC_REQ-338_a_clip_id_does_not_change_when_an_earlier_clipper_is_not_reached', () => {
    // THE defect. The counter was assigned on first sight, so hiding the
    // carousel's only run renumbered the crop from 1 to 0 — and the fold then
    // grouped a photograph into a container 1400px away and clipped it out of
    // existence, at zero value deltas because both sides lay it out identically
    // and only one of them paints it.
    expect(idOf(clipPage(true), 'Dreaming')).toBe(idOf(clipPage(false), 'Dreaming'))
  })

  it('test_UAT_FC_REQ-338_two_runs_cut_off_by_different_ancestors_do_not_share_an_id', () => {
    const both = clipPage(false)
    const slide = idOf(both, 'Joyful')
    const caption = idOf(both, 'Dreaming')
    expect(slide, 'the slide is cut off by the carousel').toBeTruthy()
    expect(caption, 'the caption by its crop').toBeTruthy()
    expect(slide).not.toBe(caption)
  })
})

describe('REQ-338 — a bundle taken before these reads says so', () => {
  // All four are capture-side, so `1c refold` can never pick them up: the fold
  // re-derives from the oracle the bundle already holds. The stamp is how an
  // operator knows a re-capture is owed — and these four are caught by the
  // CONTRADICTION rather than by absence, because a page with no veil, no
  // non-breaking space and no clipping ancestor records none of them however new
  // its extractor is.
  const bundle = (schema: number, sections: unknown[]): Capture =>
    ({
      url: 'https://joyfulculinarycreations.test/',
      host: 'joyfulculinarycreations.test',
      path: '/',
      capturedAt: '2026-09-27T00:47:21.132Z',
      captureSchema: schema,
      viewport: { width: 1280, height: 800 },
      theme: { subScales: {} },
      sections,
      assets: [],
    }) as unknown as Capture

  /** The vegetable band as a PRE-8 bundle recorded it: the section's own fill, read as its veil. */
  const misreadVeil = [
    {
      index: 0,
      box: { x: 0, y: 2667, width: 1280, height: 268 },
      background: {
        kind: 'image',
        color: '#ffffff',
        image: 'assets/market-vegetables-produce-6329164.jpg',
        overlay: { color: '#ffffff', opacity: 0.09 },
      },
      layout: { contentAlign: 'left', contentAnchorRatio: 0.5 },
      content: [],
      items: [],
      fields: [],
    },
  ]

  it('test_UAT_FC_REQ-338_an_overlay_whose_colour_is_the_band_s_own_fill_is_reported_as_owed_a_re_capture', () => {
    const axes = staleCaptureAxes(bundle(7, misreadVeil))
    expect(
      axes.map((a) => a.axis).filter((a) => a.includes('overlay')),
      'a veil whose colour IS the fill under it is the section background misread as the scrim over it',
    ).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-338_a_current_bundle_is_not_reported_stale', () => {
    expect(staleCaptureAxes(bundle(CAPTURE_SCHEMA, misreadVeil))).toEqual([])
  })
})
