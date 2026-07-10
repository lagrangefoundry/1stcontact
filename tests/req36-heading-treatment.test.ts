import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { generateThemeCss } from '../packages/framework/src/tokens/index'
import { composeRow, ROW_CSS } from '../packages/framework/src/modules/row'

// Read a module's .astro source for CSS-rule assertions (Astro's container
// rewrites scoped selectors with data-astro-cid hashes, so we assert the
// authored rule against source — the pattern the card-treatment UATs use).
function source(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}
const textBlockCss = source('../packages/framework/src/modules/text-block/index.astro')
const gridCss = source('../packages/framework/src/modules/services-grid/index.astro')
const heroCss = source('../packages/framework/src/modules/hero/index.astro')
const headerCss = source('../packages/framework/src/modules/header/index.astro')
const footerCss = source('../packages/framework/src/modules/footer/index.astro')

/**
 * UATs for REQ-36 — the `headingTreatment` colour dial generalized from the hero
 * onto the flat-content modules (text-block + services-grid). `accent` fills the
 * heading solid gold (`--color-accent`), `gold` the metallic gradient; `plain`
 * (default) inherits the band colour so a section that omits the dial is
 * unchanged. On services-grid the treatment colours the grid heading *and* the
 * card titles, so one grid can read gold (Offerings) while another stays white.
 */
type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Comp: unknown, props: Record<string, unknown>) {
  container ??= await AstroContainer.create()
  return container.renderToString(Comp as Parameters<Container['renderToString']>[0], { props })
}

describe('REQ-36 heading treatment — text-block', () => {
  const content = { heading: 'THE HOLISTIC APPROACH', body: 'Prose.' }

  it('test_UAT_FC_REQ-36_textblock_accent_colours_the_heading', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { headingTreatment: 'accent' }, content })
    expect(html).toContain('text-block__heading treatment-accent')
    // The scoped CSS fills the heading with the accent token (the effect).
    expect(textBlockCss).toMatch(/\.text-block__heading\.treatment-accent\s*\{[^}]*color:\s*var\(--color-accent\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_default_is_plain_unchanged', async () => {
    const html = await render(TextBlock, { variant: 'prose', content })
    expect(html).toContain('treatment-plain')
    expect(html).not.toContain('treatment-accent')
  })

  it('test_UAT_FC_REQ-36_textblock_gradient_value_is_not_a_dial_option', () => {
    // `gradient` needs a headingGradient content field — excluded from the flat
    // module's dial so it can never be a silently-inert value.
    expect(textBlockMeta.dials.headingTreatment).toEqual(['plain', 'accent', 'gold'])
  })
})

describe('REQ-36 heading treatment — services-grid', () => {
  const items = [
    { title: 'Personal Chef Services', body: 'Weekly.' },
    { title: 'Cooking Classes', body: 'Small groups.' },
  ]

  it('test_UAT_FC_REQ-36_grid_accent_colours_heading_and_card_titles', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { headingTreatment: 'accent' },
      content: { heading: 'Our Offerings', items },
    })
    expect(html).toContain('treatment-accent')
    // Effect: the rule targets BOTH the grid heading and the card titles.
    expect(gridCss).toMatch(/\.services-grid\.treatment-accent\s+\.services-grid__heading/)
    expect(gridCss).toMatch(/\.services-grid\.treatment-accent\s+\.services-grid__card-title\s*\{[^}]*color:\s*var\(--color-accent\)/)
  })

  it('test_UAT_FC_REQ-36_grid_default_plain_keeps_titles_on_band_colour', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: { items } })
    expect(html).toContain('treatment-plain')
    expect(html).not.toContain('treatment-accent')
  })

  it('test_UAT_FC_REQ-36_grid_treatment_composes_with_bare_and_variant', async () => {
    for (const variant of servicesGridMeta.variants) {
      const html = await render(ServicesGrid, {
        variant,
        dials: { headingTreatment: 'accent', cardSurface: 'bare' },
        content: { items },
      })
      expect(html).toContain(`variant-${variant}`)
      expect(html).toContain('treatment-accent')
      expect(html).toContain('card-surface-bare')
    }
  })
})

describe('REQ-36 heading letter-case (upper) — DOM stays literal', () => {
  it('test_UAT_FC_REQ-36_hero_upper_transforms_render_but_keeps_literal_text', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { headingCase: 'upper' },
      content: { heading: 'Dreaming of healthier meals', subhead: 'x' },
    })
    // The uppercase is a render-time transform (class + CSS)…
    expect(html).toContain('case-upper')
    expect(heroCss).toMatch(/\.hero__heading\.case-upper\s*\{[^}]*text-transform:\s*uppercase/)
    // …and the DOM text node is LEFT LITERAL (mixed case) — so a faithful-repro
    // values-diff still pairs on the source text, not a synthesised uppercase.
    expect(html).toContain('Dreaming of healthier meals')
    expect(html).not.toContain('DREAMING OF HEALTHIER MEALS')
  })

  it('test_UAT_FC_REQ-36_case_default_is_normal', async () => {
    const html = await render(TextBlock, { variant: 'prose', content: { heading: 'Our Offerings', body: 'x' } })
    expect(html).toContain('case-normal')
    expect(html).not.toContain('case-upper')
  })

  it('test_UAT_FC_REQ-36_left_hero_cta_hugs_content_not_full_width', () => {
    // The left hero pins the CTA to the content-start edge (align-self) so it
    // hugs its label rather than stretching into a full-width bar.
    expect(heroCss).toMatch(/\.hero\.align-left\s+\.hero__cta\s*\{[^}]*align-self:\s*flex-start/)
  })
})

