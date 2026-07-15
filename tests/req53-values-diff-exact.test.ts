import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

/**
 * UATs for REQ-53 — exact match is the DEFAULT in `1c values-diff` for every
 * fidelity axis we author directly and the browser renders verbatim. REQ-35 made
 * these axes jitter-tolerant by default; REQ-52 showed that a real gap and a
 * tolerance are indistinguishable from the outside (a 24px position tolerance
 * silently hid an 8px hero-margin error). So the default is inverted:
 *
 *   • Group A (colour, font-size/weight, line-height, letter-spacing, padding,
 *     border-width, corner-radius) → exact (tolerance 0).
 *   • Group B (position, box width) → exact with a ±1px integer-rounding allowance.
 *   • Group C (box height, gradient angle, overlay opacity, content anchor) →
 *     genuinely emergent / measured perceptually, tolerance retained.
 *
 * `--tolerant` restores the old loose REQ-35 defaults wholesale (the escape hatch
 * for an unavoidable font-substitution gap); per-metric overrides loosen a single
 * axis. These UATs drive the diff engine directly — the same code the CLI runs.
 */

// ── fixture builders (mirror req31/req35) ────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function mani(
  source: string,
  elements: ValueElement[],
  sections: ValueManifest['sections'] = [],
): ValueManifest {
  return { source, elements, sections }
}
const hasDelta = (deltas: { text: string; property: string }[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

// ── Group A — directly-authored scalars are exact by default ─────────────────

describe('REQ-53 values-diff — exact match is the default for authored scalars', () => {
  it('test_UAT_FC_REQ-53_exact_match_default_intrinsic', () => {
    // Every one of these was PASSING under the REQ-35 jitter tolerance; under the
    // REQ-53 exact default each is a delta the operator must clear.
    const ref = mani('ref', [
      el('Body', { fontSizePx: 24, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0.5, color: '#808080' }),
    ])
    const actual = mani('a', [
      // Δ1px size, nearest-loaded weight snap (400→500), 2px line-height metric
      // drift, 0.3px letter-spacing, and a single-channel colour rounding step.
      el('Body', { fontSizePx: 25, fontWeight: 500, lineHeightPx: 30, letterSpacingPx: 0.8, color: '#818080' }),
    ])
    const { deltas } = diffManifests(ref, actual)
    expect(hasDelta(deltas, 'Body', 'fontSizePx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'fontWeight')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'lineHeightPx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'letterSpacingPx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'color')).toBe(true)
  })
})

// ── Group B — position is exact with only an integer-rounding allowance ───────

describe('REQ-53 values-diff — position exact by default (±1 rounding)', () => {
  it('test_UAT_FC_REQ-53_position_exact_default', () => {
    const ref = mani('ref', [el('Hero', { box: box(120, 100, 600, 60) })])
    // An 8px left-margin shift (the exact REQ-52 miss) FAILS by default…
    const shifted = diffManifests(ref, mani('a', [el('Hero', { box: box(128, 100, 600, 60) })]))
    expect(hasDelta(shifted.deltas, 'Hero', 'position')).toBe(true)
    // …while a 1px integer-rounding difference in the captured box does not.
    const rounded = diffManifests(ref, mani('a', [el('Hero', { box: box(121, 100, 600, 60) })]))
    expect(hasProp(rounded.deltas, 'position')).toBe(false)
  })
})

// ── the size split — width exact (Group B), height tolerant (Group C) ─────────

describe('REQ-53 values-diff — width exact, height keeps a wrapping tolerance', () => {
  it('test_UAT_FC_REQ-53_size_width_exact_height_tolerant', () => {
    const ref = mani('ref', [el('Card', { box: box(0, 0, 300, 40) })])
    // A 4px WIDTH delta (container-determined → exact) FAILS…
    const wide = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 304, 40) })]))
    expect(hasDelta(wide.deltas, 'Card', 'size')).toBe(true)
    // …while an equal-magnitude 4px HEIGHT delta (emerges from wrapping × font
    // metrics → small documented tolerance) does not.
    const tall = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 300, 44) })]))
    expect(hasProp(tall.deltas, 'size')).toBe(false)
    // A whole extra wrapped line (≥ one line-height) still fails on height.
    const wrapped = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 300, 64) })]))
    expect(hasDelta(wrapped.deltas, 'Card', 'size')).toBe(true)
  })
})

// ── Group C — art-directed axes stay tolerant by default ─────────────────────

describe('REQ-53 values-diff — art-directed axes remain tolerant by default', () => {
  it('test_UAT_FC_REQ-53_art_directed_still_tolerant', () => {
    // Gradient direction within ±20° (measured perceptually, never authored to
    // the degree) does not flag.
    const gradRef = mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops: [{ color: '#aaaaaa', position: null }, { color: '#bbbbbb', position: null }] } })])
    const gradAct = mani('a', [el('Wordmark', { gradient: { angleDeg: 100, stops: [{ color: '#aaaaaa', position: null }, { color: '#bbbbbb', position: null }] } })])
    expect(hasProp(diffManifests(gradRef, gradAct).deltas, 'gradient')).toBe(false)

    // Hero scrim opacity within ±0.1 and vertical anchor within ±0.15 (both
    // measured, not authored precisely) do not flag.
    const secRef = mani('ref', [], [{ index: 0, overlay: { color: '#000000', opacity: 0.5 }, contentAnchorRatio: 0.5 }])
    const secAct = mani('a', [], [{ index: 0, overlay: { color: '#000000', opacity: 0.55 }, contentAnchorRatio: 0.6 }])
    const { deltas } = diffManifests(secRef, secAct)
    expect(hasProp(deltas, 'overlay')).toBe(false)
    expect(hasProp(deltas, 'contentAnchor')).toBe(false)
  })
})

// ── the opt-out — `tolerant` restores loose matching wholesale ───────────────

describe('REQ-53 values-diff — the tolerant opt-out restores loose matching', () => {
  it('test_UAT_FC_REQ-53_tolerant_optout_restores_loose', () => {
    const ref = mani('ref', [
      el('Body', { fontSizePx: 24, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0.5, color: '#808080', box: box(100, 100, 300, 40) }),
    ])
    const actual = mani('a', [
      el('Body', { fontSizePx: 25, fontWeight: 500, lineHeightPx: 30, letterSpacingPx: 0.8, color: '#818080', box: box(108, 100, 304, 40) }),
    ])
    // Exact default: every jitter axis + the 8px position + 4px width all fire.
    expect(diffManifests(ref, actual).deltas.length).toBeGreaterThan(0)
    // `tolerant` collapses back to the pre-REQ-53 jitter bands → all suppressed.
    expect(diffManifests(ref, actual, { tolerant: true }).deltas).toEqual([])
  })

  it('test_UAT_FC_REQ-53_per_metric_override_loosens_one_axis', () => {
    // A per-metric override loosens exactly one axis and wins over the exact
    // default, while every other axis stays exact.
    const ref = mani('ref', [el('Body', { fontSizePx: 24, box: box(100, 100, 300, 40) })])
    const actual = mani('a', [el('Body', { fontSizePx: 27, box: box(108, 100, 300, 40) })]) // Δfont 3, Δpos 8
    const base = diffManifests(ref, actual)
    expect(hasDelta(base.deltas, 'Body', 'fontSizePx')).toBe(true)
    const widened = diffManifests(ref, actual, { fontSizeTolerancePx: 4 })
    expect(hasProp(widened.deltas, 'fontSizePx')).toBe(false) // the widened axis clears…
    expect(hasDelta(widened.deltas, 'Body', 'position')).toBe(true) // …but position stays exact.
  })
})
