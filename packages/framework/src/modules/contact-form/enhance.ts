/**
 * Progressive enhancement for the `contact-form` module.
 *
 * The server-rendered form works without JavaScript: it is a real `<form>` with
 * a `method="post"` and an `action`, so submitting reloads the page against the
 * endpoint. This module upgrades that baseline — when JS runs, the submit is
 * intercepted and sent as a JSON `fetch`, keeping the visitor on the page.
 *
 * Extracted from the `.astro` island so it is unit-testable against a DOM
 * (JSDOM) with a mocked `fetch`, independent of the Astro build.
 */

const ROOT_SELECTOR = '[data-contact-form-root]'
const ERROR_SELECTOR = '[data-contact-error]'
const SUCCESS_SELECTOR = '[data-contact-success]'

function showError(form: HTMLFormElement, message: string): void {
  const errorEl = form.querySelector<HTMLElement>(ERROR_SELECTOR)
  if (errorEl) {
    errorEl.textContent = message
    errorEl.hidden = false
  }
}

async function handleSubmit(form: HTMLFormElement, event: Event): Promise<void> {
  event.preventDefault()

  const errorEl = form.querySelector<HTMLElement>(ERROR_SELECTOR)
  if (errorEl) {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  // Serialise the form's named controls to a flat JSON object — the honeypot
  // field rides along so the server can reject filled-honeypot submissions.
  const payload: Record<string, string> = {}
  for (const [name, value] of new FormData(form).entries()) {
    payload[name] = typeof value === 'string' ? value : value.name
  }

  const action = form.getAttribute('action') ?? ''

  let response: Response
  try {
    response = await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    showError(form, 'Could not reach the server. Please try again.')
    return
  }

  if (response.ok) {
    const root = form.closest<HTMLElement>(ROOT_SELECTOR)
    const success = root?.querySelector<HTMLTemplateElement | HTMLElement>(SUCCESS_SELECTOR)
    const successHtml =
      success instanceof HTMLTemplateElement ? success.innerHTML : (success?.innerHTML ?? '')
    if (root) {
      root.innerHTML = successHtml || '<p>Thanks — your message has been sent.</p>'
    }
    return
  }

  // Non-2xx: surface the server's error inline without navigating away.
  let message = `Something went wrong (${response.status}). Please try again.`
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body?.error === 'string' && body.error) {
      message = body.error
    }
  } catch {
    // Non-JSON error body — keep the status-based default message.
  }
  showError(form, message)
}

/** Attach the JSON-submit enhancement to a single contact form. */
export function enhanceContactForm(form: HTMLFormElement): void {
  form.addEventListener('submit', (event) => {
    void handleSubmit(form, event)
  })
}

/** Enhance every contact form in `root` (defaults to `document`). */
export function enhanceAllContactForms(root: ParentNode = document): void {
  for (const form of root.querySelectorAll<HTMLFormElement>('form[data-contact-form]')) {
    enhanceContactForm(form)
  }
}
