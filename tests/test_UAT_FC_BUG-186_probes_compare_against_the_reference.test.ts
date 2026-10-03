/**
 * BUG-186 — two L1-gate probes graded the reproduction against something other
 * than the reference.
 *
 *   1. The on-sample overlap / buried scan has no reference side. A geometry
 *      copied faithfully from a reference whose OWN boxes intersect (Zyro grid
 *      text boxes, a two-line heading whose line-height is below its content
 *      area, a label running under the next column's icon) was reported as a
 *      reproduction defect: 42 of 42 overlaps on www.hearingzone510.com and 16 of
 *      16 on joyfulculinarycreations.com. Such a pair is now set aside into
 *      `inReference`; a collision the reproduction invented is still a finding.
 *   2. `sampleFidelity` paired textless boxes FIFO by document order, but the fold
 *      emits captured backdrops in its own nesting order, so each oracle band was
 *      compared with the next band's box (42 × `(generic)` residuals whose `dy`
 *      was a band height). Non-text leaves now pair geometrically, document order
 *      only breaking ties.
 */
import { describe, expect, it } from 'vitest'
import { acceptanceGate, foldToL1, measuredTextHeights, onSampleProbe, sampleFidelityProbe } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function text(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
  }
}

function panel(box: ValueElement['box']): ValueElement {
  return {
    text: '',
    role: 'separator',
    a11yRole: 'separator',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    surfaceFill: '#224e7a',
    box,
  }
}

function capture(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: elementsAt(width),
    },
  }))
  return { url: 'http://bug186.test/', notes: [], projections }
}

const overlapsOf = (r: ReturnType<typeof onSampleProbe>) =>
  r.byWidth.flatMap((w) => w.findings).filter((f) => f.kind === 'overlap')

describe('BUG-186 — the probes compare against the reference', () => {
  it('test_UAT_FC_BUG-186_an_overlap_the_reference_paints_identically_is_not_a_finding', () => {
    // "Hours" sits inside the address box's second line at every width — in the
    // REFERENCE. The fold copies both boxes, so the reproduction paints the
    // same 48×24 intersection.
    const oracle = capture(() => [
      text('Alameda, CA 94501', { x: 84, y: 7060, width: 152, height: 48 }),
      text('Hours', { x: 136, y: 7084, width: 48, height: 24 }),
    ])
    const base = foldToL1(oracle)
    // The heights the gate itself evaluates with (`cmdL1Gate` threads the same).
    const measured = measuredTextHeights(oracle)

    // Without the reference the scan still sees the collision …
    expect(overlapsOf(onSampleProbe(base, { measured })).length).toBeGreaterThan(0)

    // … but with it, the pair is set aside at every captured width, and listed.
    const report = acceptanceGate(base, oracle, { served: base, measured })
    expect(overlapsOf(report.onSample)).toEqual([])
    expect(report.onSample.pass).toBe(true)
    const excused = report.onSample.byWidth.flatMap((w) => w.inReference ?? [])
    expect(new Set(excused.map((f) => f.width))).toEqual(new Set(LADDER))
    for (const f of excused) {
      expect(f.kind).toBe('overlap')
      expect(f.detail).toContain('Hours')
      expect(f.detail).toContain('Alameda, CA 94501')
    }
  })

  it('test_UAT_FC_BUG-186_an_overlap_the_reproduction_made_larger_is_still_a_finding', () => {
    // The reference's two runs touch by 8px; the reproduction's first run wraps
    // to several lines in its 280px box (BUG-112's shape) and lands squarely on
    // its neighbour. Same pair, different intersection — still a defect.
    const LONG = 'A sentence long enough that it cannot possibly fit on a single line inside this box'
    const oracle = capture(() => [
      text(LONG, { x: 20, y: 100, width: 280, height: 48 }),
      text('Directly below', { x: 20, y: 140, width: 280, height: 48 }),
    ])
    const base = foldToL1(oracle)
    const report = acceptanceGate(base, oracle, { served: base })
    expect(report.onSample.pass).toBe(false)
    for (const { width, findings } of report.onSample.byWidth) {
      const overlap = findings.filter((f) => f.kind === 'overlap')
      expect(overlap.length, `@${width}`).toBeGreaterThan(0)
      expect(overlap[0].detail).toContain('Directly below')
    }
  })

  it('test_UAT_FC_BUG-186_textless_boxes_pair_by_geometry_not_emission_order', () => {
    // Two band backdrops, 1000px apart. The reproduction emits them in the
    // opposite order to the oracle's DOM order (the fold nests a hero's scrim
    // after later bands' backdrops), but each sits exactly where its oracle
    // counterpart does.
    const oracle = capture((w) => [
      panel({ x: 0, y: 40, width: w, height: 600 }),
      panel({ x: 0, y: 1040, width: w, height: 400 }),
    ])
    const doc = foldToL1(oracle)
    const reordered = swapBoxes(doc)

    const report = sampleFidelityProbe(reordered, oracle, { tolerancePx: 2 })
    expect(report.unmatched).toEqual([])
    expect(report.residuals).toEqual([])
  })
})

/** `doc` with its two box leaves exchanged in document order (geometry untouched). */
function swapBoxes(doc: L1Document): L1Document {
  const out = structuredClone(doc) as L1Document
  const parents: L1Node[][] = []
  const walk = (nodes: L1Node[]): void => {
    if (nodes.filter((n) => n.kind === 'box').length >= 2) parents.push(nodes)
    for (const n of nodes) {
      if (n.kind === 'container') walk(n.children)
      else if (n.kind === 'box' && n.children) walk(n.children)
    }
  }
  const root = out.root
  walk(root.kind === 'container' ? root.children : root.kind === 'box' ? (root.children ?? []) : [])
  expect(parents.length, 'both box leaves share a parent').toBe(1)
  const siblings = parents[0]
  const [i, j] = siblings.flatMap((n, k) => (n.kind === 'box' ? [k] : []))
  ;[siblings[i], siblings[j]] = [siblings[j], siblings[i]]
  return out
}
