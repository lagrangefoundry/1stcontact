/**
 * Reconciliation UATs for story-24098299 —
 * "End-to-end 3-probe reproduction acceptance gate".
 *
 * One UAT per acceptance criterion, exercised at the module boundary
 * (`tools/generate/src` exports), against the analytic browser-free evaluator,
 * the three acceptance probes, the combined gate, and demand-driven structure
 * recovery.
 *
 *   AC-705  sample-fidelity probe matches reproduced boxes to the oracle
 *   AC-706  off-sample probe asserts the envelope at unsampled widths
 *   AC-707  content-robustness probe under perturbed (grown) content
 *   AC-708  combined gate over the absolute-base / structure-overlay split
 *   AC-709  demand-driven recovery promotes only failing pinned groups
 *   AC-710  each probe residual / finding is diagnostic
 */
import { describe, expect, it } from 'vitest'
import {
  contentRobustnessProbe,
  evaluateLayout,
  foldToL1,
  offSampleProbe,
  promoteToFlow,
  sampleFidelityProbe,
  threeProbeGate,
} from '../tools/generate/src'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { validateL1 } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const HEADLINE = 'Front door'
const BODY = 'Body copy line'
const CAPTION = 'Caption row'

/** A text run with a box — the only fields the fold + probes read. */
function text(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/**
 * A fluid 3-run stack captured across the 6 ladder widths at y=100/170/240 with
 * a ~70px gap. At rest (and at the 500/900 off-sample widths) it renders sane;
 * perturbed 2.5× each run's pinned box grows to 120px and overruns the pinned
 * sibling below it — the discriminator the content-robustness probe catches.
 */
function oracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(BODY, { x: 20, y: 170, width: width - 40, height: 48 }),
        text(CAPTION, { x: 20, y: 240, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/**
 * The same 3-run stack but with 300px gaps (y=100/400/700). A 2.5× perturbation
 * grows each pinned box to 120px, well inside the gap — so the region already
 * survives content-robustness and must NOT be promoted.
 */
function roomyOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `roomy@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(BODY, { x: 20, y: 400, width: width - 40, height: 48 }),
        text(CAPTION, { x: 20, y: 700, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://roomy.test/', notes: [], projections }
}

/**
 * A single fixed-width run captured only at the wide widths [768..1440]. Its
 * box (x=20, width=728, right 748) fits every captured viewport. But the
 * renderer holds the base (768) keyframe below the first breakpoint, so at the
 * off-sample width 500 the 728px run clips beyond the 500px viewport — a
 * degradation that appears only at an unsampled width.
 */
const NARROW_LADDER = [768, 1024, 1280, 1440]
function narrowOracle(): MultiStateCapture {
  const projections: StateProjection[] = NARROW_LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `narrow@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [text(HEADLINE, { x: 20, y: 100, width: 728, height: 48 })],
    },
  }))
  return { url: 'http://narrow.test/', notes: [], projections }
}

