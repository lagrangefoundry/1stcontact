import type { BehaviorMeta } from '../behavior'

/**
 * `account-chrome` ([[REQ-200]]) — the two controls a site with accounts owes
 * the person looking at it: a way in, and a way to their own portal.
 *
 * IT IS NOT PLATFORM CHROME, AND THAT IS THE WHOLE POINT. The obvious build is
 * for the apex Worker to paint a Sign In link in the corner of 1st Contact's own
 * page. That is [[DOC-40]] §2.1 rule 1's named failure — a capability built for
 * the platform that every customer needs too. A customer's site may have
 * accounts: people who sign in, hold a portal, and have a relationship with that
 * business. When it does it needs exactly these two controls, so they are a
 * feature of ANY 1c site that has accounts, and 1st Contact's own site is simply
 * the first one.
 *
 * IT IS NOT A FEATURE OF EVERY SITE EITHER. Plenty of sites have no accounts at
 * all, and a login link on a brochure site is a dead end that invites confusion.
 * So the capability is present or absent PER SITE, declared in `site.json`
 * (`config.capabilities.accounts`) and never derived — see the note on
 * `siteCapabilitiesSchema` for why derivation cannot work here.
 *
 * IT IS A MODULE RATHER THAN WORKER-PAINTED MARKUP so that **L1 decides where it
 * goes and what it looks like**: placement is a slot, styling is the L1 tree in
 * that slot, and a site that wants the portal control in the footer and the
 * Sign In link in the header can have exactly that. It ships a preset
 * (`l2/account-chrome.ts`), so a site can instantiate it without authoring L1.
 *
 * IT NEVER BRANCHES ON WHICH SITE OR BUSINESS IT IS RENDERING FOR. The builder
 * link appears when the signed-in person **operates at least one business** —
 * a fact about the person (`memberships`), not about the site they are looking
 * at. It happens to be true of one person today; an agency customer would see it
 * too, and would be right to.
 *
 * IT AUTHENTICATES NOTHING AND GATES NOTHING. It renders every state into the
 * page and lets the serving Worker say which is current ({@link ./session});
 * no published content varies by who is looking, and there is no verb here other
 * than the address POST the sign-in dialog makes.
 */
export const accountChromeMeta = {
  id: 'account-chrome',
  version: 1,
  kind: 'behavior',
  config: {
    /**
     * Where the address the visitor types is POSTed — the sign-in issue
     * endpoint for THIS site's cookie domain ([[REQ-134]]).
     *
     * A URL rather than a fixed path because a site is not always served from
     * the origin that mints its sessions, and because a customer site on its own
     * domain has its own session and its own endpoint. Reading it as config is
     * what makes that a different site definition rather than a different module.
     */
    signIn: { type: 'url', required: true },
    /** Where the signed-in control goes: this site's account portal. */
    portal: { type: 'url', required: true },
    /**
     * Where the builder link goes for a person who operates a business.
     *
     * Required rather than defaulted. A default would have to name 1st
     * Contact's own builder, which is the platform special case this module
     * exists to avoid; a site that has accounts states its own answer.
     */
    businesses: { type: 'url', required: true },
    /** The signed-out control's words. */
    signInLabel: { type: 'string', required: false, default: 'Sign in' },
    /** The signed-in control's words. */
    portalLabel: { type: 'string', required: false, default: 'Your account' },
    /** The builder link's words. */
    businessesLabel: { type: 'string', required: false, default: 'My businesses' },
    /** The dialog's field label — programmatic, and visible unless L1 hides it. */
    emailLabel: { type: 'string', required: false, default: 'Email address' },
    /** The dialog's submit affordance. */
    submitLabel: { type: 'string', required: false, default: 'Send me a link' },
    /** The dialog's close affordance. */
    dismissLabel: { type: 'string', required: false, default: 'Close' },
    /**
     * What the dialog says once the address has been sent.
     *
     * ONE MESSAGE, SHOWN WHATEVER THE SERVER ANSWERS. The response must not
     * reveal who is on the list ([[REQ-134]]), so `client.js` never reads it:
     * the message appears when the request COMPLETES, at any status. A known
     * address and an unknown one are therefore indistinguishable here by
     * construction rather than by the endpoint remembering to be careful.
     */
    sentMessage: {
      type: 'string',
      required: false,
      default: 'Check your email for a sign-in link.',
    },
  },
  slots: {
    /**
     * What a visitor with no session sees — the Sign In control and whatever
     * frames it. Required: a chrome with no authored presentation has no visible
     * control at all, and failing that at validation beats rendering an empty box.
     */
    signedOut: { required: true },
    /** What a signed-in visitor sees — the portal control and its framing. */
    signedIn: { required: true },
    /**
     * The builder link, in its own slot rather than inside `signedIn`.
     *
     * Its visibility is a THIRD state, not a decoration of the second: a signed-in
     * person who operates no business must not see it. A slot of its own is what
     * lets the module hide it without reaching into an L1 subtree it does not own.
     */
    businesses: { required: true },
    /** The sign-in dialog: the address field, the submit, the close. */
    dialog: { required: true },
  },
  controls: {
    /** Opens the sign-in dialog. */
    signIn: { element: 'button', required: true },
    /** Navigates to this site's account portal. */
    portal: { element: 'a', required: true },
    /** Navigates to the builder, for a person who operates a business. */
    businesses: { element: 'a', required: true },
    /** The address the visitor types. */
    email: { element: 'input', required: true },
    /** Sends it. */
    submit: { element: 'button', required: true },
    /** Closes the dialog without sending. */
    dismiss: { element: 'button', required: false },
    // ── Invariant elements ([[DOC-25]] §10.3) — obligation, not taste ─────────
    /**
     * The programmatic label for the address field: present and associated for
     * assistive technology, and never bound to an L1 node — a chrome whose
     * designer could unlabel the one field on it is a chrome that can ship
     * inaccessible.
     */
    emailLabel: { element: 'span', required: false, invariant: true },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies BehaviorMeta
