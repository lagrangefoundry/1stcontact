import { describe, expect, it } from 'vitest'
import { adoptFlatValues, planGapFixes } from '../tools/generate/src/cli/edit'
import type { StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/**
 * UATs for REQ-66 — `adopt-values`: mechanically COPY the reference's flat Type-A
 * values into the draft's styled objects (the "copy" half of the REQ-64 repair
 * order). These drive the pure core `adoptFlatValues(projections, pages)` directly
 * — no disk — asserting BOTH that a flat difference is adopted and that the guards
 * (structural / gradient / inferred / not-authored) correctly leave a value alone.
 */

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'heading', text, color: '#000000', fontFamily: 'sans', fontSizePx: 20, fontWeight: 400, ...over }
}
/** A ladder of projections, one per width, each carrying the same element set. */
function ladder(...cells: { width: number; elements: ValueElement[] }[]): StateProjection[] {
  return cells.map((c) => ({
    engine: 'chromium',
    viewport: { width: c.width, height: 900 },
    state: 'rest',
    manifest: { source: 'ref', elements: c.elements, sections: [] },
  }))
}
/** A page holding one styled heading object we can inspect after mutation. */
function pageWith(style: Record<string, unknown>): Record<string, unknown> {
  return { id: 'home', modules: [{ content: { heading: style } }] }
}
const headingOf = (page: Record<string, unknown>): Record<string, unknown> =>
  (((page.modules as { content: { heading: Record<string, unknown> } }[])[0]).content.heading)

describe('REQ-66 adopt-values — copy flat Type-A, leave structural/guarded alone', () => {
  it('test_UAT_FC_REQ-66_adopts_flat_color_and_weight', () => {
    // A colour + weight constant across the ladder and different from ours → copied.
    const projs = ladder(
      { width: 375, elements: [el('Hello', { color: '#222222', fontWeight: 700 })] },
      { width: 1280, elements: [el('Hello', { color: '#222222', fontWeight: 700 })] },
    )
    const page = pageWith({ text: 'Hello', color: '#111111', fontSizePx: 20, fontWeight: 400 })
    const changes = adoptFlatValues(projs, [{ name: 'home.json', page }])
    expect(changes.map((c) => c.axis).sort()).toEqual(['color', 'fontWeight'])
    expect(headingOf(page).color).toBe('#222222')
    expect(headingOf(page).fontWeight).toBe(700)
    // fontSizePx already matched (20) → untouched, no delta.
    expect(headingOf(page).fontSizePx).toBe(20)
  })

  it('test_UAT_FC_REQ-66_skips_structural_value_that_varies_across_ladder', () => {
    // A responsive font size (30 mobile → 36 desktop) is structural — never a scalar
    // paste, so it must be left exactly as authored.
    const projs = ladder(
      { width: 375, elements: [el('Hello', { fontSizePx: 30 })] },
      { width: 1280, elements: [el('Hello', { fontSizePx: 36 })] },
    )
    const page = pageWith({ text: 'Hello', color: '#000000', fontSizePx: 72, fontWeight: 400 })
    const changes = adoptFlatValues(projs, [{ name: 'home.json', page }])
    expect(changes.some((c) => c.axis === 'fontSizePx')).toBe(false)
    expect(headingOf(page).fontSizePx).toBe(72)
  })

  it('test_UAT_FC_REQ-66_skips_color_on_gradient_and_inferred_nodes', () => {
    // The wordmark trap: the reference's solid colour is the transparent base under
    // a gradient (or an inferred sentinel), not the paint. Never copy it.
    const projs = ladder(
      { width: 375, elements: [el('Grad', { color: '#000000', gradient: { angleDeg: 90, stops: [{ color: '#f5e6a3', position: 0 }] } }), el('Guess', { color: '#000000', colorInferred: true })] },
      { width: 1280, elements: [el('Grad', { color: '#000000', gradient: { angleDeg: 90, stops: [{ color: '#f5e6a3', position: 0 }] } }), el('Guess', { color: '#000000', colorInferred: true })] },
    )
    const page = { id: 'home', modules: [{ content: { heading: { text: 'Grad', color: '#f5e6a3' } } }, { content: { heading: { text: 'Guess', color: '#abcdef' } } }] }
    const changes = adoptFlatValues(projs, [{ name: 'home.json', page }])
    expect(changes.some((c) => c.axis === 'color')).toBe(false)
  })

  it('test_UAT_FC_REQ-66_never_introduces_an_axis_the_style_does_not_author', () => {
    // The reference authors a letter-spacing, but our style object never set one —
    // adopt-values must not inject it (that would change intent, not correct a value).
    const projs = ladder(
      { width: 375, elements: [el('Hello', { letterSpacingPx: -0.5 })] },
      { width: 1280, elements: [el('Hello', { letterSpacingPx: -0.5 })] },
    )
    const page = pageWith({ text: 'Hello', color: '#000000', fontSizePx: 20, fontWeight: 400 })
    adoptFlatValues(projs, [{ name: 'home.json', page }])
    expect('letterSpacingPx' in headingOf(page)).toBe(false)
  })

  it('test_UAT_FC_REQ-66_restricts_to_requested_axes', () => {
    // --axes color: only colour is adopted even though weight also differs.
    const projs = ladder(
      { width: 375, elements: [el('Hello', { color: '#222222', fontWeight: 700 })] },
      { width: 1280, elements: [el('Hello', { color: '#222222', fontWeight: 700 })] },
    )
    const page = pageWith({ text: 'Hello', color: '#111111', fontSizePx: 20, fontWeight: 400 })
    const changes = adoptFlatValues(projs, [{ name: 'home.json', page }], { axes: ['color'] })
    expect(changes.map((c) => c.axis)).toEqual(['color'])
    expect(headingOf(page).fontWeight).toBe(400) // weight untouched
  })
})

