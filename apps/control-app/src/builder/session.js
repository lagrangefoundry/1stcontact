/**
 * The builder's session: how it ends, who is told, and what is said ([[BUG-52]]).
 *
 * WHY A MODULE OF ITS OWN. Before this, an ended session was not represented
 * anywhere — each call in `api.js` met a 401 alone and turned it into whatever
 * local default read best at that one call site, and the three defaults together
 * drew a builder that looked fine and contained nothing: no account, no
 * businesses, no sites, and an assistant reporting itself healthy. A session is
 * one fact about the whole client, so it is one thing here rather than a rule
 * every route has to remember.
 *
 * THE SPLIT AGAINST `api.js` IS TRANSPORT VERSUS MEANING. `api.js` knows what a
 * 401 and a rejected fetch look like; this module knows what they MEAN, who
 * needs telling and in what words. It also keeps the dependency one-way — `api.js`
 * imports this and this imports nothing — where holding the error class beside
 * the fetches would have made the entry point and the shell import transport to
 * ask a question about identity.
 *
 * NOTHING HERE NAVIGATES BY ITSELF, and that is the load-bearing decision. The
 * person most likely to meet an expired session is mid-edit — a modal open, a
 * paragraph typed and not yet saved — and a client that reloaded on their behalf
 * would throw that away to fix a problem they had not yet been told about.
 * Recovery is a button they press when they are ready.
 *
 * NOR DOES ANYTHING HERE MAKE THE SHELL `inert`, which is the same decision seen
 * from the other side, and the one place this departs from REQ-173's
 * unconfigured-deployment block. That block covers a builder with nothing in it
 * yet; this covers a builder with the operator's unsaved work in it, and `inert`
 * removes a subtree from hit testing — so it would put their own half-typed text
 * behind a barrier they cannot even select it out of, immediately before the
 * recovery discards it. The shell therefore stays live: further calls refuse,
 * the notice has already said why, and the work stays reachable.
 */

/** The session's token was refused outright — a 401 from our own origin. */
export const SESSION_EXPIRED = 'expired'

/**
 * The call did not complete at all.
 *
 * BEHIND CLOUDFLARE ACCESS THIS IS WHAT A LAPSED COOKIE ACTUALLY LOOKS LIKE. The
 * Worker is never reached: Access answers first, with a cross-origin redirect to
 * its login origin that a background `fetch` may not follow, so the promise
 * rejects and there is no status code anywhere to find. Reading that as an
 * authentication failure is therefore the accurate reading of the common case
 * rather than a guess — and {@link sessionEndedMessage} still admits the other.
 */
export const SESSION_UNREACHABLE = 'unreachable'

const MESSAGES = {
  [SESSION_EXPIRED]: 'Your session has ended. Sign in again to carry on.',
  // HEDGED ON PURPOSE. A rejected fetch is a lapsed Access cookie most of the
  // time and an origin that is down the rest of it, and this side cannot tell
  // them apart. One button recovers from both, so the honest sentence names the
  // likely cause without asserting it.
  [SESSION_UNREACHABLE]:
    'The builder could not reach the server — your session may have ended. Sign in again to carry on.',
}

/** What to tell someone whose session ended, for either way of finding out. */
export function sessionEndedMessage(reason) {
  return MESSAGES[reason] ?? MESSAGES[SESSION_EXPIRED]
}

/**
 * The session behind every call has ended.
 *
 * ONE ERROR FOR BOTH WAYS OF FINDING OUT, because they are one fact. `reason`
 * keeps them distinguishable for the sentence shown to the operator; nothing
 * else branches on it.
 */
export class SessionEndedError extends Error {
  constructor(reason = SESSION_EXPIRED, cause = undefined) {
    super(sessionEndedMessage(reason))
    this.name = 'SessionEndedError'
    this.reason = reason
    if (cause !== undefined) this.cause = cause
  }
}

/** Whether a caught failure is the session ending rather than the call failing. */
export function isSessionEnded(error) {
  return error instanceof SessionEndedError
}

const handlers = new Set()

