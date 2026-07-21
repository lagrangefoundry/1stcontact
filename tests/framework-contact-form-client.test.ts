// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enhanceContactForm } from '../packages/framework/src/modules/contact-form/client.js'

/**
 * UATs for REQ-5 — the contact-form capability's vetted client behaviour
 * (`client.js`, shipped as `capabilities.js`). Exercised against a real DOM
 * (JSDOM) with a mocked `fetch`, independent of the Astro build. The DOM here
 * mirrors the structure the module renders:
 * a `[data-contact-form-root]` wrapping the form, an inline error element, and
 * a `<template data-contact-success>` holding the rendered success markup.
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

describe('contact-form client enhancement', () => {
  it('test_UAT_FC_REQ-5_contact_form_client_enhancement_intercepts_submit_and_posts_json', async () => {
    const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
    const form = mountForm('/leads/intake')

    const event = await submit(form)

    // The native submit was intercepted (no navigation).
    expect(event.defaultPrevented).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/leads/intake')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    const payload = JSON.parse(init.body)
    expect(payload).toMatchObject({ name: 'Ada', email: 'ada@e.test', hp_company_url: '' })
  })

  it('test_UAT_FC_REQ-5_contact_form_client_renders_success_message_on_200', async () => {
    fetchReturning({ ok: true, status: 200, json: async () => ({}) })
    const form = mountForm()

    await submit(form)

    const root = document.querySelector('[data-contact-form-root]')!
    expect(root.innerHTML).toContain('Thanks, we will be in touch.')
    // The form is gone — replaced by the success message.
    expect(root.querySelector('form')).toBeNull()
  })

  it('test_UAT_FC_REQ-5_contact_form_client_renders_error_on_non_200', async () => {
    fetchReturning({ ok: false, status: 500, json: async () => ({ error: 'Server exploded' }) })
    const form = mountForm()

    await submit(form)

    const errorEl = document.querySelector<HTMLElement>('[data-contact-error]')!
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('Server exploded')
    // The form is preserved so the visitor can retry — no navigation.
    expect(document.querySelector('form[data-contact-form]')).not.toBeNull()
  })
})
