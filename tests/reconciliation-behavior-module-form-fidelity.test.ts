import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

import { contactFormMeta, validateBehaviorConfig } from '../packages/framework/src/index'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'

/**
 * Reconciliation UATs for story-179b8c06 — the two facts a mounted
 * `contact-form` must NOT override with a module default (REQ-93):
 *
 * - **AC-790** — labelling is typed config, not a fixed choice. A reference that
 *   names its controls with a placeholder is reproduced by putting the words
 *   inside the box; the `<label>` is kept and kept associated, only moved out of
 *   flow, so the a11y obligation is never traded for the look.
 * - **AC-791** — an authored submit chip IS the button. The module surrenders
 *   its own paint rather than nesting the chip inside a second, differently
 *   coloured button.
 *
 * Both are exercised at the real boundary: the SSR container render (the same
 * path `tools/generate` uses) and the published `validateBehaviorConfig`.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function renderContactForm(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(ContactForm, { props: props as Record<string, unknown> })
}

const action = 'https://example.com/submit'

// ════════════════════════════════════════════════════════════════════════════
// AC-790 — Contact-form labelling mode reproduces a placeholder-named control
//          without a visible label row
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — contact-form labelling mode', () => {
  it('test_UAT_AC790_labelling_mode_reproduces_a_placeholder_named_control', async () => {
    // A form MIXING the two modes — the mode is a per-field setting, so one
    // render must show both behaviours side by side.
    const html = await renderContactForm({
      config: {
        action,
        fields: [
          // states `placeholder`
          { name: 'name', label: 'Your name', type: 'text', required: true, labelMode: 'placeholder' },
          // states nothing → must default to `visible`
          { name: 'email', label: 'Email', type: 'email', required: true },
          // states `visible` explicitly
          { name: 'message', label: 'Message', type: 'textarea', required: false, labelMode: 'visible' },
        ],
      },
      slots: {},
    })

    // ── placeholder mode: the label's words go INSIDE the control ────────────
    expect(html).toMatch(/<input[^>]*id="cf-name"[^>]*placeholder="Your name"/)

    // …and the a11y obligation is moved out of flow, never traded away: the
    // <label> is still emitted, still associated by `for`, still carries the
    // same words — and is marked visually hidden (not removed, not display:none).
    const nameLabel = html.match(/<label[^>]*for="cf-name"[^>]*>[^<]*<\/label>/)?.[0]
    expect(nameLabel).toBeTruthy()
    expect(nameLabel).toContain('Your name')
    expect(nameLabel).toContain('contact-form__label--visually-hidden')
    // Still exposed to assistive technology — no `hidden`, no aria-hidden.
    expect(nameLabel).not.toMatch(/\shidden[\s>=]/)
    expect(nameLabel).not.toMatch(/aria-hidden/)

    // ── default (mode absent) → `visible`: label in flow, no placeholder ─────
    const emailLabel = html.match(/<label[^>]*for="cf-email"[^>]*>[^<]*<\/label>/)?.[0]
    expect(emailLabel).toBeTruthy()
    expect(emailLabel).toContain('Email')
    expect(emailLabel).not.toContain('visually-hidden')
    expect(html).toMatch(/<input[^>]*id="cf-email"(?![^>]*placeholder)[^>]*>/)

    // ── explicit `visible` behaves exactly as before ─────────────────────────
    const messageLabel = html.match(/<label[^>]*for="cf-message"[^>]*>[^<]*<\/label>/)?.[0]
    expect(messageLabel).toBeTruthy()
    expect(messageLabel).toContain('Message')
    expect(messageLabel).not.toContain('visually-hidden')
    expect(html).toMatch(/<textarea[^>]*id="cf-message"(?![^>]*placeholder)[^>]*>/)

    // ── the enum is closed: an unrecognised mode is a config violation ───────
    const violations = validateBehaviorConfig(contactFormMeta, {
      action,
      fields: [{ name: 'name', label: 'Your name', type: 'text', required: true, labelMode: 'floating' }],
    })
    expect(violations.length).toBe(1)
    expect(violations[0].field).toBe('config.fields[0].labelMode')

    // …while both legal modes (and omitting it) validate clean.
    for (const labelMode of ['visible', 'placeholder', undefined]) {
      expect(
        validateBehaviorConfig(contactFormMeta, {
          action,
          fields: [{ name: 'name', label: 'Your name', type: 'text', required: true, ...(labelMode ? { labelMode } : {}) }],
        }),
      ).toEqual([])
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-791 — Contact-form surrenders its own submit paint to an authored
//          submit subtree
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — contact-form submit paint surrender', () => {
  const config = {
    action,
    fields: [{ name: 'name', label: 'Your name', type: 'text', required: true }],
  }

  it('test_UAT_AC791_submit_paint_is_surrendered_to_an_authored_subtree', async () => {
    // An authored chip carrying its OWN fill and rounding — exactly the case
    // that would look wrong nested inside a second painted button.
    const withSlot = await renderContactForm({
      config,
      slots: {
        submit: {
          kind: 'box',
          axes: { surfaceFill: '#ff5a1f', borderRadiusPx: 24 },
          children: [{ kind: 'text', text: 'Send message' }],
        },
      },
    })

    // The authored subtree is the button's content…
    expect(withSlot).toContain('Send message')

    // …the module's default `Send` button does not appear alongside it…
    expect(withSlot).not.toMatch(/>\s*Send\s*<\/button>/)
    // …and there is exactly ONE button — the chip is not nested in a second one.
    expect(withSlot.match(/<button\b/g) ?? []).toHaveLength(1)

    // The element remains a real submit button (focus, submission, no-JS
    // baseline unchanged) — only its paint is surrendered.
    const button = withSlot.match(/<button[^>]*>/)?.[0]
    expect(button).toBeTruthy()
    expect(button).toContain('type="submit"')
    expect(button).toContain('contact-form__submit')
    // The surrendered-paint state is observable on the rendered button.
    expect(button).toContain('contact-form__submit--l1')
    // …and the button is still inside the form.
    expect(withSlot.indexOf('<form')).toBeLessThan(withSlot.indexOf('<button'))
    expect(withSlot.indexOf('<button')).toBeLessThan(withSlot.indexOf('</form>'))

    // ── no `submit` slot → the module paints its own default button as before ─
    const withoutSlot = await renderContactForm({ config, slots: {} })
    const plain = withoutSlot.match(/<button[^>]*>/)?.[0]
    expect(plain).toBeTruthy()
    expect(plain).toContain('type="submit"')
    expect(plain).toContain('contact-form__submit')
    // Paint NOT surrendered — the modifier is absent…
    expect(plain).not.toContain('contact-form__submit--l1')
    // …and the plain default label is present.
    expect(withoutSlot).toMatch(/>\s*Send\s*<\/button>/)
    expect(withoutSlot).not.toContain('Send message')
  })
})
