import { describe, it, expect } from 'vitest'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'

/**
 * UATs for REQ-50 — a `styled-text` content field validates literal-or-known-alias
 * per style axis and rejects an unknown alias, so a captured value pastes in
 * verbatim while a typo (`fontWeight: "heavy"`, `color: "reddish"`) is caught.
 */
const meta: ModuleMeta = {
  id: 'test-styled',
  version: 1,
  variants: ['default'],
  dials: {},
  contentSchema: {
    heading: { type: 'styled-text', required: true },
    subhead: { type: 'styled-text', required: false },
  },
}

describe('REQ-50 styled-text validation — accepts literals and known aliases', () => {
  it('test_UAT_FC_REQ-50_valid_literal_run_passes', () => {
    const errors = validateModuleContent(meta, {
      heading: {
        text: 'Dreaming of healthier meals',
        fontFamily: 'Oswald',
        fontSizePx: 65,
        fontWeight: 500,
        color: '#ffffff',
        letterSpacingPx: 0,
        lineHeightPx: 75,
      },
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-50_valid_alias_run_passes', () => {
    const errors = validateModuleContent(meta, {
      heading: { text: 'x', fontSizePx: '5xl', fontWeight: 'medium', color: 'primary', lineHeightPx: 'snug' },
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-50_gradient_run_matching_report_shape_passes', () => {
    const errors = validateModuleContent(meta, {
      heading: {
        text: 'Gigabyte Alchemy',
        gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
      },
      subhead: {
        text: 'y',
        gradient: { angleDeg: 'to-right', stops: [{ color: 'accent-light' }, { color: 'accent-deep', position: 80 }] },
      },
    })
    expect(errors).toEqual([])
  })
})

describe('REQ-50 styled-text validation — rejects unknown aliases', () => {
  it('test_UAT_FC_REQ-50_unknown_weight_alias_is_rejected', () => {
    const errors = validateModuleContent(meta, { heading: { text: 'x', fontWeight: 'heavy' } })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('heading.fontWeight')
  })

  it('test_UAT_FC_REQ-50_non_hex_non_role_color_is_rejected', () => {
    const errors = validateModuleContent(meta, { heading: { text: 'x', color: 'reddish' } })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('heading.color')
  })

  it('test_UAT_FC_REQ-50_unknown_gradient_direction_and_bad_stop_are_rejected', () => {
    const errors = validateModuleContent(meta, {
      heading: { text: 'x', gradient: { angleDeg: 'sideways', stops: ['nope'] } },
    })
    const fields = errors.map((e) => e.field)
    expect(fields).toContain('heading.gradient.angleDeg')
    expect(fields).toContain('heading.gradient.stops[0].color')
  })

  it('test_UAT_FC_REQ-50_missing_required_styled_text_is_reported', () => {
    const errors = validateModuleContent(meta, {})
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('heading')
  })
})
