// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enhanceContactForm } from '../packages/framework/src/modules/contact-form/enhance'

/**
 * Reconciliation UATs for story-903e3e3a (REQ-5) — the contact-form's
 * progressive-enhancement island (`enhance.ts`). The logic is extracted from
 * the `.astro` `<script>` so it can be exercised against a real DOM (JSDOM)
 * with a mocked `fetch`, independent of the Astro build. The DOM here mirrors
 * the structure the module renders: a `[data-contact-form-root]` wrapping the
 * form, an inline error element, and a `<template data-contact-success>`
 * holding the rendered success markup. One UAT per acceptance criterion.
 */

function mountForm(action = '/api/forms/contact'): HTMLFormElement {
  document.body.innerHTML = `
    <div data-contact-form-root>
      <form data-contact-form action="${action}" method="post">
        <input name="name" value="Ada" />
        <input name="email" value="ada@e.test" />
        <input name="hp_company_url" value="" />
        <p class="contact-form__error" data-contact-error hidden></p>
        <button type="submit">Send</button>
      </form>
      <template data-contact-success><p>Thanks, we will be in touch.</p></template>
    </div>`
  const form = document.querySelector<HTMLFormElement>('form[data-contact-form]')!
  enhanceContactForm(form)
  return form
}

function fetchReturning(value: {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}) {
  const fn = vi.fn().mockResolvedValue(value)
  vi.stubGlobal('fetch', fn)
  return fn
}

/** Submit the form and let the async handler's microtasks settle. */
async function submit(form: HTMLFormElement): Promise<Event> {
  const event = new Event('submit', { cancelable: true, bubbles: true })
  form.dispatchEvent(event)
  // Allow the awaited fetch chain inside the handler to resolve.
  await new Promise((r) => setTimeout(r, 0))
  return event
}

beforeEach(() => {
  document.body.innerHTML = ''
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reconciliation: contact-form client enhancement (story-903e3e3a)', () => {
  // AC-454 — enhancement intercepts submit and POSTs the named values as JSON
  // to the configured action, including the honeypot field.
  it('test_UAT_AC454_enhancement_intercepts_submit_and_posts_json_to_action', async () => {
    const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
    const form = mountForm('/leads/intake')

    const event = await submit(form)

    // The native full-page navigation was prevented.
    expect(event.defaultPrevented).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    // A POST to the configured action with a JSON body of the submitted values.
    expect(url).toBe('/leads/intake')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    const payload = JSON.parse(init.body)
    // The honeypot field rides along so the server can reject filled submissions.
    expect(payload).toMatchObject({ name: 'Ada', email: 'ada@e.test', hp_company_url: '' })
  })

  // AC-455 — on a 2xx response, the form is replaced in place by the success
  // message, without navigating away.
  it('test_UAT_AC455_enhancement_swaps_in_success_message_on_2xx', async () => {
    fetchReturning({ ok: true, status: 200, json: async () => ({}) })
    const form = mountForm()

    await submit(form)

    const root = document.querySelector('[data-contact-form-root]')!
    // The form is replaced by the configured success-message content…
    expect(root.innerHTML).toContain('Thanks, we will be in touch.')
    expect(root.querySelector('form')).toBeNull()
    // …and the document did not navigate (the root element is still present).
    expect(document.body.contains(root)).toBe(true)
  })

  // AC-456 — on a non-2xx response, an inline error is shown, the form remains
  // present for retry, and no navigation occurs.
  it('test_UAT_AC456_enhancement_surfaces_inline_error_on_failed_response', async () => {
    fetchReturning({ ok: false, status: 500, json: async () => ({ error: 'Server exploded' }) })
    const form = mountForm()

    const event = await submit(form)

    const errorEl = document.querySelector<HTMLElement>('[data-contact-error]')!
    // An inline error message becomes visible near the form…
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('Server exploded')
    // …the form is still present so the submission can be retried…
    expect(document.querySelector('form[data-contact-form]')).not.toBeNull()
    // …and no navigation occurs (default prevented).
    expect(event.defaultPrevented).toBe(true)
  })
})
