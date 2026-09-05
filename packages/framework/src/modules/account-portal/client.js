/**
 * Vetted client behaviour for the `account-portal` behavior ([[REQ-183]]).
 *
 * TWO JOBS, AND NEITHER OF THEM DELETES ANYTHING. It fills the account line and
 * the holdings sentence from the endpoint the instance names, and it folds the
 * erasure explanation away behind the control. There is no third job: the only
 * request this file makes is a `GET`, and a UAT asserts that, because "the button
 * does not delete the account" has to be a property of the code rather than of a
 * promise ([[REQ-183]] §4.1).
 *
 * IT ONLY EVER SUBTRACTS. The server renders the explanation OPEN
 * (`component.ts` explains why), so every failure of this file — no script, a
 * throw, an endpoint that refuses — leaves a page that shows more of the truth
 * rather than a control that claims something the page cannot do ([[DOC-37]]
 * §6.2). That is why the collapse happens here and the reveal does not.
 *
 * Authored as self-contained browser JavaScript (no imports) so the render
 * pipeline ships it verbatim in `capabilities.js`; unit-tested by importing this
 * module against a JSDOM + mocked `fetch`. **Isolation** ([[DOC-25]]): defensive
 * throughout, so a failure degrades to the fully-expanded baseline.
 */

const PORTAL_SELECTOR = '[data-account-portal]'
const IDENTITY_SELECTOR = '[data-account-identity]'
const HOLDINGS_SELECTOR = '[data-account-holdings]'
const ERASURE_SELECTOR = '[data-account-erasure]'
const ERROR_SELECTOR = '[data-account-error]'
const REVEAL_SELECTOR = 'button[aria-expanded]'

/**
 * How an account is named on its own portal.
 *
 * THE EMAIL IS THE FALLBACK AND NOT THE ORNAMENT. It is the identity the login
 * verified ([[DOC-40]] §2), so it is always true; a display name is a label
 * somebody set and may not exist. A blank line where a person's name goes reads
 * as a failure to load rather than as a name nobody has set — which is the same
 * reasoning the avatar surface already uses.
 *
 * Pure and exported so both branches are provable without a DOM.
 */
export function accountLine(account) {
  if (!account || typeof account !== 'object') return ''
  const email = typeof account.email === 'string' ? account.email.trim() : ''
  const name = typeof account.name === 'string' ? account.name.trim() : ''
  if (name && email) return name + ' — ' + email
  return name || email
}

/**
 * What erasure would take with it, in this account's own terms ([[REQ-183]] D6).
 *
 * THE SENTENCE IS COMPUTED, NOT AUTHORED, and that is the answer to the ticket's
 * third open question. "Delete account" is a request about the account, and an
 * account is relative to the business it is an account of ([[DOC-42]] §6) — so a
 * fixed sentence about businesses is wrong at one level or the other. This names
 * the businesses this account actually operates, and one level down, where an
 * account operates none, it returns nothing and the sentence does not appear.
 *
 * LAPSED BUSINESSES ARE INCLUDED. They are still the person's, they still hold
 * their site and their customers, and the population most likely to be reading
 * this page is exactly the one whose grants have lapsed. Omitting them would make
 * the surface understate what it destroys, on the one page where understating is
 * the failure ([[DOC-37]] §6.2).
 *
 * Pure and exported for the same reason as above.
 */
export function holdingsLine(businesses) {
  const list = Array.isArray(businesses) ? businesses : []
  const names = []
  for (let i = 0; i < list.length; i++) {
    const entry = list[i]
    if (!entry || typeof entry !== 'object') continue
    const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : entry.id
    if (typeof name === 'string' && name) names.push(name)
  }
  if (names.length === 0) return ''
  const noun = names.length === 1 ? 'business' : 'businesses'
  return 'This account operates ' + names.length + ' ' + noun + ': ' + names.join(', ') + '.'
}

/** Show a node's text, or hide the node when there is nothing true to put in it. */
function fill(node, text) {
  if (!node) return
  if (text) {
    node.textContent = text
    node.hidden = false
  } else {
    node.textContent = ''
    node.hidden = true
  }
}

/** Fold the explanation away, or open it, keeping the control's state honest. */
export function setDisclosure(section, open) {
  try {
    const erasure = section.querySelector(ERASURE_SELECTOR)
    if (erasure) erasure.hidden = !open
    const buttons = section.querySelectorAll(REVEAL_SELECTOR)
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-expanded', open ? 'true' : 'false')
    }
  } catch (_e) {
    // A disclosure that cannot be moved stays where the server left it — open.
  }
}

/** Read the caller's own account and write it into the two invariant elements. */
export async function loadAccount(section, fetchImpl) {
  const src = section.getAttribute('data-account-src')
  if (!src) return
  const call = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!call) return

  let payload
  try {
    // GET, credentials included — the endpoint authenticates by the origin's own
    // session ([[DOC-40]] §3). No method, no body, nothing to send.
    const response = await call(src, { method: 'GET', credentials: 'same-origin' })
    if (!response || !response.ok) throw new Error('refused')
    payload = await response.json()
  } catch (_e) {
    const error = section.querySelector(ERROR_SELECTOR)
    if (error) error.hidden = false
    return
  }

  if (!payload || typeof payload !== 'object') return
  fill(section.querySelector(IDENTITY_SELECTOR), accountLine(payload.account))
  fill(section.querySelector(HOLDINGS_SELECTOR), holdingsLine(payload.businesses))
}

/** Attach both behaviours to one portal `<section>`. */
export function enhanceAccountPortal(section, fetchImpl) {
  try {
    setDisclosure(section, false)
    const buttons = section.querySelectorAll('button[aria-controls]')
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const opens = button.hasAttribute('aria-expanded')
      button.addEventListener('click', function () {
        setDisclosure(section, opens)
      })
    }
    void loadAccount(section, fetchImpl)
  } catch (_e) {
    // Isolation: enhancement failure leaves the fully-expanded server baseline.
  }
}

/** Enhance every portal in `root` (defaults to `document`). */
export function enhanceAllAccountPortals(root) {
  const scope = root || (typeof document !== 'undefined' ? document : null)
  if (!scope) return
  const sections = scope.querySelectorAll(PORTAL_SELECTOR)
  for (let i = 0; i < sections.length; i++) enhanceAccountPortal(sections[i])
}

// Auto-init when shipped to the browser; inert under Node/JSDOM-less imports.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAllAccountPortals()
    })
  } else {
    enhanceAllAccountPortals()
  }
}
