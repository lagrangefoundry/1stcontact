/**
 * Reconciliation UATs — story-46e3b3c7 (STORY-82): "Reproduction treatments:
 * card veil/border, placeholder & inline contact form, and footer
 * copyright/colour overrides".
 *
 * The REQ-79 framework pivot re-homed these treatments off the deleted module
 * dials onto the two surviving post-pivot surfaces. One UAT per AC, exercised at
 * the real boundary (the module catalog, the L1 validator + renderer, and the
 * contact-form capability's SSR render):
 *
 *   AC-719  card/band veil + footer copyright/colour treatments are expressed as
 *           L1 leaf axes (colour/opacity literals), not services-grid/footer
 *           module dials — those modules no longer exist in the catalog, and the
 *           L1 envelope rejects out-of-envelope (non-hex / freeform-CSS) values.
 *   AC-718  contact-form presentation (submit look, intro framing) is authored
 *           via capability config + named L1 slots, not aesthetic dials; field
 *           labelling stays a fixed accessibility obligation of the core.
 */
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document, registry, getModule } from '../packages/framework/src/index'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'

// ════════════════════════════════════════════════════════════════════════════
// AC-719 — card/band + footer visual treatments live in L1 leaf axes, not dials
// ════════════════════════════════════════════════════════════════════════════
describe('STORY-82 — card/band + footer treatments are L1 leaf axes', () => {
  it('test_UAT_AC719_card_and_footer_treatments_authored_as_l1_leaf_axes', () => {
    // (a) The delivery mechanism is gone: the module catalog holds only the two
    // survivor capabilities. No services-grid/footer (or any deleted layout
    // module) survives, so no cardVeil/cardBorder/footer-colour dial can exist.
    expect([...registry.keys()].sort()).toEqual(['carousel@2', 'contact-form@3'])
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

// ════════════════════════════════════════════════════════════════════════════
// AC-718 — contact-form presentation is capability config + L1 slots, not dials
// ════════════════════════════════════════════════════════════════════════════
describe('STORY-82 — contact-form presentation via capability config + L1 slots', () => {
  const config = {
    action: 'https://example.com/lead',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
    ],
  }

  it('test_UAT_AC718_contact_form_presentation_via_config_and_l1_slots', async () => {
    // (a) The capability meta carries only behavioural/functional config — no
    // aesthetic dials (fieldLabels / submitInline / submitColor) remain — and
    // exposes `intro` + `submit` as declared L1 presentation slots.
    expect(Object.keys(contactFormMeta.config).sort()).toEqual(['action', 'fields', 'successMessage'])
    for (const gone of ['fieldLabels', 'submitInline', 'submitColor', 'submitColour', 'submitTreatment']) {
      expect(Object.keys(contactFormMeta.config)).not.toContain(gone)
    }
    expect(Object.keys(contactFormMeta.slots).sort()).toEqual(['intro', 'submit'])
    expect((contactFormMeta as Record<string, unknown>).dials).toBeUndefined()

    const container = await AstroContainer.create()

    // (b) With an L1 subtree in the `submit` slot, the rendered submit button
    // reflects that L1 look: the mounted (namespaced) fragment, its verbatim
    // content, and its surface colour literal shipped as fragment CSS.
    const withSubmit = await container.renderToString(ContactForm, {
      props: {
        config,
        slots: {
          submit: {
            kind: 'box',
            axes: { surfaceFill: '#e11d48' },
            children: [{ kind: 'text', text: 'Send message' }],
          },
        },
      },
    })
    expect(withSubmit).toMatch(/<button[^>]*class="contact-form__submit"/)
    expect(withSubmit).toMatch(/class="[^"]*contact-form-submit-l1-0/)
    expect(withSubmit).toContain('Send message')
    expect(withSubmit).toContain('background-color: #e11d48')

    // (c) With the `submit` slot absent, a plain functional button renders (no L1
    // look, no authored surface colour).
    const plain = await container.renderToString(ContactForm, { props: { config, slots: {} } })
    expect(plain).toMatch(/<button[^>]*class="contact-form__submit"[^>]*>\s*Send\s*<\/button>/)
    expect(plain).not.toContain('background-color: #e11d48')

    // (d) Field labelling is a fixed obligation of the vetted core, independent of
    // presentation: every configured field renders a programmatic <label> bound to
    // its control — in BOTH the slot-dressed and the plain baseline renders.
    for (const html of [withSubmit, plain]) {
      expect(html).toMatch(/<label[^>]*for="cf-name"[^>]*>Your name<\/label>/)
      expect(html).toMatch(/<input[^>]*id="cf-name"[^>]*type="text"[^>]*required/)
      expect(html).toMatch(/<label[^>]*for="cf-email"[^>]*>Email<\/label>/)
    }
  })
})
