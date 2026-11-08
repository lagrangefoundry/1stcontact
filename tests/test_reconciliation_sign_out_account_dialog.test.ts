// @vitest-environment jsdom
/**
 * story-e0ca0a36 — **the Account dialog's way out, drawn for everybody**.
 *
 * The dialog is mounted from the SHIPPED `business.js` into a real DOM and read
 * back out of the document, so what is asserted is what an operator sees and
 * presses. Nothing about the caller's credential is supplied — the AC says no
 * state hides the control, so the barest spec, and the field an earlier cut
 * branched on in both shapes, must all still draw it.
 *
 * The `/api/businesses` half of AC-2365 (no `session` field) needs real D1 and
 * runs in workerd: `test_reconciliation_sign_out_destination.workers.test.ts`.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { openAccountSurface } from '../apps/control-app/src/builder/business.js'
import { SIGN_OUT_HREF, SIGN_OUT_LABEL } from '../apps/control-app/src/builder/config.js'
import { SIGN_OUT_PATH } from '../apps/control-app/src/sessions'

function freshHost(): HTMLElement {
  document.body.innerHTML = ''
  const host = document.createElement('div')
  document.body.append(host)
  return host
}

beforeEach(() => {
  document.body.innerHTML = ''
})

const PERSON = { name: 'Robin', email: 'robin@example.test' }
const BUSINESSES = [{ id: 'acct_dialog', name: 'Bakery', selectable: true, lapse: null }]

describe('story-e0ca0a36 — the Account dialog signs out', () => {
  it('test_UAT_AC2365_the_account_dialog_always_shows_a_sign_out_form_beside_close_posting_to_sign_out', () => {
    // The Worker's path and the builder's literal are one value: a form posting
    // where nothing serves sign-out is a 404 in place of a sign-out.
    expect(SIGN_OUT_HREF).toBe(SIGN_OUT_PATH)

    const specs: Array<Record<string, unknown>> = [
      {},
      { person: PERSON, businesses: BUSINESSES, selected: 'acct_dialog' },
      { session: false },
      { session: true },
    ]
    for (const spec of specs) {
      const label = JSON.stringify(spec)
      openAccountSurface({ host: freshHost(), ...spec })

      const footer = document.querySelector<HTMLElement>('.builder-modal__footer')
      expect(footer, `${label}: the dialog has no footer`).not.toBeNull()

      const form = footer!.querySelector<HTMLFormElement>('form')
      expect(form, `${label}: no sign-out form in the footer`).not.toBeNull()
      expect(form!.getAttribute('method')?.toLowerCase(), `${label}: method`).toBe('post')
      expect(form!.method.toLowerCase()).toBe('post')
      expect(new URL(form!.action, 'https://app.example.test').pathname, `${label}: action`).toBe('/sign-out')

      const submit = form!.querySelector<HTMLButtonElement>('button')
      expect(submit, `${label}: the form holds no button`).not.toBeNull()
      expect(submit!.type, `${label}: a non-submit button inside a form submits nothing`).toBe('submit')
      expect(submit!.textContent).toBe('Sign out')
      expect(SIGN_OUT_LABEL).toBe('Sign out')

      // Beside Close: the two controls are siblings in the one footer.
      const close = [...footer!.querySelectorAll('button')].find((b) => b.textContent === 'Close')
      expect(close, `${label}: no Close in the footer`).toBeDefined()
      expect(close!.closest('form'), `${label}: Close was put inside the sign-out form`).toBeNull()
      const siblings = [...footer!.children]
      expect(siblings).toContain(form)
      expect(siblings.some((child) => child === close || child.contains(close!))).toBe(true)

      // An ordinary navigation: no click handler intercepts it, so submitting
      // fires the form's submit event and is not cancelled by the client.
      let defaultPrevented: boolean | null = null
      form!.addEventListener('submit', (event) => {
        defaultPrevented = event.defaultPrevented
        event.preventDefault() // jsdom cannot navigate; stop it after reading
      })
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      // Listeners added by the client run first (they were registered at mount).
      form!.dispatchEvent(submitEvent)
      expect(defaultPrevented, `${label}: the client cancelled the form navigation`).toBe(false)
    }
  })
})