describe('REQ-36 hero front-door geometry — line breaks, divider, column pin', () => {
  it('test_UAT_FC_REQ-36_hero_heading_newline_renders_as_br_segments', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Dreaming of healthier meals\non your dinner table?', subhead: 'x' },
    })
    // The newline becomes a hard <br> so the heading breaks exactly where the
    // reference does — without capping the measure.
    expect(html).toMatch(/Dreaming of healthier meals<br[^>]*>on your dinner table\?/)
  })

  it('test_UAT_FC_REQ-36_hero_heading_without_newline_has_no_br', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Dreaming of healthier meals', subhead: 'x' },
    })
    // A single-line heading is unchanged (no injected break).
    expect(html).toContain('Dreaming of healthier meals')
    expect(html).not.toContain('<br')
  })

  it('test_UAT_FC_REQ-36_hero_divider_rule_renders_only_when_selected', async () => {
    const withRule = await render(Hero, {
      variant: 'bg-color',
      dials: { divider: 'rule' },
      content: { heading: 'H', subhead: 'x' },
    })
    const without = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'H', subhead: 'x' },
    })
    expect(withRule).toContain('hero__divider')
    expect(without).not.toContain('hero__divider')
    // The rule inherits the surface text colour (currentColor), not a hard-coded one.
    expect(heroCss).toMatch(/\.hero__divider\s*\{[^}]*border-top:\s*2px solid currentColor/)
  })

  it('test_UAT_FC_REQ-36_hero_portrait_renders_only_when_supplied', async () => {
    // The quote band's attribution avatar: a foreground portrait rendered above
    // the subhead. Present only when `content.portrait` is supplied — a hero
    // without one (every prior hero) is unchanged.
    const withPortrait = await render(Hero, {
      variant: 'bg-image',
      content: {
        heading: 'H',
        subhead: 'Chef Sarah Joy',
        image: { src: 'assets/bg.jpg', alt: 'bg' },
        portrait: { src: 'assets/chef.jpg', alt: 'Chef Sarah Joy' },
      },
    })
    const without = await render(Hero, {
      variant: 'bg-image',
      content: { heading: 'H', subhead: 'x', image: { src: 'assets/bg.jpg', alt: 'bg' } },
    })
    expect(withPortrait).toContain('hero__portrait')
    expect(withPortrait).toContain('assets/chef.jpg')
    expect(without).not.toContain('hero__portrait')
  })

  it('test_UAT_FC_REQ-36_hero_portrait_shape_defaults_to_circle', async () => {
    const dflt = await render(Hero, {
      variant: 'bg-image',
      content: {
        heading: 'H',
        subhead: 'x',
        image: { src: 'assets/bg.jpg', alt: 'bg' },
        portrait: { src: 'assets/chef.jpg', alt: 'c' },
      },
    })
    const square = await render(Hero, {
      variant: 'bg-image',
      dials: { portraitShape: 'square' },
      content: {
        heading: 'H',
        subhead: 'x',
        image: { src: 'assets/bg.jpg', alt: 'bg' },
        portrait: { src: 'assets/chef.jpg', alt: 'c' },
      },
    })
    expect(dflt).toContain('portrait-circle')
    expect(square).toContain('portrait-square')
    // `circle` crops the avatar round; the default has an effect.
    expect(heroCss).toMatch(/\.hero__portrait\.portrait-circle\s*\{[^}]*border-radius:\s*50%/)
  })

  it('test_UAT_FC_REQ-36_hero_content_column_left_drops_the_centring_margin', async () => {
    const left = await render(Hero, {
      variant: 'bg-color',
      dials: { contentColumn: 'left' },
      content: { heading: 'H', subhead: 'x' },
    })
    expect(left).toContain('content-column-left')
    // `left` pins the column to the gutter (start margin 0); `center` is default.
    expect(heroCss).toMatch(/\.hero\.content-column-left\s+\.hero__inner\s*\{[^}]*margin-inline:\s*0 auto/)
    const dflt = await render(Hero, { variant: 'bg-color', content: { heading: 'H', subhead: 'x' } })
    expect(dflt).toContain('content-column-center')
  })

  it('test_UAT_FC_REQ-36_hero_scrim_keys_to_dedicated_scrim_token_not_surface_inverse', () => {
    // The legibility scrim paints `--color-scrim` (a near-black), NOT
    // `--color-surface-inverse` — so a theme with a mid-grey inverse band
    // (joyfulculinary) still darkens its hero image instead of greying it.
    expect(heroCss).toMatch(/\.hero__scrim\s*\{[^}]*background:\s*var\(--color-scrim\)/)
    expect(heroCss).not.toMatch(/\.hero__scrim\s*\{[^}]*var\(--color-surface-inverse\)/)
  })

  it('test_UAT_FC_REQ-36_scrim_token_defaults_to_a_near_black', () => {
    // The generated theme always declares --color-scrim, defaulting dark so the
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

describe('REQ-36 text-block heading finish — weight / size / align / leading', () => {
  const content = { heading: 'THE HOLISTIC APPROACH', body: 'Prose paragraph.' }

  it('test_UAT_FC_REQ-36_textblock_headingWeight_reaches_extralight', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { headingWeight: 'extralight' }, content })
    expect(html).toContain('hw-extralight')
    expect(textBlockCss).toMatch(/\.text-block__heading\.hw-extralight\s*\{[^}]*font-weight:\s*var\(--font-weight-extralight\)/)
  })

  it('test_UAT_FC_REQ-36_extralight_weight_token_emitted_as_200', () => {
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    expect(css).toMatch(/--font-weight-extralight:\s*200/)
  })

  it('test_UAT_FC_REQ-36_textblock_headingSize_steps_the_heading_independently_of_body', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { headingSize: 'lg', size: 'sm' }, content })
    expect(html).toContain('hs-lg')
    // `lg` heading = 4xl, independent of the body `size` dial (which stays sm).
    expect(textBlockCss).toMatch(/\.text-block__heading\.hs-lg\s*\{[^}]*font-size:\s*var\(--font-size-4xl\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_headingAlign_centres_heading_over_left_body', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { headingAlign: 'center', textAlign: 'left' }, content })
    expect(html).toContain('halign-center')
    expect(textBlockCss).toMatch(/\.text-block__heading\.halign-center\s*\{[^}]*text-align:\s*center/)
  })

  it('test_UAT_FC_REQ-36_textblock_body_leading_tightens', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { leading: 'snug' }, content })
    expect(html).toContain('leading-snug')
    expect(textBlockCss).toMatch(/\.text-block\.leading-snug\s+\.text-block__body\s*\{[^}]*line-height:\s*var\(--line-height-snug\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_panel_card_insets_a_filled_rounded_box', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { panel: 'subtle' }, content })
    expect(html).toContain('panel-subtle')
    expect(textBlockCss).toMatch(/\.text-block\.panel-subtle\s+\.text-block__inner\s*\{[^}]*background:\s*var\(--color-surface-subtle\)/)
    // The card is padded + rounded (grouped rule covering the panel roles).
    expect(textBlockCss).toMatch(/\.text-block\.panel-subtle\s+\.text-block__inner,[\s\S]*?\{[^}]*border-radius:\s*var\(--radius-lg\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_panel_default_none_fills_the_band', async () => {
    const html = await render(TextBlock, { variant: 'prose', content })
    expect(html).toContain('panel-none')
  })

  it('test_UAT_FC_REQ-36_textblock_listMarker_check_uses_accent_ticks', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { listMarker: 'check' }, content: { heading: 'H', body: '- one\n- two' } })
    expect(html).toContain('list-marker-check')
    // The tick is FontAwesome `fa-check` (U+F00C) rendered in the IconFont — the
    // heavier geometric check the reference's Elementor icon-list uses, not the
    // thin Unicode ✓ (U+2713).
    expect(textBlockCss).toMatch(/\.list-marker-check\s+\.text-block__body li::before\s*\{[^}]*content:\s*"\\f00c"/)
    expect(textBlockCss).toMatch(/\.list-marker-check\s+\.text-block__body li::before\s*\{[^}]*font-family:\s*'IconFont'/)
    expect(textBlockCss).toMatch(/\.list-marker-check\s+\.text-block__body li::before\s*\{[^}]*color:\s*var\(--color-accent\)/)
    const dflt = await render(TextBlock, { variant: 'prose', content: { heading: 'H', body: '- one' } })
    expect(dflt).toContain('list-marker-bullet')
  })

  it('test_UAT_FC_REQ-36_textblock_heading_finish_defaults_unchanged', async () => {
    const html = await render(TextBlock, { variant: 'prose', content })
    // Omitting the new dials preserves the prior heading (bold / 3xl / left) + relaxed body.
    expect(html).toContain('hw-bold')
    expect(html).toContain('hs-md')
    expect(html).toContain('halign-left')
    expect(html).toContain('leading-relaxed')
  })
})

