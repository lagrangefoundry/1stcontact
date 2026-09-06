/**
 * The one seam between a published site's bytes and the person requesting them
 * ([[REQ-200]]).
 *
 * WHY A STRING TRANSFORM RATHER THAN A RE-RENDER. A published site is an
 * immutable snapshot of rendered bytes ([[DOC-12]] §7) and `public-site` serves
 * them out of R2; re-rendering per request would make the published channel show
 * something other than what was published, which is the one thing that channel
 * exists to guarantee. So the module renders EVERY state into the snapshot and
 * the serving Worker says which one is current, by rewriting a single attribute
 * whose value is the state's name. Nothing else in the page moves.
 *
 * WHICH IS WHY THE MARKER IS DECLARED HERE, next to the component that emits it.
 * The producer and the consumer are the same file, so a change to the markup
 * cannot leave a Worker rewriting an attribute that is no longer there.
 *
 * THE SIGNED-OUT TRANSFORM IS THE IDENTITY. The snapshot is rendered signed-out,
 * so an anonymous request is served the bytes exactly as published — the common
 * case costs nothing, and the states only ever swap in the direction the session
 * justifies.
 */

/** The attribute carrying the current state, on the module's root element. */
export const ACCOUNT_CHROME_STATE_ATTR = 'data-account-chrome'

/** The attribute marking a signed-in person who operates at least one business. */
export const ACCOUNT_CHROME_BUSINESSES_ATTR = 'data-account-chrome-businesses'

/** How the module is rendered before any session is known. */
export const ACCOUNT_CHROME_SIGNED_OUT = `${ACCOUNT_CHROME_STATE_ATTR}="signed-out"`

/**
 * What the serving Worker knows about the person asking.
 *
 * NEITHER FIELD NAMES A SITE OR A BUSINESS, deliberately. `operatesBusiness` is
 * a fact about the PERSON — whether they hold any membership at all — and not
 * about the site they happen to be reading. That is what makes the builder link
 * a general rule rather than a platform special case: an agency customer
 * operating their own client's business sees it, and is right to.
 */
export interface AccountChromeSession {
  /** Whether the request carried a valid session for this cookie domain. */
  signedIn: boolean
  /** Whether that person operates at least one business. */
  operatesBusiness: boolean
}

/**
 * Whether this HTML carries an `account-chrome` instance — and therefore whether
 * its bytes depend on who is asking.
 *
 * Read off the markup rather than from a database column so that the answer
 * cannot disagree with the page: a response with no chrome in it is an ordinary
 * anonymous page and stays as cacheable as it ever was.
 */
export function hasAccountChrome(html: string): boolean {
  return html.includes(ACCOUNT_CHROME_SIGNED_OUT)
}

/**
 * Select the rendered state for `session`, in place, in the published bytes.
 *
 * Every instance on the page is switched: two chromes on one page (a header and
 * a footer, which is exactly the placement freedom the module is a module for)
 * must not disagree about whether the reader is signed in.
 */
export function applyAccountChromeSession(html: string, session: AccountChromeSession): string {
  if (!session.signedIn) return html
  const replacement =
    `${ACCOUNT_CHROME_STATE_ATTR}="signed-in"` +
    (session.operatesBusiness ? ` ${ACCOUNT_CHROME_BUSINESSES_ATTR}` : '')
  return html.split(ACCOUNT_CHROME_SIGNED_OUT).join(replacement)
}
