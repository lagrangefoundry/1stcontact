import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { getModuleCss } from '../packages/framework/src/modules/styles'

/**
 * Reconciliation UATs for story-46e3b3c7 — reproduction treatments on the
 * surviving contact-form module (placeholder field labels, inline submit layout,
 * absolute-or-overlay submit colour). The services-grid card veil/border and
 * footer override cases were dropped with those modules in the framework pivot
 * (REQ-84); the treatments they covered (card chrome, footer copyright) are now
 * owned by the L1 substrate, not a capability module.
 *
 * These assert the OBSERVABLE RENDERED behaviour the ACs specify. Modules are
 * drawn through Astro's container API — the same SSR path the site generator
 * uses. The container drops each module's scoped `<style>`, so CSS assertions
 * read the aggregated module CSS via `getModuleCss()` while markup assertions
 * read the rendered HTML string.
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

// ── contact-form ─────────────────────────────────────────────────────────────

describe('story-46e3b3c7 — contact-form treatments', () => {
  const twoFields = {
    action: 'https://example.com/submit',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Your email', type: 'email', required: true },
    ],
  }
  const oneField = {
    action: 'https://example.com/subscribe',
    fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
  }

  it('test_UAT_AC676_field_labels_placeholder_moves_label_into_placeholder_and_hides_label', async () => {
    // placeholder mode: label text becomes the field placeholder and the <label>
    // stays in the DOM (a11y) but is visually hidden.
    const placeholder = await render(ContactForm, {
      dials: { fieldLabels: 'placeholder' },
      content: twoFields,
    })
    expect(placeholder).toContain('placeholder="Your name"')
    expect(placeholder).toContain('placeholder="Your email"')
    expect(placeholder).toContain('visually-hidden') // label hidden but present
    expect(placeholder).toMatch(/<label[^>]*>Your name<\/label>/) // label element kept

    // Default / above: a visible stacked <label>, and no placeholder injected.
    const above = await render(ContactForm, { content: twoFields })
    expect(above).toMatch(/<label[^>]*>Your name<\/label>/)
    expect(above).not.toContain('visually-hidden')
    expect(above).not.toContain('placeholder="Your name"')
  })

  it('test_UAT_AC677_submit_inline_lays_field_and_button_on_one_row', async () => {
    // Inline: the form carries the submit-inline treatment class; the scoped CSS
    // lays that form as a single row (field grows, button beside it).
    const inline = await render(ContactForm, {
      dials: { submitInline: 'inline' },
      content: oneField,
    })
    expect(inline).toContain('submit-inline')
    expect(getModuleCss()).toMatch(/\.contact-form__form\.submit-inline\s*\{[^}]*flex-direction:\s*row/)

    // Default / unset: the button stacks below the fields — no inline class.
    const stacked = await render(ContactForm, { content: oneField })
    expect(stacked).not.toContain('submit-inline')
  })

  it('test_UAT_AC678_submit_color_paints_button_fill_with_literal_or_role', async () => {
    // Absolute #hex: painted verbatim as the button background fill.
    const hex = await render(ContactForm, {
      dials: { submitColor: '#009966' },
      content: oneField,
    })
    expect(hex).toContain('background: #009966')

    // Palette role: resolved to the role's CSS var as the button background.
    const role = await render(ContactForm, {
      dials: { submitColor: 'primary' },
      content: oneField,
    })
    expect(role).toContain('background: var(--color-primary)')

    // Omitted: no background override — the button keeps its default treatment fill.
    const dflt = await render(ContactForm, { content: oneField })
    expect(dflt).not.toContain('background:')
    expect(dflt).toContain('submit-primary') // default fill treatment retained
  })
})
