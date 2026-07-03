import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { renderMarkdown } from '../packages/framework/src/modules/markdown'

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
        submitLabel: 'Subscribe',
      },
    })
    expect(html).toMatch(/class="contact-form__submit"[^>]*>Subscribe</)
  })
})

describe('REQ-33 checklist tick is a real text run (AC3)', () => {
  it('test_UAT_FC_REQ-33_checklist_tick_is_dom_text_not_pseudo', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: 'Sanctum Voice', body: 'x', checklist: ['On-device', 'Private'] },
          { title: 'Filler', body: 'y' },
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
