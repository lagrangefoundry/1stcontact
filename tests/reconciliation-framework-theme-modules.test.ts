import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { getModule } from '../packages/framework/src/modules/registry'
import Header from '../packages/framework/src/modules/header/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { BUILD_YEAR } from '../packages/framework/src/buildInfo'

/**
 * Reconciliation UATs for story-a224111f (REQ-4) — token-driven theme CSS and
 * a versioned chrome module catalog. One UAT per acceptance criterion,
 * asserting against the existing implementation at its external boundaries:
 * the `generateThemeCss` generator, the `getModule` catalog resolver, and the
 * SSR-rendered markup of the header/hero/footer Astro modules (via Astro's
 * container API — the same render path tools/generate uses).
 */

/** Extract the declarations inside the top-level `:root { ... }` block. */
function rootBlock(css: string): string {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/)
  return m ? m[1] : ''
}

/** Count `--name:` custom-property declarations in a CSS fragment. */
function declCount(fragment: string): number {
  return (fragment.match(/--[a-z0-9-]+:/g) ?? []).length
}

/** Read a shipped module's `.astro` source (the authoritative stylesheet). */
function moduleSource(rel: string): string {
  return readFileSync(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url), 'utf8')
}

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: Parameters<Container['renderToString']>[0], props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

describe('story-a224111f — theme CSS generation', () => {
  it('test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names', () => {
    const css = generateThemeCss(defaultTokens)
    expect(css).toContain(':root {')

    // At least one representative variable per group, using the group-specific
    // deterministic naming scheme.
    for (const name of [
      '--color-bg', // palette role
      '--color-surface-subtle', // palette role, kebab-cased
      '--color-text', // palette role (text, not fg)
      '--font-family-heading',
      '--font-size-5xl', // 9-step scale
      '--font-weight-bold',
      '--line-height-normal',
      '--space-4',
      '--radius-md',
      '--shadow-lg',
      '--container-default',
      '--breakpoint-md',
    ]) {
      expect(css, `missing ${name}`).toContain(`${name}:`)
    }

    // Exactly one declaration per slot across the full 55-token surface.
    expect(declCount(rootBlock(css))).toBe(55)

    // Deterministic: the same input always yields byte-identical output.
    expect(generateThemeCss(defaultTokens)).toBe(css)
  })

  it('test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface', () => {
    // A sparse, nested partial: two palette roles and one spacing key supplied.
    const css = generateThemeCss({
      palette: { primary: '#ff0000', bg: '#eeeeee' },
      spacing: { '4': '2rem' },
    })

    // Supplied slots use the caller's values.
    expect(css).toContain('--color-primary: #ff0000;')
    expect(css).toContain('--color-bg: #eeeeee;')
    expect(css).toContain('--space-4: 2rem;')

    // Omitted slots fall back to framework defaults, at every group/nesting depth.
    expect(css).toContain('--color-text: #111827;') // default palette role
    expect(css).toContain('--space-24: 6rem;') // default spacing key
    expect(css).toContain('--font-size-base: 1rem;') // default type-scale step
    expect(css).toContain('--container-default: 72rem;') // default container

    // The output is never missing a slot: still the full 55-token surface.
    expect(declCount(rootBlock(css))).toBe(55)
  })

  it('test_UAT_AC435_emits_dark_mode_block_only_for_supplied_dark_roles', () => {
    const withDark = generateThemeCss(defaultTokens, {
      dark: { bg: '#000000', text: '#ffffff', surfaceSubtle: '#1f2937' },
    })
    expect(withDark).toContain('@media (prefers-color-scheme: dark)')

    const darkBlock = withDark.slice(withDark.indexOf('@media'))
    expect(darkBlock).toContain('--color-bg: #000000;')
    expect(darkBlock).toContain('--color-text: #ffffff;')
    expect(darkBlock).toContain('--color-surface-subtle: #1f2937;')
    // Only the supplied dark roles are overridden — nothing else.
    expect(declCount(darkBlock)).toBe(3)

    // No dark palette supplied → no prefers-color-scheme block at all.
    expect(generateThemeCss(defaultTokens)).not.toContain('prefers-color-scheme: dark')
  })
})

