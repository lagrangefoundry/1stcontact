import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
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
 * so a literal and an overlay are interchangeable at the call site. Length
 * validation is exercised at the framework validation entry (validateModuleContent).
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
const HERO_CONTENT = { heading: { text: 'Heading' } }
const TEXTBLOCK_CONTENT = { body: 'Body copy.' }
const GRID_CONTENT = { heading: { text: 'Grid' }, items: [{ title: { text: 'A' }, body: 'y' }] }
const HEADER_CONTENT = { wordmark: { text: 'Brand' }, entries: [] }
const FORM_CONTENT = {
  action: 'https://example.com/submit',
  fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
}
const FOOTER_CONTENT = { copyrightHolder: 'Acme', links: [] }

// ── AC-660: a colour dial set to a #hex literal renders that exact colour ──────
describe('AC-660 — colour dial #hex literal renders verbatim', () => {
  it('test_UAT_AC660_colour_hex_literal_renders_exact', async () => {
    // services-grid card accent + checklist tick — absolute #hex, used as-is.
    const grid = await render(ServicesGrid, {
      variant: 'stacked',
      content: {
        items: [
          { title: { text: 'A' }, body: 'x', accent: '#90a1b9', checkColor: '#00bc7d', checklist: ['one'] },
        ],
      },
    })
    expect(grid).toContain('--fc-accent: #90a1b9')
    expect(grid).toContain('--fc-check: #00bc7d')

    // footer text + link colours — absolute #hex.
    const footer = await render(Footer, {
      dials: { textColor: '#5b6b7a', linkColor: '#90a1b9' },
      content: { ...FOOTER_CONTENT, links: [{ label: 'GitHub', target: '#' }] },
    })
    expect(footer).toContain('--fc-text: #5b6b7a')
    expect(footer).toContain('--fc-link: #90a1b9')

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
    // Card accent as a role → the palette custom property, not a literal.
    const grid = await render(ServicesGrid, {
      variant: 'stacked',
      content: { items: [{ title: { text: 'A' }, body: 'x', accent: 'secondary' }] },
    })
    expect(grid).toContain('--fc-accent: var(--color-secondary)')

    // Footer link colour as a role.
    const footer = await render(Footer, {
      dials: { linkColor: 'accent' },
      content: { ...FOOTER_CONTENT, links: [{ label: 'GitHub', target: '#' }] },
    })
    expect(footer).toContain('--fc-link: var(--color-accent)')

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
    // Every spacing-bearing dial across every module, mixing px / relative / content
    // forms — each applied to its CSS property without snapping to a named step.
    const cases: Array<[unknown, Record<string, unknown>, string]> = [
      [TextBlock, { dials: { spacingTop: '80px' }, content: TEXTBLOCK_CONTENT }, '--fc-pt: 80px'],
      [Hero, { dials: { spacingBottom: '120px' }, content: HERO_CONTENT }, '--fc-pb: 120px'],
      [ServicesGrid, { dials: { gap: '40px' }, content: GRID_CONTENT }, '--fc-gap: 40px'],
      [Header, { dials: { logoSize: '48px' }, content: HEADER_CONTENT }, '--fc-logo: 48px'],
      [Hero, { dials: { contentOffsetTop: '40px' }, content: HERO_CONTENT }, '--fc-offset-top: 40px'],
      [Hero, { dials: { contentInset: '24px' }, content: HERO_CONTENT }, '--fc-inset: 24px'],
      [TextBlock, { dials: { panelPad: '56px' }, content: TEXTBLOCK_CONTENT }, '--fc-panel-pad: 56px'],
      [TextBlock, { dials: { contentWidth: '880px' }, content: TEXTBLOCK_CONTENT }, '--fc-content-width: 880px'],
      // content form (fit-content) and relative form (%) both pass through verbatim.
      [TextBlock, { dials: { contentWidth: 'fit-content' }, content: TEXTBLOCK_CONTENT }, '--fc-content-width: fit-content'],
      [Hero, { dials: { contentWidth: '50%' }, content: HERO_CONTENT }, '--fc-content-width: 50%'],
      [ContactForm, { dials: { spacingTop: '48px' }, content: FORM_CONTENT }, '--fc-pt: 48px'],
      [Footer, { dials: { spacingTop: '32px' }, content: FOOTER_CONTENT }, '--fc-pt: 32px'],
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
      [TextBlock, { dials: { spacingTop: 'xl' }, content: TEXTBLOCK_CONTENT }, '--fc-pt: var(--space-24)'],
      [ServicesGrid, { dials: { gap: 'loose' }, content: GRID_CONTENT }, '--fc-gap: var(--space-8)'],
      [TextBlock, { dials: { panelPad: 'lg' }, content: TEXTBLOCK_CONTENT }, '--fc-panel-pad: var(--space-16)'],
      [TextBlock, { dials: { contentWidth: '4xl' }, content: TEXTBLOCK_CONTENT }, '--fc-content-width: var(--container-4xl)'],
      [Header, { dials: { logoSize: 'lg' }, content: HEADER_CONTENT }, '--fc-logo: var(--space-12)'],
      [Hero, { dials: { contentOffsetTop: 'md' }, content: HERO_CONTENT }, '--fc-offset-top: var(--space-32)'],
      [Hero, { dials: { contentInset: 'md' }, content: HERO_CONTENT }, '--fc-inset: var(--space-6)'],
      // Footer carries its own compressed spacing overlay (xl → --space-12).
      [Footer, { dials: { spacingTop: 'xl' }, content: FOOTER_CONTENT }, '--fc-pt: var(--space-12)'],
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
    // CTA corner: an absolute px passes through; a named shape → its radius token.
    const ctaPx = await render(TextBlock, { dials: { ctaShape: '12px' }, content: TEXTBLOCK_CONTENT })
    expect(ctaPx).toContain('--fc-cta-radius: 12px')
    const ctaShape = await render(TextBlock, { dials: { ctaShape: 'round' }, content: TEXTBLOCK_CONTENT })
    expect(ctaShape).toContain('--fc-cta-radius: var(--radius-md)')

    // Panel corner: an absolute px passes through; a named shape → its radius token.
    const panelPx = await render(TextBlock, { dials: { panelCorner: '8px' }, content: TEXTBLOCK_CONTENT })
    expect(panelPx).toContain('--fc-panel-radius: 8px')
    const panelShape = await render(TextBlock, { dials: { panelCorner: 'rounded' }, content: TEXTBLOCK_CONTENT })
    expect(panelShape).toContain('--fc-panel-radius: var(--radius-lg)')

    // The hero CTA shape shares the same overlay — a named shape resolves to token.
    const heroSquare = await render(Hero, { dials: { ctaShape: 'square' }, content: HERO_CONTENT })
    expect(heroSquare).toContain('--fc-cta-radius: 0')
  })
})