describe('REQ-36 services-grid card top-media', () => {
  it('test_UAT_FC_REQ-36_services_grid_renders_card_image_as_top_media', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      content: { items: [{ title: 'Personal Chef', body: 'b', image: { id: 'c', src: 'assets/card.jpg', alt: 'chef' } }] },
    })
    expect(html).toContain('services-grid__media')
    expect(html).toContain('assets/card.jpg')
    // Full-width square cover image atop the card.
    expect(gridCss).toMatch(/\.services-grid__media\s*\{[^}]*aspect-ratio:\s*1 \/ 1/)
    expect(gridCss).toMatch(/\.services-grid__media\s*\{[^}]*object-fit:\s*cover/)
    // A card without an image renders no media element.
    const noImg = await render(ServicesGrid, { variant: 'three-col', content: { items: [{ title: 'X', body: 'b' }] } })
    expect(noImg).not.toContain('services-grid__media')
  })
})

describe('REQ-36 services-grid finish — card-title size, section CTA', () => {
  it('test_UAT_FC_REQ-36_grid_size_lg_scales_card_title_to_3xl', () => {
    expect(gridCss).toMatch(/\.services-grid\.size-lg\s+\.services-grid__card-title\s*\{[^}]*font-size:\s*var\(--font-size-3xl\)/)
  })

  it('test_UAT_FC_REQ-36_grid_section_cta_renders_only_when_present', async () => {
    const withCta = await render(ServicesGrid, {
      variant: 'three-col',
      content: { items: [{ title: 'T', body: 'b' }], cta: { label: 'Get Started', href: '#c' } },
    })
    expect(withCta).toContain('services-grid__cta')
    expect(withCta).toContain('Get Started')
    const without = await render(ServicesGrid, { variant: 'three-col', content: { items: [{ title: 'T', body: 'b' }] } })
    expect(without).not.toContain('services-grid__cta')
  })
})

