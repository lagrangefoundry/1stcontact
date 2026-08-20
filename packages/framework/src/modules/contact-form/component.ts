import type { L1Node } from '@1stcontact/site-schema'
import { renderL1Fragment } from '../../l1/render'
import type { BehaviorProps } from '../behavior'
import { attr, escapeHtml } from '../html'
import { assertSafeUrl } from '../safety'
import { contactFormControls, controlId, type ContactFormField } from './controls'

/**
 * `contact-form` behavior (REQ-85; made layout-agnostic by construction in
 * REQ-96; plain TypeScript since REQ-148).
 *
 * The core is purely behavioural: a real `<form method=post action=…>`, the
 * programmatic label association, the honeypot + Turnstile anti-spam surface, and
 * the JSON-`fetch` upgrade in `client.js`. **It paints nothing.** The form's whole
 * presentation is the L1 subtree in the `form` slot; each control inside it is an
 * L1 `control` node that the emitter renders as the element declared here
 * (`controls.ts`), carrying L1's class, geometry and paint axes.
 *
 * The only CSS the module ships (`styles.css`) belongs to its **invariant**
 * elements (DOC-25 §10.3) — presentation fixed by an obligation rather than by
 * taste: a honeypot a designer must not be able to reveal, a programmatic label
 * that must stay out of the visual flow, and the module's own wrapper chrome,
 * which must contribute no layout of its own to the L1 it wraps.
 *
 * WHY THIS IS NOT AN `.astro` FILE (REQ-148). It was one, and it used no Astro
 * feature: no island, no hydration, no `Astro.request`, no layout, no child
 * slot — only `Astro.props`, plain TypeScript, and two `set:html` interpolations.
 * The cost of that file extension was the whole Astro transform on the render
 * path, which a Worker has no way to run. As a plain function the module renders
 * in workerd and in Node through the *same* code, so the two cannot disagree.
 * What the compiler used to do implicitly — escaping every interpolation — is
 * now explicit at each sink (`../html.ts`).
 */
export function contactForm({
  config = {},
  slots = {},
  instanceId = 'contact-form',
  edit = false,
}: BehaviorProps = {}): string {
  const action = typeof config.action === 'string' ? config.action : ''
  // Isolation (REQ-85): coerce the field schema defensively — a malformed entry is
  // dropped rather than throwing, keeping the page robust.
  const fields: ContactFormField[] = Array.isArray(config.fields)
    ? (config.fields as unknown[])
        .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
        .map((f): ContactFormField => ({
          name: String(f.name ?? ''),
          label: String(f.label ?? ''),
          labelMode: f.labelMode === 'placeholder' ? 'placeholder' : 'visible',
          type: (['text', 'email', 'tel', 'textarea'].includes(f.type as string)
            ? (f.type as string)
            : 'text') as ContactFormField['type'],
          required: f.required === true,
        }))
        .filter((f) => f.name)
    : []
  const successMessage = typeof config.successMessage === 'string' ? config.successMessage : ''
  const submitLabel =
    typeof config.submitLabel === 'string' && config.submitLabel ? config.submitLabel : 'Send'

  // The module's half of the control contract: which elements exist and what makes
  // them work. Handed to the emitter, which pairs each with the L1 node naming it.
  const controls = contactFormControls(fields, submitLabel)

  // The form's presentation, as one L1 subtree in its own class namespace so two
  // instances on a page never collide. A repeated-slot array here is not a valid
  // binding for a single slot; isolation says drop it rather than throw.
  const slot = slots.form
  const formNode: L1Node[] = slot && typeof slot === 'object' && !Array.isArray(slot) ? [slot] : []
  const form = renderL1Fragment(formNode, `${instanceId}-form`, controls, { edit })

  // Honeypot: hidden from humans, tempting to bots. The server rejects any
  // submission where this is filled (wired in REQ-7).
  const honeypotName = 'hp_company_url'

  /*
   * Invariant — the programmatic label for every control, whatever the reference
   * rendered visually. A control's *visible* words (a label above the box, or the
   * placeholder inside it) are the reference's business: the first is an L1 text
   * run in the subtree below, the second is a `placeholder` attribute the module
   * sets from `labelMode`. This element is neither: it is the accessible name, and
   * it is not a designer's to move, restyle, or remove.
   */
  const labels = fields
    .map(
      (field) =>
        `<label class="contact-form__label" data-fc-invariant for="${escapeHtml(
          controlId(field.name),
        )}">${escapeHtml(field.label)}</label>`,
    )
    .join('\n      ')

  /*
   * REQ-116 — in the edit render the form has no action and no method: there is
   * nothing to post to and no verb to post with, so a submit cannot leave the
   * page. `data-contact-form` stays: it is only the handle `client.js` binds its
   * fetch upgrade to, and the edit channel ships no client script at all.
   *
   * REQ-117 — `data-l1-slot` is the seam marker. Copy inside a slot is addressed
   * relative to the INSTANCE, so an address alone is ambiguous: the editor needs
   * to know which of the module's slots the subtree array belongs to. Only the
   * module knows which of its elements is which seam — the same reason it, and
   * not the channel, owns what "my behaviour is off" looks like — so it says so
   * here. `carousel` marks its slide `<li>` the same way.
   */
  const formAttrs =
    attr('action', edit ? undefined : assertSafeUrl(action, 'contact-form action')) +
    attr('method', edit ? undefined : 'post')

  /*
   * The remaining invariant elements (DOC-25 §10.3), each marked
   * `data-fc-invariant` so the reproduction value gate skips it:
   *   • the honeypot — visually hidden, off the tab order, never autofilled;
   *   • the Turnstile mount — where the widget expects it (script + token wired
   *     in REQ-7);
   *   • the inline error surface — shown only by the client enhancement.
   * The success copy sits in a `<template>` the client swaps the form for.
   */
  return `<section class="contact-form">
  <div class="contact-form__inner" data-contact-form-root>
    <form class="contact-form__form" data-contact-form data-l1-slot="form"${formAttrs}>
      ${labels}
      ${form.htmls[0] ?? ''}
      <div class="contact-form__honeypot" data-fc-invariant aria-hidden="true">
        <label for="cf-${honeypotName}">Leave this field empty</label>
        <input id="cf-${honeypotName}" name="${honeypotName}" type="text" tabindex="-1" autocomplete="off">
      </div>
      <div class="contact-form__turnstile" data-fc-invariant data-turnstile-target></div>
      <p class="contact-form__error" data-fc-invariant data-contact-error hidden></p>
    </form>
    <template data-contact-success>${escapeHtml(
      successMessage || 'Thanks — your message has been sent.',
    )}</template>
  </div>
  ${form.css ? `<style>${form.css}</style>` : ''}
</section>`
}
