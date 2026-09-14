import type { BehaviorMeta } from '../behavior'

/**
 * `account-portal` ([[REQ-183]]) — the surface an account is shown of itself.
 *
 * WHAT IT IS FOR. [[DOC-40]] §2.1: the page showing an account its relationship
 * with a business is **the customer portal of that business's site**, rendered by
 * the code that will render the portal our customers give their own customers.
 * The failure mode §2.1 rule 1 names is the bespoke admin billing page — the same
 * page a customer needs, built once for us and once for them — so this is a
 * behaviour module in the ordinary catalog rather than a template in the control
 * app, and the portal is authored as ordinary site content around it.
 *
 * WHAT MAKES IT A BEHAVIOUR RATHER THAN A LAYOUT. Two things, and both are
 * behavioural in the sense [[DOC-25]] means:
 *
 *  - the facts are **per visitor and not per page**, so they arrive from an
 *    authenticated endpoint at request time rather than being authored into the
 *    definition. That is what keeps the page identical for everybody and
 *    therefore genuinely site content;
 *  - the erasure explanation is **progressively disclosed**, which is a state a
 *    static L1 subtree has no axis to express.
 *
 * IT PAINTS NOTHING. The portal's whole presentation is the L1 subtree in
 * {@link slots}; the delete affordance is an L1 `control` node; the only CSS the
 * module ships belongs to its invariant elements ([[DOC-25]] §10.3). The same
 * contract `contact-form` has, for the same reason.
 *
 * WHAT IT DELIBERATELY CANNOT DO ([[REQ-183]] §4.1, §6). It never deletes and it
 * never grants. [[DOC-37]] is the deletion design and it is not the tail of this
 * module.
 *
 * THE CONTRACT WAS READ-ONLY AND IS NOW OPEN BY EXACTLY ONE THING
 * ([[REQ-245]] §2). It used to be that there was no config field naming anything
 * but the account endpoint and no verb in `client.js` other than a `GET`, so
 * "the button does not delete the account" was a property of the contract rather
 * than of a branch someone could flip. That reasoning is not discarded — it is
 * why the opening is BOUNDED rather than why it never happens:
 *
 *   - the second endpoint is {@link accountPortalMeta.config.acceptances}, and
 *     the one write on it SETS AND UNSETS A PREFERENCE — an acceptance the
 *     contact may revoke at will, which is theirs by definition ([[REQ-240]] §2);
 *   - the endpoint itself refuses every key whose type is not a preference, so
 *     a document acceptance and a request are shown and are not changeable, and
 *     a new key of either acquires that behaviour with this module untouched;
 *   - there is still no field naming a destructive endpoint, and `client.js`
 *     still issues no `DELETE`, `PUT` or `PATCH` — only the `GET` it always made
 *     and the one `POST` this opening is.
 *
 * So the property a UAT asserts has changed shape rather than gone: the module
 * makes exactly two kinds of request, to exactly two declared endpoints, and one
 * of them can only ever move a preference.
 */
