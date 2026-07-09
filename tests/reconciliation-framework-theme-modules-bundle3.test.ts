import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { validateSite } from '../packages/site-schema/src/index'
import Header from '../packages/framework/src/modules/header/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'

/**
 * Reconciliation UATs for story-a224111f — the BUNDLE-3 additions to the
 * token-driven theme CSS + chrome catalog (REQ-28, REQ-32, REQ-33, REQ-20
 * import). One UAT per acceptance criterion, asserting against the existing
 * implementation at its external boundaries: the `generateThemeCss` generator,
 * the `validateSite` schema entry point, the SSR-rendered chrome markup (via
 * Astro's container API — the same render path tools/generate uses), and the
 * folded module component CSS (`getModuleCss`) that backs the class hooks.
 *
 * The 12 REQ-4 baseline ACs (AC-433..444) are covered by
 * `reconciliation-framework-theme-modules.test.ts` and the 4 BUNDLE-2 ACs
 * (AC-498..501) by `reconciliation-framework-theme-modules-bundle2.test.ts`;
 * this file adds the six ACs the BUNDLE-3 upgrade introduced:
 *   AC-502 — hero headingTreatment dial (plain/accent/gold/gradient)
 *   AC-503 — hero height / markdown subhead / subheadColor+Size / scrim / anchor
 *   AC-504 — header align / logoSize / xl top-spacing / display-wordmark styling
 *   AC-505 — footer layout dial (center vs spread)
 *   AC-506 — generalized structured gradient text treatment
 *   AC-507 — expanded optional palette roles
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(
  Component: Parameters<Container['renderToString']>[0],
  props: unknown,
): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

/** Minimal valid site whose theme palette we can mutate per-case (AC-507). */
function minimalSite(palette: Record<string, string>) {
  return {
    id: 'site-min',
    config: { businessName: 'Acme Co' },
    theme: {
      palette: {
        bg: '#ffffff',
        surface: '#f9fafb',
        surfaceSubtle: '#f3f4f6',
        surfaceInverse: '#111827',
        text: '#111827',
        muted: '#6b7280',
        primary: '#2563eb',
        accent: '#f59e0b',
        border: '#e5e7eb',
        ...palette,
      },
      typography: {
        family: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
        scale: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
        },
        weights: { regular: '400', medium: '500', semibold: '600', bold: '700', black: '900' },
        lineHeights: { tight: '1.1', normal: '1.5', relaxed: '1.75' },
      },
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
      radius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      shadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
      container: { narrow: '40rem', default: '72rem', wide: '90rem', bleed: '100%' },
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    nav: { pattern: 'in-page-anchors', entries: [] },
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'Home',
        modules: [
          {
            id: 'm1',
            type: 'hero',
            version: 1,
            variant: 'centered',
            dials: {},
            content: { heading: 'Welcome' },
          },
        ],
      },
    ],
  }
}

