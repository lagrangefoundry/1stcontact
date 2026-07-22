import { describe, expect, it } from 'vitest'
import {
  diffManifests,
  type ValueDelta,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-d5de22a5 — "Values-diff closes capture blind
 * spots." This file covers the treatment / effect / media / font-fallback
 * closures (AC-711…AC-715); the sibling `reconcile-values-diff-fidelity.test.ts`
 * covers the geometry / surface / pairing closures (AC-629…AC-633).
 *
 * Boundary: every UAT drives the exported diff engine (`diffManifests`) — the
 * exact code path the `1c values-diff` CLI runs — against projected manifests.
 * Nothing internal is mocked; the manifests are the same shape the real capture
 * emits. Each new axis is additive and backward-tolerant: a value absent on
 * either side is skipped, never reported, so each closure can only *reduce*
 * false negatives (the "matches / absent → no delta" leg of every AC).
 *
 *   AC-711 — typography treatments (font-style, decoration, transform,
 *            small-caps) + list marker captured and compared per text run
 *   AC-712 — element effects (backdrop-filter/outline presence, blend mode,
 *            pseudo-content, opacity) captured and compared
 *   AC-713 — box-border comparison folds in line style; border captured on
 *            text runs via the thickest painted side
 *   AC-714 — image object-position (crop within its box) compared exactly
 *   AC-715 — a reference font-fallback (FOUT) artifact does not flag a correct
 *            render as a defect
 */

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A projected text run with sane defaults; `over` sets the axis under test. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
/** A text-free image element (pairs on a11yRole + document order). */
function imgEl(over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'img',
    text: '(img)',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    box: box(0, 0, 200, 200),
    ...over,
  }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })

const deltasFor = (ref: ValueManifest, act: ValueManifest, opts = {}): ValueDelta[] =>
  diffManifests(ref, act, opts).deltas
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)
const on = (deltas: ValueDelta[], property: string): ValueDelta | undefined =>
  deltas.find((d) => d.property === property)

