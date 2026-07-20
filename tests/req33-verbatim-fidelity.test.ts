import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { renderMarkdown, CALLOUT_CSS } from '../packages/framework/src/modules/markdown'
import { TREATMENT_ROLE_DIAL } from '../packages/framework/src/modules/dials'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-33 — the *universal* framework-code fidelity corrections that
 * survive the REQ-84 layout-module strip. Each is a correctness fix that makes
 * rendered output match authored/captured source for every site (not a per-site
 * value tune — those live in the site-def):
 *
 *   1. The shared markdown renderer renders punctuation *verbatim* (smartypants
 *      off) — a straight apostrophe/quote/dash is not silently curled, so text
 *      still equals its captured reference.
 *   2. The contact-form submit button inherits the site type (`font: inherit`)
 *      rather than falling back to the UA default (Arial 13px).
 *
 * (The services-grid checklist-tick / hero-subhead / header-wordmark corrections
 * were coupled to the deleted layout modules; the surviving corrections below —
 * markdown, callout, contact-form, styled inline runs, palette roles — are
 * module-independent.)
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

describe('REQ-71 styled inline runs in markdown body prose', () => {
  it('test_UAT_FC_REQ-71_span_carries_colour_size_and_emphasis', async () => {
    const html = await renderMarkdown('[We work at the intersection]{emphasis=italic color=#45556c fontSizePx=18 lineHeightPx=28}')
    expect(html).toContain('<span style="')
    expect(html).toContain('color: #45556c')
    expect(html).toContain('font-size: 18px')
    expect(html).toContain('line-height: 28px')
    expect(html).toContain('font-style: italic')
    expect(html).toContain('>We work at the intersection</span>')
    // The literal bracket/brace markup must NOT survive.
    expect(html).not.toContain('{emphasis=italic')
  })

  it('test_UAT_FC_REQ-71_colour_role_and_bold_emphasis', async () => {
    const html = await renderMarkdown('[key phrase]{color=primary emphasis=bold}')
    expect(html).toContain('color: var(--color-primary)')
    expect(html).toContain('font-weight: 700')
  })

  it('test_UAT_FC_REQ-71_unknown_key_is_left_literal', async () => {
    // A raw-CSS smuggle / unknown key must not become a span (no silent mis-style).
    const html = await renderMarkdown('[x]{background=red}')
    expect(html).not.toContain('<span')
    expect(html).toContain('{background=red}')
  })

  it('test_UAT_FC_REQ-71_span_inside_a_callout', async () => {
    const html = await renderMarkdown("> [!accent] [We're not trying to change you.]{emphasis=italic color=#1d293d}")
    expect(html).toContain('fc-callout--accent')
    expect(html).toContain('<span style="')
    expect(html).toContain('color: #1d293d')
    expect(html).toContain('font-style: italic')
  })
})
