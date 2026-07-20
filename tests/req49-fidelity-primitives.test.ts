import { describe, expect, it } from 'vitest'
import { generateThemeCss } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-49 — the token-surface primitives the gigabytealchemy perceptual
 * diff surfaced. The hero-render fidelity dials (contentWidth/contentOffsetTop/
 * contentInset, subhead weight/leading) went away with the semantic hero module
 * in the framework pivot (REQ-84); what survives — and is asserted here — is the
 * extended theme-token scale those dials resolved against, still emitted by
 * `generateThemeCss` and reused by L1 / capability modules: the `snug` leading,
 * `light` weight, the `--container-3xl` reading measure, and the large
 * `--space-*` steps (which must survive a site-supplied base spacing block via
 * the deep-merge over defaults).
 */

describe('REQ-49 token surface — extended scale backs the dials', () => {
  it('test_UAT_FC_REQ-49_theme_emits_snug_line_height_and_light_weight', () => {
    const css = generateThemeCss()
    expect(css).toContain('--line-height-snug: 1.33;')
    expect(css).toContain('--font-weight-light: 300;')
  })

  it('test_UAT_FC_REQ-49_theme_emits_768px_container_measure', () => {
    // Residual 1 — the 768px reading measure, now `--container-3xl` (REQ-55).
    expect(generateThemeCss()).toContain('--container-3xl: 48rem;')
  })

  it('test_UAT_FC_REQ-49_theme_emits_large_spacing_steps_for_content_offset', () => {
    const css = generateThemeCss()
    // The `xl` offset resolved to `--space-80` = 20rem (320px, the reference inset).
    expect(css).toContain('--space-32: 8rem;')
    expect(css).toContain('--space-48: 12rem;')
    expect(css).toContain('--space-80: 20rem;')
  })

  it('test_UAT_FC_REQ-49_large_spacing_steps_survive_a_site_supplied_spacing_block', () => {
    // A site that supplies its own (base-10) spacing block must still get the new
    // large steps via the deep-merge over defaults — else `--space-80` vanishes
    // and any consumer of the large inset silently collapses.
    const css = generateThemeCss({
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
      },
    })
    expect(css).toContain('--space-80: 20rem;')
  })
})
