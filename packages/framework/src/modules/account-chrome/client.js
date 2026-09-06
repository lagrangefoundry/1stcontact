/**
 * Vetted client behaviour for the `account-chrome` behavior ([[REQ-200]]).
 *
 * TWO JOBS, AND BOTH OF THEM ONLY SUBTRACT. It folds the sign-in form away
 * behind the Sign In control, and it upgrades the form's native POST to a
 * `fetch` so the visitor stays on the page. The server renders the form OPEN and
 * posting natively, so every failure of this file — no script, a throw, a blocked
 * bundle — leaves a page on which the address can still be sent.
 *
 * IT NEVER READS THE RESPONSE, AND THAT IS A REQUIREMENT RATHER THAN AN ECONOMY.
 * The issue endpoint must not reveal whether an address is known ([[REQ-134]]),
 * so the confirmation is shown when the request COMPLETES, at any status. A known
 * address and an unknown one are indistinguishable here by construction. Only a
 * request that never reached the server at all — a thrown `fetch` — shows the
 * error, because that is a fact about the network and not about the address.
 *
 * IT AUTHENTICATES NOTHING. There is no session read here and no state decided
 * here: which of the chrome's states is current is settled by the serving Worker
 * before the bytes leave it.
 *
 * Authored as self-contained browser JavaScript (no imports) so the render
 * pipeline ships it verbatim in `capabilities.js`; unit-tested by importing this
 * module against a JSDOM + mocked `fetch`. **Isolation** ([[DOC-25]]): defensive
 * throughout, so a failure degrades to the native-post baseline.
 */

const CHROME_SELECTOR = '[data-account-chrome]'
const DIALOG_SELECTOR = '[data-account-chrome-dialog]'
const SENT_SELECTOR = '[data-account-chrome-sent]'
const ERROR_SELECTOR = '[data-account-chrome-error]'
const OPEN_SELECTOR = '[data-account-chrome-open]'
const CLOSE_SELECTOR = '[data-account-chrome-close]'
const EMAIL_SELECTOR = '[data-account-chrome-email]'

/** Open or fold away the sign-in form, keeping the control's state honest. */
export function setDialog(section, open) {
  try {
    const dialog = section.querySelector(DIALOG_SELECTOR)
    if (dialog) dialog.hidden = !open
    const openers = section.querySelectorAll(OPEN_SELECTOR)
    for (let i = 0; i < openers.length; i++) {
      openers[i].setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    if (open) {
      const email = section.querySelector(EMAIL_SELECTOR)
      if (email && typeof email.focus === 'function') email.focus()
    }
  } catch (_e) {
    // A dialog that cannot be moved stays where the server left it — open.
  }
}

/**
 * Send the address and report the one message.
 *
 * Exported and given its `fetch` so the "identical for a known and an unknown
 * address" property is provable without a browser.
 */
export async function submitAddress(section, form, fetchImpl) {
  const sent = section.querySelector(SENT_SELECTOR)
  const error = section.querySelector(ERROR_SELECTOR)
  if (error) error.hidden = true

  const action = form.getAttribute('action') || ''
  const call = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!call) return

  const email = section.querySelector(EMAIL_SELECTOR)
  const address = email && typeof email.value === 'string' ? email.value : ''

  try {
    await call(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: address }),
    })
  } catch (_e) {
    // The request never reached the server. That is a fact about the network and
    // says nothing about the address, so it is the one case that reports itself.
    if (error) error.hidden = false
    return
  }

  // Completed — at ANY status, and without looking at what came back. See the
  // module note: the response must not distinguish a known address from an
  // unknown one, and the surest way to honour that is never to consult it.
  if (sent) sent.hidden = false
  for (const node of [email, form.querySelector('button[type="submit"]')]) {
    if (node) node.disabled = true
  }
}

/** Attach both behaviours to one chrome `<section>`. */
export function enhanceAccountChrome(section, fetchImpl) {
  try {
    // Marks that script has taken over, which is what lets the form stop being an
    // inline part of the page and become an overlay (see `styles.css`).
    section.setAttribute('data-account-chrome-enhanced', '')
    setDialog(section, false)

    const openers = section.querySelectorAll(OPEN_SELECTOR)
    for (let i = 0; i < openers.length; i++) {
      openers[i].addEventListener('click', function () {
        setDialog(section, true)
      })
    }
    const closers = section.querySelectorAll(CLOSE_SELECTOR)
    for (let i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', function () {
        setDialog(section, false)
      })
    }

    const form = section.querySelector(DIALOG_SELECTOR)
    if (form && typeof form.addEventListener === 'function') {
      form.addEventListener('submit', function (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault()
        void submitAddress(section, form, fetchImpl)
      })
    }
  } catch (_e) {
    // Isolation: enhancement failure leaves the native-post baseline.
  }
}

/** Enhance every chrome in `root` (defaults to `document`). */
export function enhanceAllAccountChrome(root) {
  const scope = root || (typeof document !== 'undefined' ? document : null)
  if (!scope) return
  const sections = scope.querySelectorAll(CHROME_SELECTOR)
  for (let i = 0; i < sections.length; i++) enhanceAccountChrome(sections[i])
}

// Auto-init when shipped to the browser; inert under Node/JSDOM-less imports.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAllAccountChrome()
    })
  } else {
    enhanceAllAccountChrome()
  }
}