describe('REQ-36 header nav size', () => {
  it('test_UAT_FC_REQ-36_header_navSize_lg_enlarges_nav_links', async () => {
    const html = await render(Header, {
      variant: 'overlay',
      dials: { navSize: 'lg' },
      content: { logo: 'X', entries: [{ label: 'Home', target: '#' }] },
    })
    expect(html).toContain('nav-size-lg')
    expect(headerCss).toMatch(/\.header\.nav-size-lg\s+\.header__nav a\s*\{[^}]*font-size:\s*var\(--font-size-xl\)/)
  })
})

describe('REQ-36 services-grid icon-font glyphs', () => {
  it('test_UAT_FC_REQ-36_services_grid_icon_font_renders_accent_glyph', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { iconFont: 'icon-font' },
      content: { items: [{ title: 'FAQ', body: 'b', icon: '' }] },
    })
    expect(html).toContain('icon-font-icon-font')
    // The string icon renders in the site IconFont, accent-coloured and sized up.
    expect(gridCss).toMatch(/\.icon-font-icon-font\s+\.services-grid__icon span\s*\{[^}]*font-family:\s*'IconFont'/)
    expect(gridCss).toMatch(/\.icon-font-icon-font\s+\.services-grid__icon span\s*\{[^}]*color:\s*var\(--color-accent\)/)
    // Default (no dial) leaves a string icon as plain text.
    const dflt = await render(ServicesGrid, { variant: 'three-col', content: { items: [{ title: 'X', body: 'b', icon: '' }] } })
    expect(dflt).toContain('icon-font-default')
  })
})

describe('REQ-36 fc-row column ratio — asymmetric partial-width bands', () => {
  it('test_UAT_FC_REQ-36_composeRow_wraps_columns_with_width_encoded_flex', () => {
    const html = composeRow([
      { html: '<section>text</section>', width: 'third' },
      { html: '<section>grid</section>', width: 'two-thirds' },
    ])
    expect(html).toContain('class="fc-col fc-col--third"')
    expect(html).toContain('class="fc-col fc-col--two-thirds"')
    // `two-thirds` grows twice as fast → a ~33/67 split; the base column grows 1.
    expect(ROW_CSS).toMatch(/\.fc-col\s*\{[^}]*flex:\s*1 1 0/)
    expect(ROW_CSS).toMatch(/\.fc-col--two-thirds\s*\{[^}]*flex-grow:\s*2/)
  })
})

