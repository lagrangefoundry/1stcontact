import { describe, it, expect, expectTypeOf } from 'vitest'
import {
  validateSite,
  type Site,
} from '../packages/site-schema/src/index'

/**
 * UATs for REQ-3 — @1stcontact/site-schema structural validation.
 *
 * Entry point under test: the public `validateSite(input): Result<Site, ...>`
 * exported from the package index. Fixtures are built from a complete, valid
 * site and mutated per-case so each test isolates one validation rule.
 */

/** A complete theme with every required token slot present (DOC-7 §4). */
function fullTheme() {
  return {
    palette: {
      primary: '#2563eb',
      accent: '#f59e0b',
      fg: '#111827',
      bg: '#ffffff',
      surface: '#f9fafb',
      surfaceSubtle: '#f3f4f6',
      surfaceInverse: '#111827',
      border: '#e5e7eb',
      muted: '#6b7280',
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
      },
    },
    spacing: {
      none: '0',
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    radius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
    shadow: {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    },
    container: { maxWidth: '72rem' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  }
}

/** Smallest valid site: one page, one module, full theme. */
function minimalSite() {
  return {
    id: 'site-min',
    config: { businessName: 'Acme Co' },
    theme: fullTheme(),
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

/** Site exercising every slot: nav entries, multiple pages/modules, assets. */
function fullSite() {
  return {
    id: 'site-full',
    config: {
      businessName: 'Acme Catering',
      tagline: 'We cater everything',
      contact: { email: 'hi@acme.test', phone: '+1 555 0100', address: '1 Main St' },
      integrations: { stripe: 'acct_123' },
    },
    theme: fullTheme(),
    nav: {
      pattern: 'top-tabs',
      entries: [
        { label: 'Home', target: { kind: 'page', pageId: 'page-home' } },
        {
          label: 'Menu',
          target: { kind: 'anchor', pageId: 'page-home', moduleId: 'm-menu' },
        },
        { label: 'Blog', target: { kind: 'url', href: 'https://blog.acme.test' } },
      ],
    },
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'Home',
        seoMeta: { title: 'Acme | Home', description: 'Catering', ogImage: 'og.png' },
        modules: [
          {
            id: 'm-hero',
            type: 'photo-text',
            version: 2,
            variant: 'image-left',
            dials: { size: 'lg', shape: 'rounded' },
            content: {
              heading: 'Welcome',
              body: 'Some **markdown** body',
              image: { id: 'a1', src: '/assets/a1.jpg', alt: 'Hero', focalPoint: { x: 0.5, y: 0.3 } },
              bullets: ['One', 'Two', 'Three'],
            },
          },
          {
            id: 'm-menu',
            type: 'text-block',
            version: 1,
            variant: 'stacked',
            dials: {},
            content: { body: 'Our menu' },
          },
        ],
      },
      {
        id: 'page-about',
        slug: 'about',
        title: 'About',
        modules: [
          { id: 'm-about', type: 'text-block', version: 1, variant: 'stacked', dials: {}, content: {} },
        ],
      },
    ],
    assets: [{ id: 'a1', src: '/assets/a1.jpg', alt: 'Hero' }],
  }
}

describe('@1stcontact/site-schema validateSite', () => {
  it('test_UAT_FC_REQ-3_valid_minimal_site_validates', () => {
    const result = validateSite(minimalSite())
    expect(result.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-3_valid_full_site_validates', () => {
    const result = validateSite(fullSite())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.pages).toHaveLength(2)
      expect(result.value.nav.entries).toHaveLength(3)
    }
  })

  it('test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected', () => {
    const site = minimalSite() as Record<string, any>
    delete site.pages[0].modules[0].version // ModuleInstance missing required `version`
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/pages/0/modules/0/version')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-3_invalid_nav_pattern_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.nav.pattern = 'mega-menu' // not in the enum
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/nav/pattern')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected', () => {
    const site = minimalSite() as Record<string, any>
    delete site.theme.spacing.md // a required token slot
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/theme/spacing/md')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-3_invalid_color_format_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.theme.palette.primary = 'blue' // not a hex color
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/theme/palette/primary')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-3_validator_returns_typed_site', () => {
    const result = validateSite(minimalSite())
    expect(result.ok).toBe(true)
    if (result.ok) {
      // On the success branch the value is narrowed to Site at compile time.
      expectTypeOf(result.value).toEqualTypeOf<Site>()
    }
  })

  it('test_UAT_FC_REQ-3_catalog_membership_not_validated', () => {
    const site = minimalSite() as Record<string, any>
    site.pages[0].modules[0].type = 'totally-not-a-real-module' // unknown type
    site.pages[0].modules[0].variant = 'not-a-real-variant'
    // Schema validates structure only; catalog membership is the framework's job.
    const result = validateSite(site)
    expect(result.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-3_duplicate_page_slug_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.pages.push({ ...site.pages[0], id: 'page-home-2' }) // same slug 'home'
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/pages/1/slug')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.pages[0].modules.push({ ...site.pages[0].modules[0] }) // duplicate id 'm1'
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/pages/0/modules/1/id')).toBe(true)
    }
  })
})
