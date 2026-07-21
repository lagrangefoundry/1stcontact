import { describe, it, expect } from 'vitest'
import { SPACING_STEPS } from '../packages/framework/src/modules/dials'
import { generateThemeCss } from '../packages/framework/src/tokens/index'

/**
 * UATs for REQ-36 — the framework primitives that survive the REQ-84
 * layout-module strip. The `headingTreatment` colour dial and the per-module
 * fidelity dials (hero/header/footer/text-block/services-grid) are gone with
 * those modules; what remains here is the module-independent capability:
 *
 *   - the shared spacing / gap step overlay (REQ-58 absolute-or-overlay);
 *   - the theme-token surface (`generateThemeCss`) — scrim, extralight weight,
 *     accent-mid, the Tailwind container scale, and the label font family.
 */

describe('REQ-36 scrim token', () => {
  it('test_UAT_FC_REQ-36_scrim_token_defaults_to_a_near_black', () => {
    // The generated theme always declares --color-scrim, defaulting dark so a
    // scrim darkens for contrast even when the site omits the role.
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    const m = css.match(/--color-scrim:\s*(#[0-9a-fA-F]{6})/)
    expect(m).not.toBeNull()
    const hex = m![1]
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    // Luminance well below mid-grey — a genuine darkening tint, not a wash.
    expect((r + g + b) / 3).toBeLessThan(40)
  })
})

describe('REQ-36 extended spacing scale — airy sections', () => {
  it('test_UAT_FC_REQ-36_spacing_steps_carry_2xl_3xl', () => {
    // The shared overlay carries the two steps past `xl`.
    expect(SPACING_STEPS['2xl']).toBe('var(--space-32)')
    expect(SPACING_STEPS['3xl']).toBe('var(--space-48)')
  })
})

describe('REQ-36 extralight weight token', () => {
  it('test_UAT_FC_REQ-36_extralight_weight_token_emitted_as_200', () => {
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    expect(css).toMatch(/--font-weight-extralight:\s*200/)
  })
})

describe('REQ-36 theme token surface — container scale, accent-mid, label font', () => {
  it('test_UAT_FC_REQ-36_accent_mid_declared_out_of_the_box', () => {
    // The default palette declares `--color-accent-mid` in :root even when a site
    // omits accentMid, so a surface referencing it never renders undefined.
    const css = generateThemeCss({})
    expect(css).toMatch(/:root\s*\{[^}]*--color-accent-mid:/)
  })

  it('test_UAT_FC_REQ-36_theme_emits_tailwind_container_scale', () => {
    // REQ-55: the container scale is Tailwind's `max-w` steps; each is a
    // default-filled optional slot, so every theme emits the whole scale.
    const css = generateThemeCss({})
    expect(css).toMatch(/--container-lg:\s*32rem/)
    expect(css).toMatch(/--container-4xl:\s*56rem/)
  })

  it('test_UAT_FC_REQ-36_theme_emits_font_family_label_from_the_label_role', () => {
    const withLabel = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla', label: 'Raleway' } } })
    expect(withLabel).toMatch(/--font-family-label:\s*Raleway/)
    // Omitting the role falls back to the body family, so an existing theme is unchanged.
    const without = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla' } } })
    expect(without).toMatch(/--font-family-label:\s*Karla/)
  })
})