/**
 * Be told the moment any call discovers the session has ended.
 *
 * A SUBSCRIPTION RATHER THAN A RETURN VALUE, because the discovery and the
 * response happen in different places. Any of twenty calls can be the one that
 * finds out — a background site list, a save, an upload — and each already has a
 * caller with its own local idea of what a failure means. Requiring every one of
 * those callers to ALSO report a client-wide fact is how the next route added
 * quietly does not.
 *
 * @returns a function that unsubscribes.
 */
export function onSessionEnded(handler) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

/**
 * Tell everyone. Returns the error, so a caller can `throw announceSessionEnded(…)`.
 *
 * A COPY OF THE SET, and each handler in its own `try`: a subscriber that throws
 * must not stop the others being told, and must not turn "your session ended"
 * into an exception thrown out of whatever call happened to notice.
 */
export function announceSessionEnded(error) {
  for (const handler of [...handlers]) {
    try {
      handler(error)
    } catch {
      /* a listener's own failure is not the noticing call's business */
    }
  }
  return error
}

/**
 * The notice itself, in one of its two shapes.
 *
 * `variant: 'banner'` is the mid-session strip above a builder that is already
 * full of the operator's work; `'page'` is the whole-document version drawn when
 * the very first call is refused and there is no builder to put a strip on top
 * of. Two shapes, one wording and one action — which is the reason they are one
 * function rather than a banner here and a screen there.
 *
 * `signIn` DEFAULTS TO A TOP-LEVEL RELOAD because that is the one navigation
 * that actually recovers: Access answers a document request with its login page,
 * which it will never show to a background `fetch`. It is injectable so a suite
 * can prove the button is wired without the page going anywhere.
 */
export function createSessionNotice({
  reason = SESSION_EXPIRED,
  variant = 'banner',
  signIn = () => globalThis.location?.reload(),
} = {}) {
  const element = document.createElement('div')
  // ITS OWN CLASS, NOT `.builder-banner` ([[BUG-52]]). It wears the same strip
  // styling — the CSS names both — but it is a different fact from REQ-173's
  // "this deployment has no key" and REQ-179's "no business is selectable", and
  // a surface that has to tell the three apart must be able to.
  element.className =
    variant === 'page' ? 'builder-signed-out' : 'builder-session-notice'
  // `alert` rather than `status`, as everywhere else in this builder: this is
  // not progress, it is the reason the surface below has stopped answering.
  element.setAttribute('role', 'alert')
  element.dataset.sessionEnded = reason

  const text = document.createElement('span')
  text.className = 'builder-signed-out-message'
  text.textContent = sessionEndedMessage(reason)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'builder-signed-out-action'
  button.textContent = 'Sign in again'
  button.addEventListener('click', () => signIn())

  element.append(text, button)
  return { element, button, reason }
}

/**
 * Run the builder's opening calls, or say why there will be no builder.
 *
 * HERE RATHER THAN INLINE IN `main.js`, and the reason is evidence. `main.js`
 * imports three modules by absolute URL that only a browser can resolve, so
 * nothing but a browser can load it — a decision written there is a decision no
 * suite can drive. This is the decision; that file is the wiring around it.
 *
 * A REFUSED SESSION IS CAUGHT, ANY OTHER FAILURE IS RETHROWN. `main.js` awaits
 * this at top level, so a rejection takes the module down and leaves the page
 * blank until REQ-149's boot guard writes "the builder did not start" four
 * seconds later — a true sentence about the wrong subject when the answer is
 * simply that nobody is signed in. But a module that swallowed EVERY load error
 * to show one friendly sentence would report "sign in again" for a 500, a broken
 * import map and a mount that threw, which is the blank-page-with-no-reason
 * problem the boot guard exists to end.
 *
 * FILLING `root` IS ALSO WHAT STANDS THE BOOT GUARD DOWN: every path it takes
 * checks the element is still empty immediately before writing, so putting the
 * notice there is the documented way to tell it the page is handled.
 *
 * @returns what `load` resolved to, or `null` when the session has ended.
 */
export async function loadOrSignOut(root, load, notice = createSessionNotice) {
  try {
    return await load()
  } catch (error) {
    if (!isSessionEnded(error)) throw error
    root.replaceChildren(notice({ reason: error.reason, variant: 'page' }).element)
    return null
  }
}
