/**
 * The submission vocabulary — the names a `contact-form` puts on the wire, and
 * the one place both ends of the seam read them from ([[REQ-223]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, on `builder/contact-events.js`'s
 * precedent. Three parties have to agree on these strings and none of them can
 * see the others: the component that renders the form, the client that
 * serialises it, and the Worker that receives it — which lives in a different
 * app and could not import a component without pulling the whole renderer in.
 * A literal written at any of those ends is a second answer to what the honeypot
 * is called, free to drift by one character in silence, and the failure is
 * SILENT: a honeypot the server looks for under the wrong name is a honeypot
 * that never catches anything and never says so.
 *
 * NONE OF THESE IS A FIELD AN AUTHOR MAY NAME. They are reserved — the receiver
 * strips them out of the submitted bag before anything is recorded — so a form
 * whose author called a field `fc_form` would find it ignored rather than
 * stored, which is the safe direction of that collision.
 */

/**
 * The honeypot: hidden from humans, tempting to bots, and rejected when filled.
 *
 * The component has rendered this since [[REQ-85]] and `client.js` has
 * deliberately sent it since then too, its comment saying *"the honeypot field
 * rides along so the server can reject filled-honeypot submissions"*. The server
 * half did not exist because the server did not exist.
 */
export const HONEYPOT_FIELD = 'hp_company_url'

/**
 * Turnstile's own response field.
 *
 * NAMED BY CLOUDFLARE, NOT BY US. The widget injects `<input type="hidden"
 * name="cf-turnstile-response">` into the enclosing form itself, so this string
 * is a fact about their product; it is spelled here so that the verifier and the
 * stripper agree with the thing that writes it.
 */
export const TURNSTILE_FIELD = 'cf-turnstile-response'

/**
 * Which form instance this submission came from.
 *
 * IT IS A HANDLE AND NOT A PAYLOAD. What the receiver does with it is look the
 * instance up in the site's own published definition — the asset the form
 * promised, the consent wording it showed, what its submit button said — so a
 * caller who edits this value can only name another instance that already
 * exists in the same site, and can never assert anything about one.
 */
export const FORM_INSTANCE_FIELD = 'fc_form'

/**
 * What a ticked `checkbox` field submits ([[REQ-223]] §7).
 *
 * A VALUE RATHER THAN THE BROWSER'S DEFAULT `on`. An unticked box submits
 * nothing at all, so presence IS the answer and the value is only what the
 * answer reads as in a stored record — and `hp_company_url=on` reads as a
 * browser artefact where `yes` reads as a person's answer.
 */
export const CHECKBOX_VALUE = 'yes'

/** Every reserved name, for a receiver stripping them out of the field bag. */
export const RESERVED_FIELDS: readonly string[] = [
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
  FORM_INSTANCE_FIELD,
]

/**
 * The field types a `contact-form` admits.
 *
 * `checkbox` IS THE CONSENT RECORD AND NOT A FOURTH INPUT FLAVOUR ([[REQ-223]]
 * §7). Capture does not depend on it — asking for a whitepaper is its own
 * request — and what it governs is being added to a mailing list, which is a
 * separate purpose and has to be separately evidenced. That is why its answer
 * AND the wording it was shown under both reach the stored provenance.
 */
export const FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'checkbox'] as const

export type ContactFormFieldType = (typeof FIELD_TYPES)[number]
