import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { getModuleCss } from '../packages/framework/src/modules/styles'

/**
 * UATs for REQ-58 — two framework capability gaps the gigabytealchemy re-import
 * forced (surfaced by the multi-viewport values-diff, T2):
 *
 *   1. `text-block` left-accent rule — the reference runs a 4px palette-role bar
 *      down the inline-start edge of its manifesto text blocks. The capability
 *      existed only on services-grid cards; T3/A generalises it into a
 *      `text-block` `accent` dial (no new module) — see [[REQ-32]] guidance.
 *   2. `contact-form` placeholder-only fields — the reference form labels each
 *      field with an in-field placeholder, not a stacked <label>. T3/B adds a
 *      `fieldLabels` dial (`above` default | `placeholder`) that moves the label
 *      into the placeholder and visually hides the <label> (kept for a11y).
 *
 * Module-render UATs (DOC-7 §7): render the .astro to string and assert the
 * chrome the dial produces, plus a meta assertion pinning the dial surface.
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

// ── Gap 1: text-block left-accent rule ───────────────────────────────────────

describe('REQ-58 T3 — text-block left-accent rule', () => {
  it('test_UAT_FC_REQ-58_textblock_meta_exposes_accent_dial', () => {
    // The dial is a closed palette-role set with `none` as the default (off).
    expect(textBlockMeta.dials.accent).toContain('none')
    expect(textBlockMeta.dials.accent).toContain('primary')
    expect(textBlockMeta.dials.accent).toContain('accent')
  })

  it('test_UAT_FC_REQ-58_textblock_accent_none_paints_no_rule', async () => {
    // Default: no accent class variant beyond `accent-rule-none`, and the CSS
    // that paints a bar is gated on :not(.accent-rule-none) — so a plain block
    // carries no inline-start border.
    const html = await render(TextBlock, {
      variant: 'prose',
      content: { body: 'Plain manifesto copy.' },
    })
    expect(html).toContain('accent-rule-none')
    expect(html).not.toContain('accent-rule-primary')
  })

  it('test_UAT_FC_REQ-58_textblock_accent_primary_paints_rule', async () => {
    // A role value tags the section so the scoped CSS paints a left bar in that
    // palette role down the content column.
    const html = await render(TextBlock, {
      variant: 'prose',
      dials: { accent: 'primary' },
      content: { body: "These aren't just features." },
    })
    expect(html).toContain('accent-rule-primary')
    expect(html).not.toContain('accent-rule-none')
  })
})

// ── Gap 3: services-grid frosted card veil ───────────────────────────────────

describe('REQ-58 T6 — services-grid translucent card veil', () => {
  const gridContent = {
    heading: { text: 'Our Mission' },
    items: [{ title: { text: 'Presence' }, body: 'Inner space.' }],
  }

  it('test_UAT_FC_REQ-58_servicesgrid_meta_exposes_card_veil_dial', () => {
    expect(servicesGridMeta.dials.cardVeil).toContain('none')
    expect(servicesGridMeta.dials.cardVeil).toContain('50')
    expect(servicesGridMeta.dials.cardVeil).toContain('70')
  })

  it('test_UAT_FC_REQ-58_servicesgrid_veil_none_keeps_solid_surface', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: gridContent })
    expect(html).toContain('card-veil-none')
    expect(html).not.toContain('card-veil-50')
  })

  it('test_UAT_FC_REQ-58_servicesgrid_veil_paints_translucent_white', async () => {
    // The veil tags the grid so the scoped CSS paints rgba(255,255,255,.NN) on the
    // card — a translucent fill the browser composites over the band, not a solid.
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { cardVeil: '50' },
      content: gridContent,
    })
    expect(html).toContain('card-veil-50')
    // The scoped CSS (aggregated into the site's theme.css) maps the class to a
    // translucent white fill the browser composites over the band.
    const css = getModuleCss()
    expect(css).toMatch(/card-veil-50[^}]*rgba\(255, ?255, ?255, ?0\.5\)/)
    expect(css).toMatch(/card-veil-70[^}]*rgba\(255, ?255, ?255, ?0\.7\)/)
  })
})

// ── Gap 2: contact-form placeholder-only fields ──────────────────────────────

describe('REQ-58 T3 — contact-form placeholder-only field labels', () => {
  const baseContent = {
    action: 'https://example.com/submit',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Your email', type: 'email', required: true },
    ],
  }

  it('test_UAT_FC_REQ-58_contactform_meta_exposes_field_labels_dial', () => {
    expect(contactFormMeta.dials.fieldLabels).toContain('above')
    expect(contactFormMeta.dials.fieldLabels).toContain('placeholder')
  })

  it('test_UAT_FC_REQ-58_contactform_labels_above_by_default', async () => {
    // Default `above`: a visible <label>, and no placeholder attribute on the
    // input (the label sits stacked over the field).
    const html = await render(ContactForm, { content: baseContent })
    expect(html).toContain('Your name')
    expect(html).not.toContain('visually-hidden')
    expect(html).not.toContain('placeholder="Your name"')
  })

  it('test_UAT_FC_REQ-58_contactform_placeholder_mode_moves_label_into_field', async () => {
    // `placeholder`: the label text moves into the input's placeholder and the
    // <label> is visually hidden (still present for the accessibility tree).
    const html = await render(ContactForm, {
      dials: { fieldLabels: 'placeholder' },
      content: baseContent,
    })
    expect(html).toContain('placeholder="Your name"')
    expect(html).toContain('placeholder="Your email"')
    expect(html).toContain('visually-hidden')
    // The <label> element is retained (a11y) — the text is still in the DOM.
    expect(html).toContain('Your name')
  })
})
