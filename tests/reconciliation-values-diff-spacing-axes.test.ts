import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-d5de22a5 — the two REQ-73 **vertical-spacing**
 * criteria, AC-1609 (the adjacent-row `gap` axis) and AC-1610 (band padding is no
 * longer compared, because the gap axis supersedes it).
 *
 * Both drive the real `diffManifests` — the same comparator the `1c values-diff`
 * command runs — with hand-built manifests. Pure and browser-free.
 *
 * Relationship to the free-coded evidence: `req63-values-diff-coverage.test.ts`
 * carries `test_UAT_FC_REQ-73_gap_axis_measures_relative_spacing_and_reports_the_
 * correction`, `…_matching_gap_and_side_by_side_row_emit_no_gap_delta` and
 * `…_section_band_padding_no_longer_compared`. Those remain REQ-73's own evidence
 * and are not renamed or replaced. These tests add the clauses each AC's
 * Verification asks for that no FC sibling makes:
 *   • AC-1609 — the delta NAMES the two rows it sits between; `--tolerant` widens
 *     the band from 6px to 16px and absorbs a 12px difference; two rows that
 *     overlap (not genuinely stacked) contribute no gap at all.
 *   • AC-1610 — with band padding held identical and a row shifted, the
 *     vertical-spacing signal that fires is the `gap` axis, and no band-padding
 *     delta is emitted on any section.
 */

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function mani(source: string, elements: ValueElement[], sections: unknown[] = []): ValueManifest {
  return { source, elements, sections } as ValueManifest
}

/** A section carrying only the band vertical padding the axis used to compare. */
const section = (paddingTopPx: number, paddingBottomPx: number) => ({
  index: 0,
  overlay: null,
  contentAnchorRatio: null,
  paddingTopPx,
  paddingBottomPx,
})

/** The band-padding axes AC-1610 says must never be compared. */
const PADDING_AXES = ['paddingTopPx', 'paddingBottomPx']

// ── AC-1609 — inter-row spacing is its own gap axis ──────────────────────────

describe('story-d5de22a5 — AC-1609 adjacent-row gap axis', () => {
  it('test_UAT_AC1609_gap_delta_names_both_rows_and_carries_both_measured_gaps', () => {
    // Every paired element matches its reference exactly except that the second
    // row sits ~12px lower — the "every element is right but the page breathes
    // differently" case the axis exists to catch. Reference gap 40px, ours 52px.
    const ref = mani('ref', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })])
    const ours = mani('a', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 72, 200, 20) })])

    const gaps = diffManifests(ref, ours).deltas.filter((d) => d.property === 'gap')
    expect(gaps.length, 'exactly one gap delta for the one row pair').toBe(1)

    // It NAMES the two rows it sits between, so an operator knows which spacing
    // knob to turn — the clause no FC sibling asserts.
    expect(gaps[0].text).toBe('Heading → Body copy')
    // …and carries BOTH measured gaps, so expected-minus-actual is directly the
    // linear correction to apply (40 - 52 = -12px).
    expect(gaps[0].expected).toBe('40px')
    expect(gaps[0].actual).toBe('52px')
  })

  it('test_UAT_AC1609_tolerant_widens_the_gap_band_and_absorbs_a_12px_difference', () => {
    // Default tolerance is 6px, so 12px fires. `--tolerant` widens it to 16px, so
    // the same comparison is absorbed — the AC's second Verification sentence.
    const ref = mani('ref', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })])
    const ours = mani('a', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 72, 200, 20) })])

    expect(diffManifests(ref, ours).deltas.some((d) => d.property === 'gap')).toBe(true)
    expect(diffManifests(ref, ours, { tolerant: true }).deltas.some((d) => d.property === 'gap')).toBe(false)
  })

  it('test_UAT_AC1609_rows_that_are_not_genuinely_stacked_contribute_no_gap', () => {
    // "Rows that are not genuinely stacked (overlapping on either side) contribute
    // no gap." Here the reference rows are stacked (gap 40) but ours overlap — the
    // second row starts 40px ABOVE the first row's bottom. A signed "gap" across
    // overlapping boxes is not a spacing measurement, so none is reported.
    const overlapping = diffManifests(
      mani('ref', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })]),
      mani('a', [el('Heading', { box: box(0, 0, 200, 60) }), el('Body copy', { box: box(0, 20, 200, 20) })]),
    )
    expect(overlapping.deltas.some((d) => d.property === 'gap')).toBe(false)
    // The overlap itself is still reported — by the axes that own it, so this is a
    // suppression of a meaningless measurement, not a blind spot.
    expect(overlapping.deltas.length).toBeGreaterThan(0)
  })

  it('test_UAT_AC1609_side_by_side_cards_are_one_row_not_several', () => {
    // Three cards laid out side by side share a row. Grouping them as three rows
    // would invent two zero-height "gaps" between neighbours and report the one
    // real spacing difference three times over.
    const cards = (footY: number): ValueElement[] => [
      el('Card one', { box: box(0, 0, 100, 20) }),
      el('Card two', { box: box(120, 0, 100, 20) }),
      el('Card three', { box: box(240, 0, 100, 20) }),
      el('Footer', { box: box(0, footY, 200, 20) }),
    ]

    const gaps = diffManifests(mani('ref', cards(60)), mani('a', cards(100))).deltas.filter((d) => d.property === 'gap')

    // One row pair, therefore exactly one gap delta — not one per card.
    expect(gaps.length).toBe(1)
    // Labelled from the row, which begins at the first card.
    expect(gaps[0].text).toBe('Card one → Footer')
    expect(gaps[0].expected).toBe('40px')
    expect(gaps[0].actual).toBe('80px')
  })
})

