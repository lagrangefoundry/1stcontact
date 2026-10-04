/**
 * BUG-197 — two instrument defects found on www.bluelotusintegralhealing.com
 * (repro-console loop 1, iteration 2).
 *
 *  1. A fold-declared `backedBy` that the fold's own geometry contradicts AT REST
 *     was linked unconditionally and reported as an `escape` under a diagnosis
 *     that says the page "is exact at rest and comes apart the moment the
 *     viewport moves". It is now held to the resting states like an observed
 *     pair, and a failure there is reported as `declared-backing-uncovered` at the
 *     captured width, with a diagnosis that points at the fold's `backedBy`.
 *  2. A chip sized by `min-height` + flex centring (padding 0/0, transparent fill,
 *     own border + radius) against one that pads its label (18/17, own plate) was
 *     reported as three LOW deltas per pill over identical pixels.
 *
 * Synthetic documents and manifests carry the evidence (reference bundles are
 * gitignored); the manifest values are the iteration's own.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { contentRobustnessProbe, offSampleProbe, onSampleProbe } from '../tools/generate/src/l1'
import { layoutCollisions, reconcileGates } from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import type { EnvelopeReport } from '../tools/generate/src/l1/probes'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli/capture/values-diff'

// ── 1. declared backing that fails at rest ────────────────────────────────────

const WIDTHS = [320, 768, 1280]
const H = 800
type Frame = { at: number; x: number; y: number; width: number; height: number }
const kfs = (fs: Frame[]) => fs.map((f) => ({ ...f, atHeight: H }))
const band = (id: string, fs: Frame[]): L1Node => ({
  kind: 'box',
  id,
  axes: { surfaceFill: '#30499c' },
  geometry: { keyframes: kfs(fs) },
  sizing: { width: { mode: 'fluid' } },
})

/**
 * "Contact" declares `section-band-4`, which covers it at 320 and 768 but sits
 * 152px above it at 1280 — a captured width. `backdrop-3`, the same fill, covers
 * it everywhere; that is why the page paints correctly.
 */
function misdeclaredPage(): L1Document {
  const full = (y: number, h: number): Frame[] => WIDTHS.map((w) => ({ at: w, x: 0, y, width: w, height: h }))
  return {
    widths: WIDTHS,
    background: '#ffffff',
    root: {
      kind: 'box',
      children: [
        band('backdrop-3', full(1900, 600)),
        band('section-band-4', [
          { at: 320, x: 0, y: 2200, width: 320, height: 200 },
          { at: 768, x: 0, y: 2200, width: 768, height: 200 },
          { at: 1280, x: 0, y: 1994, width: 1280, height: 95 },
        ]),
        {
          kind: 'text',
          text: 'Contact',
          backedBy: 'section-band-4',
          axes: { color: '#ffffff', fontSizePx: 18 },
          geometry: {
            keyframes: kfs(WIDTHS.map((w) => ({ at: w, x: 20, y: 2241, width: 200, height: 40 }))),
          },
        },
      ],
    },
  } as L1Document
}

const ofKind = (r: EnvelopeReport, kind: string) =>
  r.byWidth.flatMap((w) => w.findings.filter((f) => f.kind === kind).map((f) => ({ ...f, at: w })))

const CLEAN_COVERAGE: ReferenceCoverage = {
  mirroredImages: 0,
  referencedImages: 0,
  unreferencedImages: [],
  sections: 2,
  pageHeightPx: 800,
  pxPerSection: 400,
  findings: [],
}
const NO_DELTAS = {
  deltas: [],
  matched: 10,
  unmatched: 0,
  unpairedActual: [],
  unpairedSections: [],
  unpairedActualSections: [],
  notComparableAxes: [],
}