describe('REQ-36 hero finish — scrim depth / heading weight / CTA shape / divider', () => {
  it('test_UAT_FC_REQ-36_hero_scrim_heavy_darkens_beyond_strong', () => {
    // `heavy` sits above `strong` (0.55) for a busy/bright photo the reference darkens further.
    expect(heroCss).toMatch(/\.hero\.scrim-heavy\s+\.hero__scrim\s*\{[^}]*opacity:\s*0\.68/)
  })

  it('test_UAT_FC_REQ-36_hero_headingWeight_reaches_medium', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { headingWeight: 'medium' }, content: { heading: 'H', subhead: 'x' } })
    expect(html).toContain('hw-medium')
    expect(heroCss).toMatch(/\.hero__heading\.hw-medium\s*\{[^}]*font-weight:\s*var\(--font-weight-medium\)/)
  })

  it('test_UAT_FC_REQ-36_hero_cta_square_removes_the_radius', async () => {
    const square = await render(Hero, { variant: 'bg-color', dials: { ctaShape: 'square' }, content: { heading: 'H', subhead: 'x', cta: { label: 'Go', href: '#' } } })
    expect(square).toContain('cta-square')
    expect(heroCss).toMatch(/\.hero__cta\.cta-square\s*\{[^}]*border-radius:\s*0/)
    const dflt = await render(Hero, { variant: 'bg-color', content: { heading: 'H', subhead: 'x', cta: { label: 'Go', href: '#' } } })
    expect(dflt).toContain('cta-round')
  })

  it('test_UAT_FC_REQ-36_hero_divider_is_a_solid_2px_rule', () => {
    // A 1px hairline read thin/washed over the image; the rule is a solid 2px.
    expect(heroCss).toMatch(/\.hero__divider\s*\{[^}]*border-top:\s*2px solid currentColor/)
  })

  it('test_UAT_FC_REQ-36_hero_subheadFont_sets_the_lead_face', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { subheadFont: 'display' }, content: { heading: 'H', subhead: 'x' } })
    expect(html).toContain('subhead-font-display')
    expect(heroCss).toMatch(/\.hero\.subhead-font-display\s+\.hero__subhead\s*\{[^}]*font-family:\s*var\(--font-family-display\)/)
  })

  it('test_UAT_FC_REQ-36_hero_scrimGradient_top_darkens_the_band_top', async () => {
    const html = await render(Hero, { variant: 'bg-image', dials: { scrimGradient: 'top' }, content: { heading: 'H', subhead: 'x', image: { id: 'i', src: 'a.jpg', alt: 'a' } } })
    expect(html).toContain('hero__scrim-top')
    expect(heroCss).toMatch(/\.hero__scrim-top\s*\{[^}]*linear-gradient\(to bottom, var\(--color-scrim\)/)
    // Omitting the dial renders no top-gradient element.
    const without = await render(Hero, { variant: 'bg-image', content: { heading: 'H', subhead: 'x', image: { id: 'i', src: 'a.jpg', alt: 'a' } } })
    expect(without).not.toContain('hero__scrim-top')
  })

  it('test_UAT_FC_REQ-36_hero_finish_defaults_unchanged', async () => {
    const html = await render(Hero, { variant: 'bg-color', content: { heading: 'H', subhead: 'x', cta: { label: 'Go', href: '#' } } })
    expect(html).toContain('hw-bold')
    expect(html).toContain('cta-round')
    expect(html).toContain('subhead-font-body')
    expect(html).toContain('scrim-gradient-none')
  })
})

describe('REQ-36 header finish — image-logo size + logo card', () => {
  const content = { logo: { id: 'l', src: 'assets/logo.png', alt: 'Logo' }, entries: [{ label: 'Home', target: '#' }] }

  it('test_UAT_FC_REQ-36_logoSize_scales_an_image_logo', async () => {
    const html = await render(Header, { variant: 'overlay', dials: { logoSize: 'lg' }, content })
    expect(html).toContain('logo-size-lg')
    expect(headerCss).toMatch(/\.header__logo\.logo-size-lg img\s*\{[^}]*height:\s*var\(--space-12\)/)
  })

  it('test_UAT_FC_REQ-36_logoCard_sets_a_shadowed_plate', async () => {
    const html = await render(Header, { variant: 'overlay', dials: { logoCard: 'card' }, content })
    expect(html).toContain('logo-card-card')
    expect(headerCss).toMatch(/\.header__logo\.logo-card-card\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/)
  })

  it('test_UAT_FC_REQ-36_logoCard_shadow_drops_a_glyph_shadow', async () => {
    const html = await render(Header, { variant: 'overlay', dials: { logoCard: 'shadow' }, content })
    expect(html).toContain('logo-card-shadow')
    expect(headerCss).toMatch(/\.header__logo\.logo-card-shadow img\s*\{[^}]*filter:\s*drop-shadow/)
  })

  it('test_UAT_FC_REQ-36_header_logo_defaults_unchanged', async () => {
    const html = await render(Header, { variant: 'overlay', content })
    expect(html).toContain('logo-size-md')
    expect(html).toContain('logo-card-none')
  })
})

/**
 * UATs for the second-pass REQ-36 generalizations closing the joyfulculinary
 * fidelity gaps: a full-bleed shared band behind a partial-width row (the
 * Offerings white-gutter fix), the hero heading font-family dial (the Karla
 * pull-quote), a text-block CTA button (the Offerings "Learn More"), and the
 * extended spacing / gap scale (the airy "How It Works" band).
 */
describe('REQ-36 fc-band — shared surface behind a partial-width row', () => {
  it('test_UAT_FC_REQ-36_row_shared_surface_paints_a_full_bleed_band', () => {
    // Both columns declare surface `inverse` → a full-bleed band paints it so the
    // inter-column gap + outer margins read as one continuous band, not page-white.
    const html = composeRow([
      { html: '<section>text</section>', width: 'third', surface: 'inverse' },
      { html: '<section>grid</section>', width: 'two-thirds', surface: 'inverse' },
    ])
    expect(html).toContain('class="fc-band surface-inverse"')
    expect(ROW_CSS).toMatch(/\.fc-band\.surface-inverse\s*\{[^}]*background:\s*var\(--color-surface-inverse\)/)
  })

  it('test_UAT_FC_REQ-36_row_mixed_or_default_surfaces_get_no_band', () => {
    // Columns that disagree (or default) earn no band — the row is unchanged.
    const mixed = composeRow([
      { html: '<section>a</section>', width: 'half', surface: 'inverse' },
      { html: '<section>b</section>', width: 'half', surface: 'accent' },
    ])
    expect(mixed).not.toContain('fc-band')
    const bare = composeRow([
      { html: '<section>a</section>', width: 'half' },
      { html: '<section>b</section>', width: 'half' },
    ])
    expect(bare).not.toContain('fc-band')
  })
})

