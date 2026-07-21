import { describe, expect, it } from 'vitest'
import { generateThemeCss } from '../packages/framework/src/tokens'
import { resolveTextStyle } from '../packages/framework/src/modules/text-style'
import { TREATMENT_ROLE_DIAL } from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-20 (gigabytealchemy import), eyes pass #2. Post-pivot (REQ-84) the
 * layout modules (hero/header/footer/services-grid) are gone, and with them the
 * render-pipeline `fc-row` grouping of consecutive half-width bands (layout is now
 * owned by the L1 substrate — a plain vertical stack). The surviving fidelity
 * coverage is the framework-level capability that outlived the layout modules:
 *
 *   • the `secondary` + `accent-mid` palette roles and the warm text-fill gradient
 *     they carry, resolved by `resolveTextStyle` and emitted by `generateThemeCss`.
 */

describe('REQ-20 secondary palette role', () => {
  it('test_UAT_FC_REQ-20_theme_css_emits_secondary_color_token', () => {
    // A partial palette still gets a `--color-secondary`, filled from defaults.
    const css = generateThemeCss({ palette: { primary: '#0f9d6e' } })
    expect(css).toMatch(/--color-secondary:\s*#[0-9a-fA-F]{6};/)
  })
})

/**
 * REQ-20 eyes pass #3 — the warm-gradient fidelity gap the values-diff surfaced
 * on the gigabytealchemy re-import. What remains structural post-pivot is the
 * `accent-mid` palette role: a warm text-fill gradient can carry a third mid-stop
 * hue as a role (never a raw colour), expressed as a `gradient` on a styled run
 * and resolved by `resolveTextStyle`.
 */
describe('REQ-20 fidelity — accent-mid gradient role', () => {
  it('test_UAT_FC_REQ-20_accent_mid_role_resolves_in_gradient', () => {
    // The warm gradient can carry a third mid-stop hue as a palette role…
    expect(TREATMENT_ROLE_DIAL).toContain('accent-mid')
    // …which `resolveTextStyle` clips to the run's glyphs as --color-accent-mid.
    const style = resolveTextStyle({
      gradient: {
        angleDeg: 'to-right',
        stops: [
          { color: 'accent-light', position: 0 },
          { color: 'accent-mid', position: 90 },
          { color: 'accent-deep', position: 100 },
        ],
      },
    })
    expect(style).toContain('var(--color-accent-mid)')
    // A text-fill gradient clips to the glyphs and forces transparent text.
    expect(style).toContain('background-clip: text')
    expect(style).toContain('color: transparent')
  })

  it('test_UAT_FC_REQ-20_theme_emits_accent_mid_custom_property', () => {
    const css = generateThemeCss({ palette: { accentMid: '#ff8c42' } })
    expect(css).toContain('--color-accent-mid: #ff8c42;')
  })
})
