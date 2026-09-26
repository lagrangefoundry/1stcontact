/**
 * BUG-151 — three defects in the INSTRUMENT, not in the reproduction engine.
 *
 * Between them they accounted for 32 of one round's 122 value deltas, including
 * all nine of its highest-severity ones and the whole of its `unmeasured`
 * headline, and every one of the 32 described a difference that does not exist in
 * the served document.
 *
 * ## Issue 1 — "full-bleed" was measured against a SCROLL width
 *
 * `backdropBoxes` and `bandSlices` both asked `x + width >= docW - 1`, and `docW`
 * is `documentElement.scrollWidth`. On a reproduction whose testimonial carousel
 * lays two slides off-stage — L1 cannot clip them — the document is 1699.75px
 * wide at a 1280px viewport, so every 1280-wide band failed the test. All eleven
 * were dropped: `bandSlices` returned `[]` and the page fell back to ONE
 * body-spanning band (overlay / contentAnchor / textAlign UNMEASURED, the
 * standing blind spot REQ-269 exists to remove), while `fieldsUnder` lost nine
 * records whose paint the served CSS demonstrably emits — nine CRITICAL `missing`
 * deltas at severity 4060, plus six CRITICAL `arrangement` deltas from the
 * predecessor re-sort that dropping nine records causes.
 *
 * The reference never tripped it: its `.swiper` CLIPS the same two slides, so the
 * two sides were segmented by procedures that differed because of a property of
 * OUR OWN RENDER.
 *
 * Fixed by splitting the two jobs `docW` was doing: it still bounds the visible
 * region, and a new `layoutW` (`documentElement.clientWidth`) answers "does this
 * span the page". The qualifying slices are also RECORDED at `layoutW`, so a band
 * record agrees with the rule that admitted it.
 *
 * ## Issue 2 — an unnamed textless field took the queue head sight unseen
 *
 * The text-free pass joins on accessible name and falls back to document-order
 * FIFO. A band backdrop has no accessible name, so it fell straight through to
 * the assumption the fallback's own comment disowns, with no geometric check and
 * no floor below which it declined to pair. With eleven `generic` records on the
 * reference side and two on ours, the hero's opaque base was compared against a
 * band 2624px down the page and 533px shorter: twelve deltas, led by a CRITICAL
 * claiming a 2624px move, not one of them about the served document.
 *
 * Fixed by giving the unnamed case the join key it actually has — its box. Below
 * a quarter-of-union floor it does not pair at all: the reference record lands in
 * `unmatched` as an honest `missing` and the candidate stays in the queue for a
 * later reference element.
 *
 * ## Issue 3 — `semanticOf` reached an ancestor landmark's role
 *
 * REQ-302's semantic-ancestor walk selected `[role]` unbounded, and `closest`
 * runs to the document root. A testimonial run three levels inside
 * `div.swiper-slide[role="group"]` recorded `group` — the SLIDE's role, not its
 * own. An L1 render has no slide wrapper and recorded `generic`, which is right,
 * so the two sides could not agree however good the reproduction was: five HIGH
 * deltas at 3100 pointing at the side that was correct.
 *
 * Fixed by bounding the role branch to roles a text run could legitimately BE.
 *
 * The extractor UATs drive the real `EXTRACT_SCRIPT` under jsdom with layout
 * stubbed per element (the BUG-15 / REQ-63 harness); the pairing UATs drive the
 * pure `diffManifests` the CLI itself runs.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/**
 * Run the real `EXTRACT_SCRIPT` over a DOM, stubbing layout via a class→box map.
 *
 * `scrollWidth` and `clientWidth` are stubbed SEPARATELY — that they were the
 * same number is the whole of issue 1, so a harness that could not tell them
 * apart could not see the defect.
 */