describe('story-a224111f — module catalog', () => {
  it('test_UAT_AC436_resolves_known_module_returning_contract_and_component', () => {
    for (const id of ['header', 'hero', 'footer']) {
      const def = getModule(id, 1)
      expect(def.meta.id).toBe(id)
      expect(def.meta.version).toBe(1)
      // A renderable component is paired with the contract.
      expect(def.Component).toBeTypeOf('function')
    }
  })

  it('test_UAT_AC437_unknown_module_throws_catalog_miss_naming_request_and_known_entries', () => {
    // Unknown id.
    expect(() => getModule('nope', 1)).toThrow(/not found in catalog/i)
    try {
      getModule('nope', 1)
      throw new Error('expected getModule to throw')
    } catch (err) {
      const msg = (err as Error).message
      expect(msg).toContain("'nope'") // names what was requested
      expect(msg).toContain('v1')
      expect(msg).toContain('header@1') // enumerates the known catalog entries
      expect(msg).toContain('hero@1')
      expect(msg).toContain('footer@1')
    }

    // A known id at an unavailable version is also a catalog miss.
    expect(() => getModule('hero', 99)).toThrow(/catalog/i)
  })

  it('test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract', () => {
    const expected: Record<string, string[]> = {
      header: ['top-nav'],
      hero: ['bg-color', 'bg-image'],
      footer: ['minimal'],
    }

    for (const [id, variants] of Object.entries(expected)) {
      const meta = getModule(id, 1).meta
      expect(typeof meta.id).toBe('string')
      expect(typeof meta.version).toBe('number')
      // Finite, non-empty variant list matching the declared surface.
      expect(meta.variants).toEqual(variants)
      expect(meta.variants.length).toBeGreaterThan(0)

      // Every dial declares a finite (array) enumeration of permitted values.
      expect(Object.keys(meta.dials).length).toBeGreaterThan(0)
      for (const values of Object.values(meta.dials)) {
        expect(Array.isArray(values)).toBe(true)
        expect(values.length).toBeGreaterThan(0)
      }

      // Every content field declares a type and a required flag.
      expect(Object.keys(meta.contentSchema).length).toBeGreaterThan(0)
      for (const spec of Object.values(meta.contentSchema)) {
        expect(typeof spec.type).toBe('string')
        expect(typeof spec.required).toBe('boolean')
      }
    }
  })
})

