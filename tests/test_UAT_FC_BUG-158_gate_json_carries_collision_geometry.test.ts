/**
 * BUG-158 — the geometry BUG-153 put on every collision never reached `gate.json`.
 *
 * BUG-153 item 3's second ask was that *"a finding whose whole record was
 * `{kind, detail, paths}` could not be checked from the artifact at all"*, and
 * its fix put the resolved box of each path onto the probe's own finding. That
 * landed and works. But the only path from a probe finding into `gate.json` is
 * `layoutCollisions`, which rebuilds the record field by field, and `boxes` was
 * not among the fields it rebuilt — so the artifact a diagnosing round actually
 * opens went on carrying five keys and no number:
 *
 *     { "kind": "escape",
 *       "detail": "at 375px×768px: '© 2025 Faelan Westhead. All rights reserved.'
 *                  is no longer covered by its backing surface section-band-1 —
 *                  8px below its bottom edge",
 *       "width": 375, "height": 768, "paths": ["0.2.0", "0.2"] }
 *
 * — a sentence asserting an 8px overhang with nothing in the record to put
 * against it, and no route to one short of re-running the evaluator. That is
 * what iteration 3 of `repro-faelan-com` was handed, and the two boxes would
 * have shown at a glance that the *run* had been grown to three lines rather
 * than that the *band* was too short, which is the opposite of the fix the
 * verdict's `nextStep` prescribed.
 *
 * **These UATs read the artifact surface, not the probe's return value.** That
 * distinction is the whole ticket: BUG-153's own UAT asserts `found.boxes` on
 * what `contentRobustnessProbe` returns, and it passed throughout — because the
 * probe was never the layer that dropped them. So every assertion below is made
 * on a `reconcileGates` report put through `JSON.parse(JSON.stringify(…))`,
 * which is `gate.json` exactly: `1c gate` writes the file as
 * `JSON.stringify(report, null, 2)` and adds nothing.
 */
import { describe, expect, it } from 'vitest'
import { contentRobustnessProbe, evaluateLayout, onSampleProbe } from '../tools/generate/src/l1'
import { layoutCollisions, reconcileGates } from '../tools/generate/src/cli/gate'
import type { GateReport, ReferenceCoverage } from '../tools/generate/src/cli/gate'
import type { EnvelopeReport } from '../tools/generate/src/l1/probes'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'

/** The other three gates, quiet — this file is about the layout one alone. */
const CLEAN_COVERAGE: ReferenceCoverage = {
  mirroredImages: 0,
  referencedImages: 0,
  unreferencedImages: [],
  sections: 2,
  pageHeightPx: 800,
  pxPerSection: 400,
  findings: [],
}
const QUIET = { meanDiff: 0.2, pctOverThreshold: 0.05, regions: [] }
const NO_DELTAS = {
  deltas: [],
  matched: 10,
  unmatched: 0,
  unpairedActual: [],
  unpairedSections: [],
  unpairedActualSections: [],
  notComparableAxes: [],
}
const EMPTY: EnvelopeReport = { pass: true, byWidth: [] }

/**
 * The filed case: the faelan.com footer shape with `nowrapFromPx` removed, so the
 * 44-character line genuinely grows to three under the content-robustness
 * probe's 2.5× perturbation and leaves the 84px band it is painted inside.
 *
 * Same document as BUG-153's fixture, and deliberately so — this is the finding
 * whose two boxes that ticket added and this one carries to the artifact.
 */
function footerDoc(): L1Document {
  const at = (width: number): { at: number; x: number; y: number; width: number } => ({
    at: width,
    x: 24,
    y: 32,
    width: width - 48,
  })
  return {
    widths: [320, 375],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'container',
          id: 'section-band-1',
          layout: 'stack',
          axes: { surfaceFill: '#0f172b' },
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 0, width: 320, height: 104 },
              { at: 375, x: 0, y: 0, width: 375, height: 84 },
            ],
            segments: ['interpolate'],
          },
          children: [
            {
              kind: 'text',
              text: '© 2025 Faelan Westhead. All rights reserved.',
              axes: { color: '#ffffff', fontFamily: 'sans-serif', fontSizePx: 14, lineHeightPx: 20 },
              geometry: { keyframes: [at(320), at(375)], segments: ['interpolate'] },
            },
          ],
        },
      ],
    },
  } as L1Document
}

/** Two runs pinned onto each other at one width — the overlap kind. */
function overlappingDoc(): L1Document {
  return {
    widths: [375],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          text: 'FAELAN',
          axes: { color: '#ffffff', fontFamily: 'sans-serif', fontSizePx: 64, lineHeightPx: 96 },
          geometry: { keyframes: [{ at: 375, x: 24, y: 0, width: 300 }], segments: [] },
        },
        {
          kind: 'text',
          text: 'Artist • Musician • Creator',
          axes: { color: '#ffffff', fontFamily: 'sans-serif', fontSizePx: 18, lineHeightPx: 26 },
          geometry: { keyframes: [{ at: 375, x: 24, y: 40, width: 300 }], segments: [] },
        },
      ],
    },
  } as L1Document
}

