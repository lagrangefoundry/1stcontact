import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import { renderMarkdown, CALLOUT_CSS } from '../packages/framework/src/modules/markdown'
import { TREATMENT_ROLE_DIAL } from '../packages/framework/src/modules/dials'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-33 — three *universal* framework-code fidelity corrections
 * cherry-picked from the gigabytealchemy re-import values-diff. Each is a
 * correctness fix that makes rendered output match authored/captured source for
 * every site (not a per-site value tune — those live in the site-def):
 *
 *   1. The shared markdown renderer renders punctuation *verbatim* (smartypants
 *      off) — a straight apostrophe/quote/dash is not silently curled, so text
 *      still equals its captured reference.
 *   2. The contact-form submit button inherits the site type (`font: inherit`)
 *      rather than falling back to the UA default (Arial 13px).
 *   3. A services-grid checklist tick (✓) is a real leading text run, present in
 *      the DOM / a11y tree — not a `::before` pseudo a capture can't read.
 *
 * Modules render through Astro's container API — the same SSR path
 * tools/generate uses.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as never, { props: props as Record<string, unknown> })
}

function moduleSource(relPath: string): string {
  return readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), 'utf8')
}

describe('REQ-33 verbatim punctuation — smartypants off (AC1)', () => {
  it('test_UAT_FC_REQ-33_markdown_keeps_straight_apostrophe', async () => {
    const html = await renderMarkdown("We're a studio that isn't extractive.")
    // Straight apostrophes survive; the renderer must not inject curly ones.
    expect(html).toContain("We're")
    expect(html).toContain("isn't")
    expect(html).not.toContain('’') // right single quotation mark ’
  })

  it('test_UAT_FC_REQ-33_markdown_keeps_straight_quotes_and_double_hyphen', async () => {
    const html = await renderMarkdown('A "quoted" phrase -- and a range.')
    expect(html).toContain('"quoted"')
    // `--` stays two hyphens; it is not promoted to an em-dash (—).
    expect(html).toContain('--')
    expect(html).not.toContain('—') // em dash —
    expect(html).not.toContain('“') // left double quotation mark “
  })
})

describe('REQ-33 contact-form submit inherits site type (AC2)', () => {
  it('test_UAT_FC_REQ-33_submit_button_inherits_font', () => {
    const css = moduleSource('../packages/framework/src/modules/contact-form/index.astro')
    // `font: inherit` on the submit button — without it the <button> falls back
    // to the UA default (Arial 13px) instead of the site's font family/size.
    expect(css).toMatch(/\.contact-form__submit\s*\{[^}]*font:\s*inherit/)
  })

  it('test_UAT_FC_REQ-33_submit_button_renders', async () => {
    const html = await render(ContactForm, {
      dials: {},
      content: {
        action: '/x',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: { text: 'Subscribe' },
      },
    })
    expect(html).toMatch(/class="contact-form__submit[^"]*"[^>]*>Subscribe</)
  })
})

describe('REQ-33 checklist tick is a real text run (AC3)', () => {
  it('test_UAT_FC_REQ-33_checklist_tick_is_dom_text_not_pseudo', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: { text: 'Sanctum Voice' }, body: 'x', checklist: ['On-device', 'Private'] },
          { title: { text: 'Filler' }, body: 'y' },
        ],
      },
    })
    // Each tick is an actual <span> text node containing ✓ (two items → two).
    // (Astro injects a scoped-style class, so match the mark class loosely.)
    expect(html.match(/services-grid__check-mark[^>]*>✓<\/span>/g)?.length).toBe(2)
    // Each line's text sits in its own run beside the mark.
    expect(html).toMatch(/services-grid__check-text[^>]*>On-device<\/span>/)
    // The old pseudo-element approach is gone (no invisible glyph).
    const css = moduleSource('../packages/framework/src/modules/services-grid/index.astro')
    expect(css).not.toContain("services-grid__check::before")
  })
})

describe('REQ-33 callout is medium-weight emphasis (AC9)', () => {
  it('test_UAT_FC_REQ-33_callout_text_is_medium_weight', () => {
    // A callout is a weight-emphasised statement (500) — its weight lives here,
    // in the treatment, not as a raw font-weight in any site-def.
    expect(CALLOUT_CSS).toMatch(/blockquote\.fc-callout\s*\{[^}]*font-weight:\s*var\(--font-weight-medium\)/)
  })

  it('test_UAT_FC_REQ-33_callout_marker_renders_left_bar', async () => {
    // An authored `> [!primary] …` becomes a semantic left-bar callout, not the
    // `**bold**` paragraph it was mis-transcribed as.
    const html = await renderMarkdown('> [!primary] These are foundations.')
    expect(html).toContain('blockquote class="fc-callout fc-callout--primary"')
    expect(html).not.toContain('<strong>')
  })
})