describe('REQ-36 hero heading font-family', () => {
  it('test_UAT_FC_REQ-36_hero_headingFont_body_sets_the_body_face', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { headingFont: 'body' }, content: { heading: 'Quote', subhead: 'x' } })
    expect(html).toContain('heading-font-body')
    expect(heroCss).toMatch(/\.hero__heading\.heading-font-body\s*\{[^}]*font-family:\s*var\(--font-family-body\)/)
  })

  it('test_UAT_FC_REQ-36_hero_headingFont_defaults_to_heading_face', async () => {
    const html = await render(Hero, { variant: 'bg-color', content: { heading: 'H', subhead: 'x' } })
    expect(html).toContain('heading-font-heading')
  })
})

describe('REQ-36 text-block CTA button', () => {
  const content = { heading: 'Our Offerings', body: 'Prose.', cta: { label: 'Learn More', href: '#services' } }

  it('test_UAT_FC_REQ-36_textblock_cta_renders_an_accent_button', async () => {
    const html = await render(TextBlock, { variant: 'prose', content })
    expect(html).toContain('text-block__cta')
    expect(html).toContain('Learn More')
    expect(html).toContain('href="#services"')
    expect(textBlockCss).toMatch(/\.text-block__cta\s*\{[^}]*background:\s*var\(--color-accent\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_cta_square_removes_the_radius', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { ctaShape: 'square' }, content })
    expect(html).toContain('cta-square')
    expect(textBlockCss).toMatch(/\.text-block__cta\.cta-square\s*\{[^}]*border-radius:\s*0/)
  })

  it('test_UAT_FC_REQ-36_textblock_without_cta_renders_no_button', async () => {
    const html = await render(TextBlock, { variant: 'prose', content: { heading: 'H', body: 'b' } })
    expect(html).not.toContain('text-block__cta')
  })
})

describe('REQ-36 extended spacing + gap scale — airy sections', () => {
  it('test_UAT_FC_REQ-36_spacing_2xl_3xl_step_past_xl', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { spacingTop: '3xl', spacingBottom: '2xl' }, content: { items: [{ title: 'X', body: 'b' }, { title: 'Y', body: 'b' }] } })
    expect(html).toContain('spacing-top-3xl')
    expect(html).toContain('spacing-bottom-2xl')
    // The grid renders the two new steps past its own `xl` (`--space-24`).
    expect(gridCss).toMatch(/\.services-grid\.spacing-top-2xl\s*\{[^}]*padding-top:\s*var\(--space-32\)/)
    expect(gridCss).toMatch(/\.services-grid\.spacing-top-3xl\s*\{[^}]*padding-top:\s*var\(--space-48\)/)
  })

  it('test_UAT_FC_REQ-36_every_spacing_module_renders_the_new_steps', () => {
    // The dial is shared, so no module may silently drop `2xl`/`3xl` (a no-op
    // spacing value would be a latent bug). Each spacing-bearing module renders both.
    for (const css of [textBlockCss, gridCss, heroCss, headerCss]) {
      expect(css).toMatch(/spacing-top-2xl\s*\{/)
      expect(css).toMatch(/spacing-top-3xl\s*\{/)
      expect(css).toMatch(/spacing-bottom-2xl\s*\{/)
      expect(css).toMatch(/spacing-bottom-3xl\s*\{/)
    }
  })

  it('test_UAT_FC_REQ-36_grid_gap_airy_widens_the_row_gap', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { gap: 'airy' }, content: { items: [{ title: 'X', body: 'b' }, { title: 'Y', body: 'b' }] } })
    expect(html).toContain('gap-airy')
    expect(gridCss).toMatch(/\.services-grid\.gap-airy\s+\.services-grid__cards\s*\{[^}]*gap:\s*var\(--space-16\)/)
  })
})

describe('REQ-36 fc-row content measure — boxing a partial-width row', () => {
  it('test_UAT_FC_REQ-36_row_boxes_to_a_shared_rowWidth', () => {
    // A shared `readable` rowWidth boxes the whole row to the centred reading
    // measure (the ~768px Offerings row) instead of the full-bleed default.
    const html = composeRow([
      { html: '<section>text</section>', width: 'third', surface: 'inverse', rowWidth: 'readable' },
      { html: '<section>grid</section>', width: 'two-thirds', surface: 'inverse', rowWidth: 'readable' },
    ])
    expect(html).toContain('class="fc-row w-readable"')
    expect(ROW_CSS).toMatch(/\.fc-row\.w-readable\s*\{[^}]*max-width:\s*var\(--container-readable\)/)
  })

  it('test_UAT_FC_REQ-36_row_defaults_to_full_bleed', () => {
    // No rowWidth (or `default`) → the prior full-bleed row, unchanged.
    const html = composeRow([
      { html: '<section>a</section>', width: 'half' },
      { html: '<section>b</section>', width: 'half' },
    ])
    expect(html).toMatch(/class="fc-row"/)
    expect(html).not.toContain('w-readable')
  })
})

