import type { BehaviorMeta } from '../behavior'
import { FIELD_TYPES, FORM_ACCEPTANCE_KEYS } from './fields'
import { contactFormV4ToV5, contactFormV5ToV6, contactFormV6ToV7 } from './migrate'

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
  version: 7,
  kind: 'behavior',
  config: {
    /*
     * THERE IS NO `action` HERE ANY MORE ([[BUG-86]]).
     *
     * It was `{ type: 'url', required: true }`, which made the submit target of
     * this product's own lead capture a value somebody had to know and type.
     * The generated reference the builder AI reads rendered the whole of it as
     * "`action` — url; required": no default, no hint that the product has a
     * lead endpoint, nothing that could tell an author the right answer. What
     * that produced is on the record in [[BUG-86]] — a route that had never
     * been built, a third party's API, and `https://example.com/enquiry`.
     *
     * THE ENDPOINT IS THE MODULE'S, NOT THE PAGE'S. It is emitted by
     * `component.ts` from `LEAD_ACTION`, document-relative, and is correct on
     * every channel with nothing configured per site. The author's freedom is
     * unchanged where it belongs: the `form` slot, every `control` node and the
     * whole L1 subtree are untouched by this. What went away is the ability to
     * misconfigure the functionality, not the ability to design it.
     *
     * AND IT IS NOT A GENERAL WEB FORM. This module captures an email into the
     * site's own contact list; a form that could post elsewhere would look like
     * this product's capture and silently be none of it — no contact record, no
     * asset delivery, no server-side honeypot, no Turnstile.
     */
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
        /*
         * WHICH ACCEPTANCE THIS BOX IS ([[REQ-242]] §2, explicit).
         *
         * WITHOUT IT A CHECKBOX IS LINKED TO NOTHING BUT ITS OWN LABEL. That
         * was the state this closes: the answer and its wording reached one
         * event's `detail` as a blob nothing read back, so there was no way to
         * say that THIS box is the newsletter and no way to ask who is on it.
         * Named, the tick writes queryable state and the label travels as the
         * evidence — and the label is still the label, unchanged.
         *
         * THE CLOSED SET IS THE REFUSAL ([[REQ-242]] §3). It omits every
         * document key, so no configuration of a capture form can accept terms
         * or produce a member; that is a property of the contract rather than a
         * flag somebody has to leave alone.
         *
         * READ ONLY ON A `checkbox`, because a tick is the only answer a box
         * gives that means yes-or-no. A mapping on a text field would be this
         * module inventing what typing something into a box consents to, so the
         * receiver does not read one.
         */
        acceptance: { type: 'enum', required: false, values: FORM_ACCEPTANCE_KEYS },
      },
    },
    /*
     * THE ACCEPTANCES PRESSING THE BUTTON ASSERTS ([[REQ-242]] §2, implied).
     *
     * WHY IT IS NOT A LIST OF KEYS. "Pressing the button means you accepted the
     * terms" is only true if the page said so beside the button, so an implied
     * acceptance carries the wording it was asserted under and carries it as a
     * REQUIRED field. One with no wording is evidence-free — the transition
     * could never be shown to have been agreed to by anybody — so it is refused
     * at validation rather than recorded as though it meant something. The
     * refusal names the KEY and not the position (`itemKey`), because the author
     * was declaring an acceptance and not a list entry.
     *
     * THE WORDING IS THE EVIDENCE RECORD AND NOT THE RENDERED SENTENCE, exactly
     * as a field's `label` is: `labelMode: 'visible'` leaves the words to be
     * authored as an L1 text run, and this is the same seam. The vetted default
     * presentation (`l2/contact-form.ts`) does emit a run per entry above the
     * submit control, so a form instantiated from config alone says on the page
     * what it records — but an author who replaces that subtree owns keeping the
     * two in step, as they already do for every visible label.
     *
     * THE SAME CEILING `fields` AND `assets` CARRY. A form asserting more than
     * eight things on one press is not a consent surface anybody read.
     */
    accepts: {
      type: 'list',
      required: false,
      maxItems: 8,
      itemKey: 'key',
      itemSchema: {
        key: { type: 'enum', required: true, values: FORM_ACCEPTANCE_KEYS },
        wording: { type: 'string', required: true },
      },
    },
    /*
     * THE ASSETS THIS FORM PROMISES ([[REQ-223]] §5, made a SET by [[REQ-241]]).
     *
     * WHY A LIST AND NOT THREE STRINGS. It was `asset`/`assetName`/`assetUrl`,
     * three siblings because `config` had no object type — and three siblings
     * can say exactly one thing. The XGD whitepapers page promises "both
     * papers" and could only be told about one of them, so "did they take both
     * or one of them" was not a question the stored shape could express: one
     * key, one URL, one ledger entry. A list of items is the shape that can
     * hold the answer, and `itemSchema` is how `config` says "object" now.
     *
     * BOTH OR NEITHER, PER ITEM, AND THE RECEIVER ENFORCES IT. `key` is the
     * stable handle the at-most-once ledger remembers a delivery by; `url` is
     * what the message links to. A key with no URL is an asset nothing can
     * deliver and a URL with no key is a delivery nothing can remember having
     * made — so half an item is read as no item rather than as a best effort,
     * and the other items on the same form are untouched by it. Nothing here is
     * `required`, for that reason: the rule is a READING and not a refusal, and
     * a validation error would turn one malformed item into a dead page.
     *
     * IT IS BEHAVIOURAL AND NOT CONTENT. What the mail SAYS is a template in
     * the business's own store, editable without a deploy; what this names is
     * which artifacts the form is gated on, which is a fact about the form.
     *
     * THE RECEIVER READS IT FROM THE PUBLISHED DEFINITION AND NEVER FROM THE
     * SUBMISSION. That is what stops a caller naming an asset — or a URL — of
     * their own by editing what their browser posts.
     */
    assets: {
      type: 'list',
      required: false,
      // The same ceiling `fields` carries. A form gating more than eight
      // artifacts is not a gated download; it is a library, and wants a page.
      maxItems: 8,
      itemSchema: {
        // The stable ledger key. Never shown to anybody — it is the name the
        // at-most-once rule remembers this artifact by for as long as the
        // business exists, so it must not change when the prose does.
        key: { type: 'string', required: false },
        // What the message calls it. Prose, not an identifier — "the field
        // guide". A set whose items share one name is a set nobody can tell
        // apart in their inbox, which is most of the point of naming them.
        name: { type: 'string', required: false },
        /*
         * Where the artifact lives, and for a set it is A PAGE RATHER THAN A
         * FILE ([[REQ-241]] §2). With one asset the message could link straight
         * at the artifact; a form promising several wants to land the reader
         * somewhere that lists them. Nothing here enforces which — a URL is a
         * URL — and the sender hands whatever is declared to the mail's one
         * call to action.
         */
        url: { type: 'url', required: false },
      },
    },
    /*
     * WHICH MESSAGE THIS FORM SENDS ([[REQ-243]], re-homed by [[REQ-247]]).
     *
     * IT USED TO BE ONE HARDCODED TEMPLATE, AND IT FIRED ONLY ON AN ASSET. The
     * receiver rendered `asset` and did so only when the form declared both a
     * key and a URL, so a form whose whole deliverable is a place on a list —
     * this product's own beta form — mailed nobody at all, and two forms on one
     * site could not say different things.
     *
     * IT NAMES AN EMAIL PAGE OF THIS SITE, which is the change [[REQ-247]]
     * makes. The value is a page id, exactly as a navigation target is; the copy
     * it names is an ordinary page with an L1 document, listed where every other
     * page is listed and edited with the operations an author already holds.
     * That closes the capability gap [[REQ-243]] left open — nothing could show
     * an operator what a form was about to mail, or author the words, because
     * the copy lived in a ticket store the assistant had no write grant to.
     *
     * A STRING AND NOT AN ENUM, STILL, and for a better reason than before. The
     * legal values are the site's own email pages, which no literal in this
     * repository can enumerate — but unlike a business's ticket store they are
     * in the very definition being written, so the check happens at the moment
     * of the act: configuring a form to name a page that does not exist is
     * refused on the spot, and the refusal names what the site does hold and the
     * operation that makes another. Publish refuses it too, for the drafts that
     * reach an invalid state by some other route.
     *
     * ABSENT MEANS NO MAIL, AND IS AN ORDINARY CONFIGURATION. A form that only
     * joins a mailing list captures the contact, records what the press
     * asserted, and sends nothing — so absence is the honest way to say it,
     * rather than a second key saying whether the first one counts.
     *
     * NOTHING HERE CAN NAME A SIGN-UP OR A SIGN-IN, and that is now structural
     * rather than checked. `invite` and `signin` mint redeemable credentials and
     * are sent by the BUSINESS, not by a site; they are business-scoped template
     * tickets and not pages of anything, so a form naming one meets the ordinary
     * "this site has no such message" refusal. The rule stopped being something
     * somebody could forget to enforce.
     */
    template: { type: 'string', required: false },
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
    label: {
      element: 'label',
      required: false,
      invariant: true,
      // [[BUG-76]] Defect 1 — `span` was what this said while the component
      // emitted `<label>`, and the same correction lands on `account-chrome`.
      invariantPresentation:
        'visually hidden — clipped out of the visual flow; a `placeholder` ' +
        "field's words reach a visitor through its `labelMode` instead",
    },
    honeypot: {
      element: 'input',
      required: false,
      invariant: true,
      invariantPresentation:
        'off-screen and out of the tab order — a bot fills it and a person ' +
        'never sees it, so a designer who could reveal it would break the check',
    },
    turnstile: {
      element: 'span',
      required: false,
      invariant: true,
      invariantPresentation:
        'an empty mount the widget replaces; it must sit where the widget ' +
        'expects it, so nothing here is the page’s to move',
    },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
  /**
   * [[BUG-85]] — nothing is stored below v4, so no migration into v2 or v3 is
   * written.
   *
   * THE EVIDENCE, because this field is a claim about the world and a claim
   * needs one. The 3 → 4 bump landed in `3d35dec430` on 2026-07-25. The
   * earliest site in the cloud store was created 2026-09-06, six weeks later,
   * so every instance there was born at v4; `0b5a32d465` and `3d35dec430`
   * between them carried the file-backed fixtures. An audit of both stores
   * while diagnosing BUG-85 found ten stored `contact-form` instances, all v4.
   *
   * This module has therefore never been through the failure BUG-85 is about,
   * which is exactly why it never taught anyone the lesson `account-chrome`
   * did. Re-run `1c module upgrade <slug>` against a real store to re-check the
   * claim; if an older pin ever turns up, the upgrade refuses it by name and
   * says to lower this number.
   */
  migrationsFrom: 4,
  /**
   * The steps into v5, v6 and v7, each declared beside the bump that needs it
   * ([[BUG-85]]) — a declared step is the PRECONDITION for a bump, not a
   * courtesy.
   *
   * v5 carries nothing, and `migrate.ts` explains at length why it is written
   * down anyway: an identity function is how a bump says "nothing to carry" in
   * a way that cannot be mistaken for the omission the guard exists to catch.
   *
   * v6 is the other kind. It has real work — the asset triple becomes a
   * one-item list, and an instance that promised nothing becomes one carrying
   * an empty one — and both readings exist in the stores, so both are
   * exercised rather than assumed.
   *
   * v7 is the same kind as v6 and for a sharper reason ([[REQ-243]]). Naming no
   * template means sending no mail, so a v6 instance carried forward untouched
   * would go quiet — and every gated download this product has ever delivered
   * is a v6 instance carrying assets and no template. The step names `asset`
   * for exactly those, which is the template they were already sending, and
   * leaves an instance that promised nothing naming nothing, which is what it
   * was already doing.
   */
  migrations: { 5: contactFormV4ToV5, 6: contactFormV5ToV6, 7: contactFormV6ToV7 },
} as const satisfies BehaviorMeta
