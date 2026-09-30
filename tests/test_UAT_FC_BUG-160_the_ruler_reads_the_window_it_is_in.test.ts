/**
 * BUG-160 — two ways the reproduction instrument reported a page it had not
 * measured, both of them distorting the round's `gate.json`.
 *
 *   - issue 1: `measuredAt` resolved the oracle's per-run height ladder with an
 *     unconditional `lerp`, while the two resolvers beside it (`evalGeometry`,
 *     `evalScalarTrack`) branch on `segments`. So inside ONE evaluation the
 *     surface's height was resolved by a segment-aware cascade and its content's
 *     by a segment-blind one, and the overhang the probe reported between two
 *     ladder widths was partly its own arithmetic.
 *   - issue 2: `arrangement` — a CRITICAL-tier axis — was dropped by a both-sides
 *     guard on 22 of 59 pairs, and the drop reached no tally at all: `gate.json`
 *     reported `unmeasuredAxes: []` over 22 comparisons that did not happen.
 *
 * Evidence is the filed round's own numbers, transcribed. On
 * `storage/references/gigabytealchemy.ai/index` the 375→768 window is `snap` on
 * every one of the document's 69 geometry tracks and the served `home.html` pins
 * `.l1-64 { width: 233.46px }` as a literal inside `@media (min-width: 375px)` —
 * so a browser lays those runs out at 506px and at 637px exactly as it does at
 * 375px. The probe instead reported `'Practical tools for modern software
 * development'` as `height: 40` at 506 and `height: 32` at 637, which are
 * `lerp(48, 24, 131/393)` and `lerp(48, 24, 262/393)` to the hundredth — the
 * oracle's own 48 and 24, blended through a window the renderer holds. Across
 * seven wrapped runs in one card that under-measured the content column by 96px
 * at 506 and 192px at 637, and every one of the round's 18 `escape` findings sat
 * at those two widths. The bundle is gitignored, so the numbers are inlined here
 * and the SHAPE is rebuilt from the real fold.
 */
import { describe, expect, it } from 'vitest'
import {
  deriveSurfaceBacking,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { diffManifests, type ValueManifest } from '../tools/generate/src/cli/capture'
import { reconcileGates } from '../tools/generate/src/cli/gate-core'

// ── issue 1 · fixtures ───────────────────────────────────────────────────────

const LADDER = [320, 375, 768, 1024]
const VIEWPORT_HEIGHT = 900

function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
    ...over,
  } as ValueElement
}

