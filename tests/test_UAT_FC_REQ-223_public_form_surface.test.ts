import { describe, expect, it } from 'vitest'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { contactFormControls } from '../packages/framework/src/modules/contact-form/controls'
import { contactFormPreset } from '../packages/framework/src/l2/contact-form'
import {
  CHECKBOX_VALUE,
  FIELD_TYPES,
  FORM_INSTANCE_FIELD,
  HONEYPOT_FIELD,
  RESERVED_FIELDS,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import {
  applyTurnstileSitekey,
  hasTurnstileMount,
  TURNSTILE_SCRIPT_URL,
} from '../packages/framework/src/modules/contact-form/turnstile'
import { validateBehaviorConfig } from '../packages/framework/src/modules/behavior'
import { validateL1 } from '../packages/site-schema/src/index'

/**
 * [[REQ-223]] — **what a public form now puts on the page**, and the one place
 * both ends of the seam read its vocabulary from.
 *
 * THREE PARTIES HAVE TO AGREE ON THESE STRINGS AND NONE OF THEM CAN SEE THE
 * OTHERS: the component that renders the form, the client that serialises it, and
 * the Worker that receives it — which lives in a different app entirely. A
 * literal written at any of those ends is a second answer to what the honeypot is
 * called, and the failure is SILENT: a honeypot the server looks for under the
 * wrong name never catches anything and never says so.
 *
 * THE CHECKBOX IS THE CONSENT RECORD ([[REQ-223]] §7). `contact-form` supported
 * `text|email|tel|textarea` only, which is why the mailing-list opt-in was
 * missing from the XGD page entirely ([[CHAT-56]]). It is here rather than in a
 * ticket of its own because it is how a captured address acquires a lawful basis
 * — the tenant is IE — and because wording stored later cannot evidence what was
 * on the page that day.
 *
 * THE SITEKEY IS STAMPED AT SERVE TIME AND IS NOT IN THE SNAPSHOT. A published
 * revision is an immutable record of what a site said; baking a per-deployment
 * key into every one of them makes a key rotation a republish of every site that
 * has ever carried a form, and the ones nobody republishes keep pointing at a key
 * that no longer verifies.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a mount that is not stamped, or a page with no form acquiring a
 *     third-party script*;
 *   - *a form that does not say which instance it is* — without which the
 *     receiver has no non-forgeable route to the asset or the wording;
 *   - *a checkbox rendered as a text input*, which submits a value nobody ticked.
 */

/** One form's markup, with a minimal L1 subtree in its required `form` slot. */
function render(fields: Array<Record<string, unknown>>, instanceId = 'signup'): string {
  return contactForm({
    instanceId,
    config: { action: '/api/lead', fields, submitLabel: 'Send' },
    slots: {
      form: {
        kind: 'container',
        layout: 'stack',
        children: fields.map((f) => ({ kind: 'control', control: String(f.name) })),
      },
    },
  })
}

describe('REQ-223 — the public form surface', () => {
  it('test_UAT_FC_REQ-223_a_checkbox_field_renders_as_one', () => {
    // AC-15 — the type is admitted by the contract…
    expect(FIELD_TYPES).toContain('checkbox')
    expect(
      validateBehaviorConfig(contactFormMeta, {
        action: '/api/lead',
        fields: [{ name: 'list', label: 'Email me about new papers', type: 'checkbox' }],
      }),
    ).toEqual([])

    // …and rendered as a checkbox, carrying a value so a tick submits an answer.
    const html = render([
      { name: 'email', label: 'Your email', type: 'email', required: true },
      { name: 'list', label: 'Email me about new papers', type: 'checkbox' },
    ])
    expect(html).toMatch(
      new RegExp(`<input [^>]*name="list"[^>]*type="checkbox"[^>]*value="${CHECKBOX_VALUE}"`),
    )

    // The programmatic label is the same obligation every other control gets:
    // present, associated, and not a designer's to move. The VISIBLE consent
    // wording is an L1 text run beside it, which is what makes it readable.
    expect(html).toContain('<label class="contact-form__label" data-fc-invariant for="cf-list">')
    expect(html).toContain('Email me about new papers')

    // A checkbox carries no placeholder: there is no box to put words inside, and
    // an inert attribute would imply a capability the control does not have.
    const controls = contactFormControls(
      [{ name: 'list', label: 'Opt in', labelMode: 'placeholder', type: 'checkbox', required: false }],
      'Send',
    )
    expect(controls.list.attrs?.placeholder).toBeUndefined()
    expect(controls.list.attrs?.type).toBe('checkbox')
  })

  it('test_UAT_FC_REQ-223_the_default_look_lays_a_checkbox_out_as_a_row', () => {
    // The preset is a starting point rather than a ceiling, and it still has to
    // be one an author would recognise: a tick box beside its wording, not a
    // full-width slab with the consent sentence stranded above it.
    const subtree = contactFormPreset([
      { name: 'email', label: 'Your email', type: 'email' },
      { name: 'list', label: 'Email me about new papers', type: 'checkbox' },
    ])
    const doc = { widths: [1280], root: subtree }
    expect(validateL1(doc).ok).toBe(true)
    const json = JSON.stringify(subtree)
    expect(json).toContain('"control":"list"')
    // 18px square — the checkbox is sized as a control, not as a field surface.
    expect(json).toMatch(/"control":"list"[\s\S]*?"px":18/)
  })

  it('test_UAT_FC_REQ-223_the_form_says_which_instance_it_is', () => {
    const html = render([{ name: 'email', label: 'Your email', type: 'email' }], 'beta-form')
    // The receiver's only non-forgeable route to the asset, the consent wording
    // and the submit label is this handle plus the site's published definition.
    expect(html).toContain(`<input type="hidden" name="${FORM_INSTANCE_FIELD}" value="beta-form">`)
    // …and the trap and the token are named once, in one module, for everybody.
    expect(html).toContain(`name="${HONEYPOT_FIELD}"`)
    expect(RESERVED_FIELDS).toEqual([HONEYPOT_FIELD, TURNSTILE_FIELD, FORM_INSTANCE_FIELD])
  })

  it('test_UAT_FC_REQ-223_the_edit_render_still_cannot_post', () => {
    // [[REQ-116]] — the edit channel has nothing to post to and no verb to post
    // with, and the instance handle must not have quietly restored either.
    const html = contactForm({
      instanceId: 'signup',
      edit: true,
      config: { action: '/api/lead', fields: [{ name: 'email', label: 'E', type: 'email' }] },
      slots: { form: { kind: 'container', layout: 'stack', children: [] } },
    })
    expect(html).not.toContain('method="post"')
    expect(html).not.toContain('action="/api/lead"')
  })

  it('test_UAT_FC_REQ-223_the_sitekey_is_stamped_at_serve_time', () => {
    const page = `<!doctype html><html><body>${render([
      { name: 'email', label: 'Your email', type: 'email' },
    ])}</body></html>`

    expect(hasTurnstileMount(page)).toBe(true)
    const stamped = applyTurnstileSitekey(page, '0xSITEKEY')
    expect(stamped).toContain('data-sitekey="0xSITEKEY"')
    // Cloudflare's implicit rendering needs their class on the mount…
    expect(stamped).toMatch(/class="contact-form__turnstile cf-turnstile"/)
    // …and the script, once, at the end of the body.
    expect(stamped.split(TURNSTILE_SCRIPT_URL)).toHaveLength(2)
    expect(stamped.indexOf(TURNSTILE_SCRIPT_URL)).toBeLessThan(stamped.indexOf('</body>'))

    // An unconfigured deployment serves exactly what it published — the mount is
    // inert, and the REFUSAL happens at the endpoint where it is loud.
    expect(applyTurnstileSitekey(page, '')).toBe(page)

    // A page with no form acquires nothing at all.
    const plain = '<!doctype html><html><body><p>Hello</p></body></html>'
    expect(hasTurnstileMount(plain)).toBe(false)
    expect(applyTurnstileSitekey(plain, '0xSITEKEY')).toBe(plain)
  })

  it('test_UAT_FC_REQ-223_every_mount_on_a_page_is_stamped', () => {
    // Two forms on one page is ordinary. A page where one is protected and the
    // other silently is not is the worst of the three possible outcomes.
    const page =
      '<!doctype html><html><body>' +
      render([{ name: 'email', label: 'E', type: 'email' }], 'a') +
      render([{ name: 'email', label: 'E', type: 'email' }], 'b') +
      '</body></html>'
    const stamped = applyTurnstileSitekey(page, '0xSITEKEY')
    expect(stamped.split('data-sitekey="0xSITEKEY"')).toHaveLength(3)
  })
})