describe('story-a224111f — chrome module rendering', () => {
  it('test_UAT_AC439_header_renders_logo_nav_links_and_below_md_collapse', async () => {
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

    // Logo and one anchor per entry, each pointing at its resolved target.
    expect(html).toContain('Acme Co')
    expect(html).toMatch(/<a[^>]+href="\/home"[^>]*>\s*Home\s*<\/a>/)
    expect(html).toMatch(/<a[^>]+href="#menu"[^>]*>\s*Menu\s*<\/a>/)
    expect(html).toMatch(/<a[^>]+href="https:\/\/blog\.acme\.test"[^>]*>\s*Blog\s*<\/a>/)

    // Responsive hamburger toggle markup is present in the rendered output.
    expect(html).toContain('data-nav-toggle')
    expect(html).toContain('header__toggle')

    // The toggle is governed by a below-`md` (768px) breakpoint rule: the module
    // stylesheet hides the toggle at desktop and shows it below md, collapsing
    // the nav. (Astro's container strips scoped <style> from the SSR string, so
    // the rule is asserted against the shipped module source.)
    const headerCss = moduleSource('header/index.astro')
    expect(headerCss).toMatch(/\.header__toggle\s*\{[^}]*display:\s*none/) // hidden on desktop
    const belowMd = headerCss.slice(headerCss.indexOf('@media (max-width: 768px)'))
    expect(headerCss).toContain('@media (max-width: 768px)')
    expect(belowMd).toMatch(/\.header__toggle\s*\{\s*display:\s*flex/) // shown below md
    expect(belowMd).toMatch(/\.header__nav\s*\{\s*display:\s*none/) // nav collapses below md
  })

  it('test_UAT_AC440_hero_bg_color_renders_heading_subhead_no_image_clamp_sized', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { size: 'lg', align: 'center' },
      content: { heading: 'Welcome', subhead: 'We do great work' },
    })

    expect(html).toContain('Welcome')
    expect(html).toContain('We do great work')
    // The colour variant carries no background image element.
    expect(html).not.toContain('<img')

    // The size dial drives a distinct heading class in the rendered markup...
    expect(html).toContain('size-lg')
    // ...and the module stylesheet keys a fluid, clamp-based heading rule off
    // each size dial value (asserted against the shipped module source, since
    // Astro strips scoped <style> from the SSR string).
    const heroCss = moduleSource('hero/index.astro')
    expect(heroCss).toMatch(/\.hero\.size-sm\s+\.hero__heading\s*\{\s*font-size:\s*clamp\(/)
    expect(heroCss).toMatch(/\.hero\.size-md\s+\.hero__heading\s*\{\s*font-size:\s*clamp\(/)
    expect(heroCss).toMatch(/\.hero\.size-lg\s+\.hero__heading\s*\{\s*font-size:\s*clamp\(/)
  })

  it('test_UAT_AC441_hero_bg_image_renders_background_image_with_src_and_alt', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: {},
      content: {
        heading: 'Welcome',
        subhead: 'sub',
        image: { id: 'bg1', src: '/assets/hero-bg.jpg', alt: 'Catering spread' },
      },
    })

    // Heading plus a background image carrying the configured src + alt.
    expect(html).toContain('Welcome')
    expect(html).toMatch(/<img[^>]+class="hero__bg"/)
    expect(html).toContain('src="/assets/hero-bg.jpg"')
    expect(html).toContain('alt="Catering spread"')
  })

  it('test_UAT_AC442_hero_renders_cta_only_when_provided', async () => {
    const withCta = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: 's', cta: { label: 'Book now', href: '/book' } },
    })
    expect(withCta).toMatch(/<a[^>]+class="hero__cta"[^>]*href="\/book"[^>]*>\s*Book now\s*<\/a>/)

    const withoutCta = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'H', subhead: 's' },
    })
    expect(withoutCta).not.toContain('hero__cta')
  })

  it('test_UAT_AC443_footer_renders_deterministic_build_time_copyright', async () => {
    const props = {
      variant: 'minimal',
      dials: {},
      content: { copyrightHolder: 'Acme Catering Ltd' },
    }
    const first = await render(Footer, props)
    const second = await render(Footer, props)

    // Copyright line contains the configured holder and the build-time year.
    expect(first).toContain('Acme Catering Ltd')
    expect(first).toContain(String(BUILD_YEAR))
    expect(first).toMatch(new RegExp(`©\\s*${BUILD_YEAR}\\s*Acme Catering Ltd`))

    // Deterministic across repeated renders regardless of wall-clock time.
    expect(second).toBe(first)
  })

  it('test_UAT_AC444_footer_renders_optional_link_row_one_link_per_entry', async () => {
    const withLinks = await render(Footer, {
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
    // A link row with one anchor per provided entry, at the correct targets.
    expect(withLinks).toContain('footer__links')
    expect(withLinks).toMatch(/<a[^>]+href="https:\/\/acme\.test\/privacy"[^>]*>\s*Privacy\s*<\/a>/)
    expect(withLinks).toMatch(/<a[^>]+href="https:\/\/acme\.test\/terms"[^>]*>\s*Terms\s*<\/a>/)

    // No links provided → no link row rendered.
    const withoutLinks = await render(Footer, {
      variant: 'minimal',
      dials: {},
      content: { copyrightHolder: 'Acme' },
    })
    expect(withoutLinks).not.toContain('footer__links')
  })
})
