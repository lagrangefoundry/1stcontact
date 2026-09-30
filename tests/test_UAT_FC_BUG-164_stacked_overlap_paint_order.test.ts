/**
 * BUG-164 — `stacked: true` switched the overlap probe off, so a reproduction
 * whose `<h1>` was painted completely beneath a collage photograph passed every
 * gate.
 *
 * `stacked` says an overlap is the design; it says nothing about which side is on
 * top. REQ-331 made the fold mark every collage picture `stacked`, and one side of
 * a pair was enough to exempt it — so on faelan.com "FAELAN overlaps image" was
 * computed and then discarded. The probe now models the renderer's paint order
 * (REQ-347's `paintOrder`, else tree order) and reports a `buried` finding for the
 * one pair a declaration can never be about: a text run painted UNDER the picture
 * or panel it overlaps. Everything else a declared stack covers stays exempt.
 */
import { describe, expect, it } from 'vitest'
import { onSampleProbe } from '../tools/generate/src'
import { reconcileGates } from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import type { EnvelopeReport } from '../tools/generate/src/l1/probes'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { validateL1 } from '../packages/site-schema/src/index'

const at = (x: number, y: number, width: number, height?: number) => ({
  keyframes: [{ at: 1280, x, y, width, ...(height !== undefined ? { height } : {}) }],
})

const headline = (extra: Partial<L1Node> = {}): L1Node =>
  ({
    kind: 'text',
    id: 'hero-title',
    text: 'FAELAN',
    axes: { fontSizePx: 64, lineHeightPx: 96, color: '#ffffff' },
    geometry: at(102, 64, 268, 96),
    ...extra,
  }) as L1Node

const photo = (id: string, geometry: ReturnType<typeof at>, extra: Partial<L1Node> = {}): L1Node =>
  ({ kind: 'image', id, src: `/assets/${id}.jpg`, alt: id, geometry, stacked: true, ...extra }) as L1Node

/** The faelan.com hero in miniature: the headline first, a collage photo after it. */
const montage = (children: L1Node[]): L1Document => {
  const doc = { widths: [1280], background: '#ffffff', root: { kind: 'box', id: 'root', children } } as L1Document
  expect(validateL1(doc).ok, 'fixture is legal L1').toBe(true)
  return doc
}

/**
 * The findings of the first sample. The on-sample probe evaluates each captured
 * width at more than one viewport height, and a pinned hero collides identically
 * at every one of them, so one sample says everything these cases are about.
 */
const findings = (doc: L1Document) => onSampleProbe(doc).byWidth[0].findings

const CLEAN_COVERAGE: ReferenceCoverage = {
  mirroredImages: 2,
  referencedImages: 2,
  unreferencedImages: [],
  sections: 4,
  pageHeightPx: 2000,
  pxPerSection: 500,
  findings: [],
}
const QUIET = { meanDiff: 2.87, pctOverThreshold: 1.66, regions: [] }
const NO_DELTAS = {
  deltas: [],
  matched: 40,
  unmatched: 0,
  unpairedActual: [],
  unpairedSections: [],
  unpairedActualSections: [],
  notComparableAxes: [],
}
const NO_COLLISIONS: EnvelopeReport = { pass: true, byWidth: [] }

describe('BUG-164 — a declared stack no longer hides words painted beneath it', () => {
  it('test_UAT_FC_BUG-164_text_painted_under_a_stacked_photo_is_reported_buried', () => {
    // Tree order paints the later photograph over the earlier headline, and
    // nothing declares a level — exactly the reproduction this ticket came from.
    const doc = montage([headline(), photo('collage-1', at(0, 0, 640, 600))])
    const probe = onSampleProbe(doc)
    expect(probe.pass).toBe(false)
    const all = findings(doc)
    expect(all).toHaveLength(1)
    expect(all[0].kind).toBe('buried')
    expect(all[0].detail).toBe('FAELAN is painted beneath image')
    // The run first, what covers it second — and both rects, so the claim closes.
    expect(all[0].paths).toEqual(['0.0', '0.1'])
    expect(all[0].boxes).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-164_a_declared_level_above_the_photo_clears_it', () => {
    // REQ-347's fix, as the fold writes it from the reference's `z-index: 20` over
    // a photo at 15: the declared order agrees with the design, so the stack is
    // the composition it says it is and the probe stays silent.
    const doc = montage([headline({ paintOrder: 20 }), photo('collage-1', at(0, 0, 640, 600), { paintOrder: 15 })])
    expect(onSampleProbe(doc).pass).toBe(true)
    expect(findings(doc)).toEqual([])
  })

  it('test_UAT_FC_BUG-164_a_declared_level_beats_tree_order_in_both_directions', () => {
    // The headline comes AFTER the photo — tree order alone would put it on top —
    // but the photo declares a level and the run does not, so the photo paints
    // over it. The level is what the renderer emits, so it is what the probe reads.
    const doc = montage([photo('collage-1', at(0, 0, 640, 600), { paintOrder: 5 }), headline()])
    const all = findings(doc)
    expect(all.map((f) => f.kind)).toEqual(['buried'])
    expect(all[0].paths).toEqual(['0.1', '0.0'])

    // And a negative level sends the photo BEHIND the tree-order run after it.
    const behind = montage([headline(), photo('collage-1', at(0, 0, 640, 600), { paintOrder: -1 })])
    expect(findings(behind)).toEqual([])
  })

  it('test_UAT_FC_BUG-164_words_on_top_and_picture_pairs_stay_exempt', () => {
    // BUG-112's own case — a headline laid over a hero photograph — and a collage
    // of photographs overlapping each other: the declaration is about these, and
    // neither hides a word.
    const doc = montage([
      photo('collage-1', at(0, 0, 640, 600)),
      photo('collage-2', at(300, 200, 640, 600)),
      headline(),
    ])
    expect(onSampleProbe(doc).pass).toBe(true)
    expect(findings(doc)).toEqual([])
  })

  it('test_UAT_FC_BUG-164_the_gate_names_a_buried_run_and_asks_for_a_paint_level', () => {
    const doc = montage([headline(), photo('collage-1', at(0, 0, 640, 600))])
    const report = reconcileGates({
      l1Gate: { pass: false, onSample: onSampleProbe(doc), offSample: NO_COLLISIONS, contentRobustness: NO_COLLISIONS },
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })
    // The faelan round read `verdict: pass` at a page mean of 2.87; the buried
    // headline is structural whatever the average says.
    expect(report.verdict).toBe('structural-failure')
    expect(report.layout.findings.length).toBeGreaterThan(0)
    expect(report.layout.findings.every((f) => f.kind === 'buried')).toBe(true)
    expect(report.diagnosis).toContain('painted beneath a picture stacked over them')
    expect(report.diagnosis).toContain('FAELAN is painted beneath image')
    expect(report.nextStep).toContain('paintOrder')
    // The pair is already declared — "declare it `stacked`" would be the wrong advice.
    expect(report.nextStep).not.toContain('stacked: true')
  })
})
