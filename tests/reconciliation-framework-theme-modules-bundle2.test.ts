import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import Header from '../packages/framework/src/modules/header/index.astro'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-a224111f — the BUNDLE-2 additions to the
 * token-driven theme CSS + chrome catalog (BUG-1, REQ-24, REQ-25). One UAT per
 * acceptance criterion, asserting against the existing implementation at its
 * external boundaries: the `generateThemeCss` generator, the SSR-rendered
 * header markup (via Astro's container API), and the full `1c render` pipeline
 * that writes `theme.css` + `index.html`.
 *
 * The 12 baseline ACs (AC-433..444) are covered by
 * `reconciliation-framework-theme-modules.test.ts`; this file adds the four
 * ACs the BUNDLE-2 upgrade introduced:
 *   AC-498 — per-site theme.css folds each module's component styles
 *   AC-499 — @font-face per declared display font + always a --font-family-display
 *   AC-500 — header logoFont / logoTreatment dials style a text wordmark
 *   AC-501 — header overlay variant composited over the following section band
 */

describe('story-a224111f (BUNDLE-2) — module component CSS folding (BUG-1)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'recon-b2-fold-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC498_theme_css_folds_module_component_styles_so_pages_are_styled', async () => {
    // Render the starter site (header + hero + footer) through the real pipeline.
    cmdNew('acme', { cwd })
    const { outDir } = await cmdRender('acme', { cwd })

    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The design-token :root variables are present...
    expect(themeCss).toContain(':root {')
    expect(themeCss).toContain('--color-bg:')

    // ...but so is each catalogued module's OWN component CSS — the class-selector
    // rules the modules define, folded in so the page is fully styled rather than
    // carrying only base body font/colours.
    expect(themeCss).toContain('.header__inner')
    expect(themeCss).toMatch(/\.hero__heading\s*\{/)
    expect(themeCss).toMatch(/\.surface-\w+/)

    // The rendered page carries those module classes, so the folded rules apply.
    expect(html).toContain('class="hero')
    expect(html).toContain('header__inner')
  })
})

describe('story-a224111f (BUNDLE-2) — display fonts + display-font slot (REQ-24)', () => {
  it('test_UAT_AC499_emits_font_face_per_display_font_and_always_a_display_family', () => {
    // A declared display font (.woff2) → one well-formed @font-face ahead of :root,
    // referencing the mirrored asset with a woff2 format hint and font-display,
    // and --font-family-display set to the declared family.
    const css = generateThemeCss({
      typography: {
        ...defaultTokens.typography,
        family: { ...defaultTokens.typography.family, display: '"Cinzel", serif' },
      },
      fonts: [{ family: 'Cinzel', src: 'assets/cinzel.woff2', weight: '400 900', display: 'swap' }],
    })
    expect(css).toContain('@font-face {')
    expect(css).toContain('font-family: "Cinzel";')
    expect(css).toContain('src: url("assets/cinzel.woff2") format("woff2");')
    expect(css).toContain('font-weight: 400 900;')
    expect(css).toContain('font-display: swap;')
    // The @font-face rule precedes the :root block.
    expect(css.indexOf('@font-face')).toBeLessThan(css.indexOf(':root {'))
    expect(css).toContain('--font-family-display: "Cinzel", serif;')

    // The format hint is derived from the asset extension: .ttf → format("truetype").
    const ttf = generateThemeCss({ fonts: [{ family: 'Vollkorn', src: 'assets/vollkorn.ttf' }] })
    expect(ttf).toContain('src: url("assets/vollkorn.ttf") format("truetype");')

    // No fonts declared → no @font-face emitted, but --font-family-display is still
    // present, falling back to the heading family.
    const bare = generateThemeCss(defaultTokens)
    expect(bare).not.toContain('@font-face')
    expect(bare).toContain(`--font-family-display: ${defaultTokens.typography.family.heading};`)
  })
})