describe('REQ-74 gap inversion — close a gap delta by setting spacingTop (linear)', () => {
  const twoModulePage = (bDials: Record<string, unknown> = {}) => ({
    id: 'home',
    modules: [
      { id: 'a', type: 'text-block', dials: {}, content: { heading: { text: 'Alpha' } } },
      { id: 'b', type: 'services-grid', dials: bDials, content: { heading: { text: 'Beta' } } },
    ],
  })

  it('test_UAT_FC_REQ-74_sets_spacingTop_to_close_a_too_small_gap', () => {
    const page = twoModulePage({ spacingTop: 'lg' }) // 64px
    // Gap below Beta: ref 96, ours 64 → +32 → 64+32 = 96 = xl.
    const fixes = planGapFixes([{ text: 'Alpha tail → Beta', expected: '96px', actual: '64px' }], [{ page }])
    expect(fixes).toHaveLength(1)
    expect(fixes[0].moduleId).toBe('b')
    expect((page.modules[1].dials as Record<string, unknown>).spacingTop).toBe('xl') // snapped to the token
  })

  it('test_UAT_FC_REQ-74_default_spacingTop_uses_module_default_and_literal_px', () => {
    const page = twoModulePage({}) // spacingTop unset → default 64
    // ref 71, ours 64 → +7 → 71px (no token match → literal).
    const fixes = planGapFixes([{ text: 'Alpha tail → Beta', expected: '71px', actual: '64px' }], [{ page }])
    expect((page.modules[1].dials as Record<string, unknown>).spacingTop).toBe('71px')
    expect(fixes[0].from).toContain('default')
  })

  it('test_UAT_FC_REQ-74_tight_gap_zeros_top_and_reduces_previous_spacingBottom', () => {
    const page = twoModulePage({ spacingTop: 'lg' }) // 64
    // ref 6, ours 128 → -122 → spacingTop can't go negative: 0, then take remaining
    // (58) from Alpha's spacingBottom (default 64 → 6).
    const fixes = planGapFixes([{ text: 'Alpha tail → Beta', expected: '6px', actual: '128px' }], [{ page }])
    expect((page.modules[1].dials as Record<string, unknown>).spacingTop).toBe('none')
    expect((page.modules[0].dials as Record<string, unknown>).spacingBottom).toBe('6px')
    expect(fixes[0].note).toContain('spacingBottom')
  })

  it('test_UAT_FC_REQ-74_skips_responsive_gap_and_unmatched_boundary', () => {
    const page = twoModulePage({ spacingTop: 'lg' })
    const fixes = planGapFixes(
      [
        { text: 'X → Beta', expected: '197px .. 142px', actual: '150px' }, // responsive → skip
        { text: 'X → Nonexistent', expected: '96px', actual: '64px' }, // no matching module → skip
      ],
      [{ page }],
    )
    expect(fixes).toHaveLength(0)
    expect((page.modules[1].dials as Record<string, unknown>).spacingTop).toBe('lg') // untouched
  })
})
