import { describe, expect, it } from 'vitest'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { validateSite } from '../packages/site-schema/src/validate'

/**
 * UATs for REQ-24 — display-font slot + @font-face emission (Cinzel wordmark),
 * scoped to the parts that survive the REQ-84 layout-module strip:
 *
 *   1. The framework emits a valid `@font-face` (into the per-site stylesheet)
 *      for a site-declared display font, referencing the mirrored asset — with
 *      the declaration itself living in the structured theme, never raw CSS.
 *   2. The display family is reachable by any module through the
 *      `--font-family-display` custom property (`generateThemeCss`).
 *
 * (The header-wordmark render + end-to-end pipeline assertions were coupled to
 * the deleted `header` module; the schema + theme-CSS primitives below are
 * module-independent.)
 */

/** A minimally-valid site whose theme declares one display font, for the schema UAT. */
function siteWithFont(): unknown {
  return {
    id: 'gigabytealchemy',
    config: { businessName: 'Gigabyte Alchemy' },
    theme: {
      ...defaultTokens,
      typography: {
        ...defaultTokens.typography,
        family: { ...defaultTokens.typography.family, display: '"Cinzel", serif' },
      },
      fonts: [{ family: 'Cinzel', src: 'assets/cinzel.woff2', display: 'swap' }],
    },
    nav: { pattern: 'top-tabs', entries: [] },
    pages: [
      {
        id: 'home',
        slug: 'home',
        title: 'Home',
        seoMeta: { title: 'Home', description: 'Home' },
        modules: [
          {
            id: 'header',
            type: 'header',
            version: 2,
            variant: 'top-nav',
            dials: {},
            // REQ-50: wordmark run carries the display family + gold gradient.
            content: {
              wordmark: {
                text: 'GIGABYTE ALCHEMY',
                fontFamily: 'display',
                gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
              },
              entries: [],
            },
          },
        ],
      },
    ],
    assets: [],
  }
}

describe('REQ-24 display fonts — schema', () => {
  it('test_UAT_FC_REQ-24_schema_accepts_structured_font_declaration', () => {
    // A site declaring theme.fonts + typography.family.display validates — the
    // font declaration is structured data, not raw CSS smuggled into the def.
    const result = validateSite(siteWithFont())
    expect(result.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-24_schema_rejects_malformed_font_declaration', () => {
    const bad = siteWithFont() as { theme: { fonts: unknown[] } }
    // A font entry missing its required `src` is a structural failure.
    bad.theme.fonts = [{ family: 'Cinzel' }]
    const result = validateSite(bad)
    expect(result.ok).toBe(false)
  })
})

describe('REQ-24 display fonts — theme CSS generation', () => {
  it('test_UAT_FC_REQ-24_generate_css_emits_font_face_for_declared_font', () => {
    const css = generateThemeCss({
      fonts: [{ family: 'Cinzel', src: 'assets/cinzel.woff2', display: 'swap' }],
    })
    // A single, well-formed @font-face pointing at the mirrored asset, with a
    // woff2 format hint and font-display — emitted ahead of the :root block.
    expect(css).toContain('@font-face {')
    expect(css).toContain('font-family: "Cinzel";')
    expect(css).toContain('src: url("assets/cinzel.woff2") format("woff2");')
    expect(css).toContain('font-display: swap;')
    expect(css.indexOf('@font-face')).toBeLessThan(css.indexOf(':root {'))
  })

  it('test_UAT_FC_REQ-24_generate_css_carries_optional_weight_and_style', () => {
    const css = generateThemeCss({
      fonts: [
        { family: 'Cinzel', src: 'assets/cinzel.woff2', weight: '400 900', style: 'italic' },
      ],
    })
    expect(css).toContain('font-weight: 400 900;')
    expect(css).toContain('font-style: italic;')
  })

  it('test_UAT_FC_REQ-24_generate_css_emits_display_family_custom_property', () => {
    // Declared display family surfaces as --font-family-display verbatim.
    const withDisplay = generateThemeCss({
      typography: {
        ...defaultTokens.typography,
        family: { ...defaultTokens.typography.family, display: '"Cinzel", serif' },
      },
    })
    expect(withDisplay).toContain('--font-family-display: "Cinzel", serif;')

    // Omitted → falls back to the heading family so the property is always safe.
    const noDisplay = generateThemeCss(defaultTokens)
    expect(noDisplay).toContain(`--font-family-display: ${defaultTokens.typography.family.heading};`)
  })

  it('test_UAT_FC_REQ-24_generate_css_omits_font_face_when_no_fonts_declared', () => {
    const css = generateThemeCss(defaultTokens)
    expect(css).not.toContain('@font-face')
  })
})