function extract(
  html: string,
  boxByClass: Record<string, Box>,
  page: { scrollWidth: number; clientWidth: number; scrollHeight: number },
): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const cls = (this as Element).className || ''
    const b = boxByClass[cls]
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  for (const [prop, value] of [
    ['scrollWidth', page.scrollWidth],
    ['scrollHeight', page.scrollHeight],
    ['clientWidth', page.clientWidth],
  ] as const) {
    Object.defineProperty(dom.window.Element.prototype, prop, { configurable: true, get: () => value })
  }
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

// ── issue 1 fixture ──────────────────────────────────────────────────────────

/**
 * The measured shape: a flat L1 render (one collapsed wrapper, absolutely
 * positioned children) whose bands are all viewport-wide, plus ONE off-stage
 * carousel slide sitting beyond the viewport's right edge. It is the slide that
 * makes `scrollWidth` exceed `clientWidth`, which is the only thing about this
 * page that the full-bleed test used to see.
 */
const BANDS: Array<{ cls: string; fill: string; box: Box; text: string }> = [
  { cls: 'l1-1', fill: '#000000', box: [0, 0, 1280, 400], text: 'Dreaming of healthier meals' },
  { cls: 'l1-2', fill: '#ffffff', box: [0, 400, 1280, 400], text: 'THE HOLISTIC APPROACH' },
  { cls: 'l1-3', fill: '#edc251', box: [0, 800, 1280, 400], text: 'Follow us for our latest updates' },
]
const OFFSTAGE: Box = [1280, 450, 420, 200]

function flatPage(): string {
  const bands = BANDS.map(
    (b) =>
      `<div class="${b.cls}" style="position:absolute;background-color:${b.fill}">` +
      `<p class="t-${b.cls}">${b.text}</p></div>`,
  ).join('')
  return (
    '<!doctype html><html><body>' +
    `<div class="l1-0" style="position:relative">${bands}` +
    '<p class="l1-slide">Off-stage carousel slide</p>' +
    '</div></body></html>'
  )
}

function flatBoxes(bandWidth = 1280): Record<string, Box> {
  const boxes: Record<string, Box> = { 'l1-0': [0, 0, 0, 0], 'l1-slide': OFFSTAGE }
  for (const b of BANDS) {
    boxes[b.cls] = [b.box[0], b.box[1], bandWidth, b.box[3]]
    boxes[`t-${b.cls}`] = [40, b.box[1] + 40, 600, 40]
  }
  return boxes
}

const PAGE_H = 1200
const bandFills = (s: RawSignals): (string | null)[] => s.bands.map((b) => b.backgroundColor)
const bandWidths = (s: RawSignals): number[] => s.bands.map((b) => b.box.width)