describe('BUG-197 item 1 — a declaration false at rest is not a viewport-motion escape', () => {
  it('test_UAT_FC_BUG-197_declared_pair_failing_at_rest_is_reported_as_declared_backing_uncovered', () => {
    const doc = misdeclaredPage()
    expect(validateL1(doc).ok).toBe(true)
    const on = onSampleProbe(doc, { heights: [H] })
    expect(on.pass).toBe(false)
    const found = ofKind(on, 'declared-backing-uncovered')
    // Once, at the one captured width where the declaration is false.
    expect(found).toHaveLength(1)
    expect(found[0].at.width).toBe(1280)
    expect(found[0].width).toBe(1280)
    expect(found[0].detail).toContain("'Contact'")
    expect(found[0].detail).toContain('section-band-4')
    expect(found[0].detail).toMatch(/\d+px below its bottom edge/)
    // The run then the surface, with both boxes, so the overhang can be checked.
    expect(found[0].paths).toHaveLength(2)
    const [run, surface] = found[0].boxes!
    expect(run.y + run.height - (surface.y + surface.height)).toBeGreaterThan(2)
  })

  it('test_UAT_FC_BUG-197_declared_pair_failing_at_rest_raises_no_escape_on_any_probe', () => {
    const doc = misdeclaredPage()
    for (const r of [
      onSampleProbe(doc, { heights: [H] }),
      offSampleProbe(doc, { heights: [H] }),
      contentRobustnessProbe(doc, { heights: [H], scale: 1.2 }),
    ]) {
      expect(ofKind(r, 'escape').filter((f) => f.detail.includes('section-band-4'))).toEqual([])
    }
    // The off-sample and content probes never report it: it is a fact about a
    // captured width, not about a sample between them or under grown content.
    expect(ofKind(offSampleProbe(doc, { heights: [H] }), 'declared-backing-uncovered')).toEqual([])
  })

  it('test_UAT_FC_BUG-197_gate_diagnosis_points_at_the_folds_backedBy_not_surface_sizing', () => {
    const doc = misdeclaredPage()
    const onSample = onSampleProbe(doc, { heights: [H] })
    const report = reconcileGates({
      l1Gate: { pass: false, onSample, offSample: offSampleProbe(doc, { heights: [H] }), contentRobustness: { pass: true, byWidth: [] } },
      coverage: CLEAN_COVERAGE,
      perceptual: { meanDiff: 0.2, pctOverThreshold: 0.05, regions: [] },
      values: NO_DELTAS,
    } as Parameters<typeof reconcileGates>[0])
    expect(report.verdict).toBe('structural-failure')
    expect(report.layout.findings.some((f) => f.kind === 'declared-backing-uncovered')).toBe(true)
    expect(report.diagnosis).toContain('declare a backing surface that does not cover them at a captured width')
    expect(report.diagnosis).not.toContain('comes apart the moment the viewport moves')
    expect(report.nextStep).toContain('backedBy')
    expect(report.nextStep).not.toContain('size itself from the content it backs')
    // …and it is not counted as an overlap.
    expect(report.diagnosis).not.toContain('collides with itself')
  })

  it('test_UAT_FC_BUG-197_declared_pair_holding_at_rest_still_reports_escape_between_samples', () => {
    // The declaration holds at every rung; the band snaps while the run
    // interpolates, so they part between 768 and 1280. That is still `escape`.
    const doc: L1Document = {
      widths: WIDTHS,
      background: '#ffffff',
      root: {
        kind: 'box',
        children: [
          {
            ...band('section-band-0', [
              { at: 320, x: 0, y: 100, width: 320, height: 200 },
              { at: 768, x: 0, y: 100, width: 768, height: 200 },
              { at: 1280, x: 0, y: 500, width: 1280, height: 200 },
            ]),
          },
          {
            kind: 'text',
            text: 'Connection',
            backedBy: 'section-band-0',
            axes: { color: '#111111', fontSizePx: 18 },
            geometry: {
              keyframes: kfs([
                { at: 320, x: 20, y: 150, width: 280, height: 40 },
                { at: 768, x: 20, y: 150, width: 280, height: 40 },
                { at: 1280, x: 20, y: 550, width: 280, height: 40 },
              ]),
              segments: ['interpolate', 'snap'],
            },
          },
        ],
      },
    } as L1Document
    expect(ofKind(onSampleProbe(doc, { heights: [H] }), 'declared-backing-uncovered')).toEqual([])
    const collisions = layoutCollisions({ offSample: offSampleProbe(doc, { heights: [H] }) })
    expect(collisions.some((c) => c.kind === 'escape' && c.detail.includes('section-band-0'))).toBe(true)
  })
})

// ── 2. a chip's inset: padding on one side, min-height on the other ───────────

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'link',
    text,
    color: '#ffffff',
    fontFamily: 'Lato, sans-serif',
    fontSizePx: 16,
    fontWeight: 500,
    ...over,
  }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const BORDER = { widthPx: 1, color: '#ffffff', style: 'solid' }

