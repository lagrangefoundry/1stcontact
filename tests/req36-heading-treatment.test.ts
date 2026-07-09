import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
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
    expect(textBlockCss).toMatch(/\.list-marker-check\s+\.text-block__body li::before\s*\{[^}]*content:\s*"\\2713"/)
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
