import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { footerMeta } from '../packages/framework/src/modules/footer/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { generateThemeCss } from '../packages/framework/src/tokens'
import { resolveTextStyle } from '../packages/framework/src/modules/text-style'
import { TREATMENT_ROLE_DIAL } from '../packages/framework/src/modules/dials'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * UATs for REQ-20 (gigabytealchemy import), eyes pass #2. Four fidelity gaps the
 * operator flagged, each closed with a structured dial/primitive (no raw CSS in
 * the site def):
 *
 *   1. hero `height` dial (`auto`/`fold`) — `fold` fills the viewport to the
 *      fold; and the hero `subhead` (schema type `markdown`) now renders as
 *      markdown so multi-paragraph copy keeps its structure.
 *   2. header `logoSize` dial (`sm`/`md`/`lg`/`xl`) — a display wordmark at
 *      hero scale.
 *   3. footer `layout` dial (`center`/`spread`) — copyright / links justified to
 *      opposite ends rather than a centred stack.
 *   4. contact-form `width` dial (`full`/`half`) + render-pipeline row grouping —
 *      consecutive half-width bands share one `fc-row` (side-by-side forms).
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(
    Component as Parameters<Container['renderToString']>[0],
    { props: props as Record<string, unknown> },
  )
}

describe('REQ-20 fidelity dials — meta', () => {
  it('test_UAT_FC_REQ-20_hero_meta_exposes_height_dial', () => {
    expect(heroMeta.dials.height).toContain('auto')
    expect(heroMeta.dials.height).toContain('fold')
  })

  it('test_UAT_FC_REQ-20_header_meta_exposes_logo_size_dial', () => {
    expect(headerMeta.dials.logoSize).toEqual(['sm', 'md', 'lg', 'xl'])
  })

  it('test_UAT_FC_REQ-20_footer_meta_exposes_layout_dial', () => {
    expect(footerMeta.dials.layout).toContain('center')
    expect(footerMeta.dials.layout).toContain('spread')
  })

  it('test_UAT_FC_REQ-20_contact_form_meta_exposes_width_dial', () => {
    expect(contactFormMeta.dials.width).toContain('full')
    expect(contactFormMeta.dials.width).toContain('half')
  })
})

describe('REQ-20 hero fold height + single-run subhead', () => {
  it('test_UAT_FC_REQ-20_hero_renders_fold_height', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: {
        heading: { text: 'Intentional Software' },
        subhead: { text: 'Body.' },
        image: { src: 'a.png', alt: 'x' },
      },
    })
    expect(html).toContain('height-fold')
  })

  it('test_UAT_FC_REQ-20_hero_defaults_to_auto_height', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body.' } },
    })
    expect(html).toContain('height-auto')
    expect(html).not.toContain('height-fold')
  })

  it('test_UAT_FC_REQ-20_hero_subhead_renders_single_run_verbatim', async () => {
    // REQ-50: the hero subhead is ONE styled run — no markdown, no lead/body
    // split. Its verbatim text renders in a single `.hero__subhead` paragraph;
    // multi-paragraph copy is authored as a `text-block` instead.
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: {
        heading: { text: 'Intentional Software' },
        subhead: { text: 'Tools for clarity, presence, and positive connection' },
      },
    })
    expect(html).toMatch(/class="hero__subhead"[^>]*>Tools for clarity, presence, and positive connection</)
    expect((html.match(/class="hero__subhead"/g) ?? []).length).toBe(1)
  })
})

describe('REQ-20 header wordmark size', () => {
  it('test_UAT_FC_REQ-20_header_wordmark_size_is_a_run_font_size', async () => {
    // REQ-50: a text wordmark's family + size live on its styled run
    // (`fontFamily`/`fontSizePx`), emitted as inline `style`; the `logoSize` dial
    // now sizes an image logo only.
    const html = await render(Header, {
      variant: 'overlay',
      content: {
        wordmark: { text: 'GIGABYTE ALCHEMY', fontFamily: 'display', fontSizePx: '5xl' },
        entries: [],
      },
    })
    expect(html).toMatch(
      /header__wordmark[^>]*style="[^"]*font-family: var\(--font-family-display\)[^"]*font-size: var\(--font-size-5xl\)/,
    )
  })

  it('test_UAT_FC_REQ-20_header_wordmark_defaults_to_no_size_override', async () => {
    // A wordmark run that omits `fontSizePx` inherits the base wordmark size — no
    // inline font-size is emitted.
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { wordmark: { text: 'Acme' }, entries: [] },
    })
    expect(html).toContain('header__wordmark')
    expect(html).not.toContain('font-size')
  })
})

describe('REQ-20 footer spread layout', () => {
  it('test_UAT_FC_REQ-20_footer_renders_spread_layout', async () => {
    const html = await render(Footer, {
      variant: 'minimal',
      dials: { layout: 'spread' },
      content: {
        copyrightHolder: 'Gigabyte Alchemy',
        links: [{ label: 'GitHub', target: 'https://github.com/' }],
      },
    })
    expect(html).toContain('layout-spread')
  })

  it('test_UAT_FC_REQ-20_footer_layout_defaults_to_center', async () => {
    const html = await render(Footer, {
      variant: 'minimal',
      dials: {},
      content: { copyrightHolder: 'Acme' },
    })
    expect(html).toContain('layout-center')
  })
})

