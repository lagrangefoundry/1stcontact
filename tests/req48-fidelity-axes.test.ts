import { describe, expect, it } from 'vitest'
import {
  calibrateDiscriminator,
  colorDistance,
  createEngineDriver,
  diffManifests,
  diffMultiState,
  discriminatorIsCalibrated,
  engineAvailable,
  horizontalOverflows,
  makeCalibrationBaseline,
  RESPONSIVE_VIEWPORTS,
  runMultiStateCapture,
  SEEDED_DEFECTS,
  unresolvedFonts,
  type BrowserDriver,
  type CapturedResponse,
  type InteractionState,
  type MultiStateCapture,
  type RawSignals,
  type RenderEngine,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
  type Viewport,
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

// ── Item 7 — web-font load / FOUT ────────────────────────────────────────────

describe('REQ-48 item 7 — web-font load / fallback metrics', () => {
  it('test_UAT_FC_REQ-48_fallback_font_flagged_high', () => {
    // Our render fell back off the intended face (fontLoaded:false): a FOUT that
    // shifts metrics for every run below it. HIGH, unilateral on our side.
    const expected = mani('ref', [el('Heading', { fontFamily: 'Inter' })])
    const actual = mani('draft', [el('Heading', { fontFamily: 'Inter', fontLoaded: false })])
    const report = diffManifests(expected, actual)
    const f = report.deltas.filter((d) => d.kind === 'fontLoad')
    expect(f).toHaveLength(1)
    expect(f[0].tier).toBe('HIGH')
  })

  it('test_UAT_FC_REQ-48_resolved_font_is_clean', () => {
    const report = diffManifests(
      mani('ref', [el('Heading', { fontFamily: 'Inter' })]),
      mani('draft', [el('Heading', { fontFamily: 'Inter', fontLoaded: true })]),
    )
    expect(report.deltas.some((d) => d.kind === 'fontLoad')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_unresolved_fonts_helper_selects_only_false', () => {
    const m = mani('draft', [
      el('a', { fontLoaded: false }),
      el('b', { fontLoaded: true }),
      el('c'), // undefined — generic / pre-REQ-48, never a false positive
    ])
    const unresolved = unresolvedFonts(m)
    expect(unresolved).toHaveLength(1)
    expect(unresolved[0].text).toBe('a')
  })
})

// ── Item 1 — motion & interaction (transforms + declared motion) ─────────────

describe('REQ-48 item 1 — motion / transform', () => {
  it('test_UAT_FC_REQ-48_rotation_mismatch_flagged_high', () => {
    // A collage layer rotated 15° in the reference, upright in the repro.
    const expected = mani('ref', [el('layer', { transformRotateDeg: 15 })])
    const actual = mani('draft', [el('layer', { transformRotateDeg: 0 })])
    const report = diffManifests(expected, actual)
    const t = report.deltas.filter((d) => d.kind === 'transform')
    expect(t).toHaveLength(1)
    expect(t[0].tier).toBe('HIGH')
  })

  it('test_UAT_FC_REQ-48_scale_mismatch_flagged', () => {
    const report = diffManifests(
      mani('ref', [el('badge', { transformScale: 1 })]),
      mani('draft', [el('badge', { transformScale: 1.3 })]),
    )
    expect(report.deltas.filter((d) => d.property === 'transform')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-48_small_rotation_jitter_tolerated', () => {
    // A 1° matrix-rounding difference is sub-threshold (±2°).
    const report = diffManifests(
      mani('ref', [el('layer', { transformRotateDeg: 0 })]),
      mani('draft', [el('layer', { transformRotateDeg: 1 })]),
    )
    expect(report.deltas.some((d) => d.kind === 'transform')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_missing_motion_flagged_medium', () => {
    // An entrance animation present in the reference, absent in the repro.
    const expected = mani('ref', [el('hero', { motion: 'animation' })])
    const actual = mani('draft', [el('hero', { motion: null })])
    const report = diffManifests(expected, actual)
    const m = report.deltas.filter((d) => d.kind === 'motion')
    expect(m).toHaveLength(1)
    expect(m[0].tier).toBe('MEDIUM')
  })

  it('test_UAT_FC_REQ-48_matching_transform_and_motion_clean', () => {
    const m = mani('ref', [el('x', { transformRotateDeg: 8, transformScale: 1.1, motion: 'transition' })])
    const report = diffManifests(
      m,
      mani('draft', [el('x', { transformRotateDeg: 8, transformScale: 1.1, motion: 'transition' })]),
    )
    expect(report.deltas).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-48_motion_absent_axis_inert', () => {
    const report = diffManifests(mani('ref', [el('x')]), mani('draft', [el('x')]))
    expect(report.deltas.some((d) => d.kind === 'transform' || d.kind === 'motion')).toBe(false)
  })
})

// ── Item 11 — anti-self-grading / negative-fixture calibration ───────────────

describe('REQ-48 item 11 — discriminator calibration', () => {
  it('test_UAT_FC_REQ-48_every_seeded_defect_fires', () => {
    // The independent oracle: each known defect must produce its expected delta
    // kind. A defect that does NOT fire is a blind axis — prove discrimination
    // before trusting any clean verdict.
    const results = calibrateDiscriminator()
    const blind = results.filter((r) => !r.fired)
    expect(blind, `blind axes: ${blind.map((b) => b.name).join(', ')}`).toEqual([])
    expect(results).toHaveLength(SEEDED_DEFECTS.length)
  })

  it('test_UAT_FC_REQ-48_discriminator_reports_calibrated', () => {
    const { calibrated, results } = discriminatorIsCalibrated()
    expect(calibrated).toBe(true)
    expect(results.every((r) => r.fired)).toBe(true)
  })

  it('test_UAT_FC_REQ-48_faithful_baseline_grades_clean', () => {
    // The negated control: an untouched faithful render must score zero — the
    // discriminator fires on defects but does not cry on a faithful repro.
    const baseline = makeCalibrationBaseline()
    const report = diffManifests(baseline, JSON.parse(JSON.stringify(baseline)))
    expect(report.deltas).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-48_calibration_catches_a_blinded_gate', () => {
    // If the gate were blind to one axis (simulated by masking that kind), the
    // calibration must catch it — proving the calibration itself has teeth.
    const results = calibrateDiscriminator(undefined, { ignore: ['.*'] })
    // An ignore-everything mask suppresses text-anchored deltas, so at least one
    // seeded defect must now fail to fire — the calibration is not a rubber stamp.
    expect(results.some((r) => !r.fired)).toBe(true)
  })
})

// ── Item 6 — cross-engine divergence ─────────────────────────────────────────

describe('REQ-48 item 6 — cross-engine', () => {
  it('test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated', () => {
    // Diffs across engines are layout-box equivalence, not pixel-equality: a few
    // px of AA / font-hinting drift between Blink and WebKit must not flag.
    const expected = mani('ref', [el('Heading', { box: box(0, 0, 300, 40) })])
    const actual = mani('draft', [el('Heading', { box: box(2, 2, 302, 41) })])
    const report = diffManifests(expected, actual)
    expect(report.deltas.some((d) => d.kind === 'position' || d.kind === 'size')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_engine_driver_factory_and_availability', async () => {
    // The engine seam exists for all three engines; availability resolves to a
    // boolean (never throws) so a runner missing WebKit/Gecko skips, not fails.
    expect(typeof createEngineDriver('webkit')).toBe('function')
    expect(typeof createEngineDriver('firefox')).toBe('function')
    expect(typeof (await engineAvailable('webkit'))).toBe('boolean')
  })
})

// ── Items 1/5/6 — multi-state capture orchestration (hover actuation + loop) ──

/**
 * A fake driver for the multi-state loop: it never launches a browser. `navigate`
 * records the viewport; `actuate` records the forced state; `query` returns a
 * RawSignals whose single heading *scales under `:hover`* (transformScale 1.2) —
 * so a projection's geometry provably reflects the actuated state, exactly the
 * signal a resting frame cannot hold. `canActuate` is configurable to model a
 * non-Blink engine that can't force pseudo-states.
 */
class FakeStateDriver implements BrowserDriver {
  navigated: { url: string; viewport?: Viewport }[] = []
  actuated: InteractionState[] = []
  private state: InteractionState = 'rest'
  private viewport: Viewport = { width: 1280, height: 800 }
  constructor(private readonly actuates = true) {}
  async navigate(url: string, viewport?: Viewport): Promise<void> {
    this.navigated.push({ url, viewport })
    if (viewport) this.viewport = viewport
    this.state = 'rest'
  }
  async actuate(state: InteractionState): Promise<void> {
    this.actuated.push(state)
    this.state = state
  }
  canActuate(): boolean {
    return this.actuates
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array()
  }
  async query<T = unknown>(): Promise<T> {
    const scale = this.state === 'hover' ? 1.2 : 1
    const signals: RawSignals = {
      viewport: { width: this.viewport.width, height: this.viewport.height },
      bands: [
        {
          box: box(0, 0, this.viewport.width, 200),
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          colorScheme: 'light',
          fontFamily: 'sans',
          textAlign: 'left',
          paddingTopPx: 0,
          paddingBottomPx: 0,
          overlay: null,
          contentAnchorRatio: 0.5,
          content: [
            {
              role: 'heading',
              text: 'Buy now',
              color: '#000000',
              fontFamily: 'sans',
              fontSizePx: 32,
              fontWeight: 700,
              lineHeightPx: 40,
              letterSpacingPx: 0,
              gradientCss: null,
              borderLeftWidthPx: 0,
              borderLeftColor: null,
              paddingLeftPx: 0,
              box: box(0, 0, 200, 40),
              borderRadiusPx: 0,
              boxShadow: null,
              a11yRole: 'heading',
              arrangement: null,
              zIndex: 0,
              filter: null,
              textShadow: null,
              maskEdge: null,
              transformRotateDeg: 0,
              transformScale: scale,
              motion: 'transition',
            },
          ],
          items: [],
          fields: [],
        },
      ],
      colorUsage: [],
      fontFaces: [],
      typeScale: [32],
      spacingScalePx: [],
      containerMaxWidthPx: null,
      images: [],
    }
    return signals as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html></html>'
  }
  async close(): Promise<void> {}
}

describe('REQ-48 items 1/5/6 — multi-state capture orchestration', () => {
  it('test_UAT_FC_REQ-48_multistate_loop_projects_every_state_and_viewport', async () => {
    // engines × viewports × states = 1 × 2 × 2 = 4 projections, each tagged with
    // its full provenance, and hover is actually actuated on the open page.
    const driver = new FakeStateDriver()
    const matrix = await runMultiStateCapture('http://x.test', {
      engines: ['chromium'],
      viewports: [{ width: 320, height: 800 }, { width: 1280, height: 800 }],
      states: ['rest', 'hover'],
      driverFactoryFor: () => async () => driver,
      isEngineAvailable: async () => true,
    })
    expect(matrix.projections).toHaveLength(4)
    expect(matrix.notes).toEqual([])
    const keys = matrix.projections.map((p) => `${p.engine}:${p.viewport.width}:${p.state}`).sort()
    expect(keys).toEqual(['chromium:1280:hover', 'chromium:1280:rest', 'chromium:320:hover', 'chromium:320:rest'])
    // Every non-rest state was forced on the page (hover twice — once per viewport).
    expect(driver.actuated.filter((s) => s === 'hover')).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-48_hover_actuation_changes_projected_geometry', async () => {
    // Actuation feeds through: the hover projection carries the scaled transform
    // (1.2) the resting frame never shows — the whole point of a time axis.
    const matrix = await runMultiStateCapture('http://x.test', {
      engines: ['chromium'],
      viewports: [{ width: 1280, height: 800 }],
      states: ['rest', 'hover'],
      driverFactoryFor: () => async () => new FakeStateDriver(),
      isEngineAvailable: async () => true,
    })
    const rest = matrix.projections.find((p) => p.state === 'rest')!
    const hover = matrix.projections.find((p) => p.state === 'hover')!
    expect(rest.manifest.elements[0].transformScale).toBe(1)
    expect(hover.manifest.elements[0].transformScale).toBe(1.2)
  })

  it('test_UAT_FC_REQ-48_multistate_holds_non_actuating_driver_to_rest', async () => {
    // A driver that can't actuate (non-Blink engine) is held to rest and the
    // dropped hover cell is NOTED — never a silent unactuated frame posing as hover.
    const matrix = await runMultiStateCapture('http://x.test', {
      engines: ['chromium'],
      viewports: [{ width: 1280, height: 800 }],
      states: ['rest', 'hover'],
      driverFactoryFor: () => async () => new FakeStateDriver(false),
      isEngineAvailable: async () => true,
    })
    expect(matrix.projections.map((p) => p.state)).toEqual(['rest'])
    expect(matrix.notes.some((n) => /cannot actuate/.test(n) && /hover/.test(n))).toBe(true)
  })

  it('test_UAT_FC_REQ-48_multistate_skips_unavailable_engine_with_note', async () => {
    // WebKit unavailable → no webkit projections, and the gap is surfaced as a
    // note (a partial matrix must never read as full coverage).
    const matrix = await runMultiStateCapture('http://x.test', {
      engines: ['chromium', 'webkit'],
      viewports: [{ width: 1280, height: 800 }],
      states: ['rest'],
      driverFactoryFor: () => async () => new FakeStateDriver(),
      isEngineAvailable: async (e: RenderEngine) => e === 'chromium',
    })
    expect(matrix.projections.every((p) => p.engine === 'chromium')).toBe(true)
    expect(matrix.notes.some((n) => /webkit/.test(n) && /unavailable/.test(n))).toBe(true)
  })
})

// ── diffMultiState — cell-for-cell pairing across the matrix ──────────────────

/** A one-element manifest tagged with its full {engine, viewport, state} provenance. */
function proj(
  engine: RenderEngine,
  width: number,
  state: InteractionState,
  over: Partial<ValueElement>,
): StateProjection {
  const viewport = { width, height: 800 }
  const manifest: ValueManifest = {
    source: `${engine}:${width}:${state}`,
    elements: [el('Buy now', { box: box(0, 0, 200, 40), ...over })],
    sections: [],
    viewport,
    engine,
    state,
  }
  return { engine, viewport, state, manifest }
}

describe('REQ-48 items 1/5/6 — diffMultiState pairing', () => {
  it('test_UAT_FC_REQ-48_diff_multistate_localizes_hover_delta', () => {
    // A hover-scale present in the reference (1.2) but absent in the repro (1.0)
    // fires in the HOVER cell, while the rest cell (both 1.0) stays clean.
    const reference: MultiStateCapture = {
      url: 'u',
      projections: [
        proj('chromium', 1280, 'rest', { transformScale: 1 }),
        proj('chromium', 1280, 'hover', { transformScale: 1.2 }),
      ],
      notes: [],
    }
    const repro: MultiStateCapture = {
      url: 'u',
      projections: [
        proj('chromium', 1280, 'rest', { transformScale: 1 }),
        proj('chromium', 1280, 'hover', { transformScale: 1 }),
      ],
      notes: [],
    }
    const diffs = diffMultiState(reference, repro)
    const hoverCell = diffs.find((d) => d.state === 'hover')!
    const restCell = diffs.find((d) => d.state === 'rest')!
    expect(hoverCell.report!.deltas.some((d) => d.property === 'transform')).toBe(true)
    expect(restCell.report!.deltas.some((d) => d.property === 'transform')).toBe(false)
    // The worst cell (hover) sorts first.
    expect(diffs[0].state).toBe('hover')
  })

  it('test_UAT_FC_REQ-48_diff_multistate_pairs_per_viewport', () => {
    // A break at 320 only must fire at 320 and leave 1280 clean — layout keyed on
    // width, never bled across viewports.
    const reference: MultiStateCapture = {
      url: 'u',
      projections: [
        proj('chromium', 320, 'rest', { box: box(0, 0, 200, 40) }),
        proj('chromium', 1280, 'rest', { box: box(0, 0, 200, 40) }),
      ],
      notes: [],
    }
    const repro: MultiStateCapture = {
      url: 'u',
      projections: [
        proj('chromium', 320, 'rest', { box: box(400, 0, 200, 40) }), // shifted only at mobile
        proj('chromium', 1280, 'rest', { box: box(0, 0, 200, 40) }),
      ],
      notes: [],
    }
    const diffs = diffMultiState(reference, repro)
    const mobile = diffs.find((d) => d.viewportWidth === 320)!
    const desktop = diffs.find((d) => d.viewportWidth === 1280)!
    expect(mobile.report!.deltas.some((d) => d.kind === 'position')).toBe(true)
    expect(desktop.report!.deltas.some((d) => d.kind === 'position')).toBe(false)
  })

  it('test_UAT_FC_REQ-48_diff_multistate_missing_cell_flagged', () => {
    // A reference cell the repro never projected is a coverage gap: missing:true,
    // report null, and it sorts first (nothing to compare is maximally severe).
    const reference: MultiStateCapture = {
      url: 'u',
      projections: [
        proj('chromium', 1280, 'rest', { transformScale: 1 }),
        proj('chromium', 1280, 'hover', { transformScale: 1.2 }),
      ],
      notes: [],
    }
    const repro: MultiStateCapture = {
      url: 'u',
      projections: [proj('chromium', 1280, 'rest', { transformScale: 1 })],
      notes: [],
    }
    const diffs = diffMultiState(reference, repro)
    const hoverCell = diffs.find((d) => d.state === 'hover')!
    expect(hoverCell.missing).toBe(true)
    expect(hoverCell.report).toBeNull()
    expect(diffs[0].missing).toBe(true)
  })
})
