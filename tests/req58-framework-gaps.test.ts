import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { getModuleCss } from '../packages/framework/src/modules/styles'

/**
 * UATs for REQ-58 — framework capability gaps the gigabytealchemy re-import
 * forced (surfaced by the multi-viewport values-diff, T2):
 *
 *   • `contact-form` placeholder-only fields — the reference form labels each
 *     field with an in-field placeholder, not a stacked <label>. A `fieldLabels`
 *     dial (`above` default | `placeholder`) moves the label into the placeholder
 *     and visually hides the <label> (kept for a11y).
 *   • `services-grid` translucent card veil — frosted cards are `bg-white/NN` over
 *     the band; a `cardVeil` opacity dial composites over it.
 *
 * (The manifesto left-bar callout is NOT a text-block dial — it is authored with
 * the existing `> [!role] …` markdown callout syntax, which renders a blockquote
 * `fc-callout--role`; the earlier `accent` dial was redundant and removed.)
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

// ── services-grid frosted card veil ──────────────────────────────────────────

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

  it('test_UAT_FC_REQ-58_servicesgrid_accent_and_check_take_absolute_colour', async () => {
    // The absolute-or-overlay principle: a card accent + checklist tick accept a
    // #hex absolute value (for reproduction) as readily as a palette role. The
    // literal flows through resolveColor unchanged into the per-card CSS vars.
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      content: {
        items: [
          { title: { text: 'A' }, body: 'x', accent: '#90a1b9', checkColor: '#00bc7d', checklist: ['one'] },
          { title: { text: 'B' }, body: 'y', accent: 'secondary' },
        ],
      },
    })
    expect(html).toContain('--fc-accent: #90a1b9') // absolute value, as-is
    expect(html).toContain('--fc-check: #00bc7d') // absolute tick colour
    expect(html).toContain('--fc-accent: var(--color-secondary)') // role → overlay
  })

  it('test_UAT_FC_REQ-58_servicesgrid_card_border_none_drops_hairline_keeps_accent', async () => {
    // `cardBorder: none` tags the grid; the scoped CSS zeroes the base border
    // width but re-asserts the accent bar's left width, so a frosted card loses
    // its hairline while a has-accent card keeps only its 4px left bar.
    expect(servicesGridMeta.dials.cardBorder).toEqual(['default', 'none'])
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: { cardBorder: 'none' },
      content: gridContent,
    })
    expect(html).toContain('card-border-none')
    const css = getModuleCss()
    expect(css).toMatch(/card-border-none[^}]*border-width: ?0/)
    expect(css).toMatch(/card-border-none[^}]*has-accent[^}]*border-left-width/)
  })

  it('test_UAT_FC_REQ-69_card_raw_fill_gradient_and_badge_fill', async () => {
    // Cards were limited to a 3-value `surface` enum and badges to variant tokens;
    // a card can now author a raw fill or gradient, and a badge a raw fill.
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      content: {
        items: [
          { title: { text: 'A' }, body: 'x', surfaceFill: '#e8dfd3', badge: { label: 'Coming soon', variant: 'secondary', fill: '#dbeafe' } },
          { title: { text: 'B' }, body: 'y', surfaceGradient: { angleDeg: 135, stops: [{ color: '#e8dfd3', position: 0 }, { color: '#d9ccba', position: 100 }] } },
        ],
      },
    })
    expect(html).toContain('background-color: #e8dfd3') // raw card fill (solid, under any gradient)
    expect(html).toContain('background: #dbeafe') // raw badge fill (over the variant)
    expect(html).toMatch(/background-image:\s*linear-gradient\([^"]*#e8dfd3/i) // gradient panel over the solid
    // A card with a role still resolves through the overlay.
    const role = await render(ServicesGrid, {
      variant: 'stacked',
      content: { items: [{ title: { text: 'C' }, body: 'z', surfaceFill: 'secondary' }] },
    })
    expect(role).toContain('background-color: var(--color-secondary)')
  })
})

// ── gap-fix escape hatches: submit colour/inline, footer copyright/link colour ──

describe('REQ-58 — submit colour + inline, footer copyright + link colour', () => {
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

  it('test_UAT_FC_REQ-58_footer_copyright_verbatim_and_link_colour', async () => {
    // A verbatim copyright (absolute value) overrides the generated line; linkColor
    // is an absolute #hex OR role routed through resolveColor to --fc-link.
    const html = await render(Footer, {
      dials: { textColor: '#90a1b9', linkColor: '#90a1b9' },
      content: {
        copyrightHolder: 'Gigabyte Alchemy',
        copyright: '© Gigabyte Alchemy 2025',
        links: [{ label: 'GitHub', target: '#' }],
      },
    })
    expect(html).toContain('© Gigabyte Alchemy 2025')
    expect(html).not.toMatch(/©\s*20\d\d\s+Gigabyte/) // not the generated year-first form
    // textColor paints the whole footer (copyright); linkColor paints the links.
    expect(html).toContain('--fc-text: #90a1b9')
    expect(html).toContain('--fc-link: #90a1b9')
  })

  it('test_UAT_FC_REQ-68_footer_copyright_opacity_dial', async () => {
    // The copyright is muted to opacity 0.7 by default; the dial overrides it (a site
    // whose copyright colour already carries the mute wants full opacity).
    const html = await render(Footer, {
      dials: { copyrightOpacity: '1' },
      content: { copyrightHolder: 'Gigabyte Alchemy', links: [{ label: 'GitHub', target: '#' }] },
    })
    expect(html).toContain('--fc-copyright-opacity: 1')
    // Omitted → no var; the CSS keeps the 0.7 fallback (unchanged).
    const bare = await render(Footer, {
      content: { copyrightHolder: 'X', links: [{ label: 'G', target: '#' }] },
    })
    expect(bare).not.toContain('--fc-copyright-opacity')
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
