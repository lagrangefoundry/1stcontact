import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { SPACING_STEPS } from '../packages/framework/src/modules/dials'
import { overrideChain } from '../packages/framework/src/modules/breakpoints'
import { validateSite } from '../packages/site-schema/src/index'

/**
 * Reconciliation UATs for story-3569e1a4 — Responsive dials: length parameters
 * vary per breakpoint (the absolute-or-overlay seam now spans the breakpoint
 * dimension).
 *
 * Boundary: the published-page observables of the surviving capability modules
 * (the inline `--fc-*` custom properties and scoped media-query chains a module
 * emits when rendered) and the site-definition load boundary (`validateSite`).
 * These verify the per-breakpoint value model (base + `sm`/`md`/`lg`/`xl`
 * overrides, "override and up") against the shared responsive primitive.
 */

const MODULE_SRC = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url)), 'utf8')

const FORM_CONTENT = {
  action: 'https://example.com/submit',
  fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
}
const CAROUSEL_CONTENT = { items: [{ body: 'A quote.' }] }

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

// ── a complete, valid site definition, mutated per validation case (AC-673) ──

/** A complete theme with every required token slot present. */
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
    container: { bleed: '100%' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  }
}

/** Smallest valid site whose single module carries a `spacingTop` dial value. */
function siteWithDial(spacingTop: unknown) {
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
            type: 'carousel',
            version: 1,
            variant: 'default',
            dials: { spacingTop },
            content: { items: [{ body: 'A quote.' }] },
          },
        ],
      },
    ],
  }
}

// ── AC-666 — per-breakpoint override-and-up across viewport widths ───────────

