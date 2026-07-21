import type { CapabilityMeta } from '../capability'

/**
 * `contact-form` (reframed to a capability by REQ-85) — a lead-capture form. The
 * vetted core keeps everything behavioural: the field schema, a11y-labelled
 * functional controls, the honeypot + Turnstile anti-spam surface, the no-JS
 * `<form method=post>` baseline, and the JSON-`fetch` progressive enhancement
 * (`enhance.ts`). What used to be aesthetic dials (surface, spacing, alignment,
 * width, submit treatment/colour/inline, field labelling/border/radius) is gone:
 * decorative framing (an intro heading/subhead, the submit button's look) is
 * authored as L1 and mounted into the `intro` / `submit` slots.
 *
 * Field `label`s stay part of the core, not a slot — a programmatic label is an
 * accessibility obligation (the `responsive`/a11y conformance dimension), not
 * styling.
 */
export const contactFormMeta = {
  id: 'contact-form',
  version: 3,
  kind: 'capability',
  config: {
    // Submission endpoint — the no-JS form action and the fetch() target.
    action: { type: 'url', required: true },
    // The field schema: { name, label, type: text|email|tel|textarea, required }.
    fields: {
      type: 'list',
      required: true,
      minItems: 1,
      maxItems: 8,
      itemSchema: {
        name: { type: 'string', required: true },
        label: { type: 'string', required: true },
        type: { type: 'enum', required: true, values: ['text', 'email', 'tel', 'textarea'] },
        required: { type: 'boolean', required: false, default: false },
      },
    },
    // Markdown shown in place of the form after a successful JSON submit.
    successMessage: { type: 'string', required: false },
  },
  slots: {
    // Optional decorative framing above the fields (heading / subhead), as L1.
    intro: { required: false },
    // Optional L1 look for the submit button; absent → a plain functional button.
    submit: { required: false },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies CapabilityMeta
