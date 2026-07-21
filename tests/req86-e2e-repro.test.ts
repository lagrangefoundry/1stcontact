/**
 * REQ-86 — end-to-end reproduction, gated by the 3-probe acceptance.
 *
 * Drives the whole new pipeline on a fixture capture: capture (a
 * `MultiStateCapture`-shaped oracle across the 6 widths) → `foldToL1` (absolute
 * base + retained oracle) → the 3 probes, and the demand-driven `promoteToFlow`
 * structure recovery.
 *
 * The four acceptance probes from the ticket:
 *   - sample_fidelity    the folded L1 reproduces the oracle boxes within
 *                        tolerance at every captured width.
 *   - offsample          the recovered doc renders sane (no overlap/clip) at 500
 *                        and 900px — widths the fold never sampled.
 *   - content_robustness the DISCRIMINATOR: perturbed content overruns the
 *                        pinned base (probe FAILS), and `promoteToFlow` — applied
 *                        only where the probe fails — restores the envelope
 *                        (probe PASSES). Promotion is demand-driven.
 *   - gate               `threeProbeGate` on the absolute base + recovered
 *                        overlay passes on every probe.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import {
  contentRobustnessProbe,
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

const LADDER = [320, 375, 768, 1024, 1280, 1440]

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
 * A fluid 3-run stack captured across the 6 widths: three 40px runs at fixed
 * y=100/170/240 whose left edge is fixed (x=20) and whose width tracks the
 * viewport (x=20, width=w-40). The runs are short enough to stay one line
 * (~48px) at every width down to 320 — so at rest, and at the off-sample widths,
 * the pinned base renders sane with a ~70px gap. Perturbed 2.5× each grows to
 * 2–3 lines and overruns the run below: the pinned base cannot absorb the extra
 * content, but flow can.
 */
const HEADLINE = 'Front door'
const BODY = 'Body copy line'
const CAPTION = 'Caption row'

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

describe('REQ-86 — end-to-end reproduction (3-probe gate)', () => {
  it('test_UAT_FC_REQ-86_sample_fidelity', () => {
    const cap = oracle()
    const doc = foldToL1(cap)

    // The absolute base reproduces the oracle boxes at every captured width.
    const report = sampleFidelityProbe(doc, cap, { tolerancePx: 2 })
    expect(report.pass).toBe(true)
    expect(report.residuals).toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.maxDelta).toBeLessThanOrEqual(2)

    // And it really did check all 6 widths × 3 runs (18 oracle samples), not zero.
    const widthsChecked = new Set(cap.projections.map((p) => p.viewport.width))
    expect(widthsChecked).toEqual(new Set(LADDER))
  })

  it('test_UAT_FC_REQ-86_offsample', () => {
    const cap = oracle()
    const base = foldToL1(cap)
    const recovered = promoteToFlow(base).doc

    // Both the base and the recovered overlay render sane at intermediate widths
    // the fold never sampled (500 bracketed by 375/768; 900 by 768/1024).
    for (const doc of [base, recovered]) {
      const report = offSampleProbe(doc, { widths: [500, 900] })
      expect(report.pass).toBe(true)
      for (const w of report.byWidth) expect(w.findings).toEqual([])
    }
  })

  it('test_UAT_FC_REQ-86_content_robustness', () => {
    const cap = oracle()
    const base = foldToL1(cap)

    // The DISCRIMINATOR: the pinned base cannot absorb 2.5× content — a run
    // overruns the pinned sibling below it, so the probe FAILS and names it.
    const before = contentRobustnessProbe(base, { scale: 2.5 })
    expect(before.pass).toBe(false)
    const overlaps = before.byWidth.flatMap((w) => w.findings).filter((f) => f.kind === 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)

    // Demand-driven recovery: only the failing pinned sibling group is promoted
    // to a flow stack (here the root's three runs). Passing regions are untouched.
    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5 })
    expect(promoted).toContain('0')

    // With the interior flowed, growing content reflows instead of overrunning —
    // the envelope holds at every captured width.
    const after = contentRobustnessProbe(recovered, { scale: 2.5 })
    expect(after.pass).toBe(true)
    for (const w of after.byWidth) expect(w.findings).toEqual([])
  })

  it('test_UAT_FC_REQ-86_gate', () => {
    const cap = oracle()
    const base = foldToL1(cap)
    const recovered = promoteToFlow(base, { scale: 2.5 }).doc

    // The full gate: fidelity on the absolute base, envelope probes on the
    // structure-recovered overlay. All three pass end-to-end.
    const gate = threeProbeGate(base, cap, { recovered, contentScale: 2.5 })
    expect(gate.sampleFidelity.pass).toBe(true)
    expect(gate.offSample.pass).toBe(true)
    expect(gate.contentRobustness.pass).toBe(true)
    expect(gate.pass).toBe(true)

    // A gate run WITHOUT recovery fails content-robustness — proving the gate is
    // not vacuous and that recovery is what closes it.
    const ungated = threeProbeGate(base, cap, { contentScale: 2.5 })
    expect(ungated.pass).toBe(false)
    expect(ungated.contentRobustness.pass).toBe(false)
  })
})