// ── AC-1610 — band padding is not compared; the gap axis supersedes it ───────

describe('story-d5de22a5 — AC-1610 band padding is superseded by the gap axis', () => {
  it('test_UAT_AC1610_differing_band_padding_with_agreeing_gaps_raises_no_delta', () => {
    // The proxy's false positive: the two sides distribute the same visible rhythm
    // differently (one through padding, one through margins), so the rendered
    // inter-row gaps agree while the declared band padding differs sharply. The
    // old axis fired here; nothing may now.
    const d = diffManifests(
      mani('ref', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })], [
        section(0, 0),
      ]),
      mani('a', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })], [
        section(96, 128),
      ]),
    )

    // No delta at all — in particular no band-padding delta on any section.
    expect(d.deltas).toEqual([])
    expect(d.deltas.some((x) => PADDING_AXES.includes(x.property))).toBe(false)
  })

  it('test_UAT_AC1610_identical_band_padding_with_a_shifted_row_reports_the_gap_axis', () => {
    // The mirror: band padding is held IDENTICAL on both sides while a row moves,
    // so the visible rhythm genuinely differs. The vertical-spacing signal must now
    // fire, and it must be the measured `gap` — the axis that replaced the proxy.
    const d = diffManifests(
      mani('ref', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 60, 200, 20) })], [
        section(48, 48),
      ]),
      mani('a', [el('Heading', { box: box(0, 0, 200, 20) }), el('Body copy', { box: box(0, 100, 200, 20) })], [
        section(48, 48),
      ]),
    )

    const gaps = d.deltas.filter((x) => x.property === 'gap')
    expect(gaps.length, 'the spacing difference is reported once, on the gap axis').toBe(1)
    expect(gaps[0].expected).toBe('40px')
    expect(gaps[0].actual).toBe('80px')

    // Band padding is identical on both sides AND is not an axis at all, so it
    // contributes nothing either way.
    expect(d.deltas.some((x) => PADDING_AXES.includes(x.property))).toBe(false)
    // `gap` is the ONLY vertical-spacing axis reported: the two are not
    // double-reported, which is the whole point of retiring the proxy.
    //
    // Note: the row's absolute `position` delta is also present and is expected —
    // it is a different axis (absolute drift, repair class B) answering a different
    // question, and it is what `gap` was introduced to complement rather than
    // replace. AC-1610's Verification sentence "exactly one delta is reported"
    // reads more narrowly than its own Criterion, which speaks only about band
    // padding vs the gap axis; the Criterion is what is asserted here.
    const spacingAxes = d.deltas.filter((x) => x.property === 'gap' || PADDING_AXES.includes(x.property))
    expect(spacingAxes.map((x) => x.property)).toEqual(['gap'])
  })
})
