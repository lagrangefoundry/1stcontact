import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { footerMeta } from '../packages/framework/src/modules/footer/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
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

describe('REQ-20 hero fold height + markdown subhead', () => {
  it('test_UAT_FC_REQ-20_hero_renders_fold_height', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: { heading: 'Intentional Software', subhead: 'Body.', image: { src: 'a.png', alt: 'x' } },
    })
    expect(html).toContain('height-fold')
  })

  it('test_UAT_FC_REQ-20_hero_defaults_to_auto_height', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'Acme', subhead: 'Body.' },
    })
    expect(html).toContain('height-auto')
    expect(html).not.toContain('height-fold')
  })

  it('test_UAT_FC_REQ-20_hero_subhead_renders_markdown_paragraphs', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: {
        heading: 'Intentional Software',
        // Two markdown paragraphs: a subhead line then the body copy.
        subhead: 'Tools for clarity, presence, and positive connection\n\nWe build tools differently.',
      },
    })
    // Both paragraphs survive as distinct <p> — not collapsed into one run-on
    // string the way a raw {subhead} interpolation would render them.
    expect(html).toMatch(
      /hero__subhead[\s\S]*<p>[\s\S]*positive connection[\s\S]*<\/p>[\s\S]*<p>[\s\S]*tools differently\.<\/p>/,
    )
  })
})

describe('REQ-20 header wordmark size', () => {
  it('test_UAT_FC_REQ-20_header_renders_requested_logo_size', async () => {
    const html = await render(Header, {
      variant: 'overlay',
      dials: { logoFont: 'display', logoSize: 'lg' },
      content: { logo: 'GIGABYTE ALCHEMY', entries: [] },
    })
    expect(html).toContain('header__wordmark--size-lg')
  })

  it('test_UAT_FC_REQ-20_header_logo_size_defaults_to_md', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme', entries: [] },
    })
    expect(html).toContain('header__wordmark--size-md')
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
        version: 1,
        variant: 'inline',
        dials: { width: 'half' },
        content: {
          heading: 'Get in touch',
          action: '/subscribe',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          submitLabel: 'Subscribe',
        },
      },
      {
        id: 'contact',
        type: 'contact-form',
        version: 1,
        variant: 'inline',
        dials: { width: 'half' },
        content: {
          action: '/contact',
          fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
          submitLabel: 'Send',
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
