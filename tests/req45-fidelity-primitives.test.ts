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
import {
  CONTENT_WIDTH_DIAL,
  LINE_HEIGHT_DIAL,
  SUBHEAD_SIZE_DIAL,
  TRACKING_DIAL,
} from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-45 — the last-mile fidelity primitives the gigabytealchemy
 * perceptual diff surfaced but the framework could not yet express. Each is a
 * generalization of an existing module (no new modules), token-backed, with the
 * default value preserving the prior behaviour so a site that omits the dial is
 * unchanged:
 *
 *   1. start-aligned constrained content column (`contentWidth` on text-block +
 *      services-grid) — a narrow measure pinned to the left gutter, collapsing
 *      the cumulative vertical drift that dominated the perceptual heat.
 *   2. tracking (`tracking`) on the hero heading + header wordmark.
 *   3. hero subhead line-height (`subheadLeading`).
 *   4. contact-form submit-label foreground (`submitForeground`).
 *   5. contact-form subhead / caption size (`subheadSize` / `captionSize` + a
 *      `caption` slot).
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

  it('test_UAT_FC_REQ-45_hero_meta_exposes_tracking_and_subhead_leading', () => {
    expect(heroMeta.dials.tracking).toEqual(TRACKING_DIAL)
    expect(heroMeta.dials.subheadLeading).toEqual(LINE_HEIGHT_DIAL)
  })

  it('test_UAT_FC_REQ-45_header_meta_exposes_tracking_dial', () => {
    expect(headerMeta.dials.tracking).toEqual(TRACKING_DIAL)
  })

  it('test_UAT_FC_REQ-45_contact_form_meta_exposes_foreground_and_size_dials', () => {
    // `auto` plus the palette roles (incl. `bg` for a white on-primary label).
    expect(contactFormMeta.dials.submitForeground).toContain('auto')
    expect(contactFormMeta.dials.submitForeground).toContain('bg')
    expect(contactFormMeta.dials.subheadSize).toEqual(SUBHEAD_SIZE_DIAL)
    expect(contactFormMeta.dials.captionSize).toEqual(SUBHEAD_SIZE_DIAL)
    // The caption slot is a content field, not a dial.
    expect(contactFormMeta.contentSchema.caption).toEqual({ type: 'markdown', required: false })
  })
})

describe('REQ-45 capability 1 — start-aligned constrained content column', () => {
  it('test_UAT_FC_REQ-45_text_block_emits_narrow_content_width_class', async () => {
    const html = await render(TextBlock, {
      variant: 'landing',
      dials: { contentWidth: 'narrow' },
      content: { heading: 'A Different Approach', body: 'Body copy.' },
    })
    expect(html).toContain('content-width-narrow')
  })

  it('test_UAT_FC_REQ-45_text_block_defaults_to_full_frame_content_width', async () => {
    const html = await render(TextBlock, {
      variant: 'landing',
      content: { body: 'Body copy.' },
    })
    // Default fallback: the frame-filling `default`, never the narrow cap.
    expect(html).toContain('content-width-default')
    expect(html).not.toContain('content-width-narrow')
  })

  it('test_UAT_FC_REQ-45_services_grid_emits_narrow_content_width_class', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: { contentWidth: 'narrow' },
      content: {
        subhead: 'Intro.',
        items: [
          { title: 'A', body: 'x' },
          { title: 'B', body: 'y' },
        ],
      },
    })
    expect(html).toContain('content-width-narrow')
  })

  it('test_UAT_FC_REQ-45_services_grid_defaults_to_full_frame_content_width', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      content: {
        items: [
          { title: 'A', body: 'x' },
          { title: 'B', body: 'y' },
        ],
      },
    })
    expect(html).toContain('content-width-default')
    expect(html).not.toContain('content-width-narrow')
  })
})

describe('REQ-45 capability 2 — tracking on hero heading + header wordmark', () => {
  it('test_UAT_FC_REQ-45_hero_heading_carries_tracking_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { tracking: 'tight' },
      content: { heading: 'Intentional Software', subhead: 'Body.' },
    })
    expect(html).toMatch(/hero__heading[^"]*tracking-tight/)
  })

  it('test_UAT_FC_REQ-45_hero_heading_defaults_to_untracked', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Body.' },
    })
    // Default marker present, tighter overrides absent (heading stays untracked).
    expect(html).toContain('tracking-normal')
    expect(html).not.toContain('tracking-tight')
  })

  it('test_UAT_FC_REQ-45_header_wordmark_carries_tracking_class', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: { tracking: 'tighter' },
      content: { logo: 'GigabyteAlchemy', entries: [] },
    })
    expect(html).toMatch(/header__wordmark--tracking-tighter/)
  })
})

describe('REQ-45 capability 3 — hero subhead line-height', () => {
  it('test_UAT_FC_REQ-45_hero_subhead_carries_leading_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadLeading: 'normal' },
      content: { heading: 'Acme', subhead: 'Body.' },
    })
    expect(html).toContain('subhead-leading-normal')
  })

  it('test_UAT_FC_REQ-45_hero_subhead_defaults_to_relaxed_leading', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Body.' },
    })
    expect(html).toContain('subhead-leading-relaxed')
    expect(html).not.toContain('subhead-leading-normal')
  })
})

describe('REQ-45 capability 4 — contact-form submit-label foreground', () => {
  it('test_UAT_FC_REQ-45_submit_label_paints_role_foreground', async () => {
    const html = await render(ContactForm, {
      variant: 'inline',
      dials: { submitTreatment: 'neutral', submitForeground: 'bg' },
      content: {
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: 'Send message',
      },
    })
    // A legible white on-primary label — the framework computes the role fill.
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
    const html = await render(ContactForm, {
      variant: 'inline',
      dials: { subheadSize: 'lg', captionSize: 'sm' },
      content: {
        subhead: 'Join our mailing list.',
        caption: 'More to come.',
        action: '/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
    })
    expect(html).toContain('subhead-size-lg')
    expect(html).toContain('caption-size-sm')
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
    // Default fallback: no caption node, and the prior `md` sizes.
    expect(html).not.toContain('contact-form__caption')
    expect(html).toContain('subhead-size-md')
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
