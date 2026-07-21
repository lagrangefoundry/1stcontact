import { describe, expect, it } from 'vitest'
import { generateThemeCss } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-45 — the last-mile fidelity primitives the gigabytealchemy
 * perceptual diff surfaced. Post-pivot (REQ-84) the carousel/contact-form dial
 * and content-field surfaces they exercised are gone; the surviving
 * module-independent coverage is the theme token surface.
 */

describe('REQ-45 token surface — tracking custom properties', () => {
  it('test_UAT_FC_REQ-45_theme_emits_tracking_custom_properties', () => {
    const css = generateThemeCss()
    expect(css).toContain('--tracking-normal: 0em;')
    expect(css).toContain('--tracking-tight: -0.025em;')
    expect(css).toContain('--tracking-tighter: -0.05em;')
  })
})