describe('story-3569e1a4 — per-breakpoint length dials', () => {
  it('test_UAT_AC666_per_breakpoint_dial_applies_override_and_up', async () => {
    // A spacing dial `{ base: A, md: B, xl: C }` emits the base plus exactly the
    // defined overrides — sm/lg carry no var, so a viewport between two overrides
    // falls to the nearest defined one at or below it (override-and-up).
    const html = await render(Carousel, {
      dials: { spacingTop: { base: 24, md: 48, xl: 64 } },
      content: CAROUSEL_CONTENT,
    })
    expect(html).toContain('--fc-pt: 24px') // <768px → base (A)
    expect(html).toContain('--fc-pt-md: 48px') // ≥768px, e.g. 800px → md (B)
    expect(html).toContain('--fc-pt-xl: 64px') // ≥1280px, e.g. 1300px → xl (C)
    // No override at the breakpoints that were not supplied — so 1300px reads xl,
    // and a width in (md, xl) reads md (not some invented lg step).
    expect(html).not.toContain('--fc-pt-sm')
    expect(html).not.toContain('--fc-pt-lg')
    // The scoped CSS re-points padding-top through the shared override-and-up chain
    // (xl falls back md→sm→base), wiring the cascade the vars above feed.
    expect(MODULE_SRC('carousel/index.astro')).toContain(`padding-top: ${overrideChain('pt', 3)}`)
  })

  // ── AC-667 — a scalar dial is constant across all widths ───────────────────
  it('test_UAT_AC667_scalar_length_dial_constant_across_widths', async () => {
    // A single scalar value (named step) emits ONLY the base var — no per-breakpoint
    // override vars — so the resolved length is identical at 500 / 800 / 1300px.
    const html = await render(Carousel, {
      dials: { spacingTop: 'lg' },
      content: CAROUSEL_CONTENT,
    })
    expect(html).toContain(`--fc-pt: ${SPACING_STEPS.lg}`)
    for (const bp of ['sm', 'md', 'lg', 'xl']) {
      expect(html).not.toContain(`--fc-pt-${bp}`)
    }
  })

  // ── AC-668 — per-breakpoint form honoured across the full enumerated set ───
  it('test_UAT_AC668_per_breakpoint_form_honoured_across_all_length_dials', async () => {
    // Each enumerated length dial, on its owning capability module, honours the
    // per-breakpoint object: the override var lands at the specified breakpoint
    // while the base holds.
    const cases: { Component: unknown; dials: Record<string, unknown>; content: unknown; base: string; override: string }[] = [
      // spacing top / bottom + inter-slide gap — carousel
      { Component: Carousel, dials: { spacingTop: { base: 24, md: 64 } }, content: CAROUSEL_CONTENT, base: '--fc-pt: 24px', override: '--fc-pt-md: 64px' },
      { Component: Carousel, dials: { spacingBottom: { base: 24, lg: 64 } }, content: CAROUSEL_CONTENT, base: '--fc-pb: 24px', override: '--fc-pb-lg: 64px' },
      { Component: Carousel, dials: { gap: { base: 16, lg: 40 } }, content: CAROUSEL_CONTENT, base: '--fc-gap: 16px', override: '--fc-gap-lg: 40px' },
      // spacing top / bottom — contact-form
      { Component: ContactForm, dials: { spacingTop: { base: 32, md: 64 } }, content: FORM_CONTENT, base: '--fc-pt: 32px', override: '--fc-pt-md: 64px' },
      { Component: ContactForm, dials: { spacingBottom: { base: 16, xl: 48 } }, content: FORM_CONTENT, base: '--fc-pb: 16px', override: '--fc-pb-xl: 48px' },
    ]
    for (const { Component, dials, content, base, override } of cases) {
      const html = await render(Component, { dials, content })
      expect(html, `base var ${base}`).toContain(base)
      expect(html, `override var ${override}`).toContain(override)
    }
  })

  // ── AC-670 — each entry is an absolute literal OR a named overlay ──────────
  it('test_UAT_AC670_each_entry_accepts_literal_or_named_overlay', async () => {
    // `{ base: 24, md: "lg" }` — base is an absolute px literal, the md override a
    // named step resolving through the same overlay seam as a scalar dial.
    const html = await render(Carousel, {
      dials: { spacingTop: { base: 24, md: 'lg' } },
      content: CAROUSEL_CONTENT,
    })
    expect(html).toContain('--fc-pt: 24px') // literal px below md
    expect(html).toContain(`--fc-pt-md: ${SPACING_STEPS.lg}`) // named step at/above md
  })

  // ── AC-669 — per-breakpoint content-width cap varies and can drop the cap ──
  it('test_UAT_AC669_per_breakpoint_content_width_cap', async () => {
    // A per-breakpoint cap: base cap + a wider cap at lg.
    const capped = await render(Carousel, {
      dials: { contentWidth: { base: '4xl', lg: 896 } },
      content: CAROUSEL_CONTENT,
    })
    expect(capped).toContain('has-content-width')
    expect(capped).toContain('--fc-content-width: var(--container-4xl)')
    expect(capped).toContain('--fc-content-width-lg: 896px')

    // A `bleed` override drops the cap at that width: no `-lg` var → the container
    // is uncapped at ≥1024px, falling through the chain to the base cap below it.
    const bleedAtLg = await render(Carousel, {
      dials: { contentWidth: { base: '4xl', lg: 'bleed' } },
      content: CAROUSEL_CONTENT,
    })
    expect(bleedAtLg).toContain('--fc-content-width: var(--container-4xl)')
    expect(bleedAtLg).not.toContain('--fc-content-width-lg')

    // A per-breakpoint cap requires a base cap: a `bleed` base means no cap at any
    // width. Every max-width rule (base + each breakpoint) is gated on the
    // `has-content-width` class, and a bleed base leaves it off — so no cap is
    // applied at any width regardless of the override (which is left inert).
    const noBaseCap = await render(Carousel, {
      dials: { contentWidth: { base: 'bleed', md: 896 } },
      content: CAROUSEL_CONTENT,
    })
    expect(noBaseCap).not.toContain('has-content-width')
  })
})

// ── AC-673 — site definition rejects a malformed per-breakpoint dial object ──

describe('story-3569e1a4 — per-breakpoint dial validation at load', () => {
  it('test_UAT_AC673_rejects_malformed_per_breakpoint_dial_object', () => {
    // Missing `base` → rejected (a per-breakpoint object must carry a base).
    expect(validateSite(siteWithDial({ sm: 12 })).ok).toBe(false)
    // Stray key → rejected, not silently dropped (schema is strict).
    expect(validateSite(siteWithDial({ base: 12, xxl: 40 })).ok).toBe(false)
    // A well-formed `{ base, md }` object → accepted.
    expect(validateSite(siteWithDial({ base: 12, md: 24 })).ok).toBe(true)
  })
})
