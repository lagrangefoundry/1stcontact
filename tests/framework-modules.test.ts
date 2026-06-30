import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Header from '../packages/framework/src/modules/header/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { BUILD_YEAR } from '../packages/framework/src/buildInfo'

/**
 * UATs for REQ-4 — chrome module rendering. Each module is rendered to a string
 * through Astro's container API (the same SSR path tools/generate uses) and
 * asserted on the produced markup, not internal state.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>

let container: Container
async function render(Component: Parameters<Container['renderToString']>[0], props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

describe('header module', () => {
  it('test_UAT_FC_REQ-4_header_renders_logo_and_entries', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: {
        logo: 'Acme Co',
        entries: [
          { label: 'Home', target: { kind: 'page', pageId: 'home' } },
          { label: 'Menu', target: { kind: 'anchor', pageId: 'home', moduleId: 'menu' } },
          { label: 'Blog', target: { kind: 'url', href: 'https://blog.acme.test' } },
        ],
      },
    })
    expect(html).toContain('Acme Co')
    // An anchor for each entry, with the resolved href.
    expect(html).toMatch(/<a[^>]+href="\/home"[^>]*>\s*Home\s*<\/a>/)
    expect(html).toMatch(/<a[^>]+href="#menu"[^>]*>\s*Menu\s*<\/a>/)
    expect(html).toMatch(/<a[^>]+href="https:\/\/blog\.acme\.test"[^>]*>\s*Blog\s*<\/a>/)
  })

  it('test_UAT_FC_REQ-4_header_collapses_below_md_breakpoint', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme', entries: [] },
    })
    // The responsive hamburger toggle markup is always present (CSS hides it on desktop).
    expect(html).toContain('data-nav-toggle')
    expect(html).toContain('header__toggle')
  })
})

describe('hero module', () => {
  it('test_UAT_FC_REQ-4_hero_renders_with_bg_color_variant', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { size: 'lg', align: 'center' },
      content: { heading: 'Welcome', subhead: 'We do great work' },
    })
    expect(html).toContain('Welcome')
    // The colour variant has no background image element.
    expect(html).not.toContain('<img')
  })

  it('test_UAT_FC_REQ-4_hero_renders_with_bg_image_variant', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: {},
      content: {
        heading: 'Welcome',
        subhead: 'sub',
        image: { id: 'bg1', src: '/assets/hero-bg.jpg', alt: 'Catering spread' },
      },
    })
    expect(html).toMatch(/<img[^>]+class="hero__bg"/)
    expect(html).toContain('src="/assets/hero-bg.jpg"')
    expect(html).toContain('alt="Catering spread"')
  })

  it('test_UAT_FC_REQ-4_hero_omits_cta_when_not_provided', async () => {
    const withCta = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: 's', cta: { label: 'Book now', href: '/book' } },
    })
    expect(withCta).toContain('hero__cta')
    expect(withCta).toContain('Book now')

    const withoutCta = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: 's' },
    })
    expect(withoutCta).not.toContain('hero__cta')
  })
})

describe('footer module', () => {
  it('test_UAT_FC_REQ-4_footer_renders_copyright_with_year', async () => {
    const html = await render(Footer, {
      variant: 'minimal',
      dials: {},
      content: { copyrightHolder: 'Acme Catering Ltd' },
    })
    expect(html).toContain(String(BUILD_YEAR))
    expect(html).toContain('Acme Catering Ltd')
  })

  it('test_UAT_FC_REQ-4_footer_renders_optional_links', async () => {
    const html = await render(Footer, {
      variant: 'minimal',
      dials: {},
      content: {
        copyrightHolder: 'Acme',
        links: [
          { label: 'Privacy', target: { kind: 'url', href: 'https://acme.test/privacy' } },
          { label: 'Terms', target: { kind: 'url', href: 'https://acme.test/terms' } },
        ],
      },
    })
    expect(html).toMatch(/<a[^>]+href="https:\/\/acme\.test\/privacy"[^>]*>\s*Privacy\s*<\/a>/)
    expect(html).toMatch(/<a[^>]+href="https:\/\/acme\.test\/terms"[^>]*>\s*Terms\s*<\/a>/)
  })
})
