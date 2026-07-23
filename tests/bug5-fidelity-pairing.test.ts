/**
 * BUG-5 — the L1 sample-fidelity gate must pair oracle↔reproduced leaves by a
 * stable occurrence identity, not by a `text → box` map that collides on
 * repeated text.
 *
 * The bug: `sampleFidelityProbe` keyed a `Map<normText, box>` by normalized
 * text, so a page with duplicate labels/CTAs kept only the *last* leaf's box;
 * every other oracle sample of that text paired against the wrong box, producing
 * huge phantom deltas at the sampled widths (the 1616px FAIL) even though
 * `evalGeometry` reproduces the keyframes exactly there.
 *
 * The fix pairs the k-th reproduced text leaf of a key to the k-th oracle
 * element of that key (document order per width) — the same occurrence index the
 * fold's responsive table used to build each leaf. These UATs pin:
 *   - a repeated-text fixture that mispaired pre-fix now gates clean;
 *   - idempotency of the analytic value-render (the fold reproduces its own
 *     oracle at every sampled width, with repeated text present);
 *   - genuine coverage gaps still surface as `unmatched` (not masked);
 *   - genuine residuals on a *specific* duplicate occurrence are still reported
 *     (the fix must not hide real drift behind a nearest-box match).
 */
import { describe, expect, it } from 'vitest'
import { evaluateLayout, foldToL1, sampleFidelityProbe } from '../tools/generate/src'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

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
 * A stack with the SAME label ("Learn more") appearing three times at distinct
 * y positions (100 / 500 / 900), plus a unique heading. Pre-fix the three
 * identical texts collapsed to one map entry (the last, y=900), so the first two
 * oracle samples paired against y=900 → phantom dy of 800 / 400 at every width.
 */
const CTA = 'Learn more'
function repeatedTextOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `dup@${width}`,
      viewport: { width, height: 1200 },
      sections: [],
      elements: [
        text('Unique heading', { x: 20, y: 20, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 500, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 900, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://dup.test/', notes: [], projections }
}

describe('BUG-5 — sample-fidelity pairs by occurrence identity, not by text', () => {
  it('test_UAT_FC_BUG-5_repeated_text_fixture_gates_clean', () => {
    const cap = repeatedTextOracle()
    const doc = foldToL1(cap)

    // Sanity: the fold produced three distinct "Learn more" leaves (occurrences
    // 0/1/2), not one — so a correct probe has three boxes to pair against.
    const dupLeaves = evaluateLayout(doc, 1440).leaves.filter(
      (l) => l.kind === 'text' && l.text === CTA,
    )
    expect(dupLeaves).toHaveLength(3)

    const report = sampleFidelityProbe(doc, cap, { tolerancePx: 2 })
    expect(report.pass).toBe(true)
    expect(report.residuals).toEqual([])
    expect(report.unmatched).toEqual([])
    // No phantom deltas at the sampled widths — well under the pre-fix 400/800px.
    expect(report.maxDelta).toBeLessThanOrEqual(2)
  })

  it('test_UAT_FC_BUG-5_value_render_is_idempotent_with_repeated_text', () => {
    // Idempotency: value-render(value-render(X)) == value-render(X). The analytic
    // value-render (evaluateLayout) of the absolute-base fold reproduces the
    // retained oracle boxes at every sampled width — even with repeated text —
    // and is deterministic across repeated evaluation.
    const cap = repeatedTextOracle()
    const doc = foldToL1(cap)

    for (const width of LADDER) {
      const first = evaluateLayout(doc, width).leaves
      const second = evaluateLayout(doc, width).leaves
      // value-render is a pure function of the doc: re-rendering is identity.
      expect(second).toEqual(first)

      // Each occurrence of the repeated key reproduces its OWN oracle box (paired
      // by occurrence index), not a single collapsed box.
      const proj = cap.projections.find((p) => p.viewport.width === width)!
      const oracleCtas = proj.manifest.elements.filter((e) => e.text === CTA)
      const reproCtas = first.filter((l) => l.kind === 'text' && l.text === CTA)
      expect(reproCtas).toHaveLength(oracleCtas.length)
      oracleCtas.forEach((o, i) => {
        expect(Math.abs(reproCtas[i].box.y - o.box!.y)).toBeLessThanOrEqual(2)
      })
    }
  })

  it('test_UAT_FC_BUG-5_extra_duplicate_occurrence_surfaces_as_unmatched', () => {
    // A genuine coverage gap: the oracle carries a 4th "Learn more" at one width
    // that the fold never produced a leaf for. Pre-fix the stale map hit masked
    // it; post-fix the exhausted occurrence queue reports it as unmatched.
    const cap = repeatedTextOracle()
    const doc = foldToL1(cap)
    const withGap = structuredClone(cap)
    const proj768 = withGap.projections.find((p) => p.viewport.width === 768)!
    proj768.manifest.elements.push(text(CTA, { x: 20, y: 1100, width: 200, height: 48 }))

    const report = sampleFidelityProbe(doc, withGap, { tolerancePx: 2 })
    expect(report.pass).toBe(false)
    expect(report.unmatched).toContainEqual({ text: CTA, width: 768 })
    // The three genuine occurrences still pair cleanly — only the extra is unmatched.
    expect(report.unmatched).toHaveLength(1)
    expect(report.residuals).toEqual([])
  })

  it('test_UAT_FC_BUG-5_residual_on_a_specific_duplicate_is_not_hidden', () => {
    // Shift ONLY the middle "Learn more" (occurrence 1) at the widest width. The
    // occurrence-indexed pairing must attribute the drift to that occurrence — a
    // nearest-box match would have silently paired it to an unshifted sibling.
    const cap = repeatedTextOracle()
    const doc = foldToL1(cap)
    const shifted = structuredClone(cap)
    const last = shifted.projections.find((p) => p.viewport.width === 1440)!
    const middleCta = last.manifest.elements.filter((e) => e.text === CTA)[1]
    middleCta.box.y += 30

    const report = sampleFidelityProbe(doc, shifted, { tolerancePx: 2 })
    expect(report.pass).toBe(false)
    expect(report.residuals).toHaveLength(1)
    const r = report.residuals[0]
    expect(r.text).toBe(CTA)
    expect(r.width).toBe(1440)
    expect(r.dy).toBeCloseTo(30, 5)
  })
})