describe('BUG-151 — full-bleed is measured against the layout viewport, not the scroll box', () => {
  it('test_UAT_FC_BUG-151_sideways_overflow_does_not_drop_the_bands', () => {
    // scrollWidth 1700 (the off-stage slide), clientWidth 1280 (the viewport).
    // Pre-fix every 1280-wide band failed `x + width >= 1700 - 1`, bandSlices
    // returned [] and the page degenerated to ONE body-spanning band.
    const sig = extract(flatPage(), flatBoxes(), {
      scrollWidth: 1700,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    expect(sig.bands.length).toBeGreaterThan(1)
    for (const fill of ['#000000', '#ffffff', '#edc251']) {
      expect(bandFills(sig)).toContain(fill)
    }
  })

  it('test_UAT_FC_BUG-151_a_qualifying_slice_is_recorded_at_the_viewport_width', () => {
    // A slice admitted for spanning the viewport is BOXED at the viewport width.
    // Recording these at the 1700px scroll width would only have traded nine
    // false `missing` deltas for eleven false `size` ones against a reference
    // whose own bands are 1280 wide.
    const sig = extract(flatPage(), flatBoxes(), {
      scrollWidth: 1700,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    expect(sig.bands.length).toBeGreaterThan(1)
    for (const width of bandWidths(sig)) expect(width).toBe(1280)
  })

  it('test_UAT_FC_BUG-151_the_band_backdrops_reach_the_manifest_as_fields', () => {
    // `backdropBoxes` is also the candidate source for `fieldsUnder`, so the same
    // predicate dropped the same boxes from `fields` — nine CRITICAL `missing`
    // deltas about paint the served CSS emits. They are recorded again.
    const sig = extract(flatPage(), flatBoxes(), {
      scrollWidth: 1700,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    const fills = sig.bands.flatMap((b) => b.fields.map((f) => f.surfaceFill))
    for (const fill of ['#000000', '#ffffff', '#edc251']) expect(fills).toContain(fill)
  })

  it('test_UAT_FC_BUG-151_a_page_that_does_not_overflow_sideways_is_unchanged', () => {
    // No-regression: where scrollWidth === clientWidth the two rules are the same
    // rule, so a conventionally-laid-out document reports exactly what it did.
    const overflowing = extract(flatPage(), flatBoxes(), {
      scrollWidth: 1700,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    const flush = extract(flatPage(), flatBoxes(), {
      scrollWidth: 1280,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    expect(bandFills(flush)).toEqual(bandFills(overflowing))
    expect(bandWidths(flush)).toEqual(bandWidths(overflowing))
  })

  it('test_UAT_FC_BUG-151_a_narrow_box_is_still_not_a_band', () => {
    // The predicate still DISCRIMINATES: widening the rule to the viewport must
    // not make every painted box full-bleed. Bands inset to 900px of a 1280px
    // viewport qualify as backdrops neither before the fix nor after it.
    const sig = extract(flatPage(), flatBoxes(900), {
      scrollWidth: 1700,
      clientWidth: 1280,
      scrollHeight: PAGE_H,
    })
    for (const fill of ['#000000', '#ffffff', '#edc251']) {
      expect(bandFills(sig)).not.toContain(fill)
    }
  })
})

// ── issue 3 — the bounded semantic-ancestor walk ─────────────────────────────

const SWIPER =
  '<!doctype html><html><body>' +
  '<section class="sec">' +
  '<div class="swiper" role="region" aria-roledescription="carousel" aria-label="Slides">' +
  '<div class="wrap"><div class="slide" role="group" aria-roledescription="slide">' +
  '<div class="tcard"><div class="tcontent">' +
  '<div class="ttext">We have really enjoyed having Sarah plan out a healthy menu</div>' +
  '<div class="tname">Dan H.</div>' +
  '</div></div></div></div></div>' +
  '</section></body></html>'

const SWIPER_BOXES: Record<string, Box> = {
  sec: [0, 0, 1280, 600],
  swiper: [0, 0, 1280, 600],
  wrap: [0, 0, 1280, 600],
  slide: [0, 0, 1280, 600],
  tcard: [40, 40, 1200, 520],
  tcontent: [40, 40, 1200, 520],
  ttext: [40, 60, 1200, 80],
  tname: [40, 200, 1200, 24],
}

const PLAIN = { scrollWidth: 1280, clientWidth: 1280, scrollHeight: 600 }
const rolesOf = (s: RawSignals): Record<string, string> =>
  Object.fromEntries(s.bands.flatMap((b) => b.content).map((r) => [r.text, r.a11yRole]))

describe('BUG-151 — a run records its own semantics, not an enclosing landmark’s', () => {
  it('test_UAT_FC_BUG-151_a_carousel_slide_role_is_not_the_runs_role', () => {
    // `closest('[role],…')` walked ttext → tcontent → tcard → slide[role=group]
    // and returned the SLIDE, so both runs recorded `group`. Neither run is a
    // group; the slide is, and it is three levels up.
    const roles = rolesOf(extract(SWIPER, SWIPER_BOXES, PLAIN))
    expect(roles['Dan H.']).toBe('generic')
    expect(roles['We have really enjoyed having Sarah plan out a healthy menu']).toBe('generic')
  })

  it('test_UAT_FC_BUG-151_a_landmark_region_is_also_invisible_to_the_walk', () => {
    // Same page with the slide's grouping role removed: the carousel's own
    // `role="region"` is the next `[role]` up, and it is no more a run's role
    // than the slide was. An unbounded walk would simply report `region` instead.
    const roles = rolesOf(extract(SWIPER.replace(' role="group"', ''), SWIPER_BOXES, PLAIN))
    expect(roles['Dan H.']).toBe('generic')
  })

  it('test_UAT_FC_BUG-151_the_presentational_wrapper_case_REQ_302_fixed_still_works', () => {
    // No-regression: the walk exists because a gradient-text treatment wraps the
    // words in a presentational span INSIDE the semantic element, and reading the
    // role off the span recorded `generic` beside the href its neighbour found.
    // An interactive or heading ancestor is still reached.
    const html =
      '<!doctype html><html><body><section class="sec">' +
      '<a class="lk" href="/"><span class="sp">Gigabyte Alchemy</span></a>' +
      '<h2 class="hd"><span class="sp2">Our Offerings</span></h2>' +
      '<div class="btn" role="button"><span class="sp3">Get Started</span></div>' +
      '</section></body></html>'
    const roles = rolesOf(
      extract(html, {
        sec: [0, 0, 1280, 600],
        lk: [40, 40, 400, 40],
        sp: [40, 40, 400, 40],
        hd: [40, 120, 400, 40],
        sp2: [40, 120, 400, 40],
        btn: [40, 200, 200, 48],
        sp3: [50, 210, 180, 28],
      }, PLAIN),
    )
    expect(roles['Gigabyte Alchemy']).toBe('link')
    expect(roles['Our Offerings']).toBe('heading')
    expect(roles['Get Started']).toBe('button')
  })

  it('test_UAT_FC_BUG-151_an_elements_own_role_is_still_its_own_role', () => {
    // The defect is reaching THROUGH a grouping role to an ancestor, not honouring
    // one an element carries itself: a `role="group"` box that directly holds its
    // text still reports `group`.
    const html =
      '<!doctype html><html><body><section class="sec">' +
      '<div class="grp" role="group">Slides</div></section></body></html>'
    const roles = rolesOf(
      extract(html, { sec: [0, 0, 1280, 600], grp: [40, 40, 400, 40] }, PLAIN),
    )
    expect(roles['Slides']).toBe('group')
  })
})

// ── issue 2 — the unnamed textless join ──────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A band backdrop as the projection emits one: textless, `generic`, unnamed. */
function backdrop(box_: ReturnType<typeof box>, over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'generic',
    a11yRole: 'generic',
    text: '(generic)',
    textless: true,
    box: box_,
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 0,
    fontWeight: 400,
    ...over,
  }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const props = (deltas: { property: string }[]): string[] => deltas.map((d) => d.property)

describe('BUG-151 — an unnamed textless field joins on its box, or not at all', () => {
  it('test_UAT_FC_BUG-151_two_disjoint_boxes_are_never_compared', () => {
    // The measured shape: three reference backdrops, one reproduction backdrop
    // that is only the LAST of them. FIFO gave reference[0] the single candidate
    // and read nine axes off two boxes 2000px apart.
    const ref = mani('ref', [
      backdrop(box(0, 0, 1280, 800), { surfaceFill: '#000000' }),
      backdrop(box(0, 1000, 1280, 300), { surfaceFill: '#7a7a7a' }),
      backdrop(box(0, 2000, 1280, 300), { surfaceFill: '#edc251' }),
    ])
    const act = mani('act', [backdrop(box(0, 2000, 1280, 300), { surfaceFill: '#edc251' })])
    const report = diffManifests(ref, act)
    // The one candidate pairs with the one reference box it IS.
    expect(report.matched).toBe(1)
    expect(report.unmatched).toBe(2)
    // No axis is read off a pair that does not overlap: the 2000px `position`
    // claim, and the surfaceFill / size / opacity values beside it, are gone.
    expect(props(report.deltas)).not.toContain('position')
    expect(props(report.deltas)).not.toContain('surfaceFill')
    // What is left is the honest report: two reference backdrops with no
    // counterpart, which is a coverage gap rather than twelve invented values.
    expect(report.deltas.filter((d) => d.property === 'missing')).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-151_the_box_join_pairs_across_a_document_order_disagreement', () => {
    // The reproduction enumerates its backdrops in the opposite order — exactly
    // the disagreement the FIFO fallback's own comment says it cannot rule out.
    // Geometry pairs them correctly, and the REAL residual is still reported.
    const ref = mani('ref', [
      backdrop(box(0, 0, 1280, 800), { surfaceFill: '#000000' }),
      backdrop(box(0, 1000, 1280, 300), { surfaceFill: '#7a7a7a' }),
    ])
    const act = mani('act', [
      backdrop(box(0, 1000, 1280, 300), { surfaceFill: '#7a7a7a' }),
      backdrop(box(0, 0, 1280, 800), { surfaceFill: '#ffffff' }),
    ])
    const report = diffManifests(ref, act)
    expect(report.matched).toBe(2)
    expect(report.unmatched).toBe(0)
    expect(props(report.deltas)).not.toContain('position')
    // Declining to pair wrongly is not declining to MEASURE: the hero's fill
    // really is wrong, and that is the one delta the pairing now supports.
    const fills = report.deltas.filter((d) => d.property === 'surfaceFill')
    expect(fills).toHaveLength(1)
    expect(fills[0].expected).toBe('#000000')
    expect(fills[0].actual).toBe('#ffffff')
  })

  it('test_UAT_FC_BUG-151_a_partial_overlap_above_the_floor_still_pairs', () => {
    // The floor is deliberately loose. A band reproduced 60px too short is the
    // same band drawn a little differently, and the size axis exists to say so —
    // a tight floor would refuse the very pairs the axes are there to grade.
    const ref = mani('ref', [backdrop(box(0, 0, 1280, 800), { surfaceFill: '#000000' })])
    const act = mani('act', [backdrop(box(0, 0, 1280, 740), { surfaceFill: '#000000' })])
    const report = diffManifests(ref, act)
    expect(report.matched).toBe(1)
    expect(report.unmatched).toBe(0)
    expect(props(report.deltas)).toContain('size')
  })

  it('test_UAT_FC_BUG-151_the_accessible_name_join_still_wins', () => {
    // No-regression for REQ-96: a NAMED control joins on its name, and geometry
    // does not override that. The name is the stronger key — it says the two
    // sides mean the same control — and a control the reproduction placed wrongly
    // must still pair so that its `position` delta is the one reported.
    const named = (name: string, box_: ReturnType<typeof box>): ValueElement =>
      backdrop(box_, { role: 'textbox', a11yRole: 'textbox', text: name, accessibleName: name })
    const ref = mani('ref', [named('Email', box(0, 0, 300, 48)), named('Message', box(0, 100, 300, 120))])
    const act = mani('act', [named('Message', box(0, 100, 300, 120)), named('Email', box(0, 900, 300, 48))])
    const report = diffManifests(ref, act)
    expect(report.matched).toBe(2)
    expect(report.unmatched).toBe(0)
    // Paired by name despite zero overlap, so the displacement is REPORTED
    // rather than hidden behind a `missing`.
    expect(props(report.deltas)).toContain('position')
  })

  it('test_UAT_FC_BUG-151_a_manifest_with_no_geometry_keeps_the_old_answer', () => {
    // Inert for a pre-`box` bundle: with no geometry on either side there is
    // nothing better than the queue head, so an old manifest keeps pairing
    // rather than reading `missing` on every field it has.
    const bare = (over: Partial<ValueElement> = {}): ValueElement => {
      const el = backdrop(box(0, 0, 0, 0), over)
      delete el.box
      return el
    }
    const report = diffManifests(
      mani('ref', [bare({ surfaceFill: '#000000' })]),
      mani('act', [bare({ surfaceFill: '#ffffff' })]),
    )
    expect(report.matched).toBe(1)
    expect(report.unmatched).toBe(0)
    expect(props(report.deltas)).toContain('surfaceFill')
  })
})