describe('REQ-33 hero subhead size on the styled run (AC8)', () => {
  // REQ-50 — the subhead's size is no longer a `subheadSize` dial (with its
  // lead/body-paragraph split); it's the `subhead` run's own `fontSizePx`,
  // which resolves to an inline `style` on the rendered subhead.
  it('test_UAT_FC_REQ-33_subhead_size_alias_scales_the_lead', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'H' }, subhead: { text: 'Lead line.', fontSizePx: '2xl' } },
    })
    // A prominent lead subtitle: the `2xl` scale step resolves to the theme var.
    expect(html).toMatch(/hero__subhead[^>]*style="[^"]*font-size: var\(--font-size-2xl\)/)
  })

  it('test_UAT_FC_REQ-33_subhead_size_literal_px_reproduces_verbatim', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'H' }, subhead: { text: 'Lead line.', fontSizePx: 24 } },
    })
    // A captured px size pastes straight in — no enum step between diff and spec.
    expect(html).toMatch(/hero__subhead[^>]*style="[^"]*font-size: 24px/)
  })

  it('test_UAT_FC_REQ-33_subhead_size_defaults_to_the_base_slot', async () => {
    // A run that omits `fontSizePx` inherits the base slot size — no inline size.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'H' }, subhead: { text: 'Lead line.' } },
    })
    expect(html).not.toMatch(/hero__subhead[^>]*style="[^"]*font-size:/)
  })
})

describe('REQ-33 display wordmark tracking + weight (AC7)', () => {
  it('test_UAT_FC_REQ-33_display_wordmark_is_tight_and_not_faux_bold', async () => {
    // REQ-50 — the display wordmark's face/tracking/weight are no longer a
    // `logoFont` dial + `--font-display` class; they live on the `wordmark`
    // run's `fontFamily`/`letterSpacingPx`/`fontWeight`, resolved to inline style.
    const html = await render(Header, {
      variant: 'top-nav',
      content: {
        wordmark: {
          text: 'ACME',
          fontFamily: 'display',
          letterSpacingPx: 'tight',
          fontWeight: 'semibold',
        },
        entries: [],
      },
    })
    // Display face, tight (negative) tracking, never a positive spread.
    expect(html).toMatch(/header__wordmark[^>]*style="[^"]*font-family: var\(--font-family-display\)/)
    expect(html).toMatch(/header__wordmark[^>]*style="[^"]*letter-spacing: var\(--tracking-tight\)/)
    // Its own semibold so a 600-only face is not faux-bolded to 700 by an
    // inherited `bold`.
    expect(html).toMatch(/header__wordmark[^>]*style="[^"]*font-weight: var\(--font-weight-semibold\)/)
  })
})

describe('REQ-33 warm palette roles accent-light / accent-deep (AC4)', () => {
  it('test_UAT_FC_REQ-33_warm_roles_in_treatment_vocabulary', () => {
    // Both roles are selectable anywhere a treatment role is (gradient stops,
    // callouts, subhead colour).
    expect(TREATMENT_ROLE_DIAL).toContain('accent-light')
    expect(TREATMENT_ROLE_DIAL).toContain('accent-deep')
  })

  it('test_UAT_FC_REQ-33_warm_roles_emit_color_custom_properties', () => {
    // A site declaring the roles gets `--color-accent-light` / `--color-accent-deep`.
    const css = generateThemeCss({
      ...defaultTokens,
      palette: { ...defaultTokens.palette, accentLight: '#f5e6a3', accentDeep: '#ff6b35' },
    })
    expect(css).toContain('--color-accent-light: #f5e6a3;')
    expect(css).toContain('--color-accent-deep: #ff6b35;')
  })
})

describe('REQ-33 hero subhead colour on the styled run (AC5)', () => {
  // REQ-50 — the subhead tint is no longer a `subheadColor` dial; it's the
  // `subhead` run's own `color`, resolved to an inline `style` on the subhead.
  it('test_UAT_FC_REQ-33_subhead_tinted_by_palette_role', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'H' }, subhead: { text: 'Lead paragraph.', color: 'accent-light' } },
    })
    // A palette-role alias resolves to the theme var (never a raw colour).
    expect(html).toMatch(/hero__subhead[^>]*style="[^"]*color: var\(--color-accent-light\)/)
  })

  it('test_UAT_FC_REQ-33_subhead_inherits_by_default', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'H' }, subhead: { text: 'Lead paragraph.' } },
    })
    // No colour override when the run omits `color` — inherits the surface colour.
    expect(html).not.toMatch(/hero__subhead[^>]*style="[^"]*color:/)
  })
})

describe('REQ-33 contact-form submitTreatment dial (AC6)', () => {
  async function renderForm(dials: Record<string, string>) {
    return render(ContactForm, {
      dials,
      content: {
        action: '/x',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: { text: 'Send' },
      },
    })
  }

  it('test_UAT_FC_REQ-33_submit_neutral_is_dark_button', async () => {
    const html = await renderForm({ submitTreatment: 'neutral' })
    expect(html).toMatch(/class="contact-form__submit submit-neutral"/)
    const css = moduleSource('../packages/framework/src/modules/contact-form/index.astro')
    // Neutral fills with the theme text colour (a dark button on a light band).
    expect(css).toMatch(/\.submit-neutral\s*\{[^}]*var\(--color-text\)/)
  })

  it('test_UAT_FC_REQ-33_submit_defaults_to_primary', async () => {
    const html = await renderForm({})
    expect(html).toMatch(/class="contact-form__submit submit-primary"/)
  })
})
