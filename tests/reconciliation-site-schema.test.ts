import { describe, it, expect } from 'vitest'
import { validateSite } from '../packages/site-schema/src/index'

/**
 * Reconciliation UATs for story-6fc151b1 — "Structural validation of site
 * definitions" (@1stcontact/site-schema).
 *
 * One UAT per acceptance criterion (AC-425 .. AC-432), asserting against the
 * existing `validateSite(input): Result<Site, ValidationError[]>` exported from
 * the package index — the external boundary every consumer (framework renderer,
 * generator, control app, AI tool-call validators) calls.
 *
 * Fixtures are built from a complete, valid site (full REQ-4 token superset) and
 * mutated per-case so each test isolates one validation rule.
 */

// --- Fixtures --------------------------------------------------------------

/** A complete theme with every required token slot present (DOC-7 §4, REQ-4 superset). */
function fullTheme() {
  return {
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

/**
 * Site exercising every slot: a nav config whose three entries use each of the
 * three target kinds (page, anchor, url), multiple pages/modules, and assets.
 */
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
        { label: 'Menu', target: { kind: 'anchor', pageId: 'page-home', moduleId: 'm-menu' } },
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

// --- UATs ------------------------------------------------------------------

describe('story-6fc151b1 — structural validation of site definitions', () => {
  // AC-425: Valid site definition validates and returns the site value.
  it('test_UAT_AC425_valid_site_validates_and_returns_value', () => {
    // Minimal site validates.
    const min = validateSite(minimalSite())
    expect(min.ok).toBe(true)

    // Full site (every token slot, nav config, multiple pages/modules, assets)
    // validates and the success result reproduces the submitted structure.
    const submitted = fullSite()
    const full = validateSite(submitted)
    expect(full.ok).toBe(true)
    if (full.ok) {
      expect(full.value).toEqual(submitted)
      expect(full.value.pages).toHaveLength(2)
      expect(full.value.pages[0].modules).toHaveLength(2)
      expect(full.value.nav.entries).toHaveLength(3)
      expect(full.value.assets).toHaveLength(1)
    }
  })

  // AC-426: Structurally invalid input is rejected with path-located errors.
  it('test_UAT_AC426_invalid_module_rejected_with_json_pointer_path', () => {
    const site = minimalSite() as Record<string, any>
    delete site.pages[0].modules[0].version // ModuleInstance missing required `version`
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0)
      // At least one error carries a JSON-pointer path locating the offending node.
      const offending = result.errors.find((e) => e.path === '/pages/0/modules/0/version')
      expect(offending).toBeDefined()
      expect(offending!.path.startsWith('/')).toBe(true)
      expect(typeof offending!.message).toBe('string')
      expect(offending!.message.length).toBeGreaterThan(0)
    }
  })

  // AC-427: Navigation pattern outside the recognized set is rejected.
  it('test_UAT_AC427_unrecognized_nav_pattern_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.nav.pattern = 'mega-menu' // not one of the five recognized patterns
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/nav/pattern')).toBe(true)
    }
  })

  // AC-428: Missing required theme-token slot is rejected at the slot path.
  it('test_UAT_AC428_missing_theme_token_slot_rejected', () => {
    const site = minimalSite() as Record<string, any>
    delete site.theme.spacing['4'] // omit a required token slot
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/theme/spacing/4')).toBe(true)
    }
  })

  // AC-429: Non-hex color value in a color token is rejected.
  it('test_UAT_AC429_non_hex_color_token_rejected', () => {
    const site = minimalSite() as Record<string, any>
    site.theme.palette.primary = 'blue' // not #rgb / #rrggbb / #rrggbbaa
    const result = validateSite(site)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/theme/palette/primary')).toBe(true)
    }
  })

  // AC-430: Duplicate structural identifiers are rejected.
  it('test_UAT_AC430_duplicate_structural_identifiers_rejected', () => {
    // (a) two module instances share the same id within one page.
    const dupModule = minimalSite() as Record<string, any>
    dupModule.pages[0].modules.push({ ...dupModule.pages[0].modules[0] }) // duplicate id 'm1'
    const modResult = validateSite(dupModule)
    expect(modResult.ok).toBe(false)
    if (!modResult.ok) {
      const err = modResult.errors.find((e) => e.path === '/pages/0/modules/1/id')
      expect(err).toBeDefined()
      expect(err!.message).toMatch(/duplicate/i)
    }

    // (b) two pages share the same slug within the site.
    const dupSlug = minimalSite() as Record<string, any>
    dupSlug.pages.push({ ...dupSlug.pages[0], id: 'page-home-2' }) // same slug 'home'
    const slugResult = validateSite(dupSlug)
    expect(slugResult.ok).toBe(false)
    if (!slugResult.ok) {
      const err = slugResult.errors.find((e) => e.path === '/pages/1/slug')
      expect(err).toBeDefined()
      expect(err!.message).toMatch(/duplicate/i)
    }
  })

  // AC-431: Catalog membership is not validated (structure-only boundary).
  it('test_UAT_AC431_catalog_membership_not_validated', () => {
    const site = minimalSite() as Record<string, any>
    site.pages[0].modules[0].type = 'totally-not-a-real-module' // unknown type
    site.pages[0].modules[0].variant = 'not-a-real-variant' // unknown variant
    // Structure is well-formed; catalog membership is verified downstream at render.
    const result = validateSite(site)
    expect(result.ok).toBe(true)
  })

  // AC-432: Navigation entry targets are accepted for each target kind.
  it('test_UAT_AC432_nav_targets_accepted_for_each_kind', () => {
    const site = minimalSite() as Record<string, any>
    site.nav = {
      pattern: 'top-tabs',
      entries: [
        // page reference
        { label: 'Home', target: { kind: 'page', pageId: 'page-home' } },
        // in-page anchor reference (page + module)
        { label: 'Section', target: { kind: 'anchor', pageId: 'page-home', moduleId: 'm1' } },
        // external url reference
        { label: 'Blog', target: { kind: 'url', href: 'https://blog.acme.test' } },
      ],
    }
    const result = validateSite(site)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.nav.entries).toHaveLength(3)
    }
  })
})
