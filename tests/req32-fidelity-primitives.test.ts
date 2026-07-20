import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../packages/framework/src/modules/markdown'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-32 — the framework fidelity primitives surfaced *by* the
 * gigabytealchemy import that survive the REQ-84 layout-module strip:
 *
 *   - `text-block`-style callout / left-bar — a GFM-alert blockquote rendered as
 *     a semantic accent left-bar (+ optional italic), available in any markdown
 *     body (the shared `renderMarkdown` primitive).
 *   - Cool-neutral palette role, selectable independent of the warm `muted` (the
 *     shared `generateThemeCss` / token primitive).
 *
 * (Primitives 1 & 3 — gradient text on the header/hero wordmark, and the hero
 * overlay-scrim — were coupled to the deleted layout modules and are covered for
 * the surviving modules elsewhere; the callout + palette-role primitives below
 * are module-independent.)
 */

describe('REQ-32 primitive 2 — callout / left-bar treatment', () => {
  it('test_UAT_FC_REQ-32_markdown_alert_becomes_semantic_callout', async () => {
    const html = await renderMarkdown('> [!accent] These are foundations.')
    expect(html).toContain('<blockquote class="fc-callout fc-callout--accent">')
    // The marker itself is consumed — it never shows in the copy.
    expect(html).not.toContain('[!accent]')
    expect(html).toContain('These are foundations.')
  })

  it('test_UAT_FC_REQ-32_callout_supports_italic_and_any_role', async () => {
    const html = await renderMarkdown('> [!secondary italic] Not trying to change you.')
    expect(html).toContain('fc-callout--secondary')
    expect(html).toContain('fc-callout--italic')
  })

  it('test_UAT_FC_REQ-32_plain_blockquote_and_unknown_role_untouched', async () => {
    const plain = await renderMarkdown('> just a quote')
    expect(plain).not.toContain('fc-callout')
    const unknown = await renderMarkdown('> [!bogus] text')
    expect(unknown).not.toContain('fc-callout')
    expect(unknown).toContain('[!bogus]')
  })
})

describe('REQ-32 primitive 4 — cool-neutral palette role', () => {
  it('test_UAT_FC_REQ-32_theme_emits_neutral_cool_custom_property', () => {
    // Default is filled even when a theme omits it (like `secondary`).
    expect(defaultTokens.palette.neutralCool).toBeDefined()
    expect(generateThemeCss()).toContain('--color-neutral-cool:')
    // And a site-supplied value flows through.
    const css = generateThemeCss({ palette: { neutralCool: '#334155' } })
    expect(css).toContain('--color-neutral-cool: #334155;')
  })
})
