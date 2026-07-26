import type { L1ControlElement } from '../../l1/render'

/**
 * REQ-96 — `contact-form`'s **attribute bundles**: the module's entire half of
 * the control contract.
 *
 * The module says which elements must exist and what makes them *work* — the
 * `type`, the submission `name`, `required`, the `id` a label points at, the
 * `placeholder` a placeholder-labelled reference renders inside the box. L1 says
 * what they look like. Neither can express the other's half, which is the point:
 * appearance can vary freely per site without any route to changing what the
 * form submits or how it is labelled.
 *
 * Security stays construction-time (DOC-25 §10.4). Nothing here is authored by
 * an instance: field names and labels arrive as validated `config`, the endpoint
 * is checked separately by `assertSafeUrl`, and the emitter escapes every value
 * and refuses `class` / `style` / `on*` attribute names outright.
 */

/** One `config.fields` entry, after the component's defensive coercion. */
export interface ContactFormField {
  name: string
  label: string
  labelMode: 'visible' | 'placeholder'
  type: 'text' | 'email' | 'tel' | 'textarea'
  required: boolean
}

/** The DOM id a field's control and its `<label for>` share. */
export function controlId(fieldName: string): string {
  return `cf-${fieldName}`
}

/**
 * The control roster for one instance: one element per configured field, named
 * by the field's own submission `name`, plus the `submit` button.
 *
 * A field's control is a `<textarea>` or an `<input type=…>` — the distinction
 * is behavioural (single-line vs multi-line entry, and the mobile keyboard the
 * type selects), never a matter of look.
 */
export function contactFormControls(
  fields: readonly ContactFormField[],
  submitLabel: string,
): Record<string, L1ControlElement> {
  const controls: Record<string, L1ControlElement> = {}
  for (const field of fields) {
    // The reference labelled this control with a placeholder, so the words go
    // inside the box. The `<label>` stays in the DOM regardless — the a11y
    // obligation is not negotiable — but it is visually hidden (see the module's
    // invariant elements).
    const placeholder = field.labelMode === 'placeholder' ? field.label : undefined
    const id = controlId(field.name)
    controls[field.name] =
      field.type === 'textarea'
        ? { tag: 'textarea', attrs: { id, name: field.name, required: field.required, placeholder } }
        : {
            tag: 'input',
            attrs: { id, name: field.name, type: field.type, required: field.required, placeholder },
          }
  }
  controls.submit = { tag: 'button', attrs: { type: 'submit' }, text: submitLabel }
  return controls
}
