import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { generateThemeCss } from '../packages/framework/src/tokens'
import { CONTENT_WIDTH_DIAL } from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-45 — the last-mile fidelity primitives the gigabytealchemy
 * perceptual diff surfaced but the framework could not yet express. Post-REQ-50,
 * the intrinsic-typography axes (tracking, leading, subhead/caption size, submit
 * foreground) are no longer dials: they live on the text slots as styled runs
 * (`letterSpacingPx`/`lineHeightPx`/`fontSizePx`/`color`), resolved to an inline
 * `style`. Only the structural `contentWidth` capability remains a dial:
 *
 *   1. start-aligned constrained content column (`contentWidth` on text-block +
 *      services-grid) — a narrow measure pinned to the left gutter, collapsing
 *      the cumulative vertical drift that dominated the perceptual heat.
 *   2. tracking — now `run.letterSpacingPx` on the hero heading + header wordmark.
 *   3. hero subhead line-height — now the subhead run's `lineHeightPx`.
 *   4. contact-form submit-label foreground — now the `submitLabel` run's `color`.
 *   5. contact-form subhead / caption size — now the subhead/caption style run's
 *      `fontSizePx` (with a `caption` markdown slot).
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
  it('test_UAT_FC_REQ-45_text_block_meta_exposes_content_width_dial', () => {
    expect(textBlockMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
  })

  it('test_UAT_FC_REQ-45_services_grid_meta_exposes_content_width_dial', () => {
    expect(servicesGridMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
  })

  it('test_UAT_FC_REQ-45_hero_heading_and_subhead_are_styled_runs', () => {
    // REQ-50: the former `tracking` + `subheadLeading` dials are gone; their
    // axes are `letterSpacingPx` / `lineHeightPx` on the heading / subhead runs.
    expect(heroMeta.contentSchema.heading).toEqual({ type: 'styled-text', required: true })
    expect(heroMeta.contentSchema.subhead).toEqual({ type: 'styled-text', required: false })
  })

  it('test_UAT_FC_REQ-45_header_wordmark_is_a_styled_run', () => {
    // REQ-50: the former header `tracking` dial is gone; the wordmark's tracking
    // is `letterSpacingPx` on its styled run.
    expect(headerMeta.contentSchema.wordmark).toEqual({ type: 'styled-text', required: false })
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

describe('REQ-45 capability 1 — start-aligned constrained content column', () => {
  it('test_UAT_FC_REQ-45_text_block_emits_constrained_content_width', async () => {
    // REQ-55: a constrained column is `has-content-width` + an inline
    // `--fc-content-width` (a named-step token), not a per-name class.
    const html = await render(TextBlock, {
      variant: 'landing',
      dials: { contentWidth: 'lg' },
      content: { heading: { text: 'A Different Approach' }, body: 'Body copy.' },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('--fc-content-width: var(--container-lg)')
  })

  it('test_UAT_FC_REQ-45_text_block_defaults_to_full_frame_content_width', async () => {
    const html = await render(TextBlock, {
      variant: 'landing',
      content: { body: 'Body copy.' },
    })
    // Default fills the frame — no content-width marker or inline measure.
    expect(html).not.toContain('has-content-width')
    expect(html).not.toContain('--fc-content-width')
  })

  it('test_UAT_FC_REQ-45_services_grid_emits_constrained_content_width', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: { contentWidth: 'lg' },
      content: {
        subhead: 'Intro.',
        items: [
          { title: { text: 'A' }, body: 'x' },
          { title: { text: 'B' }, body: 'y' },
        ],
      },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('--fc-content-width: var(--container-lg)')
  })

  it('test_UAT_FC_REQ-45_services_grid_defaults_to_full_frame_content_width', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      content: {
        items: [
          { title: { text: 'A' }, body: 'x' },
          { title: { text: 'B' }, body: 'y' },
        ],
      },
    })
    expect(html).not.toContain('has-content-width')
    expect(html).not.toContain('--fc-content-width')
  })
})

describe('REQ-45 capability 2 — tracking on hero heading + header wordmark', () => {
  it('test_UAT_FC_REQ-45_hero_heading_carries_tracking_style', async () => {
    // REQ-50: tracking is the heading run's `letterSpacingPx` (a `tight` alias →
    // the tracking token), emitted as an inline `style` on the h1.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: {
        heading: { text: 'Intentional Software', letterSpacingPx: 'tight' },
        subhead: { text: 'Body.' },
      },
    })
    expect(html).toMatch(
      /hero__heading[^>]*style="[^"]*letter-spacing: var\(--tracking-tight\)/,
    )
  })

  it('test_UAT_FC_REQ-45_hero_heading_defaults_to_untracked', async () => {
    // A heading run that omits `letterSpacingPx` emits no letter-spacing at all.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body.' } },
    })
    expect(html).not.toContain('letter-spacing')
  })

  it('test_UAT_FC_REQ-45_header_wordmark_carries_tracking_style', async () => {
    // REQ-50: the wordmark's tracking is `letterSpacingPx` on its styled run.
    const html = await render(Header, {
      variant: 'top-nav',
      content: { wordmark: { text: 'GigabyteAlchemy', letterSpacingPx: 'tighter' }, entries: [] },
    })
    expect(html).toMatch(
      /header__wordmark[^>]*style="[^"]*letter-spacing: var\(--tracking-tighter\)/,
    )
  })
})

describe('REQ-45 capability 3 — hero subhead line-height', () => {
  it('test_UAT_FC_REQ-45_hero_subhead_carries_leading_style', async () => {
    // REQ-50: leading is the subhead run's `lineHeightPx` (a `normal` alias →
    // the line-height token), emitted as an inline `style` on the subhead.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body.', lineHeightPx: 'normal' } },
    })
    expect(html).toMatch(
      /hero__subhead[^>]*style="[^"]*line-height: var\(--line-height-normal\)/,
    )
  })

  it('test_UAT_FC_REQ-45_hero_subhead_defaults_to_no_leading_override', async () => {
    // A subhead run that omits `lineHeightPx` inherits the base leading — no
    // inline line-height is emitted.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body.' } },
    })
    expect(html).not.toContain('line-height')
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
