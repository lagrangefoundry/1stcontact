import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderMarkdown, CALLOUT_CSS } from '../packages/framework/src/modules/markdown'
import { TREATMENT_ROLE_DIAL } from '../packages/framework/src/modules/dials'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens'
import { renderL1Fragment } from '../packages/framework/src/l1/render'

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
    // `font: inherit` on the submit button — without it the <button> falls back
    // to the UA default (Arial 13px) instead of the site's font family/size.
    //
    // REQ-96 moved this from the module's stylesheet to the L1 emitter: a control
    // leaf is neutralised of UA chrome by the sole emitter, so EVERY module's
    // controls inherit the site's type rather than each module remembering to say
    // so. The guarantee is now structural instead of per-module discipline.
    const { css } = renderL1Fragment(
      [{ kind: 'control', control: 'submit' }],
      'fc',
      { submit: { tag: 'button', attrs: { type: 'submit' }, text: 'Send' } },
    )
    expect(css).toMatch(/font:\s*inherit/)
    expect(css).toMatch(/appearance:\s*none/)
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

// REQ-114 — AC4's `accentLight` / `accentDeep` were two slots of the closed
// 15-role token palette, and they are the exact shape DOC-23 §5.4 rejects: a ramp
// baked into sibling *role names*. The replacement is a palette entry carrying
// named `steps`, so a warm ramp is one role with positions rather than three
// unrelated roles. Coverage moved to the palette model's own UATs.

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

  it('test_UAT_FC_REQ-71_colour_literal_and_bold_emphasis', async () => {
    // REQ-114 — `color=primary` named a slot of the retired token palette and
    // resolved to `var(--color-primary)`. A literal is the surviving form (colour
    // reaches prose as a painted value, never through a custom property), and the
    // emphasis half of this AC is unchanged.
    const html = await renderMarkdown('[key phrase]{color=#0f9d6e emphasis=bold}')
    expect(html).toContain('color: #0f9d6e')
    expect(html).toContain('font-weight: 700')
    expect(html).not.toContain('--color-')
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