/** `gate.json` itself: the report as the file on disk holds it. */
function gateJson(l1Gate: {
  pass: boolean
  onSample: EnvelopeReport
  offSample: EnvelopeReport
  contentRobustness: EnvelopeReport
}): GateReport {
  const report = reconcileGates({
    l1Gate,
    coverage: CLEAN_COVERAGE,
    perceptual: QUIET,
    values: NO_DELTAS,
  })
  // The round trip is the point, not ceremony: an `undefined` member and a
  // member that survives serialisation are the same object in TypeScript and
  // different files on disk, and the file is what the round reads.
  return JSON.parse(JSON.stringify(report)) as GateReport
}

describe('BUG-158 — a collision in gate.json carries the geometry its sentence asserts', () => {
  it('test_UAT_FC_BUG-158_an_escape_in_gate_json_can_be_checked_without_rerunning_the_evaluator', () => {
    const doc = footerDoc()
    expect(validateL1(doc).ok).toBe(true)

    const contentRobustness = contentRobustnessProbe(doc, { heights: [768] })
    const report = gateJson({ pass: false, onSample: EMPTY, offSample: EMPTY, contentRobustness })

    expect(report.verdict).toBe('structural-failure')
    const escape = report.layout.findings.find((f) => f.kind === 'escape')
    expect(escape).toBeDefined()

    // One box per path, in `paths` order — the contract the probe guarantees,
    // now stated at the boundary the artifact is written from.
    expect(escape!.boxes).toHaveLength(escape!.paths.length)
    const [run, surface] = escape!.boxes!

    // And the sentence closes: the overhang the `detail` claims in prose is a
    // subtraction over the two rects in the same record. THIS is the thing that
    // could not be done from `gate.json` before — the detail said "8px below its
    // bottom edge" and the record had no bottom edge in it.
    const overhang = run.y + run.height - (surface.y + surface.height)
    expect(overhang).toBeGreaterThan(0)
    expect(escape!.detail).toContain(`${overhang}px below its bottom edge`)
  })

  it('test_UAT_FC_BUG-158_an_overlap_in_gate_json_carries_both_boxes_that_intersect', () => {
    // The other kind of collision, on the other probe, reaching the artifact by
    // the other arm of `layoutCollisions` — so the fix is a property of the
    // boundary rather than of the escape path that exposed it.
    const doc = overlappingDoc()
    expect(validateL1(doc).ok).toBe(true)

    const onSample = onSampleProbe(doc)
    const report = gateJson({ pass: false, onSample, offSample: EMPTY, contentRobustness: EMPTY })

    const overlap = report.layout.findings.find((f) => f.kind === 'overlap')
    expect(overlap).toBeDefined()
    expect(overlap!.boxes).toHaveLength(overlap!.paths.length)

    // Both rects are real and they really intersect on both axes.
    const [a, b] = overlap!.boxes!
    expect(a.x < b.x + b.width && b.x < a.x + a.width).toBe(true)
    expect(a.y < b.y + b.height && b.y < a.y + a.height).toBe(true)
  })

  it('test_UAT_FC_BUG-158_the_reported_boxes_are_the_probes_own_and_are_copies_of_them', () => {
    // Two claims in one, and they pull against each other: the boundary must
    // change no value, and must hand out no reference. A collision list outlives
    // the report it was flattened from, so an aliased rect is a rect a later
    // caller can move under a reader who has already been told it is the
    // measurement.
    const probe = contentRobustnessProbe(footerDoc(), { heights: [768] })
    const finding = probe.byWidth.flatMap((w) => w.findings).find((f) => f.kind === 'escape')!
    const collision = layoutCollisions({ contentRobustness: probe }).find((c) => c.kind === 'escape')!

    expect(collision.boxes).toEqual(finding.boxes)
    collision.boxes![0].height = -1
    expect(finding.boxes![0].height).not.toBe(-1)
  })

  it('test_UAT_FC_BUG-158_a_finding_with_no_geometry_reports_no_boxes_key', () => {
    // The rail. `boxes` is optional on the probe finding because a finding may be
    // raised where only a path is in hand, and absent has to stay absent through
    // the boundary: an empty array reads as "measured, and there were none",
    // which is a different and false claim. So the key is omitted, not emptied.
    const noGeometry: EnvelopeReport = {
      pass: false,
      byWidth: [
        {
          width: 375,
          height: 768,
          findings: [{ kind: 'clip', detail: 'a pinned box overflows its content', paths: ['0.1'] }],
        },
      ],
    }
    const report = gateJson({ pass: false, onSample: noGeometry, offSample: EMPTY, contentRobustness: EMPTY })

    const clip = report.layout.findings.find((f) => f.kind === 'clip')!
    expect(clip.paths).toEqual(['0.1'])
    expect('boxes' in clip).toBe(false)
  })

  it('test_UAT_FC_BUG-158_a_clean_reproduction_still_reports_no_findings_at_all', () => {
    // The other rail, per the epic's §8.4: the layout gate must not have become
    // unconditionally red, or loud, by acquiring a field.
    const doc = footerDoc()
    expect(evaluateLayout(doc, 375).findings).toEqual([])

    const report = gateJson({ pass: true, onSample: EMPTY, offSample: EMPTY, contentRobustness: EMPTY })
    expect(report.layout).toEqual({ pass: true, findings: [] })
  })
})
