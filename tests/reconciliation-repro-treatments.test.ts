import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { BUILD_YEAR } from '../packages/framework/src/buildInfo'

/**
 * Reconciliation UATs for story-46e3b3c7 — reproduction treatments across three
 * existing modules (services-grid card veil/border, contact-form placeholder /
 * inline / submit colour, footer copyright / text & link colour overrides).
 *
 * These assert the OBSERVABLE RENDERED behaviour the ACs specify, not the module
 * `meta` schema. The story explicitly flags that `submitInline`/`submitColor`
 * (contact-form) and the footer `copyright`/`textColor`/`linkColor` overrides are
 * consumed by the render code but not yet declared in `meta` — so the tests below
 * exercise the render output (the intent), which is what the ACs describe.
 *
 * Modules are drawn through Astro's container API — the same SSR path the site
 * generator uses. The container drops each module's scoped `<style>`, so CSS
 * assertions read the aggregated module CSS via `getModuleCss()` while markup
 * assertions read the rendered HTML string.
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

// ── services-grid ────────────────────────────────────────────────────────────

describe('story-46e3b3c7 — services-grid card treatments', () => {
  const gridContent = {
    heading: { text: 'Our Mission' },
    items: [{ title: { text: 'Presence' }, body: 'Inner space.' }],
  }

  it('test_UAT_AC674_card_veil_paints_translucent_white_none_keeps_solid_surface', async () => {
    const css = getModuleCss()
    // Every declared opacity step composites a translucent white fill at that
    // opacity over the section band (e.g. cardVeil 60 → rgba(255,255,255,0.6)).
    for (const [step, alpha] of [
      ['40', '0.4'], ['50', '0.5'], ['60', '0.6'],
      ['70', '0.7'], ['80', '0.8'], ['90', '0.9'],
    ] as const) {
      const html = await render(ServicesGrid, {
        variant: 'three-col',
        // A non-default section surface, so the veil is visibly distinct from it.
        dials: { surface: 'subtle', cardVeil: step },
        content: gridContent,
      })
      expect(html).toContain(`card-veil-${step}`)
      expect(css).toMatch(
        new RegExp(`card-veil-${step}[^}]*rgba\\(255, ?255, ?255, ?${alpha.replace('.', '\\.')}\\)`),
      )
    }
    // Default / omitted: the card keeps the solid surface fill — no veil class,
    // no translucent white overlay. The base card rule paints var(--color-surface).
    const plain = await render(ServicesGrid, { variant: 'three-col', content: gridContent })
    expect(plain).toContain('card-veil-none')
    expect(plain).not.toContain('card-veil-60')
    expect(css).toMatch(/\.services-grid__card\s*\{[^}]*background:\s*var\(--color-surface\)/)
  })

  it('test_UAT_AC675_card_border_none_drops_hairline_but_accented_card_keeps_left_bar', async () => {
    const css = getModuleCss()
    // cardBorder: none, with a plain card and an accented card in the same grid.
    const html = await render(ServicesGrid, {
      variant: 'two-col',
      dials: { cardBorder: 'none' },
      content: {
        items: [
          { title: { text: 'Plain' }, body: 'no accent' },
          { title: { text: 'Accented' }, body: 'has accent', accent: 'accent' },
        ],
      },
    })
    expect(html).toContain('card-border-none')
    expect(html).toContain('has-accent') // the accented card still carries its accent
    // The scoped CSS zeroes the base 1px hairline under card-border-none …
    expect(css).toMatch(/card-border-none\s+\.services-grid__card\s*\{[^}]*border-width:\s*0/)
    // … but re-asserts the accent card's left bar (a thicker left-edge border).
    expect(css).toMatch(/card-border-none\s+\.services-grid__card\.has-accent\s*\{[^}]*border-left-width/)

    // Default / unset: cards render the standard 1px hairline on all edges.
    const dflt = await render(ServicesGrid, { variant: 'two-col', content: gridContent })
    expect(dflt).toContain('card-border-default')
    expect(dflt).not.toContain('card-border-none')
    expect(css).toMatch(/\.services-grid__card\s*\{[^}]*border:\s*1px solid var\(--color-border\)/)
  })
})

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
      dials: { submitInline: 'true' },
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

// ── footer ───────────────────────────────────────────────────────────────────

describe('story-46e3b3c7 — footer overrides', () => {
  const baseFooter = {
    copyrightHolder: 'Acme Collective',
    links: [{ label: 'GitHub', target: '#' }],
  }

  it('test_UAT_AC679_copyright_override_renders_verbatim_line_else_generated_default', async () => {
    // Verbatim override: the copyright line is exactly the provided string.
    const override = await render(Footer, {
      content: { ...baseFooter, copyright: '© Acme Collective 2025' },
    })
    expect(override).toContain('© Acme Collective 2025')
    expect(override).not.toMatch(/©\s*20\d\d\s+Acme Collective/) // not the generated year-first form

    // No override: the generated `© <year> <holder>` default (year is BUILD_YEAR).
    const generated = await render(Footer, { content: baseFooter })
    expect(generated).toContain(`© ${BUILD_YEAR} Acme Collective`)
  })

  it('test_UAT_AC680_text_color_renders_footer_body_in_literal_or_role_else_surface_default', async () => {
    // Absolute #hex → footer text colour var painted verbatim.
    const hex = await render(Footer, {
      dials: { textColor: '#90a1b9' },
      content: baseFooter,
    })
    expect(hex).toContain('--fc-text: #90a1b9')

    // Palette role → resolved to the role's CSS var.
    const role = await render(Footer, {
      dials: { textColor: 'muted' },
      content: baseFooter,
    })
    expect(role).toContain('--fc-text: var(--color-muted)')

    // Unset → no text-colour override; the footer uses the surface default.
    const dflt = await render(Footer, { content: baseFooter })
    expect(dflt).not.toContain('--fc-text')
  })

  it('test_UAT_AC681_link_color_renders_footer_links_in_literal_or_role_else_surface_default', async () => {
    // Absolute #hex → footer link colour var painted verbatim on the links nav.
    const hex = await render(Footer, {
      dials: { linkColor: '#90a1b9' },
      content: baseFooter,
    })
    expect(hex).toContain('--fc-link: #90a1b9')

    // Palette role → resolved to the role's CSS var.
    const role = await render(Footer, {
      dials: { linkColor: 'accent' },
      content: baseFooter,
    })
    expect(role).toContain('--fc-link: var(--color-accent)')

    // Unset → no link-colour override; the links use the surface default.
    const dflt = await render(Footer, { content: baseFooter })
    expect(dflt).not.toContain('--fc-link')
  })
})
