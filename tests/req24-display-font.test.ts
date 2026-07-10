import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Header from '../packages/framework/src/modules/header/index.astro'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { validateSite } from '../packages/site-schema/src/validate'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * UATs for REQ-24 — display-font slot + @font-face emission (Cinzel wordmark).
 *
 * Three AC-linked capabilities are proven here:
 *   1. The framework emits a valid `@font-face` (into the per-site stylesheet)
 *      for a site-declared display font, referencing the mirrored asset — with
 *      the declaration itself living in the structured theme, never raw CSS.
 *   2. Any module can reach the display family through the `--font-family-display`
 *      custom property; a text wordmark expresses it via the `wordmark` run's
 *      `fontFamily: 'display'` (REQ-50 styled-run vocabulary).
 *   3. A site declaring a Cinzel display font renders its header wordmark in
 *      Cinzel, end-to-end through the render pipeline.
 *
 * REQ-50 migration: `logoFont`/`logoTreatment` dials removed; wordmark family
 * and colour/gradient are expressed on the `wordmark` styled run. Tests checking
 * the old CSS hook classes (`header__wordmark--font-display`, `--gold`) are
 * rewritten to assert the resolved inline `style` instead.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Header, { props: props as Record<string, unknown> })
}

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

describe('REQ-24 display fonts — header wordmark', () => {
  // REQ-50: logoFont/logoTreatment dials removed; the wordmark run's `fontFamily`
  // and `color`/`gradient` fields carry what those dials formerly expressed.
  // Assertions rewritten to check the resolved inline `style` on the wordmark span.

  it('test_UAT_FC_REQ-24_header_renders_wordmark_in_display_font_with_gold_gradient', async () => {
    const html = await render({
      variant: 'top-nav',
      dials: {},
      // `fontFamily: 'display'` → resolves to `font-family: var(--font-family-display)`.
      // `gradient` with two stops → resolves to `background-clip: text; color: transparent`.
      content: {
        wordmark: {
          text: 'GIGABYTE ALCHEMY',
          fontFamily: 'display',
          gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
        },
        entries: [],
      },
    })
    // The wordmark span renders with the resolved inline style (REQ-50).
    expect(html).toContain('GIGABYTE ALCHEMY')
    expect(html).toContain('font-family: var(--font-family-display)')
    expect(html).toContain('background-clip: text')
    expect(html).toContain('color: transparent')
  })

  it('test_UAT_FC_REQ-24_header_wordmark_with_display_family_alias_emits_css_var', async () => {
    // A wordmark run with only `fontFamily: 'display'` (no gradient) resolves the
    // family alias to the custom property; no gradient-clip classes involved.
    const html = await render({
      variant: 'top-nav',
      dials: {},
      content: {
        wordmark: { text: 'Acme Co', fontFamily: 'display' },
        entries: [],
      },
    })
    expect(html).toContain('font-family: var(--font-family-display)')
    // No gradient → no clip
    expect(html).not.toContain('background-clip: text')
  })
})

describe('REQ-24 display fonts — render pipeline', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req24-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-24_render_pipeline_emits_font_face_and_display_wordmark', async () => {
    cmdNew('acme', { cwd })
    const draft = path.join(cwd, 'storage', 'sites', 'acme', 'draft')

    // Declare a display font in the theme and mirror the asset it points at.
    const site = JSON.parse(readFileSync(path.join(draft, 'site.json'), 'utf8'))
    site.theme.typography.family.display = '"Cinzel", serif'
    site.theme.fonts = [{ family: 'Cinzel', src: 'assets/cinzel.woff2', display: 'swap' }]
    writeFileSync(path.join(draft, 'site.json'), JSON.stringify(site))
    writeFileSync(path.join(draft, 'assets', 'cinzel.woff2'), 'stub-font-bytes')

    // Replace the scaffold header (v1, string logo) with a v2 wordmark run
    // carrying the display family and a gold gradient (REQ-50).
    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
    const header = home.modules.find((m: { type: string }) => m.type === 'header')
    header.version = 2
    header.dials = {}
    header.content = {
      wordmark: {
        text: 'GIGABYTE ALCHEMY',
        fontFamily: 'display',
        gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
      },
      entries: [],
    }
    // Update the hero to v2 styled-run shape (REQ-50).
    const hero = home.modules.find((m: { type: string }) => m.type === 'hero')
    hero.version = 2
    hero.dials = { align: 'center' }
    hero.content = {
      heading: { text: 'Welcome to acme' },
    }
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })

    // theme.css carries the @font-face and the display custom property.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('@font-face {')
    expect(themeCss).toContain('font-family: "Cinzel";')
    expect(themeCss).toContain('src: url("assets/cinzel.woff2") format("woff2");')
    expect(themeCss).toContain('--font-family-display: "Cinzel", serif;')

    // The rendered page shows the wordmark text and the resolved inline style
    // carries the display family var and gradient clip (REQ-50 styled-run output).
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('GIGABYTE ALCHEMY')
    expect(html).toContain('font-family: var(--font-family-display)')
    expect(html).toContain('background-clip: text')
    expect(html).toContain('color: transparent')

    // The font asset was copied through so the @font-face url resolves.
    expect(readFileSync(path.join(outDir, 'assets', 'cinzel.woff2'), 'utf8')).toBe('stub-font-bytes')
  })
})
