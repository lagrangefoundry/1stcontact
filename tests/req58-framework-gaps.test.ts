import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { getModuleCss } from '../packages/framework/src/modules/styles'

/**
 * UATs for REQ-58 — framework capability gaps the gigabytealchemy re-import
 * forced (surfaced by the multi-viewport values-diff, T2). Post-pivot (REQ-84)
 * the surviving coverage is the `contact-form` gap set:
 *
 *   • `contact-form` placeholder-only fields — the reference form labels each
 *     field with an in-field placeholder, not a stacked <label>. A `fieldLabels`
 *     dial (`above` default | `placeholder`) moves the label into the placeholder
 *     and visually hides the <label> (kept for a11y).
 *   • submit colour/inline + field-styling escape hatches.
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

// ── gap-fix escape hatches: submit colour/inline ─────────────────────────────

describe('REQ-58 — submit colour + inline', () => {
  const formContent = { action: 'https://x.com/s', fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }] }

  it('test_UAT_FC_REQ-58_contactform_submit_colour_and_inline', async () => {
    // submitColor is an absolute-or-overlay button fill; submitInline lays the
    // single field + button on one row (the reference subscribe strip).
    const html = await render(ContactForm, {
      dials: { submitColor: '#009966', submitInline: 'inline' },
      content: formContent,
    })
    expect(html).toContain('background: #009966') // absolute button fill
    expect(html).toContain('submit-inline') // field + button on one row
  })

  it('test_UAT_FC_REQ-67_field_styling_dials_emit_override_vars', async () => {
    // The field border colour, control radius, and submit horizontal padding were
    // hard-wired to shared theme tokens; the dials emit inline --fc-* overrides.
    const html = await render(ContactForm, {
      dials: { fieldBorderColor: '#000000', fieldRadius: '8px', submitPaddingX: '32px' },
      content: formContent,
    })
    expect(html).toContain('--fc-field-border: #000000') // absolute border colour
    expect(html).toContain('--fc-field-radius: 8px') // absolute control radius
    expect(html).toContain('--fc-submit-px: 32px') // absolute submit padding
    // A named radius token resolves through the overlay (absolute-or-overlay).
    const token = await render(ContactForm, { dials: { fieldRadius: 'lg' }, content: formContent })
    expect(token).toContain('--fc-field-radius: var(--radius-lg)')
    // Omitted → no override var; the CSS keeps the theme-token fallback (unchanged).
    const bare = await render(ContactForm, { content: formContent })
    expect(bare).not.toContain('--fc-field-border')
    expect(bare).not.toContain('--fc-submit-px')
  })

  it('test_UAT_FC_REQ-64_contactform_submit_inline_stacks_on_mobile_rows_from_sm', async () => {
    // The reference subscribe form is `flex-col sm:flex-row`: STACKED on mobile
    // (field over a full-width button), field + button BESIDE each other from the
    // sm (640px) breakpoint up. submit-inline must model that responsively — a flat
    // `flex-direction: row` squishes the strip on mobile (the real repro defect).
    const html = await render(ContactForm, {
      dials: { submitInline: 'inline' },
      content: formContent,
    })
    expect(html).toContain('submit-inline')
    const css = getModuleCss()
    // The row layout is asserted only inside a min-width:640px block; the base
    // strip inherits the form's `flex-direction: column` (stacked) and gives the
    // button `align-self: stretch` so it fills the row on mobile.
    const inlineRow = css.match(/@media \(min-width: ?640px\)[^@]*submit-inline[^@]*flex-direction: ?row/)
    expect(inlineRow).not.toBeNull()
    // The base (mobile) rule must NOT force a row — no `submit-inline … flex-direction: row`
    // outside a media query.
    const base = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    expect(base).not.toMatch(/submit-inline[^}]*flex-direction: ?row/)
    // Mobile: the submit button stretches to full width (matches the reference's
    // full-width "Subscribe" on a narrow screen).
    expect(css).toMatch(/submit-inline[^@]*contact-form__submit[^}]*align-self: ?stretch/)
  })
})

// ── contact-form placeholder-only fields ─────────────────────────────────────

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
