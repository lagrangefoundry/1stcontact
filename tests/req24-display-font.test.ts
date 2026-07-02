import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Header from '../packages/framework/src/modules/header/index.astro'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
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
 *   2. `header` selects the display family via a dial (`logoFont`), and any
 *      module can reach the family through the `--font-family-display` property.
 *   3. A site declaring a Cinzel display font renders its header wordmark in
 *      Cinzel with the gold treatment, end-to-end through the render pipeline.
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
            version: 1,
            variant: 'top-nav',
            dials: { logoFont: 'display', logoTreatment: 'gold' },
            content: { logo: 'GIGABYTE ALCHEMY', entries: [] },
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
  it('test_UAT_FC_REQ-24_header_meta_exposes_logo_font_and_treatment_dials', () => {
    expect(headerMeta.dials.logoFont).toContain('display')
    expect(headerMeta.dials.logoFont).toContain('heading')
    expect(headerMeta.dials.logoTreatment).toContain('gold')
    expect(headerMeta.dials.logoTreatment).toContain('plain')
  })

  it('test_UAT_FC_REQ-24_header_renders_wordmark_in_display_font_with_gold_treatment', async () => {
    const html = await render({
      variant: 'top-nav',
      dials: { logoFont: 'display', logoTreatment: 'gold' },
      content: { logo: 'GIGABYTE ALCHEMY', entries: [] },
    })
    // The wordmark text renders inside a span carrying the display-font and gold
    // treatment classes — the hooks the theme CSS binds --font-family-display and
    // the gold gradient to.
    expect(html).toMatch(
      /<span[^>]*class="[^"]*header__wordmark[^"]*"[^>]*>\s*GIGABYTE ALCHEMY\s*<\/span>/,
    )
    expect(html).toContain('header__wordmark--font-display')
    expect(html).toContain('header__wordmark--gold')
  })

  it('test_UAT_FC_REQ-24_header_wordmark_defaults_to_heading_font_plain', async () => {
    const html = await render({
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme Co', entries: [] },
    })
    expect(html).toContain('header__wordmark--font-heading')
    expect(html).toContain('header__wordmark--plain')
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

    // Point the header at the display font with the gold treatment.
    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
    const header = home.modules.find((m: { type: string }) => m.type === 'header')
    header.dials = { ...header.dials, logoFont: 'display', logoTreatment: 'gold' }
    header.content.logo = 'GIGABYTE ALCHEMY'
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })

    // theme.css carries the @font-face and the display custom property.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('@font-face {')
    expect(themeCss).toContain('font-family: "Cinzel";')
    expect(themeCss).toContain('src: url("assets/cinzel.woff2") format("woff2");')
    expect(themeCss).toContain('--font-family-display: "Cinzel", serif;')
    // The wordmark CSS binds the display class to the display family + the gold gradient.
    expect(themeCss).toContain('.header__wordmark--font-display')
    expect(themeCss).toMatch(/\.header__wordmark--gold\s*\{[\s\S]*background-clip: text/)

    // The rendered page shows the wordmark with both hook classes.
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('GIGABYTE ALCHEMY')
    expect(html).toContain('header__wordmark--font-display')
    expect(html).toContain('header__wordmark--gold')

    // The font asset was copied through so the @font-face url resolves.
    expect(readFileSync(path.join(outDir, 'assets', 'cinzel.woff2'), 'utf8')).toBe('stub-font-bytes')
  })
})