describe('story-24098299 — 3-probe reproduction acceptance gate', () => {
  it('test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance', () => {
    const cap = oracle()
    const doc = foldToL1(cap)

    // Clean: the absolute base reproduces the oracle boxes at every captured
    // width — empty residuals, empty unmatched, max delta within tolerance.
    const clean = sampleFidelityProbe(doc, cap, { tolerancePx: 2 })
    expect(clean.pass).toBe(true)
    expect(clean.residuals).toEqual([])
    expect(clean.unmatched).toEqual([])
    expect(clean.maxDelta).toBeLessThanOrEqual(2)
    // All six captured widths were retained and are the ones the probe checks.
    expect(doc.widths).toEqual(LADDER)

    // Perturb one reproduced box beyond tolerance AT THE LAST WIDTH — proving
    // the probe iterates every captured width — and assert the residual carries
    // the run text, the width, and the per-axis deltas.
    const shifted = structuredClone(cap)
    const lastProj = shifted.projections.find((p) => p.viewport.width === 1440)!
    lastProj.manifest.elements[0].box.x += 10
    const withResidual = sampleFidelityProbe(doc, shifted, { tolerancePx: 2 })
    expect(withResidual.pass).toBe(false)
    expect(withResidual.residuals).toHaveLength(1)
    const r = withResidual.residuals[0]
    expect(r.text).toBe(HEADLINE)
    expect(r.width).toBe(1440)
    expect(r.dx).toBeCloseTo(10, 5)
    expect(r.dy).toBeCloseTo(0, 5)
    expect(r.dw).toBeCloseTo(0, 5)

    // Drop a run (an oracle sample with no reproduced leaf) → unmatched.
    const withGap = structuredClone(cap)
    const proj768 = withGap.projections.find((p) => p.viewport.width === 768)!
    proj768.manifest.elements.push(text('Ghost row', { x: 20, y: 400, width: 200, height: 48 }))
    const withUnmatched = sampleFidelityProbe(doc, withGap, { tolerancePx: 2 })
    expect(withUnmatched.pass).toBe(false)
    expect(withUnmatched.unmatched).toContainEqual({ text: 'Ghost row', width: 768 })
  })

  it('test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths', () => {
    // Pass: the fluid base renders sane at the default 500 / 900 off-sample
    // widths — no overlap, no clip, per-width findings empty.
    const doc = foldToL1(oracle())
    const passReport = offSampleProbe(doc)
    expect(passReport.pass).toBe(true)
    expect(passReport.byWidth.map((w) => w.width)).toEqual([500, 900])
    for (const w of passReport.byWidth) expect(w.findings).toEqual([])

    // Fail: a document whose fixed-width run is only captured at wide widths
    // degrades at the unsampled 500px width (the held base keyframe clips) —
    // the probe reports that finding at the affected width and pass = false.
    const narrow = foldToL1(narrowOracle())
    const failReport = offSampleProbe(narrow, { widths: [500, 900] })
    expect(failReport.pass).toBe(false)
    const at500 = failReport.byWidth.find((w) => w.width === 500)!
    expect(at500.findings.some((f) => f.kind === 'clip')).toBe(true)
    // The width that was fine when captured (900 interpolates safely) is clean.
    const at900 = failReport.byWidth.find((w) => w.width === 900)!
    expect(at900.findings).toEqual([])
  })

  it('test_UAT_AC707_content_robustness_under_grown_content', () => {
    const base = foldToL1(oracle())

    // Purely-pinned region: 2.5× content overruns the fixed-position sibling
    // below — overlap finding, pass = false. Findings are reported per width.
    const before = contentRobustnessProbe(base, { scale: 2.5 })
    expect(before.pass).toBe(false)
    expect(before.byWidth.map((w) => w.width)).toEqual(base.widths)
    const overlaps = before.byWidth.flatMap((w) => w.findings).filter((f) => f.kind === 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)

    // A flow-structured equivalent (interior flows) absorbs the extra content —
    // envelope holds, pass = true, empty findings at every captured width.
    const flowed = promoteToFlow(base, { scale: 2.5 }).doc
    const after = contentRobustnessProbe(flowed, { scale: 2.5 })
    expect(after.pass).toBe(true)
    for (const w of after.byWidth) expect(w.findings).toEqual([])
  })

  it('test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split', () => {
    const cap = oracle()
    const base = foldToL1(cap)
    const recovered = promoteToFlow(base, { scale: 2.5 }).doc

    // Non-vacuous #1: run against the purely-pinned base with NO recovery
    // overlay → pass = false, driven by content-robustness failing. Fidelity is
    // still measured on the absolute base and passes.
    const ungated = threeProbeGate(base, cap, { contentScale: 2.5 })
    expect(ungated.pass).toBe(false)
    expect(ungated.contentRobustness.pass).toBe(false)
    expect(ungated.sampleFidelity.pass).toBe(true)

    // Non-vacuous #2: same base + a structure-recovered overlay → pass = true,
    // with every sub-report passing.
    const gated = threeProbeGate(base, cap, { recovered, contentScale: 2.5 })
    expect(gated.pass).toBe(true)
    expect(gated.sampleFidelity.pass).toBe(true)
    expect(gated.offSample.pass).toBe(true)
    expect(gated.contentRobustness.pass).toBe(true)

    // The report carries each probe's sub-report (with its residuals/findings).
    expect(Array.isArray(gated.sampleFidelity.residuals)).toBe(true)
    expect(Array.isArray(gated.offSample.byWidth)).toBe(true)
    expect(Array.isArray(gated.contentRobustness.byWidth)).toBe(true)
  })

  it('test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups', () => {
    // A folded fixture whose root pinned runs fail content-robustness.
    const base = foldToL1(oracle())
    expect(contentRobustnessProbe(base, { scale: 2.5 }).pass).toBe(false)

    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5 })
    // The failing root region is reported as promoted (its index path).
    expect(promoted).toContain('0')
    // After recovery the region keeps the envelope at every captured width.
    const after = contentRobustnessProbe(recovered, { scale: 2.5 })
    expect(after.pass).toBe(true)
    for (const w of after.byWidth) expect(w.findings).toEqual([])
    // The returned document is a valid L1 document (satisfies the validator).
    expect(validateL1(recovered).ok).toBe(true)

    // A region that already survives perturbation is left absolute — not
    // promoted (empty promotion list).
    const roomyBase = foldToL1(roomyOracle())
    expect(contentRobustnessProbe(roomyBase, { scale: 2.5 }).pass).toBe(true)
    expect(promoteToFlow(roomyBase, { scale: 2.5 }).promoted).toEqual([])
  })

  it('test_UAT_AC710_probe_findings_are_diagnostic', () => {
    const cap = oracle()
    const doc = foldToL1(cap)

    // A fidelity residual names the run, the width, and the per-axis deltas.
    const shifted = structuredClone(cap)
    const proj = shifted.projections.find((p) => p.viewport.width === 1280)!
    proj.manifest.elements[1].box.y += 7
    const fidelity = sampleFidelityProbe(doc, shifted, { tolerancePx: 2 })
    expect(fidelity.pass).toBe(false)
    const residual = fidelity.residuals.find((d) => d.text === BODY && d.width === 1280)!
    expect(residual).toBeDefined()
    expect(residual.dy).toBeCloseTo(7, 5)
    expect(typeof residual.dx).toBe('number')
    expect(typeof residual.dw).toBe('number')

    // An overlap finding carries kind, a human-readable detail, and the index
    // paths of the two leaves involved.
    const robustness = contentRobustnessProbe(doc, { scale: 2.5 })
    const overlap = robustness.byWidth.flatMap((w) => w.findings).find((f) => f.kind === 'overlap')!
    expect(overlap).toBeDefined()
    expect(overlap.kind).toBe('overlap')
    expect(overlap.detail.length).toBeGreaterThan(0)
    expect(overlap.paths.length).toBeGreaterThanOrEqual(2)
    for (const p of overlap.paths) expect(p).toMatch(/^\d+(\.\d+)*$/)

    // A clip finding carries kind, a detail with the offending magnitude (px),
    // and the offending leaf's index path.
    const narrow = foldToL1(narrowOracle())
    const clip = evaluateLayout(narrow, 500).findings.find((f) => f.kind === 'clip')!
    expect(clip).toBeDefined()
    expect(clip.kind).toBe('clip')
    expect(clip.detail).toMatch(/\d+px/)
    expect(clip.paths.length).toBeGreaterThanOrEqual(1)
    for (const p of clip.paths) expect(p).toMatch(/^\d+(\.\d+)*$/)
  })
})
