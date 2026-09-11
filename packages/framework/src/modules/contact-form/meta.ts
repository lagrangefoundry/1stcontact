import type { BehaviorMeta } from '../behavior'
import { FIELD_TYPES } from './fields'

/**
 * `contact-form` (reframed to a behavior by REQ-85; made layout-agnostic **by
 * construction** by REQ-96) — a lead-capture form.
 *
 * The vetted core keeps everything behavioural: the field schema, the a11y label
 * association, the honeypot + Turnstile anti-spam surface, the no-JS
 * `<form method=post>` baseline, and the JSON-`fetch` progressive enhancement
 * (`client.js`).
 *
 * REQ-96 — it now ships **no stylesheet** beyond its invariant elements. The
 * form's whole presentation is an L1 subtree in the `form` slot; each control is
 * a `control` node inside it, painted by L1 and given its attribute bundle by the
 * module (`controls.ts`). This closes the gap DOC-25 §10 names: a `slot` can only
 * express "the module wraps L1", which is structurally impossible for a leaf like
 * `<input>`, so before this the module *had* to paint its own fields and no
 * validator could catch it.
 *
 * The slot is **required**: a form with no authored presentation has no visible
 * controls at all, and failing that loudly at validation is far better than
 * rendering an empty box. A site with no capture to transcribe fills it from the
 * L2 default preset (`l2/contact-form.ts`) — a starting point, not a ceiling.
 */
export const contactFormMeta = {
  id: 'contact-form',
  version: 4,
  kind: 'behavior',
  config: {
    // Submission endpoint — the no-JS form action and the fetch() target.
    action: { type: 'url', required: true },
    // The field schema: { name, label, type, required } — see FIELD_TYPES.
    fields: {
      type: 'list',
      required: true,
      minItems: 1,
      maxItems: 8,
      itemSchema: {
        name: { type: 'string', required: true },
        label: { type: 'string', required: true },
        // REQ-93 — how the reference labelled this control, from the a11y tree's
        // `nameSource`. `placeholder` puts the label inside the box (the control
        // gets a `placeholder` attribute); `visible` leaves the words to be
        // authored as an L1 text run beside the control. Not an aesthetic dial:
        // it is a captured FACT about the control's accessible name, and the a11y
        // tree is its only witness.
        labelMode: { type: 'enum', required: false, values: ['visible', 'placeholder'], default: 'visible' },
        // THE VALUES COME FROM THE MODULE THAT NAMES THEM ([[REQ-223]]). A list
        // restated here is a second answer to what a field type is, and the half
        // that drifts is whichever one the next type is not added to.
        type: { type: 'enum', required: true, values: FIELD_TYPES },
        required: { type: 'boolean', required: false, default: false },
      },
    },
    /*
     * THE ASSET THIS FORM PROMISES ([[REQ-223]] §5), in three parts because
     * `config` has no object type and a list of one would be a shape pretending
     * to be a set.
     *
     * BOTH OR NEITHER, AND THE RECEIVER ENFORCES IT. `asset` is the stable key
     * the at-most-once ledger remembers a delivery by; `assetUrl` is what the
     * message links to. A key with no URL is an asset nothing can deliver and a
     * URL with no key is a delivery nothing can remember having made — so half a
     * declaration is read as none rather than as a best effort.
     *
     * IT IS BEHAVIOURAL AND NOT CONTENT. What the mail SAYS is a template in the
     * business's own store, editable without a deploy; what this names is which
     * artifact the form is gated on, which is a fact about the form.
     *
     * THE RECEIVER READS IT FROM THE PUBLISHED DEFINITION AND NEVER FROM THE
     * SUBMISSION. That is what stops a caller naming an asset — or a URL — of
     * their own by editing what their browser posts.
     */
    asset: { type: 'string', required: false },
    // What the message calls it. Prose, not an identifier — "both whitepapers".
    assetName: { type: 'string', required: false },
    // Where the artifact lives. Sent as the message's one call to action.
    assetUrl: { type: 'url', required: false },
    // Markdown shown in place of the form after a successful JSON submit.
    successMessage: { type: 'string', required: false },
    // The submit button's words. Behavioural copy, not styling — the button's
    // look is entirely the `submit` control node's L1 axes.
    submitLabel: { type: 'string', required: false, default: 'Send' },
  },
  slots: {
    // The form's entire presentation as one L1 subtree: the decoration, and a
    // `control` node per element below. Required — see the note above.
    form: { required: true },
  },
  controls: {
    // One control per `config.fields` entry, named by that field's `name`.
    field: { element: 'input', perItemOf: 'fields', required: true },
    // The submit affordance. Optional: a single-field form still submits on
    // Enter, so a reference that painted no button is faithfully reproduced.
    submit: { element: 'button', required: false },
    // ── Invariant elements (DOC-25 §10.3) — obligation, not taste ────────────
    // Each is presentation the module fixes because an obligation fixes it, and
    // is therefore never bound to an L1 node: a designer must not be able to
    // reveal the honeypot, unhide a programmatic label, or move the Turnstile
    // mount away from where the widget expects it.
    label: { element: 'span', required: false, invariant: true },
    honeypot: { element: 'input', required: false, invariant: true },
    turnstile: { element: 'span', required: false, invariant: true },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies BehaviorMeta
