import { describe, it, expect } from 'vitest'
import { resolveTextStyle } from '../packages/framework/src/modules/text-style'

/**
 * UATs for REQ-50 — the spec and the fidelity diff speak ONE vocabulary for
 * intrinsic typography + colour. A text run carries the diff's exact field
 * names/units (`fontSizePx`, `fontWeight`, `color`, `gradient`, …); each field
 * accepts a literal in the diff's unit (reproduction pastes the diff's numbers)
 * OR a theme alias (design reaches for a named step). `resolveTextStyle` turns a
 * run into an inline-`style` string, resolving literals verbatim and aliases to
 * the `var(--…)` custom properties the theme CSS always emits.
 */
describe('REQ-50 unified vocabulary — literal values (reproduction)', () => {
  it('test_UAT_FC_REQ-50_literals_resolve_verbatim_in_diff_units', () => {
    // The joyfulculinary hero heading, exactly as the diff reports it.
    const style = resolveTextStyle({
      text: 'Dreaming of healthier meals',
      fontFamily: 'Oswald',
      fontSizePx: 65,
      fontWeight: 500,
      color: '#ffffff',
      letterSpacingPx: 0,
      lineHeightPx: 75,
    })
    expect(style).toContain('font-family: "Oswald", sans-serif')
    expect(style).toContain('font-size: 65px')
    expect(style).toContain('font-weight: 500')
    expect(style).toContain('color: #ffffff')
    expect(style).toContain('letter-spacing: 0px')
    expect(style).toContain('line-height: 75px')
  })

  it('test_UAT_FC_REQ-50_font_weight_is_an_integer_not_an_enum', () => {
    // The change that unblocked reproduction: any captured weight, no enum step.
    expect(resolveTextStyle({ fontWeight: 517 })).toBe('font-weight: 517')
  })
})

describe('REQ-50 unified vocabulary — theme aliases (design)', () => {
  it('test_UAT_FC_REQ-50_aliases_resolve_to_theme_vars', () => {
    const style = resolveTextStyle({
      fontFamily: 'heading',
      fontSizePx: '5xl',
      fontWeight: 'medium',
      color: 'primary',
      letterSpacingPx: 'tight',
      lineHeightPx: 'snug',
    })
    expect(style).toContain('font-family: var(--font-family-heading)')
    expect(style).toContain('font-size: var(--font-size-5xl)')
    expect(style).toContain('font-weight: var(--font-weight-medium)')
    expect(style).toContain('color: var(--color-primary)')
    expect(style).toContain('letter-spacing: var(--tracking-tight)')
    expect(style).toContain('line-height: var(--line-height-snug)')
  })

  it('test_UAT_FC_REQ-50_camelCase_palette_role_kebabs_to_var', () => {
    expect(resolveTextStyle({ color: 'surfaceInverse' })).toBe('color: var(--color-surface-inverse)')
  })
})

describe('REQ-50 unified vocabulary — partial + absent runs', () => {
  it('test_UAT_FC_REQ-50_absent_fields_emit_no_declaration', () => {
    // A run that sets only weight inherits every other axis.
    expect(resolveTextStyle({ text: 'x', fontWeight: 300 })).toBe('font-weight: 300')
  })

  it('test_UAT_FC_REQ-50_absent_run_is_empty', () => {
    expect(resolveTextStyle(undefined)).toBe('')
    expect(resolveTextStyle(null)).toBe('')
  })
})

describe('REQ-50 unified vocabulary — text-fill gradient (mirrors report TextGradient)', () => {
  it('test_UAT_FC_REQ-50_gradient_literal_angle_and_hex_stops_reproduce_verbatim', () => {
    // A captured wordmark gradient, exactly as the report's TextGradient reports
    // it: an angle in degrees and bare `#rrggbb` stops — pasted straight in.
    const style = resolveTextStyle({
      text: 'Gigabyte Alchemy',
      gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
    })
    expect(style).toContain(
      'background-image: linear-gradient(90deg, #f5e6a3 0%, #fbba72 100%)',
    )
    expect(style).toContain('background-clip: text')
    // A gradient fill forces transparent glyphs so the sweep shows through.
    expect(style).toContain('color: transparent')
  })

  it('test_UAT_FC_REQ-50_gradient_direction_and_role_aliases_resolve_to_vars', () => {
    const style = resolveTextStyle({
      gradient: {
        angleDeg: 'to-right',
        stops: [{ color: 'accent-light' }, { color: 'accent-deep', position: 80 }],
      },
    })
    expect(style).toContain(
      'background-image: linear-gradient(to right, var(--color-accent-light) 0%, var(--color-accent-deep) 80%)',
    )
  })

  it('test_UAT_FC_REQ-50_gradient_supersedes_flat_color_on_the_same_run', () => {
    // color:transparent must win — the flat color is dropped, not both emitted.
    const style = resolveTextStyle({
      color: '#ffffff',
      gradient: { angleDeg: 180, stops: ['accent', 'primary'] },
    })
    expect(style).toContain('color: transparent')
    expect(style).not.toContain('color: #ffffff')
  })

  it('test_UAT_FC_REQ-50_under_two_stops_keeps_flat_color', () => {
    // An under-specified gradient (one stop) is inert; the run keeps its color.
    expect(
      resolveTextStyle({ color: '#111111', gradient: { angleDeg: 90, stops: ['#f5e6a3'] } }),
    ).toBe('color: #111111')
  })
})
