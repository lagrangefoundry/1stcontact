/**
 * The submission vocabulary — the names a `contact-form` puts on the wire, the
 * address it puts them on, and the one place both ends of the seam read them
 * from ([[REQ-223]], [[BUG-86]]).
 *
 * THE ADDRESS IS HERE FOR THE SAME REASON THE NAMES ARE ([[BUG-86]]). It was a
 * `url` an author supplied, which meant the endpoint of this product's own lead
 * capture was a string somebody had to know and type — and the three parties
 * below have exactly as much trouble agreeing on where a submission goes as on
 * what its honeypot is called. It is one constant now, and no longer a setting.
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
 * Where a submission goes, as the route grammar names it ([[BUG-86]]).
 *
 * NOT A SETTING, AND THAT IS THE FIX. `config.action` was `{ type: 'url',
 * required: true }`, so the whole of the guidance an author got was
 * "`action` — url; required" — no default, no mention that the product has a
 * lead endpoint at all. What that produced is on the record: a route that had
 * never been built, a third party's API, and `https://example.com/enquiry`.
 * The endpoint of this module's own capture is a fact about the product, so the
 * module states it rather than asking.
 *
 * IT IS THE SAME STRING `public-site` ROUTES ON. Its grammar yields this path
 * for `/api/lead` against the apex and for `/site/<key>/api/lead` against a
 * named site, and `control-app`'s preview answers the same suffix under its own
 * channel root. A second spelling at either end would be a form and a server
 * that agree until they do not — the failure this whole file exists to prevent.
 */
export const LEAD_PATH = 'api/lead'

/**
 * The same address as a form's `action`: DOCUMENT-RELATIVE, and explicitly so.
 *
 * THE LEADING `./` IS LOAD-BEARING, for the two RFC-3986 readings `relativizeUrl`
 * already records ([[BUG-30]]). A reference with no path segment resolves against
 * the DOCUMENT rather than its directory, and a first segment containing a colon
 * is read as a scheme; an explicit `./` forecloses both. It is what every other
 * URL the renderer emits is reduced to, and the form's action was the one sink
 * that skipped it.
 *
 * ONE CONSTANT IS CORRECT ON EVERY SURFACE, with nothing configured per site,
 * because a page slug is a single flat segment — so a document's directory is
 * always its channel root:
 *
 *   - preview  `/b/<biz>/preview/<slug>/draft/…` → `/b/<biz>/preview/<slug>/draft/api/lead`
 *   - apex     `/` or `/whitepapers`             → `/api/lead`
 *   - published `/site/<key>/…`                  → `/site/<key>/api/lead`
 *
 * The last line is why this closes [[BUG-78]]'s finding 2 as well as [[BUG-86]]:
 * a root-relative `/api/lead` served under `/site/<key>/` named the APEX, so a
 * published site's leads landed in another tenant's contact list.
 */
export const LEAD_ACTION = `./${LEAD_PATH}`

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

/**
 * The acceptances a PUBLIC CAPTURE FORM may set ([[REQ-242]] §3).
 *
 * A POLICY OF THIS MODULE AND NOT A SECOND COPY OF THE REGISTRY. What an
 * acceptance key exists and how it behaves is `builder/acceptances.js`'s answer
 * and only ever will be. What THIS list answers is a different question the
 * registry has no business holding: which of those keys a form on a page
 * anybody can reach is allowed to assert. Two facts, and the module owns the
 * second one because [[BUG-86]]'s reasoning says it must — removing the ability
 * to misconfigure beats documenting the correct setting, and the only place a
 * config value can be made structurally unauthorable is the contract.
 *
 * SO A TYPE 1 (DOCUMENT) KEY IS ABSENT, AND THAT IS THE WHOLE POINT. A capture
 * form takes an unknown address and produces a contact at `pipeline_stage =
 * 'lead'`; becoming a member is `tos_accepted_at` and is the sign-up flow's
 * business, with its own route and its own refusals. A `values` list that
 * omitted nothing would leave every deployment one config edit away from
 * granting membership from a form a stranger can post to.
 *
 * IT IS HERE RATHER THAN IMPORTED because the framework cannot depend on an
 * app: the registry lives in `control-app` (it has to be readable from a
 * browser panel), and `packages/framework` is upstream of it. What keeps the
 * three spellings honest is not an import but a UAT at the seam, plus the
 * receiver's own guard — `lead.ts` asks the registry whether a key it read from
 * a stored config is declared and settable before recording anything under it,
 * so drift is refused at the write rather than silently written.
 */
export const FORM_ACCEPTANCE_KEYS = ['newsletter', 'beta_requested', 'whitepapers'] as const

export type FormAcceptanceKey = (typeof FORM_ACCEPTANCE_KEYS)[number]