export const accountPortalMeta = {
  id: 'account-portal',
  version: 1,
  kind: 'behavior',
  config: {
    /**
     * Where the module reads WHO IS ASKING — an endpoint that requires an
     * identity and answers only about the caller ([[REQ-183]] §2, §6).
     *
     * A URL rather than a fixed path because the portal moves origins: today it
     * is the control app's own businesses endpoint, and at level 2 it is whatever
     * a customer's origin exposes. Reading it as config is what makes that a
     * different site definition rather than a different module.
     *
     * READ-ONLY. The client `GET`s this and nothing else — a portal that can
     * grant itself access is not a portal ([[REQ-183]] §6), and a portal that can
     * delete is [[DOC-37]]'s work. Neither changes under [[REQ-245]]: the write
     * it adds is on {@link acceptances} and reaches nothing here.
     */
    account: { type: 'url', required: true },
    /**
     * Where the module reads WHAT THIS CONTACT HAS AGREED TO, and posts the one
     * thing they may change ([[REQ-245]]).
     *
     * OPTIONAL, so a portal authored before this existed stays valid and simply
     * draws no agreements. The section is hidden until the endpoint answers with
     * something, which is the same direction every other fact on this surface
     * moves in: absent means absent rather than an empty box.
     *
     * ITS OWN FIELD AND NOT A SECOND USE OF {@link account}. What may be written
     * has to be legible from the contract — one endpoint that answers who is
     * asking and is only read, one endpoint that carries preferences and is
     * written — and a single URL doing both would make "what can this module
     * change" a question about a handler somewhere else.
     */
    acceptances: { type: 'url', required: false },
    /**
     * What the erasure explanation is folded away under before it is asked for.
     *
     * Behavioural copy, not styling: the words label an affordance the module
     * owns the state of, exactly as `contact-form`'s `submitLabel` does. The
     * control's LOOK is entirely its L1 node's.
     */
    revealLabel: { type: 'string', required: false, default: 'Delete account' },
    /** The label the disclosure carries once it is open. */
    dismissLabel: { type: 'string', required: false, default: 'Close' },
    /**
     * What the agreements section is headed, when there is one ([[REQ-245]]).
     *
     * BEHAVIOURAL COPY ON THE SAME GROUNDS AS {@link revealLabel}: the words
     * label a region whose very PRESENCE the module owns — it appears only when
     * the endpoint returned something, which no L1 subtree can express. The
     * region's look is entirely the L1 around it; this is its name.
     *
     * THE ROWS ARE NOT NAMED HERE AND MUST NOT BE. Each is labelled by the
     * business's own definition of that acceptance ([[REQ-245]] §3), so a list
     * of preferences in this config would be a second answer to which ones a
     * business holds, free to drift from the first.
     */
    preferencesLabel: { type: 'string', required: false, default: 'Your preferences' },
  },
  slots: {
    /**
     * The portal's own presentation: whatever the site says about itself, the
     * account line, and the delete control. Required — a portal with no authored
     * presentation has no visible control at all, and failing that at validation
     * is far better than rendering an empty box.
     */
    body: { required: true },
    /**
     * The [[DOC-37]] §6.1 explanation — what erasure destroys, what survives, and
     * why each survivor serves the person. Required, and required for a reason
     * the acceptance states: the control may not exist without the sentence that
     * makes what it does true.
     */
    erasure: { required: true },
  },
  controls: {
    /** The affordance that opens the explanation. */
    reveal: { element: 'button', required: true },
    /** Folds it away again. Optional — a page may leave it open once opened. */
    dismiss: { element: 'button', required: false },
    // ── Invariant elements ([[DOC-25]] §10.3) — obligation, not taste ─────────
    /**
     * Where the account line is written, and where the businesses this account
     * operates are listed ([[REQ-183]] D6).
     *
     * INVARIANT BECAUSE THEY ARE NOT COPY. What they hold is the reader's own
     * facts, fetched; a designer who could bind, move or replace them could leave
     * a portal whose explanation names businesses it did not fetch — which is the
     * one thing on this surface that must not be possible ([[DOC-37]] §6.2).
     */
    identity: { element: 'span', required: false, invariant: true },
    holdings: { element: 'span', required: false, invariant: true },
    /**
     * The agreements list ([[REQ-245]]).
     *
     * INVARIANT FOR THE SAME REASON THE TWO ABOVE ARE, AND MORE SO. Its CONTENT
     * is the reader's own facts, fetched; its MEMBERSHIP is the business's own
     * definitions, also fetched. There is no author-time roster for an L1 subtree
     * to bind against — which is exactly why `contact-form`'s `perItemOf` shape
     * does not reach here: that resolves one control per item of a CONFIG list,
     * and a config list is the thing §3 forbids.
     *
     * WHICH ROWS CARRY A CONTROL IS THE ENDPOINT'S ANSWER, not this module's.
     * Each row arrives marked editable or not, from the key's own type, so a page
     * cannot be authored that offers to withdraw a document.
     */
    preferences: {
      element: 'ul',
      required: false,
      invariant: true,
      invariantPresentation:
        'one row per acceptance the endpoint returned, in the order it returned ' +
        'them; the module supplies the list, the checkbox and nothing else, and ' +
        'every paint axis is inherited from the L1 around it',
    },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies BehaviorMeta
