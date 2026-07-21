/**
 * Vetted client behaviour for the `contact-form` capability (REQ-85).
 *
 * The server-rendered form works with no JavaScript: a real `<form
 * method="post" action=…>` submits by reloading against the endpoint. This
 * upgrades that baseline — when JS runs, the submit is intercepted and sent as a
 * JSON `fetch`, keeping the visitor on the page and swapping in the success
 * message inline.
 *
 * Authored as self-contained browser JavaScript (no imports) so the render
 * pipeline ships it verbatim in `capabilities.js`; unit-tested by importing this
 * module against a JSDOM + mocked `fetch`. **Isolation** (REQ-85): defensive
 * throughout, so a failure degrades to the no-JS post baseline.
 */

const ROOT_SELECTOR = '[data-contact-form-root]'
const ERROR_SELECTOR = '[data-contact-error]'
const SUCCESS_SELECTOR = '[data-contact-success]'

function showError(form, message) {
  const errorEl = form.querySelector(ERROR_SELECTOR)
  if (errorEl) {
    errorEl.textContent = message
    errorEl.hidden = false
  }
}

async function handleSubmit(form, event) {
  event.preventDefault()

  const errorEl = form.querySelector(ERROR_SELECTOR)
  if (errorEl) {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  // Serialise the form's named controls to a flat JSON object — the honeypot
  // field rides along so the server can reject filled-honeypot submissions.
  const payload = {}
  for (const [name, value] of new FormData(form).entries()) {
    payload[name] = typeof value === 'string' ? value : value.name
  }

  const action = form.getAttribute('action') || ''

  let response
  try {
    response = await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (_e) {
    showError(form, 'Could not reach the server. Please try again.')
    return
  }

  if (response.ok) {
    const root = form.closest(ROOT_SELECTOR)
    const success = root ? root.querySelector(SUCCESS_SELECTOR) : null
    const successHtml =
      success && 'content' in success ? success.innerHTML : success ? success.innerHTML : ''
    if (root) {
      root.innerHTML = successHtml || '<p>Thanks — your message has been sent.</p>'
    }
    return
  }

  // Non-2xx: surface the server's error inline without navigating away.
  let message = `Something went wrong (${response.status}). Please try again.`
  try {
    const body = await response.json()
    if (body && typeof body.error === 'string' && body.error) {
      message = body.error
    }
  } catch (_e) {
    // Non-JSON error body — keep the status-based default message.
  }
  showError(form, message)
}

/** Attach the JSON-submit enhancement to a single contact form. */
export function enhanceContactForm(form) {
  form.addEventListener('submit', function (event) {
    void handleSubmit(form, event)
  })
}

/** Enhance every contact form in `root` (defaults to `document`). */
export function enhanceAllContactForms(root) {
  const scope = root || (typeof document !== 'undefined' ? document : null)
  if (!scope) return
  const forms = scope.querySelectorAll('form[data-contact-form]')
  for (let i = 0; i < forms.length; i++) enhanceContactForm(forms[i])
}

// Auto-init when shipped to the browser; inert under Node/JSDOM-less imports.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAllContactForms()
    })
  } else {
    enhanceAllContactForms()
  }
}