describe('REQ-20 contact-form width', () => {
  it('test_UAT_FC_REQ-20_contact_form_renders_half_width', async () => {
    const html = await render(ContactForm, {
      variant: 'inline',
      dials: { width: 'half' },
      content: { action: '/x', fields: [{ name: 'email', label: 'Email', type: 'email', required: true }] },
    })
    expect(html).toContain('width-half')
  })
})

describe('REQ-20 secondary palette role + card treatments', () => {
  it('test_UAT_FC_REQ-20_theme_css_emits_secondary_color_token', () => {
    // A partial palette still gets a `--color-secondary`, filled from defaults.
    const css = generateThemeCss({ palette: { primary: '#0f9d6e' } })
    expect(css).toMatch(/--color-secondary:\s*#[0-9a-fA-F]{6};/)
  })

  it('test_UAT_FC_REQ-20_services_grid_meta_extends_accent_badge_and_adds_surface', () => {
    expect(servicesGridMeta.contentSchema.items.itemSchema.accent.values).toContain('secondary')
    expect(servicesGridMeta.contentSchema.items.itemSchema.badge.itemSchema.variant.values).toContain(
      'secondary',
    )
    expect(servicesGridMeta.contentSchema.items.itemSchema.surface.values).toEqual([
      'default',
      'muted',
      'neutral-cool',
    ])
  })

  it('test_UAT_FC_REQ-20_card_renders_secondary_accent_badge_and_status', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          {
            title: { text: 'XGD' },
            body: 'A methodology.',
            accent: 'secondary',
            badge: { label: 'Coming soon', variant: 'secondary' },
            checklist: ['Open source'],
          },
          { title: { text: 'Filler' }, body: 'x' },
        ],
      },
    })
    expect(html).toContain('accent-secondary')
    expect(html).toContain('badge-secondary')
    // The status hook recolours the ✓ ticks to match the badge (blue here).
    expect(html).toContain('status-secondary')
  })

  it('test_UAT_FC_REQ-20_card_renders_muted_panel_surface', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: { text: 'What We’re Exploring' }, body: 'Body.', accent: 'muted', surface: 'muted' },
          { title: { text: 'Filler' }, body: 'x' },
        ],
      },
    })
    expect(html).toContain('surface-muted')
  })

  it('test_UAT_FC_REQ-20_default_card_has_no_surface_or_status_class', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: { items: [{ title: { text: 'One' }, body: 'x' }, { title: { text: 'Two' }, body: 'y' }] },
    })
    expect(html).not.toContain('surface-muted')
    expect(html).not.toContain('status-')
  })
})

describe('REQ-20 render pipeline — half-width row grouping', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req20-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-20_consecutive_half_bands_grouped_into_one_row', async () => {
    cmdNew('acme', { cwd })
    const draft = path.join(cwd, 'storage', 'sites', 'acme', 'draft')
    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))

    // Two consecutive half-width contact-forms (subscribe + contact).
    home.modules.push(
      {
        id: 'subscribe',
        type: 'contact-form',
        version: 2,
        variant: 'inline',
        dials: { width: 'half' },
        content: {
          heading: { text: 'Get in touch' },
          action: '/subscribe',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          submitLabel: { label: 'Subscribe' },
        },
      },
      {
        id: 'contact',
        type: 'contact-form',
        version: 2,
        variant: 'inline',
        dials: { width: 'half' },
        content: {
          action: '/contact',
          fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
          submitLabel: { label: 'Send' },
        },
      },
    )
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Exactly one shared row wraps both half-width bands.
    expect((html.match(/class="fc-row"/g) ?? []).length).toBe(1)
    expect((html.match(/contact-form[^"]*width-half/g) ?? []).length).toBe(2)
    // The row structural CSS is emitted in the site stylesheet.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toMatch(/\.fc-row\s*\{[\s\S]*display: flex/)
  })

  it('test_UAT_FC_REQ-20_full_width_bands_are_not_wrapped_in_a_row', async () => {
    cmdNew('acme', { cwd })
    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    // The default scaffold carries no half-width bands, so no row wrapper.
    expect(html).not.toContain('class="fc-row"')
  })
})

/**
 * REQ-20 eyes pass #3 — the warm-gradient fidelity gap the values-diff surfaced
 * on the gigabytealchemy re-import. Post-REQ-50 the per-card / grid type scale is
 * no longer a `size` dial — a card's intrinsic size lives on its title/body runs'
 * `fontSizePx` — so those size-dial tests are retired. What remains structural is
 * the `accent-mid` palette role: a warm text-fill gradient can carry a third
 * mid-stop hue as a role (never a raw colour), now expressed as a `gradient` on a
 * styled run and resolved by `resolveTextStyle`.
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