/** The captured ladder, as the fold and the oracle both read it. */
function captureOf(elementsAt: (width: number) => ValueElement[], widths = LADDER): MultiStateCapture {
  const projections: StateProjection[] = widths.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: VIEWPORT_HEIGHT },
    state: 'rest',
    manifest: {
      source: `bug160@${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: VIEWPORT_HEIGHT },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

const WRAPPED = 'Practical tools for modern software development'

/**
 * The filed page's shape, at its own numbers: one element that REFLOWS between
 * 375 and 768 — a sidebar that jumps from the margin into a second column — and
 * one wrapped run whose measured height falls 72 → 48 → 24 as the column widens.
 *
 * The reflow is what makes the window a `snap` window, and it is `segmentKind`
 * and `holdAcrossReflowWindows` in the real fold that decide so, not this
 * fixture: the jump is 480px against a quarter-viewport threshold of 192px, and
 * a window any node snaps in is a window every node holds across. So the
 * document under test carries the same `['interpolate', 'snap', 'interpolate']`
 * the reference does, derived rather than declared.
 */
function reflowingLadder(width: number): ValueElement[] {
  const wide = width >= 768
  return [
    run('Sidebar', { x: wide ? 500 : 20, y: 10, width: 200, height: 24 }),
    run(WRAPPED, { x: 40, y: 100, width: 240, height: width <= 320 ? 72 : wide ? 24 : 48 }),
  ]
}

/** The height the evaluator gives one text leaf at `width`. */
function heightAt(doc: L1Document, oracle: MultiStateCapture, width: number, text: string): number {
  const leaf = evaluateLayout(doc, width, { measured: measuredTextHeights(oracle) }).leaves.find(
    (l) => l.text === text,
  )
  if (!leaf) throw new Error(`no leaf for ${text}`)
  return leaf.box.height
}

describe('BUG-160 issue 1 — the measured height obeys the cascade its position obeys', () => {
  const capture = captureOf(reflowingLadder)
  const doc = foldToL1(capture)

  it('test_UAT_FC_BUG-160_the_fold_marks_the_reflow_window_snap_on_every_track', () => {
    // The premise, earned from the real fold rather than asserted: the window
    // between 375 and 768 is `snap` on BOTH tracks — the sidebar that reflows and
    // the run that merely sits inside the window — which is exactly the promotion
    // `holdAcrossReflowWindows` exists to make. Without this the rest of the block
    // would be testing a document the fold never produces.
    const segments: Array<string[] | undefined> = []
    const walk = (node: L1Node): void => {
      if ('geometry' in node && node.geometry) segments.push(node.geometry.segments)
      const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
      kids.forEach(walk)
    }
    walk(doc.root)

    expect(segments.length).toBeGreaterThan(0)
    for (const s of segments) expect(s).toEqual(['interpolate', 'snap', 'interpolate'])
  })

  it('test_UAT_FC_BUG-160_a_run_holds_its_measured_height_across_a_snap_window', () => {
    // The defect, at the filed widths. `lerp(48, 24, 131/393)` is 40 and
    // `lerp(48, 24, 262/393)` is 32 — the two numbers the round's finding boxes
    // carried. The renderer paints 48 at both, because the window is held: same
    // column width, same wrap points, same line count as at 375.
    expect(heightAt(doc, capture, 506, WRAPPED)).toBe(48)
    expect(heightAt(doc, capture, 637, WRAPPED)).toBe(48)

    // And the asymmetry the ticket names is closed, not merely moved: inside one
    // evaluation the content's height is now as INVARIANT across the held window
    // as the surface's own box already was. Two off-sample widths in the same
    // window can no longer disagree.
    expect(heightAt(doc, capture, 506, WRAPPED)).toBe(heightAt(doc, capture, 637, WRAPPED))
  })

  it('test_UAT_FC_BUG-160_an_interpolate_window_still_interpolates', () => {
    // The hold is EARNED by the segment, not applied everywhere. 338 sits inside
    // the 320→375 window, which is `interpolate`, and the round's evidence turns
    // on that distinction: every off-sample width inside the one `snap` window
    // failed and all eight outside it were clean. `lerp(72, 48, 18/55)`.
    expect(heightAt(doc, capture, 338, WRAPPED)).toBeCloseTo(72 - 24 * (18 / 55), 6)
  })

  it('test_UAT_FC_BUG-160_a_captured_width_still_reads_the_oracle_exactly', () => {
    // A resting evaluation at a rung is still the oracle, to the pixel, at the
    // bottom of a held window, at the top of it, and outside the ladder entirely.
    expect(heightAt(doc, capture, 320, WRAPPED)).toBe(72)
    expect(heightAt(doc, capture, 375, WRAPPED)).toBe(48)
    expect(heightAt(doc, capture, 768, WRAPPED)).toBe(24)
    expect(heightAt(doc, capture, 1024, WRAPPED)).toBe(24)
    expect(heightAt(doc, capture, 240, WRAPPED)).toBe(72)
    expect(heightAt(doc, capture, 1600, WRAPPED)).toBe(24)
  })
})

// ── issue 1 · the escape set, and the alignment the ticket asked to assert ────

const BAND_ID = 'section-band-0'
const COPY = 'An open-source platform and methodology for hands-off software development'

type Frame = { at: number; x: number; y: number; width: number }

/**
 * A hand-authored band with one run on it whose height is its CONTENT's — no
 * pinned keyframe height, which is the ordinary case for a text leaf and the
 * only case `measuredAt` is reached in.
 *
 * Hand-authored rather than folded because these two cases bend things a fold
 * cannot be asked to produce on demand: a band whose own height is wrong at a
 * captured width, and an oracle that measured the run at fewer widths than the
 * document tracks it at.
 */
function bandPage(band: Array<Frame & { height: number }>, runFrames: Frame[]): L1Document {
  const surface: L1Node = {
    kind: 'box',
    id: BAND_ID,
    axes: { surfaceFill: '#f8f5f2' },
    geometry: {
      keyframes: band.map((f) => ({ ...f, atHeight: VIEWPORT_HEIGHT })),
      segments: ['interpolate', 'snap'],
    },
  }
  const copy: L1Node = {
    kind: 'text',
    text: COPY,
    axes: { color: '#111111', fontSizePx: 16, lineHeightPx: 24 },
    backedBy: BAND_ID,
    geometry: {
      keyframes: runFrames.map((f) => ({ ...f, atHeight: VIEWPORT_HEIGHT })),
      segments: ['interpolate', 'snap'],
    },
  }
  return { widths: [320, 375, 768], background: '#ffffff', root: { kind: 'box', children: [surface, copy] } }
}

/** An oracle that measured `COPY` at exactly the widths given, and nowhere else. */
function oracleOf(heights: Array<{ at: number; height: number }>): MultiStateCapture {
  return captureOf(
    (width) => {
      const h = heights.find((m) => m.at === width)
      return h ? [run(COPY, { x: 20, y: 110, width: 280, height: h.height })] : []
    },
    heights.map((h) => h.at),
  )
}

const escapes = (doc: L1Document, oracle: MultiStateCapture, width: number): string[] =>
  evaluateLayout(doc, width, {
    measured: measuredTextHeights(oracle),
    backing: deriveSurfaceBacking(doc),
  })
    .findings.filter((f) => f.kind === 'escape')
    .map((f) => f.detail)

describe('BUG-160 issue 1 — the escape set is the page, not the ruler', () => {
  // A band held across the 375→768 window at 120px tall, carrying copy the oracle
  // measured at 24px up to 375 and 200px at 768. The band's own height holds
  // across the window because `evalGeometry` reads the segment; before this fix
  // the copy's did not, so at 637 the probe grew the run to `lerp(24, 200, 2/3)`
  // = 141px inside a 120px band and reported an overhang that no browser paints.
  // The band is deliberately too SHORT at 768 — the run really does escape there —
  // so the fix has to remove the manufactured finding without removing the real one.
  const band = [
    { at: 320, x: 0, y: 100, width: 320, height: 120 },
    { at: 375, x: 0, y: 100, width: 375, height: 120 },
    { at: 768, x: 0, y: 100, width: 768, height: 150 },
  ]
  const runFrames = [
    { at: 320, x: 20, y: 110, width: 280 },
    { at: 375, x: 20, y: 110, width: 280 },
    { at: 768, x: 20, y: 110, width: 280 },
  ]
  const doc = bandPage(band, runFrames)
  const oracle = oracleOf([
    { at: 320, height: 24 },
    { at: 375, height: 24 },
    { at: 768, height: 200 },
  ])

  it('test_UAT_FC_BUG-160_a_held_window_manufactures_no_overhang', () => {
    // The arithmetic the finding was made of, stated so the assertion below has a
    // stake: the blend the old resolver returned at 637 overhangs the band it sits
    // in, and the held measurement does not.
    const blended = 24 + (200 - 24) * ((637 - 375) / (768 - 375))
    expect(110 + blended).toBeGreaterThan(100 + 120)
    expect(110 + 24).toBeLessThan(100 + 120)

    expect(escapes(doc, oracle, 506)).toEqual([])
    expect(escapes(doc, oracle, 637)).toEqual([])
  })

  it('test_UAT_FC_BUG-160_a_real_overhang_is_still_reported', () => {
    // Earned, in the only way that matters: the fix silences the ruler's own
    // arithmetic and nothing else. At 768 the oracle really did measure 200px of
    // copy inside a 150px band, and that is the reproduction's to answer.
    const found = escapes(doc, oracle, 768)
    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/no longer covered by its backing surface/)
  })

  it('test_UAT_FC_BUG-160_the_segment_is_resolved_by_width_not_by_track_index', () => {
    // The ticket asked for the index alignment to be asserted rather than assumed,
    // because a measured track SKIPS a width the oracle did not measure that run
    // at. Here it skips 320: the document tracks three keyframes and the oracle
    // holds two, so the `[375, 768)` measured segment is index 0 while the window
    // it spans is the document's index 1. An implementation that indexed
    // `segments` by the measured track's own position would read `interpolate`
    // here and blend; resolving the window by WIDTH against the node's ladder
    // cannot mis-align, whatever the measured track omits.
    const sparse = oracleOf([
      { at: 375, height: 24 },
      { at: 768, height: 200 },
    ])

    expect(heightAt(doc, sparse, 637, COPY)).toBe(24)
    expect(escapes(doc, sparse, 637)).toEqual([])
    // And the segment it reads is still the RIGHT one, not merely a held one: the
    // window above 768 is off the end of the ladder and holds the last
    // measurement, which is the taller of the two.
    expect(heightAt(doc, sparse, 900, COPY)).toBe(200)
  })
})

// ── issue 2 ──────────────────────────────────────────────────────────────────

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    box: { x: 20, y: 100, width: 280, height: 24 },
    ...over,
  } as ValueElement
}

function manifest(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [], viewport: { width: 1280, height: 800 } }
}

const arrangementUnmeasured = (report: ReturnType<typeof diffManifests>) =>
  report.unmeasuredAxes.filter((u) => u.axis === 'arrangement')
const arrangementDeclined = (report: ReturnType<typeof diffManifests>) =>
  report.notComparableAxes.filter((a) => a.axis === 'arrangement')

describe('BUG-160 issue 2 — an arrangement nobody compared is not an arrangement that agreed', () => {
  it('test_UAT_FC_BUG-160_a_one_sided_arrangement_is_counted_and_named', () => {
    // The filed shape: `arrangement` relates an element to the one BEFORE it in
    // that side's own top-to-bottom sort, and the two sides do not sort the same
    // list — a reproduction emits band containers a reference has no counterpart
    // for — so `relate` reads null on the reference for a pair the reproduction
    // read fine. The both-sides guard then drops the comparison, correctly, and
    // until now silently: on the filed round 22 of 59 pairs, on a CRITICAL-tier
    // axis, under a headline of `0 axes`.
    const report = diffManifests(
      manifest('ref', [el('Gigabyte Alchemy'), el('Intentional Software'), el('Our Mission', { arrangement: 'stack' })]),
      manifest('repro', [
        el('Gigabyte Alchemy', { arrangement: 'row' }),
        el('Intentional Software', { arrangement: 'stack' }),
        el('Our Mission', { arrangement: 'stack' }),
      ]),
    )

    // Still not a delta — an axis nobody measured is not a defect found.
    expect(report.deltas.filter((d) => d.property === 'arrangement')).toEqual([])
    // But no longer silence. One row for the side that read nothing, never one
    // per element, carrying the count and the mechanism.
    const rows = arrangementUnmeasured(report)
    expect(rows).toHaveLength(1)
    expect(rows[0].side).toBe('reference')
    expect(rows[0].scope).toBe('element')
    expect(rows[0].reason).toMatch(/no arrangement for 2 of 3 paired elements/)
    expect(rows[0].reason).toMatch(/do not sort the same element list/)
  })

  it('test_UAT_FC_BUG-160_the_reproduction_side_is_counted_the_same_way', () => {
    // Symmetric by construction, because the guard is: the round that filed this
    // happened to read nulls on the reference, and the one that reads them on the
    // reproduction is the same silence facing the other way.
    const rows = arrangementUnmeasured(
      diffManifests(
        manifest('ref', [el('Get in touch', { arrangement: 'row' })]),
        manifest('repro', [el('Get in touch')]),
      ),
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].side).toBe('reproduction')
    expect(rows[0].reason).toMatch(/no arrangement for 1 of 1 paired elements/)
  })

  it('test_UAT_FC_BUG-160_a_declined_arrangement_reaches_the_declination_list', () => {
    // The second guard in the same block. REQ-331 declines the axis where the
    // element's OWN box has moved, because the position delta above already names
    // the real defect and this would be a second, louder report of a third
    // element's movement. That call stands — and it is a measurement not made, so
    // it is counted where REQ-270's anchor refusal is counted.
    const report = diffManifests(
      manifest('ref', [el('Alley scene', { arrangement: 'row' })]),
      manifest('repro', [
        el('Alley scene', { arrangement: 'stack', box: { x: 20, y: 160, width: 280, height: 24 } }),
      ]),
    )

    expect(report.deltas.filter((d) => d.property === 'arrangement')).toEqual([])
    const declined = arrangementDeclined(report)
    expect(declined).toHaveLength(1)
    expect(declined[0].scope).toBe('element')
    expect(declined[0].reason).toMatch(/1 of 1 paired elements/)
    expect(declined[0].reason).toMatch(/own box had moved/)
  })

  it('test_UAT_FC_BUG-160_a_compared_axis_reports_no_hole_and_still_reports_its_delta', () => {
    // Earned in both directions. A page whose two sides both read the axis on
    // every pair puts NO row anywhere — the tally counts measurements missed, not
    // measurements made, and a permanent row on every report would be worth
    // nothing — and a genuine disagreement on a still element is still the
    // CRITICAL delta it always was.
    const report = diffManifests(
      manifest('ref', [el('Our Mission', { arrangement: 'row' }), el('The Alchemy', { arrangement: 'stack' })]),
      manifest('repro', [el('Our Mission', { arrangement: 'stack' }), el('The Alchemy', { arrangement: 'stack' })]),
    )

    expect(arrangementUnmeasured(report)).toEqual([])
    expect(arrangementDeclined(report)).toEqual([])
    expect(report.deltas.filter((d) => d.property === 'arrangement')).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-160_the_gate_stops_reporting_zero_axes_over_them', () => {
    // The hop that decides whether any of this exists: `gate.json` is what the
    // round reads. The filed round reported `unmeasuredAxes: []` and a headline
    // unmeasured count of 1 over 22 comparisons that did not happen; the count now
    // reaches the gate and the rung names the axis.
    const diff = diffManifests(
      manifest('ref', [el('Gigabyte Alchemy'), el('Our Mission', { arrangement: 'stack' })]),
      manifest('repro', [
        el('Gigabyte Alchemy', { arrangement: 'row' }),
        el('Our Mission', { arrangement: 'stack' }),
      ]),
    )
    const gate = reconcileGates({
      perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
      l1Gate: {
        pass: true,
        onSample: { pass: true, byWidth: [] },
        offSample: { pass: true, byWidth: [] },
        contentRobustness: { pass: true, byWidth: [] },
        sampleFidelity: { pass: true, maxDeltaPx: 0, byWidth: [] },
      },
      coverage: { sections: 0, elements: 2, findings: [] },
      values: diff,
    })

    expect(gate.values.unmeasuredAxes.filter((u) => u.axis === 'arrangement')).toHaveLength(1)
    expect(gate.nextStep).toMatch(/arrangement/)
  })
})