describe('REQ-36 services-grid card title weight + face', () => {
  const items = [{ title: 'Personal Chef Services', body: 'b' }, { title: 'Y', body: 'b' }]

  it('test_UAT_FC_REQ-36_card_title_extralight_thins_the_title', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { cardTitleWeight: 'extralight' }, content: { items } })
    expect(html).toContain('ctw-extralight')
    expect(gridCss).toMatch(/\.services-grid__card-title\.ctw-extralight\s*\{[^}]*font-weight:\s*var\(--font-weight-extralight\)/)
  })

  it('test_UAT_FC_REQ-36_card_title_body_face_uses_the_body_font', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { cardTitleFont: 'body', cardTitleWeight: 'regular' }, content: { items } })
    expect(html).toContain('ctf-body')
    expect(gridCss).toMatch(/\.services-grid__card-title\.ctf-body\s*\{[^}]*font-family:\s*var\(--font-family-body\)/)
  })

  it('test_UAT_FC_REQ-36_card_title_defaults_semibold_heading', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: { items } })
    expect(html).toContain('ctw-semibold')
    expect(html).toContain('ctf-heading')
  })
})

describe('REQ-36 header logo frame', () => {
  const content = { logo: { src: 'assets/logo.png', alt: 'Logo' }, entries: [{ label: 'A', target: '#a' }] }

  it('test_UAT_FC_REQ-36_logoCard_frame_draws_a_bordered_plate', async () => {
    const html = await render(Header, { variant: 'overlay', dials: { logoCard: 'frame' }, content })
    expect(html).toContain('logo-card-frame')
    // A thin light border + faint fill lift the logo off the hero image.
    expect(headerCss).toMatch(/\.header__logo\.logo-card-frame\s*\{[^}]*border:\s*1px solid rgba\(255, 255, 255, 0\.35\)/)
    expect(headerCss).toMatch(/\.header__logo\.logo-card-frame\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.07\)/)
  })
})

describe('REQ-36 footer social icons', () => {
  const base = { copyrightHolder: 'Acme', tagline: 'Follow us' }

  it('test_UAT_FC_REQ-36_footer_renders_bordered_social_circles', async () => {
    const social = [{ icon: '', href: 'https://instagram.com', label: 'Instagram' }]
    const html = await render(Footer, { variant: 'minimal', content: { ...base, social } })
    expect(html).toContain('footer__social-link')
    expect(html).toContain('aria-label="Instagram"')
    // Bordered ring set in the brand icon font.
    expect(footerCss).toMatch(/\.footer__social-link\s*\{[^}]*border:\s*2px solid currentColor/)
    expect(footerCss).toMatch(/\.footer__social-link\s*\{[^}]*border-radius:\s*var\(--radius-full\)/)
    expect(footerCss).toMatch(/\.footer__social-link span\s*\{[^}]*font-family:\s*'BrandFont'/)
  })

  it('test_UAT_FC_REQ-36_footer_without_social_renders_no_circles', async () => {
    const html = await render(Footer, { variant: 'minimal', content: base })
    expect(html).not.toContain('footer__social')
  })
})

describe('REQ-36 services-grid icon-left card layout', () => {
  const items = [{ title: 'Visit our FAQ page', body: 'Have a question?', icon: '' }, { title: 'Questionnaire', body: 'x', icon: '' }]

  it('test_UAT_FC_REQ-36_icon_layout_left_places_icon_beside_title', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { iconLayout: 'left' }, content: { items } })
    expect(html).toContain('icon-layout-left')
    // Explicit grid placement: icon col1/row1, title col2/row1, body spans full width.
    expect(gridCss).toMatch(/\.services-grid\.icon-layout-left\s+\.services-grid__card\s*\{[^}]*display:\s*grid/)
    expect(gridCss).toMatch(/\.services-grid\.icon-layout-left\s+\.services-grid__icon\s*\{[^}]*grid-column:\s*1/)
    expect(gridCss).toMatch(/\.services-grid\.icon-layout-left\s+\.services-grid__card-title\s*\{[^}]*grid-column:\s*2/)
    expect(gridCss).toMatch(/\.services-grid\.icon-layout-left\s+\.services-grid__card-body\s*\{[^}]*grid-column:\s*1 \/ -1/)
  })

  it('test_UAT_FC_REQ-36_icon_layout_defaults_to_top', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: { items } })
    expect(html).toContain('icon-layout-top')
  })
})

describe('REQ-36 services-grid centered content column + footer muted gold', () => {
  const items = [{ title: 'A', body: 'x' }, { title: 'B', body: 'y' }]

  it('test_UAT_FC_REQ-36_grid_content_align_center_centres_the_capped_column', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', dials: { contentWidth: 'readable', contentAlign: 'center' }, content: { items } })
    expect(html).toContain('content-align-center')
    expect(gridCss).toMatch(/\.services-grid\.content-align-center\s+\.services-grid__inner\s*\{[^}]*align-items:\s*center/)
  })

  it('test_UAT_FC_REQ-36_grid_content_align_defaults_left', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: { items } })
    expect(html).toContain('content-align-left')
  })

  it('test_UAT_FC_REQ-36_footer_accent_muted_uses_the_mid_gold', async () => {
    const html = await render(Footer, { variant: 'minimal', dials: { surface: 'accent-muted' }, content: { copyrightHolder: 'Acme' } })
    expect(html).toContain('surface-accent-muted')
    expect(footerCss).toMatch(/\.footer\.surface-accent-muted\s*\{[^}]*background:\s*var\(--color-accent-mid\)/)
  })
})