describe('story-a224111f (BUNDLE-2) — header wordmark dials (REQ-24)', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>
  async function render(props: unknown): Promise<string> {
    container ??= await AstroContainer.create()
    return container.renderToString(Header, { props: props as Record<string, unknown> })
  }

  it('test_UAT_AC500_header_logo_dials_style_text_wordmark_with_finite_enums', async () => {
    // The contract advertises both dials with their finite value enumerations.
    expect(headerMeta.dials.logoFont).toEqual(expect.arrayContaining(['heading', 'body', 'display']))
    expect(headerMeta.dials.logoTreatment).toEqual(expect.arrayContaining(['plain', 'gold']))

    // display + gold → the text wordmark span carries both style hooks.
    const styled = await render({
      variant: 'top-nav',
      dials: { logoFont: 'display', logoTreatment: 'gold' },
      content: { logo: 'GIGABYTE ALCHEMY', entries: [] },
    })
    expect(styled).toMatch(
      /<span[^>]*class="[^"]*header__wordmark[^"]*"[^>]*>\s*GIGABYTE ALCHEMY\s*<\/span>/,
    )
    expect(styled).toContain('header__wordmark--font-display')
    expect(styled).toContain('header__wordmark--gold')

    // The display-font hook binds the wordmark to --font-family-display (the module
    // CSS folded into the per-site stylesheet), and gold clips a gradient to the text.
    const moduleCss = getModuleCss()
    expect(moduleCss).toMatch(
      /\.header__wordmark--font-display\s*\{[^}]*font-family:\s*var\(--font-family-display\)/,
    )
    expect(moduleCss).toMatch(/\.header__wordmark--gold\s*\{[\s\S]*?background-clip:\s*text/)

    // Omitted dials default to the heading family / plain treatment.
    const defaulted = await render({
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme Co', entries: [] },
    })
    expect(defaulted).toContain('header__wordmark--font-heading')
    expect(defaulted).toContain('header__wordmark--plain')

    // The dials apply to a TEXT wordmark only — an image logo renders an <img> and
    // carries no wordmark treatment hooks.
    const imageLogo = await render({
      variant: 'top-nav',
      dials: { logoFont: 'display', logoTreatment: 'gold' },
      content: { logo: { id: 'l', src: '/assets/logo.png', alt: 'Acme' }, entries: [] },
    })
    expect(imageLogo).toContain('<img')
    expect(imageLogo).not.toContain('header__wordmark')
  })
})

describe('story-a224111f (BUNDLE-2) — header overlay variant (REQ-25)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'recon-b2-overlay-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC501_overlay_header_composited_over_following_band_as_one_shared_band', async () => {
    // Case 1: an overlay header followed by a bg-image module share one band.
    cmdNew('acme', { cwd })
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const header = page.modules.find((m: { type: string }) => m.type === 'header')
    header.variant = 'overlay'
    header.dials = { surface: 'inverse' }
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.variant = 'bg-image'
    hero.dials = { size: 'lg', align: 'left', surface: 'inverse' }
    hero.content.image = { id: 'band', src: 'assets/band.jpg', alt: 'Shared band' }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the public contract.
    expect(loadSite({ cwd, root: 'sites' }, 'acme', 'draft').ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Exactly one positioning wrapper (the shared band) — NOT a separate stacked
    // header band followed by the hero band.
    expect((html.match(/class="fc-overlay-band"/g) ?? []).length).toBe(1)

    // The wrapper contains the transparent header chrome plus the following
    // section's background image, chrome first.
    const bandIdx = html.indexOf('class="fc-overlay-band"')
    const chromeIdx = html.indexOf('fc-overlay-band__chrome')
    expect(bandIdx).toBeGreaterThanOrEqual(0)
    expect(chromeIdx).toBeGreaterThan(bandIdx)
    expect(html.slice(chromeIdx)).toContain('assets/band.jpg')

    // The header markup precedes the following section's content in the DOM.
    expect(html.indexOf('<header')).toBeGreaterThanOrEqual(0)
    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('assets/band.jpg'))

    // Case 2: an overlay header with NO following module still renders (not dropped).
    cmdNew('solo', { cwd })
    const soloPath = path.join(cwd, 'storage', 'sites', 'solo', 'draft', 'pages', 'home.json')
    const soloPage = JSON.parse(readFileSync(soloPath, 'utf8'))
    const soloHeader = soloPage.modules.find((m: { type: string }) => m.type === 'header')
    soloHeader.variant = 'overlay'
    soloHeader.dials = { surface: 'inverse' }
    soloHeader.content.logo = 'Solo Co'
    soloPage.modules = [soloHeader]
    writeFileSync(soloPath, JSON.stringify(soloPage, null, 2))
    expect(loadSite({ cwd, root: 'sites' }, 'solo', 'draft').ok).toBe(true)

    const solo = await cmdRender('solo', { cwd })
    const soloHtml = readFileSync(path.join(solo.outDir, 'index.html'), 'utf8')
    // The header still renders as chrome even with nothing to composite over it —
    // no shared band wrapper is emitted, but the header markup is present.
    expect(soloHtml).toContain('<header')
    expect(soloHtml).toContain('Solo Co')
    expect(soloHtml).not.toContain('fc-overlay-band')
  })
})