describe('story-a224111f (BUNDLE-3) — hero headingTreatment dial (REQ-28)', () => {
  it('test_UAT_AC502_hero_headingTreatment_colours_heading_independently_of_surface', async () => {
    const base = { variant: 'bg-color', content: { heading: 'Gigabyte Alchemy', subhead: 'Lead.' } }

    // `plain` (default) inherits the surface colour — the heading carries the
    // plain hook and NO inline gradient style.
    const plain = await render(Hero, { ...base, dials: { headingTreatment: 'plain' } })
    expect(plain).toContain('treatment-plain')
    expect(plain).not.toContain('linear-gradient')

    // `accent` fills the heading with the solid site accent, backed by the folded
    // module CSS keyed to --color-accent.
    const accent = await render(Hero, { ...base, dials: { headingTreatment: 'accent' } })
    expect(accent).toContain('treatment-accent')
    expect(getModuleCss()).toMatch(
      /\.hero__heading\.treatment-accent\s*\{[^}]*color:\s*var\(--color-accent\)/,
    )

    // `gold` clips the same fixed metallic-gold gradient as the header wordmark to
    // the heading glyphs (folded CSS).
    const gold = await render(Hero, { ...base, dials: { headingTreatment: 'gold' } })
    expect(gold).toContain('treatment-gold')
    expect(getModuleCss()).toMatch(
      /\.hero__heading\.treatment-gold\s*\{[\s\S]*?background-clip:\s*text/,
    )

    // `gradient` clips a framework-computed linear-gradient (from the structured
    // headingGradient field) to the heading glyphs — an inline style on the <h1>.
    const gradient = await render(Hero, {
      ...base,
      dials: { headingTreatment: 'gradient' },
      content: {
        heading: 'Gigabyte Alchemy',
        subhead: 'Lead.',
        headingGradient: {
          direction: 'to-right',
          stops: [{ role: 'accent-light' }, { role: 'accent-deep' }],
        },
      },
    })
    expect(gradient).toContain('treatment-gradient')
    expect(gradient).toMatch(/background-image:\s*linear-gradient\(to right,/)
    expect(gradient).toMatch(/var\(--color-accent-light\)\s*0%/)
    expect(gradient).toMatch(/var\(--color-accent-deep\)\s*100%/)
    expect(gradient).toMatch(/background-clip:\s*text/)

    // A `gradient` treatment with no valid headingGradient (under-specified) falls
    // back to the inherited colour — the class is present but no inline gradient.
    const fallback = await render(Hero, {
      ...base,
      dials: { headingTreatment: 'gradient' },
      content: {
        heading: 'Gigabyte Alchemy',
        subhead: 'Lead.',
        headingGradient: { direction: 'to-right', stops: [{ role: 'accent' }] },
      },
    })
    expect(fallback).toContain('treatment-gradient')
    expect(fallback).not.toContain('linear-gradient')
  })
})

describe('story-a224111f (BUNDLE-3) — hero height / subhead / scrim / anchor dials', () => {
  it('test_UAT_AC503_hero_exposes_height_markdown_subhead_colour_size_scrim_anchor', async () => {
    // A `fold` hero fills the viewport with vertically-centred content.
    const fold = await render(Hero, {
      variant: 'bg-color',
      dials: { height: 'fold' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(fold).toContain('height-fold')
    expect(getModuleCss()).toMatch(
      /\.hero\.height-fold\s*\{[^}]*min-height:\s*100vh[\s\S]*?justify-content:\s*center/,
    )
    // `top` / `bottom` anchor the content to the band's start/end on a fold band.
    const top = await render(Hero, {
      variant: 'bg-color',
      dials: { height: 'fold', contentAnchor: 'top' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(top).toContain('anchor-top')
    expect(getModuleCss()).toMatch(
      /\.hero\.height-fold\.anchor-top\s*\{[^}]*justify-content:\s*flex-start/,
    )
    expect(getModuleCss()).toMatch(
      /\.hero\.height-fold\.anchor-bottom\s*\{[^}]*justify-content:\s*flex-end/,
    )

    // A bg-image hero with a non-`none` scrim paints a tint layer over the image.
    const scrim = await render(Hero, {
      variant: 'bg-image',
      dials: { scrim: 'medium' },
      content: {
        heading: 'H',
        subhead: 'Lead.',
        image: { id: 'i', src: 'assets/band.jpg', alt: 'band' },
      },
    })
    expect(scrim).toContain('scrim-medium')
    expect(scrim).toContain('hero__scrim')
    expect(getModuleCss()).toMatch(/\.hero\.scrim-medium\s+\.hero__scrim\s*\{[^}]*opacity/)
    // `none` (default) paints no scrim layer.
    const noScrim = await render(Hero, {
      variant: 'bg-image',
      dials: {},
      content: {
        heading: 'H',
        subhead: 'Lead.',
        image: { id: 'i', src: 'assets/band.jpg', alt: 'band' },
      },
    })
    expect(noScrim).toContain('scrim-none')
    expect(noScrim).not.toContain('hero__scrim')

    // A non-`inherit` subheadColor tints the whole subhead block that role.
    const tinted = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadColor: 'accent' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(tinted).toMatch(
      /<div[^>]*class="[^"]*hero__subhead[^"]*"[^>]*style="[^"]*color:\s*var\(--color-accent\)/,
    )

    // `subheadSize` scales the subhead independently of the heading `size`.
    const sized = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadSize: 'lg' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(sized).toContain('subhead-size-lg')

    // The subhead field is rendered as markdown → HTML.
    const md = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: '**Bold lead** and more.' },
    })
    expect(md).toContain('<strong>Bold lead</strong>')

    // Defaults reproduce the prior behaviour: auto height, center anchor, no
    // scrim, inherited subhead colour, md subhead size.
    const defaults = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(defaults).toContain('height-auto')
    expect(defaults).toContain('anchor-center')
    expect(defaults).toContain('scrim-none')
    expect(defaults).toContain('subhead-size-md')
    expect(defaults).not.toMatch(/hero__subhead[^>]*style="[^"]*color:/)
  })
})

describe('story-a224111f (BUNDLE-3) — header align / logoSize / xl spacing / display wordmark', () => {
  it('test_UAT_AC504_header_exposes_align_logoSize_xl_spacing_and_display_wordmark', async () => {
    // `align: center` places the content centrally; folded CSS centres the band.
    const centered = await render(Header, {
      variant: 'top-nav',
      dials: { align: 'center' },
      content: { logo: 'Acme', entries: [] },
    })
    expect(centered).toContain('align-center')
    expect(getModuleCss()).toMatch(
      /\.header\.align-center\s+\.header__inner\s*\{[^}]*justify-content:\s*center/,
    )

    // `logoSize: xl` sizes the wordmark at display/hero scale (clamp to 5xl).
    const xlLogo = await render(Header, {
      variant: 'top-nav',
      dials: { logoSize: 'xl' },
      content: { logo: 'Acme', entries: [] },
    })
    expect(xlLogo).toContain('header__wordmark--size-xl')
    expect(getModuleCss()).toMatch(
      /\.header__wordmark--size-xl\s*\{[^}]*clamp\([\s\S]*?--font-size-5xl/,
    )

    // `xl` top-spacing gives the header generous breathing room.
    const xlSpacing = await render(Header, {
      variant: 'top-nav',
      dials: { spacingTop: 'xl' },
      content: { logo: 'Acme', entries: [] },
    })
    expect(xlSpacing).toContain('spacing-top-xl')
    expect(getModuleCss()).toMatch(
      /\.header\.spacing-top-xl\s*\{[^}]*padding-top:\s*var\(--space-16\)/,
    )

    // A `display`-font wordmark carries tight tracking + the display face's true
    // (semibold) weight, not an inherited/forced bold that would faux-bold.
    const display = await render(Header, {
      variant: 'top-nav',
      dials: { logoFont: 'display' },
      content: { logo: 'Acme', entries: [] },
    })
    expect(display).toContain('header__wordmark--font-display')
    const css = getModuleCss()
    expect(css).toMatch(
      /\.header__wordmark--font-display\s*\{[\s\S]*?letter-spacing:\s*-0\.025em/,
    )
    expect(css).toMatch(
      /\.header__wordmark--font-display\s*\{[\s\S]*?font-weight:\s*var\(--font-weight-semibold\)/,
    )

    // Defaults: left alignment, md wordmark size.
    const defaults = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme', entries: [] },
    })
    expect(defaults).toContain('align-left')
    expect(defaults).toContain('header__wordmark--size-md')
  })
})

describe('story-a224111f (BUNDLE-3) — footer layout dial (REQ-33)', () => {
  it('test_UAT_AC505_footer_layout_dial_spreads_or_stacks_copyright_and_links', async () => {
    const content = {
      copyrightHolder: 'Acme Co',
      links: [
        { label: 'Privacy', target: { kind: 'url', href: 'https://acme.test/privacy' } },
        { label: 'Terms', target: { kind: 'url', href: 'https://acme.test/terms' } },
      ],
    }

    // `spread` justifies copyright / links to opposite ends of one row, with the
    // copyright ordered to the leading end.
    const spread = await render(Footer, { dials: { layout: 'spread' }, content })
    expect(spread).toContain('layout-spread')
    const css = getModuleCss()
    expect(css).toMatch(
      /\.footer\.layout-spread\s+\.footer__inner\s*\{[^}]*flex-direction:\s*row[\s\S]*?justify-content:\s*space-between/,
    )
    expect(css).toMatch(
      /\.footer\.layout-spread\s+\.footer__copyright\s*\{[^}]*order:\s*-1/,
    )

    // `center` (default when omitted) stacks the copyright and links centred.
    const centered = await render(Footer, { dials: {}, content })
    expect(centered).toContain('layout-center')
    expect(css).toMatch(/\.footer__inner\s*\{[\s\S]*?flex-direction:\s*column[\s\S]*?align-items:\s*center/)
  })
})

describe('story-a224111f (BUNDLE-3) — generalized gradient text treatment (REQ-32)', () => {
  it('test_UAT_AC506_structured_gradient_treatment_clips_multistop_any_direction_text', async () => {
    // A header wordmark with a multi-stop, non-vertical treatment → a clipped
    // linear-gradient in the requested direction resolving to palette-role vars.
    const wordmark = await render(Header, {
      variant: 'top-nav',
      dials: { logoTreatment: 'gradient' },
      content: {
        logo: 'GIGABYTE ALCHEMY',
        entries: [],
        logoGradient: {
          direction: 'to-right',
          stops: [{ role: 'accent-light' }, { role: 'accent-deep' }],
        },
      },
    })
    expect(wordmark).toContain('header__wordmark--gradient')
    expect(wordmark).toMatch(/background-image:\s*linear-gradient\(to right,/)
    expect(wordmark).toMatch(/var\(--color-accent-light\)\s*0%/)
    expect(wordmark).toMatch(/var\(--color-accent-deep\)\s*100%/)
    expect(wordmark).toMatch(/-webkit-background-clip:\s*text/)
    expect(wordmark).toMatch(/background-clip:\s*text/)
    expect(wordmark).toMatch(/color:\s*transparent/)

    // A hero heading shares the same treatment, honouring explicit stop positions
    // and a diagonal direction.
    const heading = await render(Hero, {
      variant: 'bg-color',
      dials: { headingTreatment: 'gradient' },
      content: {
        heading: 'Gigabyte Alchemy',
        subhead: 'Lead.',
        headingGradient: {
          direction: 'to-bl',
          stops: [
            { role: 'primary', position: 10 },
            { role: 'accent', position: 90 },
          ],
        },
      },
    })
    expect(heading).toMatch(/background-image:\s*linear-gradient\(to bottom left,/)
    expect(heading).toMatch(/var\(--color-primary\)\s*10%/)
    expect(heading).toMatch(/var\(--color-accent\)\s*90%/)

    // An under-specified treatment (fewer than two stops) yields no gradient — the
    // text falls back to its inherited colour.
    const underSpecified = await render(Header, {
      variant: 'top-nav',
      dials: { logoTreatment: 'gradient' },
      content: {
        logo: 'GIGABYTE ALCHEMY',
        entries: [],
        logoGradient: { direction: 'to-right', stops: [{ role: 'accent' }] },
      },
    })
    expect(underSpecified).not.toContain('linear-gradient')

    // The fixed `gold` treatment is preserved as its own dial value alongside the
    // generalized `gradient` — a metallic-gold fill clipped to the glyphs.
    const gold = await render(Header, {
      variant: 'top-nav',
      dials: { logoTreatment: 'gold' },
      content: { logo: 'Acme', entries: [] },
    })
    expect(gold).toContain('header__wordmark--gold')
    expect(getModuleCss()).toMatch(
      /\.header__wordmark--gold\s*\{[\s\S]*?background-clip:\s*text/,
    )
  })
})

describe('story-a224111f (BUNDLE-3) — expanded palette roles (REQ-33 / REQ-20)', () => {
  it('test_UAT_AC507_palette_accepts_optional_expanded_roles_emitted_as_colour_props', () => {
    // A palette that omits the optional roles still emits secondary /
    // neutral-cool / accent-light / accent-deep (backfilled from defaults), while
    // accent-mid is absent (it is emitted only when the site declares it).
    const omitted = generateThemeCss({ palette: { primary: '#123456' } })
    expect(omitted).toContain('--color-secondary:')
    expect(omitted).toContain('--color-neutral-cool:')
    expect(omitted).toContain('--color-accent-light:')
    expect(omitted).toContain('--color-accent-deep:')
    expect(omitted).not.toContain('--color-accent-mid:')

    // A palette declaring all five emits each with its kebab-cased --color-<role>
    // name and the supplied value (accent-mid included).
    const declared = generateThemeCss({
      palette: {
        secondary: '#111111',
        neutralCool: '#222222',
        accentLight: '#333333',
        accentDeep: '#444444',
        accentMid: '#555555',
      },
    })
    expect(declared).toContain('--color-secondary: #111111;')
    expect(declared).toContain('--color-neutral-cool: #222222;')
    expect(declared).toContain('--color-accent-light: #333333;')
    expect(declared).toContain('--color-accent-deep: #444444;')
    expect(declared).toContain('--color-accent-mid: #555555;')

    // The default token surface already carries the four always-emitted roles.
    const bare = generateThemeCss(defaultTokens)
    expect(bare).toContain('--color-secondary:')
    expect(bare).not.toContain('--color-accent-mid:')

    // A pre-existing theme that omits all of them still validates through the
    // public site contract, and a theme declaring all five validates too.
    expect(validateSite(minimalSite({})).ok).toBe(true)
    expect(
      validateSite(
        minimalSite({
          secondary: '#111111',
          neutralCool: '#222222',
          accentLight: '#333333',
          accentDeep: '#444444',
          accentMid: '#555555',
        }),
      ).ok,
    ).toBe(true)
  })
})
