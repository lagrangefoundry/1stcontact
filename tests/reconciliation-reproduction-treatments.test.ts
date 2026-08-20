/**
 * Reconciliation UATs — story-46e3b3c7 (STORY-82): "Reproduction treatments:
 * card veil/border, placeholder & inline contact form, and footer
 * copyright/colour overrides".
 *
 * The REQ-79 framework pivot re-homed these treatments off the deleted module
 * dials onto the two surviving post-pivot surfaces. One UAT per live AC,
 * exercised at the real boundary (the module catalog, the L1 validator and the
 * L1 renderer):
 *
 *   AC-719  card/band veil + footer copyright/colour treatments are expressed as
 *           L1 leaf axes (colour/opacity literals), not services-grid/footer
 *           module dials — those modules no longer exist in the catalog, and the
 *           L1 envelope rejects out-of-envelope (non-hex / freeform-CSS) values.
 *
 * AC-718 (contact-form presentation) was **deprecated** by REQ-96: its criterion
 * moved to AC-701 under STORY-85, and its UAT moved with it — the closed
 * config-key set, the absent aesthetic dials and the single required `form` slot
 * are now asserted inside `test_UAT_AC701_*` in
 * `reconciliation-behavior-modules.test.ts`. Nothing here claims that criterion.
 */
import { describe, expect, it } from 'vitest'

import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document, registry, getModule } from '../packages/framework/src/index'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'

// ════════════════════════════════════════════════════════════════════════════
// AC-719 — card/band + footer visual treatments live in L1 leaf axes, not dials
// ════════════════════════════════════════════════════════════════════════════
describe('STORY-82 — card/band + footer treatments are L1 leaf axes', () => {
  it('test_UAT_AC719_card_and_footer_treatments_authored_as_l1_leaf_axes', () => {
    // (a) The delivery mechanism is gone: the module catalog holds only the two
    // survivor capabilities. No services-grid/footer (or any deleted layout
    // module) survives, so no cardVeil/cardBorder/footer-colour dial can exist.
    expect([...registry.keys()].sort()).toEqual(['carousel@3', 'contact-form@4'])
    for (const gone of ['services-grid', 'footer', 'header', 'hero', 'text-block', 'layer']) {
      expect([...registry.keys()].some((k) => k.startsWith(`${gone}@`))).toBe(false)
      expect(() => getModule(gone, 1)).toThrow(/not found in catalog/)
    }
    // The survivors expose no aesthetic dials at all — the former card/footer
    // treatments have no dial home to hide in.
    for (const meta of [contactFormMeta, carouselMeta]) {
      expect((meta as Record<string, unknown>).dials).toBeUndefined()
      const configKeys = Object.keys(meta.config)
      for (const dial of ['cardVeil', 'cardBorder', 'textColor', 'linkColor', 'copyright']) {
        expect(configKeys).not.toContain(dial)
      }
    }

    // (b) Author the treatments directly in an L1 tree: a translucent "frosted"
    // card band (an alpha surface literal, no hairline border) above a footer
    // whose surface is dark and whose copyright line + link text each carry their
    // own colour literal departing from that surface default.
    const doc: L1Document = {
      widths: [320, 768, 1280],
      background: '#0f172a',
      root: {
        kind: 'container',
        layout: 'stack',
        gapPx: 0,
        children: [
          {
            kind: 'box',
            axes: { surfaceFill: '#f8fafccc' }, // translucent white (alpha cc = frosted veil)
            children: [{ kind: 'text', text: 'Premium Care', axes: { color: '#0f172a' } }],
          },
          {
            kind: 'box',
            axes: { surfaceFill: '#0f172a' },
            children: [
              {
                kind: 'text',
                text: '© 2024 GigaByte Alchemy. All rights reserved.',
                axes: { color: '#94a3b8' },
              },
              { kind: 'text', text: 'Privacy Policy', axes: { color: '#38bdf8' } },
            ],
          },
        ],
      },
    }
    expect(validateL1(doc).ok).toBe(true)

    const { html, css } = renderL1Document(doc)
    // The frosted veil renders as a translucent surface literal.
    expect(css).toContain('background-color: #f8fafccc')
    // "No hairline": the box carries no border axis, so the renderer emits no
    // border declaration whatsoever (box-sizing/border-radius are not a hairline).
    expect(css).not.toMatch(/border-(width|style|color)\s*:/)
    expect(css).not.toMatch(/(^|[;{\s])border\s*:/m)
    // The footer copyright line renders verbatim...
    expect(html).toContain('© 2024 GigaByte Alchemy. All rights reserved.')
    // ...and the departing text + link colours are emitted as their own literals.
    expect(css).toContain('color: #94a3b8')
    expect(css).toContain('color: #38bdf8')

    // (c) The L1 envelope constrains these literals: a non-hex colour and a
    // freeform-CSS escape hatch (an unknown key) are both rejected.
    const nonHexColour: unknown = {
      widths: [320],
      root: { kind: 'box', axes: { surfaceFill: 'rgba(255,255,255,0.2)' }, children: [] },
    }
    expect(validateL1(nonHexColour).ok).toBe(false)

    const freeformCss: unknown = {
      widths: [320],
      root: { kind: 'text', text: 'x', style: 'border: 1px solid red; position: fixed' },
    }
    expect(validateL1(freeformCss).ok).toBe(false)
  })
})
