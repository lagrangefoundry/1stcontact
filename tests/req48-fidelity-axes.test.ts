import { describe, expect, it } from 'vitest'
import {
  colorDistance,
  diffManifests,
  horizontalOverflows,
  RESPONSIVE_VIEWPORTS,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-48 — extending the fidelity gate beyond the static single-state
 * frame. Built incrementally, one capability per commit; this file grows as each
 * axis lands.
 *
 * Item 9 (ignore-masks). A captured reference hardcodes `© 2025` while our render
 * emits the dynamic current year — a permanent, correct-by-design false positive
 * the gate must suppress without hiding a real content change. These UATs prove
 * the built-in calendar-year mask folds a year-only difference (so it never
 * surfaces even as a broken pairing), that any *other* change on the same run
 * still fires, that `--compare-years` (ignoreDynamicYear:false) restores verbatim
 * comparison, and that an explicit `--ignore` pattern suppresses arbitrary dynamic
 * content while leaving unmasked deltas — and never crashes on a malformed mask.
 */

// ── manifest builders (mirror req31/req35) ───────────────────────────────────

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}

// ── Item 9 — ignore-masks ────────────────────────────────────────────────────

describe('REQ-48 item 9 — ignore-masks', () => {
  it('test_UAT_FC_REQ-48_dynamic_year_not_flagged', () => {
    // Reference footer hardcodes 2025; our dynamic render says 2026 — everything
    // else identical. The year mask (on by default) must yield a clean diff.
    const expected = mani('ref', [el('© 2025 GigaByte Alchemy')])
    const actual = mani('draft', [el('© 2026 GigaByte Alchemy')])
    const report = diffManifests(expected, actual)
    expect(report.deltas).toHaveLength(0)
    expect(report.matched).toBe(1)
    expect(report.unmatched).toBe(0)
  })

  it('test_UAT_FC_REQ-48_year_mask_preserves_non_year_text_change', () => {
    // Only a non-year word changed alongside the year: the gate must still fire.
    const expected = mani('ref', [el('© 2025 GigaByte Alchemy')])
    const actual = mani('draft', [el('© 2026 GigaByte Foundry')])
    const report = diffManifests(expected, actual)
    expect(report.deltas.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-48_compare_years_restores_year_delta', () => {
    // Opting out of the mask makes a year-only difference a real delta again.
    const expected = mani('ref', [el('© 2025 GigaByte Alchemy')])
    const actual = mani('draft', [el('© 2026 GigaByte Alchemy')])
    const report = diffManifests(expected, actual, { ignoreDynamicYear: false })
    expect(report.deltas.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-48_explicit_ignore_mask_suppresses_delta', () => {
    // A live "updated N minutes ago" run carries a real colour delta, but the
    // operator masks the whole run as dynamic; it is suppressed and counted.
    const expected = mani('ref', [el('Updated 3 minutes ago', { color: '#111111' })])
    const actual = mani('draft', [el('Updated 3 minutes ago', { color: '#3388ff' })])
    const report = diffManifests(expected, actual, { ignore: ['^Updated \\d+ minute'] })
    expect(report.deltas).toHaveLength(0)
    expect(report.suppressed).toBe(1)
  })

  it('test_UAT_FC_REQ-48_ignore_mask_leaves_unmasked_delta', () => {
    // The mask hits one run; a genuine delta on a different run still ranks.
    const expected = mani('ref', [
      el('Live viewers: 1,204', { color: '#111111' }),
      el('Our Mission', { color: '#111111' }),
    ])
    const actual = mani('draft', [
      el('Live viewers: 1,204', { color: '#3388ff' }),
      el('Our Mission', { color: '#c00000' }),
    ])
    const report = diffManifests(expected, actual, { ignore: ['^Live viewers'] })
    expect(report.suppressed).toBe(1)
    expect(report.deltas).toHaveLength(1)
    expect(report.deltas[0].text).toBe('Our Mission')
  })

  it('test_UAT_FC_REQ-48_malformed_ignore_pattern_is_skipped_not_fatal', () => {
    // An un-compilable mask must degrade to "not ignored", never crash the gate.
    const expected = mani('ref', [el('Our Mission', { color: '#111111' })])
    const actual = mani('draft', [el('Our Mission', { color: '#c00000' })])
    const report = diffManifests(expected, actual, { ignore: ['('] })
    expect(report.suppressed).toBe(0)
    expect(report.deltas).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-48_faithful_control_passes_clean', () => {
    // The unchanged-pass control the acceptance requires: identical manifests
    // produce zero deltas and suppress nothing.
    const m = mani('ref', [el('© 2026 GigaByte Alchemy'), el('Our Mission')])
    const report = diffManifests(m, mani('draft', [el('© 2026 GigaByte Alchemy'), el('Our Mission')]))
    expect(report.deltas).toHaveLength(0)
    expect(report.suppressed).toBe(0)
  })
})

// ── Item 8a — systemic sub-threshold aggregation ─────────────────────────────

/** N body runs, each a distinct text so they pair 1:1, all painted `color`. */
function bodyRuns(n: number, color: string): ValueElement[] {
  return Array.from({ length: n }, (_, i) => el(`line ${i + 1}`, { color }))
}

describe('REQ-48 item 8a — systemic sub-threshold aggregation', () => {
  it('test_UAT_FC_REQ-48_systemic_low_delta_escalates_above_isolated', () => {
    // A near-black body tone rendered as slate-700 on 8 runs: each colour delta
    // is an isolated LOW, but collectively the drift is obvious. The synthetic
    // aggregate must lead the report, escalated above the per-element LOW rows.
    const expected = mani('ref', bodyRuns(8, '#111111'))
    const actual = mani('draft', bodyRuns(8, '#556677'))
    const report = diffManifests(expected, actual)
    const top = report.deltas[0]
    expect(top.systemic).toBe(true)
    expect(top.kind).toBe('color')
    expect(top.count).toBe(8)
    expect(top.tier).not.toBe('LOW')
    // The individual rows survive; the aggregate is an added headline.
    expect(report.deltas.filter((d) => !d.systemic && d.kind === 'color')).toHaveLength(8)
  })

  it('test_UAT_FC_REQ-48_isolated_low_delta_not_escalated', () => {
    // Three colour deltas — below the default threshold of 5 — stay per-element.
    const expected = mani('ref', bodyRuns(3, '#111111'))
    const actual = mani('draft', bodyRuns(3, '#556677'))
    const report = diffManifests(expected, actual)
    expect(report.deltas.some((d) => d.systemic)).toBe(false)
    expect(report.deltas.every((d) => d.tier === 'LOW')).toBe(true)
  })

  it('test_UAT_FC_REQ-48_systemic_tier_scales_with_pervasiveness_capped_at_high', () => {
    // A colour drift on 30 elements is maximally pervasive; escalation caps at
    // HIGH — a tonal drift never masquerades as a CRITICAL structural break.
    const report = diffManifests(mani('ref', bodyRuns(30, '#111111')), mani('draft', bodyRuns(30, '#556677')))
    const agg = report.deltas.find((d) => d.systemic)
    expect(agg?.tier).toBe('HIGH')
    // Even at 30 it never reaches CRITICAL.
    expect(report.deltas.some((d) => d.tier === 'CRITICAL')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_systemic_threshold_zero_disables_aggregation', () => {
    const report = diffManifests(mani('ref', bodyRuns(8, '#111111')), mani('draft', bodyRuns(8, '#556677')), {
      systemicThreshold: 0,
    })
    expect(report.deltas.some((d) => d.systemic)).toBe(false)
    expect(report.deltas).toHaveLength(8)
  })
})

// ── Item 8b — perceptual ΔE via OKLCH ────────────────────────────────────────

describe('REQ-48 item 8b — perceptual OKLab colour distance', () => {
  it('test_UAT_FC_REQ-48_color_distance_is_oklab_scale', () => {
    // ΔEOK: identical = 0, full black→white ≈ 1, a ±1 rounding step is a tiny
    // fraction, and the flagship near-neighbour golds are clearly separated.
    expect(colorDistance('#000000', '#000000')).toBe(0)
    expect(colorDistance('#000000', '#ffffff')).toBeCloseTo(1, 1)
    expect(colorDistance('#808080', '#818080')).toBeLessThan(0.01)
    expect(colorDistance('#f5e6a3', '#fbba72')).toBeGreaterThan(0.05)
  })

  it('test_UAT_FC_REQ-48_oklab_jitter_passes_but_near_neighbour_flags', () => {
    // Sub-JND rounding on one run is clean; a near-neighbour gold shift on
    // another is a real colour delta — one perceptual threshold separates them.
    const expected = mani('ref', [
      el('caption', { color: '#808080' }),
      el('brand', { color: '#f5e6a3' }),
    ])
    const actual = mani('draft', [
      el('caption', { color: '#818080' }),
      el('brand', { color: '#fbba72' }),
    ])
    const report = diffManifests(expected, actual)
    const colorDeltas = report.deltas.filter((d) => d.kind === 'color' && !d.systemic)
    expect(colorDeltas).toHaveLength(1)
    expect(colorDeltas[0].text).toBe('brand')
  })
})

// ── Item 2 — layering / z-order ──────────────────────────────────────────────

describe('REQ-48 item 2 — layering / z-order', () => {
  it('test_UAT_FC_REQ-48_wrong_z_order_flagged_high', () => {
    // Portrait and caption correctly *placed* but their stacking is swapped —
    // identical on every 2D field, separated only by paint order. HIGH.
    const expected = mani('ref', [el('portrait', { zIndex: 1 }), el('caption', { zIndex: 5 })])
    const actual = mani('draft', [el('portrait', { zIndex: 5 }), el('caption', { zIndex: 1 })])
    const report = diffManifests(expected, actual)
    const z = report.deltas.filter((d) => d.kind === 'zOrder')
    expect(z).toHaveLength(2)
    expect(z.every((d) => d.tier === 'HIGH')).toBe(true)
  })

  it('test_UAT_FC_REQ-48_matching_z_order_clean', () => {
    const m = mani('ref', [el('portrait', { zIndex: 1 }), el('caption', { zIndex: 5 })])
    const report = diffManifests(m, mani('draft', [el('portrait', { zIndex: 1 }), el('caption', { zIndex: 5 })]))
    expect(report.deltas).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-48_z_order_absent_is_inert', () => {
    // Pre-REQ-48 manifests carry no zIndex; the axis must stay silent, not
    // synthesise a spurious 0-vs-undefined delta.
    const report = diffManifests(mani('ref', [el('a')]), mani('draft', [el('a')]))
    expect(report.deltas.some((d) => d.kind === 'zOrder')).toBe(false)
  })
})

// ── Item 3 — treatments beyond box-shadow ────────────────────────────────────

describe('REQ-48 item 3 — treatments (filter / text-glow / mask edge)', () => {
  it('test_UAT_FC_REQ-48_missing_text_glow_flagged', () => {
    const expected = mani('ref', [el('Neon', { textShadow: '0 0 8px #0ff' })])
    const actual = mani('draft', [el('Neon', { textShadow: null })])
    const report = diffManifests(expected, actual)
    const t = report.deltas.filter((d) => d.kind === 'treatment')
    expect(t).toHaveLength(1)
    expect(t[0].property).toBe('textShadow')
    expect(t[0].tier).toBe('MEDIUM')
  })

  it('test_UAT_FC_REQ-48_mask_edge_presence_flagged', () => {
    // Rounded-vs-masked edge: the reference feathers with a mask, the repro doesn't.
    const expected = mani('ref', [el('portrait', { maskEdge: 'linear-gradient(#000, transparent)' })])
    const actual = mani('draft', [el('portrait', { maskEdge: null })])
    const report = diffManifests(expected, actual)
    expect(report.deltas.filter((d) => d.property === 'mask')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-48_filter_halo_presence_flagged', () => {
    const report = diffManifests(
      mani('ref', [el('logo', { filter: 'drop-shadow(0 0 12px #fff)' })]),
      mani('draft', [el('logo', { filter: null })]),
    )
    expect(report.deltas.filter((d) => d.property === 'filter')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-48_matching_treatment_presence_is_clean', () => {
    // Presence-based: both glow, so even differing value strings do not flag
    // (engine-drifting blur radii are noise, not a fidelity gap).
    const report = diffManifests(
      mani('ref', [el('Neon', { textShadow: '0 0 8px #0ff' })]),
      mani('draft', [el('Neon', { textShadow: '0 0 9px #0ff' })]),
    )
    expect(report.deltas.some((d) => d.kind === 'treatment')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_treatment_absent_axis_inert', () => {
    const report = diffManifests(mani('ref', [el('a')]), mani('draft', [el('a')]))
    expect(report.deltas.some((d) => d.kind === 'treatment')).toBe(false)
  })
})

// ── Item 4 — media fidelity + capture descends into children ─────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A captured media child (img): text-free, pairs on a11yRole `img` + order. */
function imgEl(name: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text: name,
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    accessibleName: name,
    ...over,
  }
}

describe('REQ-48 item 4 — media fidelity / capture descent', () => {
  it('test_UAT_FC_REQ-48_circle_rendered_as_ellipse_flagged', () => {
    // Reference portrait is a circle (200×200, aspect 1); the repro renders it as
    // an ellipse (200×120). A media aspect delta fires at HIGH.
    const expected = mani('ref', [imgEl('portrait', { box: box(0, 0, 200, 200) })])
    const actual = mani('draft', [imgEl('portrait', { box: box(0, 0, 200, 120) })])
    const report = diffManifests(expected, actual)
    const m = report.deltas.filter((d) => d.property === 'aspect')
    expect(m).toHaveLength(1)
    expect(m[0].tier).toBe('HIGH')
  })

  it('test_UAT_FC_REQ-48_object_fit_mismatch_flagged', () => {
    const expected = mani('ref', [imgEl('hero', { objectFit: 'cover', box: box(0, 0, 300, 200) })])
    const actual = mani('draft', [imgEl('hero', { objectFit: 'fill', box: box(0, 0, 300, 200) })])
    const report = diffManifests(expected, actual)
    expect(report.deltas.filter((d) => d.property === 'objectFit')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-48_uncaptured_photo_child_flagged_missing', () => {
    // The montage-as-items:[] false negative: the reference has a photo child the
    // repro lacks. Now that capture descends into media, the diff pairs it and a
    // missing one surfaces as a CRITICAL presence delta instead of "matched".
    const expected = mani('ref', [imgEl('montage-1', { box: box(0, 0, 200, 200) })])
    const actual = mani('draft', [])
    const report = diffManifests(expected, actual)
    expect(report.deltas.some((d) => d.kind === 'presence')).toBe(true)
    expect(report.unmatched).toBe(1)
  })

  it('test_UAT_FC_REQ-48_matching_media_clean', () => {
    const m = mani('ref', [imgEl('portrait', { objectFit: 'cover', box: box(0, 0, 200, 200) })])
    const report = diffManifests(
      m,
      mani('draft', [imgEl('portrait', { objectFit: 'cover', box: box(0, 0, 200, 200) })]),
    )
    expect(report.deltas).toHaveLength(0)
  })
})

// ── Item 5 — multi-viewport / responsive reflow ──────────────────────────────

/** A manifest tagged with the viewport it was projected at. */
function maniV(source: string, elements: ValueElement[], width: number, height = 800): ValueManifest {
  return { source, elements, sections: [], viewport: { width, height } }
}

describe('REQ-48 item 5 — multi-viewport / responsive reflow', () => {
  it('test_UAT_FC_REQ-48_viewport_mismatch_flagged_critical', () => {
    // Reference shot at mobile, repro at desktop: the diff would be all artefacts
    // of the width mismatch. The precondition leads with a CRITICAL viewport delta.
    const expected = maniV('ref', [el('Home')], 375)
    const actual = maniV('draft', [el('Home')], 1280)
    const report = diffManifests(expected, actual)
    expect(report.deltas[0].kind).toBe('viewport')
    expect(report.deltas[0].tier).toBe('CRITICAL')
  })

  it('test_UAT_FC_REQ-48_matching_viewport_no_precondition_delta', () => {
    const report = diffManifests(maniV('ref', [el('Home')], 375), maniV('draft', [el('Home')], 375))
    expect(report.deltas.some((d) => d.kind === 'viewport')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_horizontal_overflow_flagged_at_mobile', () => {
    // A wordmark 400px wide at a 320px viewport overflows — a mobile reflow break.
    const overflowing = el('WORDMARK', { box: box(0, 0, 400, 40) })
    const report = diffManifests(maniV('ref', [overflowing], 320), maniV('draft', [overflowing], 320))
    const o = report.deltas.filter((d) => d.kind === 'overflow')
    expect(o).toHaveLength(1)
    expect(o[0].tier).toBe('HIGH')
    expect(o[0].text).toBe('WORDMARK')
  })

  it('test_UAT_FC_REQ-48_no_overflow_when_layout_fits', () => {
    const fits = el('Nav', { box: box(0, 0, 280, 40) })
    expect(horizontalOverflows(maniV('draft', [fits], 320))).toHaveLength(0)
    const report = diffManifests(maniV('ref', [fits], 320), maniV('draft', [fits], 320))
    expect(report.deltas.some((d) => d.kind === 'overflow')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_overflow_inert_without_viewport', () => {
    // Pre-REQ-48 manifests carry no viewport; the overflow check must stay silent.
    const wide = el('Wide', { box: box(0, 0, 9999, 40) })
    expect(horizontalOverflows(mani('draft', [wide]))).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-48_responsive_viewport_ladder', () => {
    const widths = RESPONSIVE_VIEWPORTS.map((v) => v.width)
    expect(widths).toEqual([320, 375, 768, 1024, 1280, 1440])
    // At least one non-desktop width so a mobile reflow break can surface.
    expect(widths.some((w) => w < 768)).toBe(true)
  })
})