describe('story-d5de22a5 — values-diff treatment / effect / media / fallback closures', () => {
  it('test_UAT_AC711_typography_treatments_and_list_marker_per_run', () => {
    // Each axis is a whole property the diff never saw. When exactly one differs,
    // a single delta surfaces on that axis at the expected severity; matching
    // values, or the field absent on either side, produce none.
    const cases: Array<{ prop: string; base: Partial<ValueElement>; over: Partial<ValueElement>; tier: string }> = [
      // font-style — italic run vs roman.
      { prop: 'fontStyle', base: { fontStyle: 'italic' }, over: { fontStyle: null }, tier: 'MEDIUM' },
      // text-decoration — underline present on one side only.
      { prop: 'textDecoration', base: { textDecoration: 'underline' }, over: { textDecoration: null }, tier: 'MEDIUM' },
      // text-transform — CSS uppercase vs no transform.
      { prop: 'textTransform', base: { textTransform: 'uppercase' }, over: { textTransform: null }, tier: 'MEDIUM' },
      // font-variant — small-caps vs normal.
      { prop: 'fontVariant', base: { fontVariant: 'small-caps' }, over: { fontVariant: 'normal' }, tier: 'MEDIUM' },
      // list-style-type marker — disc vs decimal (own `marker` kind).
      { prop: 'listMarker', base: { role: 'listitem', listMarker: 'disc' }, over: { role: 'listitem', listMarker: 'decimal' }, tier: 'MEDIUM' },
    ]
    for (const c of cases) {
      // (a) exactly one axis differs → a single delta on that axis, at its tier.
      const differ = deltasFor(mani('ref', [el('Run', c.base)]), mani('a', [el('Run', c.over)]))
      const d = on(differ, c.prop)
      expect(d, `${c.prop} delta surfaces`).toBeTruthy()
      expect(d!.tier).toBe(c.tier)
      expect(differ.filter((x) => x.property === c.prop)).toHaveLength(1) // single, not duplicated

      // (b) axis matches on both sides → no delta (only reduces false negatives).
      expect(hasProp(deltasFor(mani('ref', [el('Run', c.base)]), mani('a', [el('Run', c.base)])), c.prop)).toBe(false)

      // (c) field absent on one side (pre-axis bundle) → guarded, no delta.
      const absent = { ...c.base }
      delete (absent as Record<string, unknown>)[c.prop]
      expect(hasProp(deltasFor(mani('ref', [el('Run', c.base)]), mani('a', [el('Run', absent)])), c.prop)).toBe(false)
    }
  })

  it('test_UAT_AC712_element_effects_captured_and_compared', () => {
    // backdrop-filter and outline are PRESENCE treatments (their value strings
    // drift across engines); blend mode and pseudo-content are DISCRETE values;
    // opacity is an EXACT numeric axis (tonal / LOW).

    // backdrop-filter present vs absent → delta; both present (even different
    // blur radii) → none, because only presence is compared.
    expect(hasProp(deltasFor(mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]), mani('a', [el('Panel', { backdropFilter: null })])), 'backdropFilter')).toBe(true)
    expect(hasProp(deltasFor(mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]), mani('a', [el('Panel', { backdropFilter: 'blur(4px)' })])), 'backdropFilter')).toBe(false)

    // outline present vs absent → delta.
    expect(hasProp(deltasFor(mani('ref', [el('Field', { outline: '2px solid #3b82f6' })]), mani('a', [el('Field', { outline: null })])), 'outline')).toBe(true)

    // blend mode multiply vs normal → discrete-value delta.
    expect(hasProp(deltasFor(mani('ref', [el('Overlay', { blendMode: 'multiply' })]), mani('a', [el('Overlay', { blendMode: 'normal' })])), 'blendMode')).toBe(true)

    // ::after pseudo-content present on one side only → discrete-value delta.
    expect(hasProp(deltasFor(mani('ref', [el('Chip', { pseudo: 'after' })]), mani('a', [el('Chip', { pseudo: null })])), 'pseudo')).toBe(true)

    // opacity 0.5 vs 1.0 → an exact-numeric (tonal, LOW) delta.
    const ghost = on(deltasFor(mani('ref', [el('Ghost', { opacity: 0.5 })]), mani('a', [el('Ghost', { opacity: 1 })])), 'opacity')
    expect(ghost).toBeTruthy()
    expect(ghost!.tier).toBe('LOW')

    // No delta when the axes match …
    expect(hasProp(deltasFor(mani('ref', [el('E', { opacity: 0.5, blendMode: 'multiply' })]), mani('a', [el('E', { opacity: 0.5, blendMode: 'multiply' })])), 'opacity')).toBe(false)
    // … when a field is absent on one side (guarded) …
    expect(hasProp(deltasFor(mani('ref', [el('E', { opacity: 0.5 })]), mani('a', [el('E', {})])), 'opacity')).toBe(false)
    // … and for an opacity difference inside the tolerance band under --tolerant
    // (exact by default, a small band when tolerant).
    expect(hasProp(deltasFor(mani('ref', [el('E', { opacity: 0.5 })]), mani('a', [el('E', { opacity: 0.51 })]), { tolerant: true }), 'opacity')).toBe(false)
  })

  it('test_UAT_AC713_border_line_style_and_capture_on_text_runs', () => {
    // (1) Borders differing ONLY in line style (dashed vs solid) at the same
    //     width + colour → a border delta whose label names the style.
    const styled = deltasFor(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'dashed' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    const styleDelta = on(styled, 'border')
    expect(styleDelta, 'style-only border delta surfaces').toBeTruthy()
    // The delta label carries the style (borderLabel folds it in).
    expect(styleDelta!.expected).toContain('dashed')
    expect(styleDelta!.actual).toContain('solid')

    // (2) Style absent on one side (a bundle captured before line style existed)
    //     → the style comparison is skipped; no style-driven delta is fabricated.
    const legacy = deltasFor(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    expect(hasProp(legacy, 'border')).toBe(false)

    // (3) The box border is now captured on TEXT RUNS (previously fields-only) via
    //     the thickest painted side: a run carrying a single-side (bottom rule)
    //     border vs one with none → a border delta surfaces.
    const rule = deltasFor(
      mani('ref', [el('Section title', { border: { widthPx: 2, color: '#334155', style: 'solid' } })]),
      mani('a', [el('Section title', { border: null })]),
    )
    expect(on(rule, 'border'), 'border delta on a text run').toBeTruthy()
  })

  it('test_UAT_AC714_object_position_crop_compared_exactly', () => {
    // Same box + object-fit, differing crop anchor (top vs centre) reframes the
    // photo — a media fact neither size nor fit holds. Compared exactly.
    expect(hasProp(deltasFor(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: '50% 50%' })]),
    ), 'objectPosition')).toBe(true)

    // Matching positions → no delta.
    expect(hasProp(deltasFor(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
    ), 'objectPosition')).toBe(false)

    // Field absent on one side (pre-axis bundle) → guarded, no delta.
    expect(hasProp(deltasFor(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover' })]),
    ), 'objectPosition')).toBe(false)
  })

  it('test_UAT_AC715_reference_fout_does_not_flag_correct_render', () => {
    // Reverse direction: the REFERENCE showed a font fallback (fontLoaded:false,
    // a capture-side FOUT artifact) but OUR render resolved the intended face —
    // a correct render, so NO fontLoad delta is emitted.
    expect(hasProp(deltasFor(
      mani('ref', [el('Wordmark', { fontLoaded: false })]),
      mani('a', [el('Wordmark', { fontLoaded: true })]),
    ), 'fontLoad')).toBe(false)

    // Forward direction: OUR render fell back off the intended face → the
    // fontLoad defect is still reported.
    expect(hasProp(deltasFor(
      mani('ref', [el('Wordmark', { fontLoaded: true })]),
      mani('a', [el('Wordmark', { fontLoaded: false })]),
    ), 'fontLoad')).toBe(true)

    // Both sides resolved the intended face → no delta.
    expect(hasProp(deltasFor(
      mani('ref', [el('Wordmark', { fontLoaded: true })]),
      mani('a', [el('Wordmark', { fontLoaded: true })]),
    ), 'fontLoad')).toBe(false)
  })
})