describe('REQ-36 text-block panel padding depth', () => {
  const content = { heading: 'What people are saying', body: 'A testimonial.' }

  it('test_UAT_FC_REQ-36_panel_pad_xl_deepens_the_panel', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { panel: 'secondary', panelPad: 'xl' }, content })
    expect(html).toContain('panel-pad-xl')
    expect(textBlockCss).toMatch(/\.text-block\.panel-pad-xl\s+\.text-block__inner\s*\{[^}]*padding-block:\s*var\(--space-24\)/)
  })

  it('test_UAT_FC_REQ-36_panel_pad_defaults_md', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { panel: 'secondary' }, content })
    expect(html).toContain('panel-pad-md')
  })
})

/**
 * UATs for the element-fidelity batch (REQ-36) — the hero CTA label typography
 * (font / size / weight / `soft` 2px corner, for the reference's small Raleway
 * "Learn More"), the text-block `panelCorner` (the square Holistic card) and
 * `bodyWeight` (the light "Who Uses" checklist body), and the `--font-family-label`
 * token the CTA `label` font role resolves. Every dial is default-preserving.
 */
describe('REQ-36 element fidelity — CTA typography, panel corner, body weight, label font', () => {
  const heroCta = { heading: 'H', subhead: 'x', cta: { label: 'Learn More', href: '#' } }

  it('test_UAT_FC_REQ-36_hero_cta_font_reaches_the_label_face', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { ctaFont: 'label' }, content: heroCta })
    expect(html).toContain('cta-font-label')
    expect(heroCss).toMatch(/\.hero__cta\.cta-font-label\s*\{[^}]*font-family:\s*var\(--font-family-label\)/)
    const dflt = await render(Hero, { variant: 'bg-color', content: heroCta })
    expect(dflt).toContain('cta-font-body')
  })

  it('test_UAT_FC_REQ-36_hero_cta_size_reaches_xs', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { ctaSize: 'xs' }, content: heroCta })
    expect(html).toContain('cta-size-xs')
    expect(heroCss).toMatch(/\.hero__cta\.cta-size-xs\s*\{[^}]*font-size:\s*var\(--font-size-xs\)/)
    const dflt = await render(Hero, { variant: 'bg-color', content: heroCta })
    expect(dflt).toContain('cta-size-base')
  })

  it('test_UAT_FC_REQ-36_hero_cta_weight_reaches_medium', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { ctaWeight: 'medium' }, content: heroCta })
    expect(html).toContain('cta-weight-medium')
    expect(heroCss).toMatch(/\.hero__cta\.cta-weight-medium\s*\{[^}]*font-weight:\s*var\(--font-weight-medium\)/)
    const dflt = await render(Hero, { variant: 'bg-color', content: heroCta })
    expect(dflt).toContain('cta-weight-semibold')
  })

  it('test_UAT_FC_REQ-36_hero_cta_soft_is_a_2px_corner', async () => {
    const html = await render(Hero, { variant: 'bg-color', dials: { ctaShape: 'soft' }, content: heroCta })
    expect(html).toContain('cta-soft')
    expect(heroCss).toMatch(/\.hero__cta\.cta-soft\s*\{[^}]*border-radius:\s*2px/)
  })

  it('test_UAT_FC_REQ-36_textblock_panelCorner_square_hard_corners_the_panel', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { panel: 'secondary', panelCorner: 'square' }, content: { heading: 'H', body: 'b' } })
    expect(html).toContain('panel-corner-square')
    expect(textBlockCss).toMatch(/\.text-block\.panel-corner-square\s+\.text-block__inner\s*\{[^}]*border-radius:\s*0/)
    const dflt = await render(TextBlock, { variant: 'prose', dials: { panel: 'secondary' }, content: { heading: 'H', body: 'b' } })
    expect(dflt).toContain('panel-corner-rounded')
  })

  it('test_UAT_FC_REQ-36_textblock_bodyWeight_light_steps_the_body', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { bodyWeight: 'light' }, content: { heading: 'H', body: 'b' } })
    expect(html).toContain('body-weight-light')
    expect(textBlockCss).toMatch(/\.text-block\.body-weight-light\s+\.text-block__body\s*\{[^}]*font-weight:\s*var\(--font-weight-light\)/)
    const dflt = await render(TextBlock, { variant: 'prose', content: { heading: 'H', body: 'b' } })
    expect(dflt).toContain('body-weight-regular')
  })

  it('test_UAT_FC_REQ-36_theme_emits_font_family_label_from_the_label_role', () => {
    const withLabel = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla', label: 'Raleway' } } })
    expect(withLabel).toMatch(/--font-family-label:\s*Raleway/)
    // Omitting the role falls back to the body family, so an existing theme is unchanged.
    const without = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla' } } })
    expect(without).toMatch(/--font-family-label:\s*Karla/)
  })
})
