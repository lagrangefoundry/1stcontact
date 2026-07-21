import { describe, expect, it } from 'vitest'
import { planGapFixes } from '../tools/generate/src/cli/edit'

/**
 * UATs for REQ-74 — `adopt-gaps`: close section-boundary vertical GAP deltas by
 * inverting to `spacingTop` (a gap is linear in one knob). These drive the pure
 * core `planGapFixes(gaps, pages)` directly — no disk — asserting the linear
 * inversion, the module-default / literal-px path, the too-tight zero-and-borrow
 * case, and the responsive/unmatched skips.
 *
 * (This file previously also carried REQ-66 `adopt-values`; that command was a
 * vestige of the pre-L1 "capture bundle → adopt axis values into a site"
 * reproduction path, dissolved by REQ-83 once REQ-86 made reproduction fully
 * L1-based. Its removal is asserted in `req83-capture-to-l1-fold.test.ts`.)
 */
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