/** The reference pill: min-height + flex centring, transparent fill, on the hero band. */
const refPill = (over: Partial<ValueElement> = {}): ValueElement =>
  el('1. About BQH', {
    paddingTopPx: 0,
    paddingBottomPx: 0,
    surfaceFill: '#30499c',
    box: { x: 233.984375, y: 654, width: 193.875, height: 56 },
    renderedTextBox: { x: 282.09375, y: 672.5, width: 97.65625, height: 19 },
    borderRadiusPx: 28,
    border: BORDER,
    surface: { self: false, box: { x: 0, y: 84, width: 1280, height: 882 }, borderRadiusPx: 0, boxShadow: null, border: null },
    ...over,
  } as Partial<ValueElement>)

/** Ours: the chip inset as padding (REQ-371), painting its own plate. */
const ourPill = (over: Partial<ValueElement> = {}): ValueElement => {
  const box = { x: 233.96875, y: 654, width: 193.875, height: 56 }
  return el('1. About BQH', {
    paddingTopPx: 18,
    paddingBottomPx: 17,
    surfaceFill: '#30499c',
    box,
    renderedTextBox: { x: 282.078125, y: 673, width: 97.65625, height: 19 },
    borderRadiusPx: 28,
    border: BORDER,
    surface: { self: true, box, borderRadiusPx: 28, boxShadow: null, border: BORDER },
    ...over,
  } as Partial<ValueElement>)
}

const rowsFor = (exp: ValueElement, act: ValueElement) =>
  diffManifests(mani('ref', [exp]), mani('draft', [act])).deltas.filter((d) => d.text === '1. About BQH')

describe('BUG-197 item 2 — a chip inset is compared as the inset both sides measure', () => {
  it('test_UAT_FC_BUG-197_same_pill_by_min_height_and_by_padding_reads_clean', () => {
    expect(rowsFor(refPill(), ourPill())).toEqual([])
  })

  it('test_UAT_FC_BUG-197_a_real_inset_difference_is_still_reported_as_padding', () => {
    // Our label sits 10px lower in the same box: a real vertical-centring defect.
    const rows = rowsFor(refPill(), ourPill({ renderedTextBox: { x: 282.078125, y: 683, width: 97.65625, height: 19 } }))
    const props = rows.map((d) => d.property)
    expect(props).toContain('paddingTopPx')
    expect(props).toContain('paddingBottomPx')
    const top = rows.find((d) => d.property === 'paddingTopPx')!
    expect(top.expected).toBe('inset 18.5')
    expect(top.actual).toBe('inset 29')
  })

  it('test_UAT_FC_BUG-197_a_fill_less_chip_is_compared_on_border_and_radius', () => {
    // No invented-plate row for the fill-less chip, but its corners are still compared.
    const rows = rowsFor(refPill(), ourPill({ borderRadiusPx: 4, surface: { self: true, box: ourPill().box!, borderRadiusPx: 4, boxShadow: null, border: BORDER } } as Partial<ValueElement>))
    expect(rows.some((d) => d.property === 'surfaceFill')).toBe(false)
    expect(rows.some((d) => d.property === 'shape')).toBe(true)
  })

  it('test_UAT_FC_BUG-197_an_invented_plate_under_a_borderless_run_is_still_reported', () => {
    // BUG-190's case is untouched: a reference with no border of its own on the band.
    const rows = rowsFor(refPill({ border: null, borderRadiusPx: 0 } as Partial<ValueElement>), ourPill())
    const plate = rows.find((d) => d.property === 'surfaceFill')
    expect(plate?.expected).toBe('surface band 1280×882')
    expect(plate?.actual).toBe('own plate 194×56')
  })

  it('test_UAT_FC_BUG-197_padding_with_no_taller_box_is_compared_raw', () => {
    // Both runs' boxes hug their glyphs: there is no inset to measure, so a raw
    // padding disagreement is reported as before.
    const box = { x: 10, y: 10, width: 200, height: 19 }
    const glyph = { x: 10, y: 10, width: 100, height: 19 }
    const report = diffManifests(
      mani('ref', [el('Plain', { paddingTopPx: 0, paddingBottomPx: 0, box, renderedTextBox: glyph })]),
      mani('draft', [el('Plain', { paddingTopPx: 4, paddingBottomPx: 0, box, renderedTextBox: glyph })]),
    )
    const row = report.deltas.find((d) => d.text === 'Plain' && d.property === 'paddingTopPx')
    expect(row?.expected).toBe('0')
    expect(row?.actual).toBe('4')
  })
})
