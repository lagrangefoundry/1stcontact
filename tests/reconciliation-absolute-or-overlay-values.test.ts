import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'

/**
 * Reconciliation UATs for story-c490f1cf — "Absolute-or-overlay values": every
 * colour, length, and radius dial accepts either an exact absolute value (for
 * reproducing a captured site) or a named overlay (palette role / spacing step /
 * corner shape, for the themeable design vocabulary).
 *
 * The observable boundary is the framework's module render: each dial routes
 * through a shared resolver (resolveColor / resolveStep / resolveContainerWidth)
 * into an inline `--fc-*` custom property (or a background/radius declaration),
 * so a literal and an overlay are interchangeable at the call site. The surviving
 * capability modules (carousel, contact-form) exercise the same shared seam.
 * Length validation is exercised at the framework validation entry
 * (validateModuleContent).
 *
 * One UAT per acceptance criterion:
 *   AC-660 colour dial `#hex` literal renders that exact colour
 *   AC-661 colour dial palette-role resolves to the themed palette colour
 *   AC-662 length dial absolute literal renders that exact length verbatim
 *   AC-663 length dial named step resolves to its overlay token (unchanged)
 *   AC-664 malformed length fails validation with a descriptive error
 *   AC-665 radius dial absolute px verbatim or named shape resolved to token
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

// ── Minimal valid content per module (render, not validation, is the concern). ──
const CAROUSEL_CONTENT = { heading: { text: 'Carousel' }, items: [{ body: 'A quote.' }] }
const FORM_CONTENT = {
  action: 'https://example.com/submit',
  fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
}

// ── AC-660: a colour dial set to a #hex literal renders that exact colour ──────
describe('AC-660 — colour dial #hex literal renders verbatim', () => {
  it('test_UAT_AC660_colour_hex_literal_renders_exact', async () => {
    // carousel slide accent + surface fill — absolute #hex, used as-is.
    const carousel = await render(Carousel, {
      content: {
        items: [{ body: 'x', accent: '#90a1b9', surfaceFill: '#00bc7d' }],
      },
    })
    expect(carousel).toContain('--fc-accent: #90a1b9')
    expect(carousel).toContain('background-color: #00bc7d')

    // contact-form submit-button fill — absolute #hex.
    const form = await render(ContactForm, {
      dials: { submitColor: '#009966' },
      content: FORM_CONTENT,
    })
    expect(form).toContain('background: #009966')
  })
})

// ── AC-661: the same colour dial set to a palette role → themed palette colour ──
describe('AC-661 — colour dial palette-role resolves to the theme colour', () => {
  it('test_UAT_AC661_colour_role_resolves_to_palette', async () => {
    // Slide accent as a role → the palette custom property, not a literal.
    const carousel = await render(Carousel, {
      content: { items: [{ body: 'x', accent: 'secondary' }] },
    })
    expect(carousel).toContain('--fc-accent: var(--color-secondary)')

    // Contact-form submit fill as a role.
    const form = await render(ContactForm, {
      dials: { submitColor: 'primary' },
      content: FORM_CONTENT,
    })
    expect(form).toContain('background: var(--color-primary)')
  })
})

// ── AC-662: a length dial set to an absolute literal renders it verbatim ───────
describe('AC-662 — absolute length dials render verbatim', () => {
  it('test_UAT_AC662_absolute_length_dials_render_verbatim', async () => {
    // Every spacing-bearing dial across the capability modules, mixing px / relative
    // / content forms — each applied to its CSS property without snapping to a step.
    const cases: Array<[unknown, Record<string, unknown>, string]> = [
      [Carousel, { dials: { spacingTop: '80px' }, content: CAROUSEL_CONTENT }, '--fc-pt: 80px'],
      [Carousel, { dials: { spacingBottom: '120px' }, content: CAROUSEL_CONTENT }, '--fc-pb: 120px'],
      [Carousel, { dials: { gap: '40px' }, content: CAROUSEL_CONTENT }, '--fc-gap: 40px'],
      [Carousel, { dials: { contentWidth: '880px' }, content: CAROUSEL_CONTENT }, '--fc-content-width: 880px'],
      // content form (fit-content) and relative form (%) both pass through verbatim.
      [Carousel, { dials: { contentWidth: 'fit-content' }, content: CAROUSEL_CONTENT }, '--fc-content-width: fit-content'],
      [Carousel, { dials: { contentWidth: '50%' }, content: CAROUSEL_CONTENT }, '--fc-content-width: 50%'],
      [ContactForm, { dials: { spacingTop: '48px' }, content: FORM_CONTENT }, '--fc-pt: 48px'],
      [ContactForm, { dials: { spacingBottom: '32px' }, content: FORM_CONTENT }, '--fc-pb: 32px'],
    ]
    for (const [Component, props, needle] of cases) {
      const html = await render(Component, props)
      expect(html, `expected rendered CSS to contain "${needle}"`).toContain(needle)
    }
  })
})

// ── AC-663: a named step resolves to its overlay token, unchanged from before ──
describe('AC-663 — named step resolves to its overlay token', () => {
  it('test_UAT_AC663_named_step_resolves_to_overlay_token', async () => {
    // Each named step maps to the same token it produced before the literal escape
    // hatch existed — the overlay path is byte-identical.
    const cases: Array<[unknown, Record<string, unknown>, string]> = [
      [Carousel, { dials: { spacingTop: 'xl' }, content: CAROUSEL_CONTENT }, '--fc-pt: var(--space-24)'],
      [Carousel, { dials: { gap: 'loose' }, content: CAROUSEL_CONTENT }, '--fc-gap: var(--space-8)'],
      [Carousel, { dials: { contentWidth: '4xl' }, content: CAROUSEL_CONTENT }, '--fc-content-width: var(--container-4xl)'],
      [ContactForm, { dials: { spacingTop: 'xl' }, content: FORM_CONTENT }, '--fc-pt: var(--space-24)'],
    ]
    for (const [Component, props, needle] of cases) {
      const html = await render(Component, props)
      expect(html, `expected rendered CSS to contain "${needle}"`).toContain(needle)
    }
  })
})

// ── AC-664: a malformed length fails validation with a descriptive error ───────
describe('AC-664 — malformed length fails site validation loudly', () => {
  const lengthMeta: ModuleMeta = {
    id: 'test-length',
    version: 1,
    variants: ['default'],
    dials: {},
    contentSchema: { width: { type: 'length', required: false } },
  }

  it('test_UAT_AC664_malformed_length_fails_validation', () => {
    // A typo'd unit is neither an absolute/relative/content length nor a token.
    const errors = validateModuleContent(lengthMeta, { width: '8ppx' })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('width')
    // The error names the field's expected forms and echoes the bad value.
    expect(errors[0].message).toContain('must be a length')
    expect(errors[0].message).toContain('fit-content')
    expect(errors[0].message).toContain('8ppx')

    // Well-formed lengths of every kind pass silently (the malformed value is the
    // only failure — the escape hatch does not weaken validation).
    expect(validateModuleContent(lengthMeta, { width: '80px' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: '50%' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: 'fit-content' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: 'lg' })).toEqual([])
  })
})

// ── AC-665: a radius dial accepts absolute px verbatim or a named shape token ──
describe('AC-665 — radius dial: absolute px verbatim or named shape token', () => {
  it('test_UAT_AC665_radius_absolute_or_named_shape', async () => {
    // Contact-form field radius (REQ-67) routes through the same resolveStep seam:
    // an absolute px passes through; a named shape → its radius token.
    const fieldPx = await render(ContactForm, { dials: { fieldRadius: '12px' }, content: FORM_CONTENT })
    expect(fieldPx).toContain('--fc-field-radius: 12px')
    const fieldMd = await render(ContactForm, { dials: { fieldRadius: 'md' }, content: FORM_CONTENT })
    expect(fieldMd).toContain('--fc-field-radius: var(--radius-md)')

    // Another named step resolves to its own token (the overlay path).
    const fieldLg = await render(ContactForm, { dials: { fieldRadius: 'lg' }, content: FORM_CONTENT })
    expect(fieldLg).toContain('--fc-field-radius: var(--radius-lg)')
    // `none` → the zero-radius token.
    const fieldNone = await render(ContactForm, { dials: { fieldRadius: 'none' }, content: FORM_CONTENT })
    expect(fieldNone).toContain('--fc-field-radius: var(--radius-none)')
  })
})
