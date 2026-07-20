import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { generateThemeCss } from '../packages/framework/src/tokens'
import { CONTENT_WIDTH_DIAL } from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-45 — the last-mile fidelity primitives the gigabytealchemy
 * perceptual diff surfaced, scoped to the modules that survive the REQ-84 strip.
 * The structural `contentWidth` capability remains a dial (exercised here via the
 * surviving `carousel`, which carries it); the contact-form submit-label colour
 * and subhead/caption size live on the text slots as styled runs
 * (`color`/`fontSizePx`), resolved to inline `style`:
 *
 *   1. constrained content column (`contentWidth` on carousel) — a capped measure
 *      collapsing the cumulative vertical drift that dominated the perceptual heat.
 *   4. contact-form submit-label foreground — the `submitLabel` run's `color`.
 *   5. contact-form subhead / caption size — the subhead/caption style run's
 *      `fontSizePx` (with a `caption` markdown slot).
 *
 * (Tracking / subhead line-height on the hero heading + header wordmark were
 * coupled to the deleted layout modules.)
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

describe('REQ-45 fidelity primitives — meta surfaces the dials', () => {
  it('test_UAT_FC_REQ-45_carousel_meta_exposes_content_width_dial', () => {
    expect(carouselMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
  })

  it('test_UAT_FC_REQ-45_contact_form_slots_carry_style_via_runs', () => {
    // REQ-50: `submitForeground`/`subheadSize`/`captionSize` dials are gone. The
    // submit label is a styled run (its `color` paints the label); the markdown
    // subhead/caption take their size from style-only style runs.
    expect(contactFormMeta.contentSchema.submitLabel).toEqual({ type: 'styled-text', required: false })
    expect(contactFormMeta.contentSchema.subheadStyle).toEqual({ type: 'styled-text', required: false })
    expect(contactFormMeta.contentSchema.captionStyle).toEqual({ type: 'styled-text', required: false })
    // The caption slot itself is a markdown content field.
    expect(contactFormMeta.contentSchema.caption).toEqual({ type: 'markdown', required: false })
  })
})

describe('REQ-45 capability 1 — constrained content column', () => {
  it('test_UAT_FC_REQ-45_carousel_emits_constrained_content_width', async () => {
    // REQ-55: a constrained column is `has-content-width` + an inline
    // `--fc-content-width` (a named-step token), not a per-name class.
    const html = await render(Carousel, {
      dials: { contentWidth: 'lg' },
      content: { heading: { text: 'A Different Approach' }, items: [{ title: { text: 'A' } }] },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('--fc-content-width: var(--container-lg)')
  })

  it('test_UAT_FC_REQ-45_carousel_defaults_to_full_frame_content_width', async () => {
    const html = await render(Carousel, {
      content: { items: [{ title: { text: 'A' } }] },
    })
    // Default fills the frame — no content-width marker or inline measure.
    expect(html).not.toContain('has-content-width')
    expect(html).not.toContain('--fc-content-width')
  })
})

describe('REQ-45 capability 4 — contact-form submit-label foreground', () => {
  it('test_UAT_FC_REQ-45_submit_label_paints_role_foreground', async () => {
    // REQ-50: the label colour is the `submitLabel` run's `color` (a `bg` role →
    // `var(--color-bg)`), painted as an inline `style` on the submit button.
    const html = await render(ContactForm, {
      variant: 'inline',
      dials: { submitTreatment: 'neutral' },
      content: {
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: { label: 'Send message', color: 'bg' },
      },
    })
    // A legible white on-primary label — the run's role colour resolves to a var.
    expect(html).toMatch(/contact-form__submit[^>]*style="[^"]*color: var\(--color-bg\)/)
  })

  it('test_UAT_FC_REQ-45_submit_label_defaults_to_treatment_colour', async () => {
    const html = await render(ContactForm, {
      variant: 'inline',
      content: {
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
    })
    // Default fallback: no inline colour override, the treatment CSS drives it.
    expect(html).not.toContain('color: var(--color-bg)')
  })
})

describe('REQ-45 capability 5 — contact-form subhead / caption size', () => {
  it('test_UAT_FC_REQ-45_contact_form_sizes_subhead_and_renders_caption', async () => {
    // REQ-50: the markdown subhead/caption take their size from style-only
    // `subheadStyle`/`captionStyle` runs (`fontSizePx` aliases → font-size vars),
    // applied as inline `style` on the prose containers.
    const html = await render(ContactForm, {
      variant: 'inline',
      content: {
        subhead: 'Join our mailing list.',
        subheadStyle: { fontSizePx: 'lg' },
        caption: 'More to come.',
        captionStyle: { fontSizePx: 'sm' },
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
    })
    expect(html).toMatch(
      /contact-form__subhead[^>]*style="[^"]*font-size: var\(--font-size-lg\)/,
    )
    expect(html).toMatch(
      /contact-form__caption[^>]*style="[^"]*font-size: var\(--font-size-sm\)/,
    )
    // The caption slot renders its markdown.
    expect(html).toContain('contact-form__caption')
    expect(html).toContain('More to come.')
  })

  it('test_UAT_FC_REQ-45_contact_form_omits_caption_when_absent', async () => {
    const html = await render(ContactForm, {
      variant: 'inline',
      content: {
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
    })
    // Default fallback: no caption node at all.
    expect(html).not.toContain('contact-form__caption')
  })
})

describe('REQ-45 token surface — tracking custom properties', () => {
  it('test_UAT_FC_REQ-45_theme_emits_tracking_custom_properties', () => {
    const css = generateThemeCss()
    expect(css).toContain('--tracking-normal: 0em;')
    expect(css).toContain('--tracking-tight: -0.025em;')
    expect(css).toContain('--tracking-tighter: -0.05em;')
  })
})
