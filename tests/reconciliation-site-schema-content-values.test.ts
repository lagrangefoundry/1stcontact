import { describe, it, expect } from 'vitest'
import { validateSite } from '../packages/site-schema/src/index'

/**
 * Reconciliation UATs for story-6fc151b1 — "Structural validation of site
 * definitions" (@1stcontact/site-schema), content-value ACs added by BUNDLE-2.
 *
 * The base contract ACs (AC-425 .. AC-432) are covered in
 * `reconciliation-site-schema.test.ts`. This file covers the three content-value
 * widening ACs (REQ-23):
 *   - AC-495: list-of-object content round-trips through validation
 *   - AC-496: scalar content values include number and boolean
 *   - AC-497: widened content values preserve strict raw-prop rejection
 *
 * All assert against the external boundary `validateSite(input): Result<Site,
 * ValidationError[]>` exported from the package index.
 */

// --- Fixtures --------------------------------------------------------------

/** A complete theme with every required token slot present (REQ-4 superset). */
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

/** Smallest valid site: one page, one module, full theme. Mutated per-case. */
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

// --- UATs ------------------------------------------------------------------

describe('story-6fc151b1 — content-value widening', () => {
  // AC-495: List-of-object content round-trips through validation.
  it('test_UAT_AC495_list_of_object_content_round_trips', () => {
    const site = minimalSite() as Record<string, any>
    // Modules whose content is a list of typed records: services-grid `items`,
    // contact-form `fields`, footer `links`. Shape-only — per-module field names
    // are not the schema's concern.
    site.pages[0].modules = [
      {
        id: 'm-services',
        type: 'services-grid',
        version: 1,
        variant: 'grid',
        dials: {},
        content: {
          items: [
            { title: 'Catering', body: 'Full service', icon: 'plate', cta: 'Book' },
            { title: 'Delivery', body: 'To your door', icon: 'truck', cta: 'Order' },
          ],
        },
      },
      {
        id: 'm-contact',
        type: 'contact-form',
        version: 1,
        variant: 'stacked',
        dials: {},
        content: {
          fields: [
            { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 120 },
            { name: 'message', label: 'Message', type: 'textarea', required: false, maxLength: 500 },
          ],
        },
      },
      {
        id: 'm-footer',
        type: 'footer',
        version: 1,
        variant: 'columns',
        dials: {},
        content: {
          links: [
            { label: 'Home', target: '/home' },
            { label: 'About', target: '/about' },
          ],
        },
      },
    ]

    const result = validateSite(site)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const [services, contact, footer] = result.value.pages[0].modules
      // Nested records preserve their field values intact.
      expect((services.content.items as any[])[0].title).toBe('Catering')
      expect((services.content.items as any[])[1].icon).toBe('truck')
      const contactFields = contact.content.fields as any[]
      expect(contactFields[0].name).toBe('email')
      // required (boolean) and maxLength (number) survive as real scalars.
      expect(contactFields[0].required).toBe(true)
      expect(contactFields[0].maxLength).toBe(120)
      expect((footer.content.links as any[])[1].label).toBe('About')
    }
  })

  // AC-496: Scalar content values include number and boolean (not coerced to text).
  it('test_UAT_AC496_number_and_boolean_scalar_content_preserved', () => {
    const site = minimalSite() as Record<string, any>
    site.pages[0].modules[0].content = {
      heading: 'Contact us',
      required: true, // boolean scalar (e.g. a form field's required flag)
      maxLength: 120, // number scalar (e.g. a field's max length)
    }

    const result = validateSite(site)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const content = result.value.pages[0].modules[0].content
      // Preserved as their own primitive types, not stringified.
      expect(content.required).toBe(true)
      expect(typeof content.required).toBe('boolean')
      expect(content.maxLength).toBe(120)
      expect(typeof content.maxLength).toBe('number')
    }
  })

  // AC-497: Widened content values preserve strict raw-prop rejection.
  // A raw style/css/html key on the module instance is still rejected; the
  // verdict fails and an error's path locates the offending instance property.
  it('test_UAT_AC497_widened_content_preserves_strict_raw_prop_rejection', () => {
    for (const rawKey of ['style', 'css', 'html']) {
      const site = minimalSite() as Record<string, any>
      // Widened content is fine; the raw prop rides alongside it on the instance.
      site.pages[0].modules[0].content = { heading: 'Welcome', enabled: true, count: 3 }
      site.pages[0].modules[0][rawKey] = 'color:red' // disallowed raw prop

      const result = validateSite(site)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        // The error locates the offending instance property: its path points at
        // the module instance carrying the raw key, and the message names the key.
        const offending = result.errors.find(
          (e) => e.path === '/pages/0/modules/0' && e.message.includes(rawKey),
        )
        expect(offending).toBeDefined()
        expect(offending!.path.startsWith('/')).toBe(true)
      }
    }
  })
})
