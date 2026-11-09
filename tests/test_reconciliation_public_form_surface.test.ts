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
} from '../packages/framework/src/modules/contact-form/fields'
import { validateBehaviorConfig } from '../packages/framework/src/modules/behavior'
import { validateL1 } from '../packages/site-schema/src/index'

/**
 * story-f2e5032c (BUNDLE-42, REQ-223) — **what a public form puts on the page.**
 *
 * Reconciliation UATs for the form-surface acceptance criteria: the `checkbox`
 * field type (the consent record's input) and the per-mount instance handle.
 * Both are observed through the module's real render — the same function the
 * static renderer calls when it publishes a page — with the default L2 preset as
 * the form's presentation, which is what a newly-added form gets.
 */

const CONSENT = 'Email me occasionally about new papers'

const FIELDS = [
  { name: 'email', label: 'Your email', type: 'email', required: true },
  { name: 'list', label: CONSENT, type: 'checkbox' },
]

function render(instanceId: string, options: { edit?: boolean; action?: string } = {}): string {
  return contactForm({
    instanceId,
    edit: options.edit,
    config: { action: options.action ?? '/api/lead', fields: FIELDS, submitLabel: 'Send' },
    slots: { form: contactFormPreset(FIELDS) },
  })
}

describe('story-f2e5032c — the public form surface', () => {
  it('test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder', () => {
    // The type is admitted beside the existing four.
    for (const type of ['text', 'email', 'tel', 'textarea', 'checkbox']) {
      expect(FIELD_TYPES).toContain(type)
    }
    expect(validateBehaviorConfig(contactFormMeta, { action: '/api/lead', fields: FIELDS })).toEqual([])

    const html = render('signup')
    const input = html.match(/<input [^>]*name="list"[^>]*>/)?.[0] ?? ''
    expect(input).toMatch(/type="checkbox"/)
    expect(input).toMatch(new RegExp(`value="${CHECKBOX_VALUE}"`))
    expect(CHECKBOX_VALUE).not.toBe('')
    expect(input).not.toMatch(/placeholder=/)
    const id = input.match(/id="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()

    // The invariant programmatic label, associated with the box.
    expect(html).toContain(`<label class="contact-form__label" data-fc-invariant for="${id}">${CONSENT}</label>`)
    // The wording is also visible: a text run in the form's own presentation,
    // not only the accessible name.
    expect(html.split(CONSENT).length - 1).toBeGreaterThanOrEqual(2)

    // No placeholder even when the author asks for placeholder labels.
    const controls = contactFormControls(
      [{ name: 'list', label: CONSENT, labelMode: 'placeholder', type: 'checkbox', required: false }],
      'Send',
    )
    expect(controls.list.attrs?.type).toBe('checkbox')
    expect(controls.list.attrs?.placeholder).toBeUndefined()

    // The default layout validates as L1 and sizes the box as an 18px control.
    const subtree = contactFormPreset(FIELDS)
    expect(validateL1({ widths: [1280], root: subtree }).ok).toBe(true)
    expect(JSON.stringify(subtree)).toMatch(/"control":"list"[\s\S]*?"px":18/)
  })

  it('test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post', () => {
    const published = render('beta-form', { action: '/api/lead' })
    expect(published).toContain(`<input type="hidden" name="${FORM_INSTANCE_FIELD}" value="beta-form">`)
    expect(published).toMatch(new RegExp(`<input [^>]*name="${HONEYPOT_FIELD}"[^>]*>`))
    expect(published).toContain('method="post"')
    expect(published).toContain('action="/api/lead"')

    const edit = render('beta-form', { edit: true, action: '/api/lead' })
    expect(edit).not.toContain('method="post"')
    expect(edit).not.toMatch(/<form[^>]*\saction=/)
    expect(edit).not.toContain('/api/lead')
  })
})
