// @vitest-environment jsdom
/**
 * REQ-204 — **the way out of a session, and the sessions it is not offered for**.
 *
 * WHAT MAKES THIS EVIDENCE. The account dialog is mounted from the SHIPPED
 * `business.js` into a real DOM and read back out of the document, so what is
 * asserted is what an operator would see and click. `openAccountSurface`
 * composes `modal.js`, which is ours, so nothing here depends on the shared
 * `webui-*` components being installed.
 *
 * THREE CLAIMS, AND THE SECOND IS AN ABSENCE:
 *
 *   1. THE CONTROL IS A POSTED FORM. Signing out is a navigation — the Worker
 *      ends the row, clears the cookie and answers a 303 — so the control is a
 *      `<form method="post">` with a submit inside it and not a click handler.
 *      A `type="button"` in a form submits nothing, which is a control that
 *      looks identical and does nothing at all.
 *   2. IT IS NOT DRAWN WHEN THERE IS NO SESSION OF OURS TO END. The builder
 *      also admits through Cloudflare Access ([[REQ-202]]), and `POST /sign-out`
 *      cannot touch that — so a Sign out drawn for an Access caller would send
 *      them to a sign-in page and re-admit them on the way back. That is the
 *      defect [[REQ-183]] §4.2 refuses for a Delete account button that deletes
 *      nothing, and an absence is only a decision if something checks it.
 *   3. THE PATH IS THE WORKER'S OWN. The builder is browser JavaScript and
 *      cannot import the Worker's TypeScript, so the two literals are held
 *      equal here rather than by an import — a control posting at a path
 *      nothing serves is a 404 in place of a sign-out.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { openAccountSurface } from '../apps/control-app/src/builder/business.js'
import { SIGN_OUT_HREF, SIGN_OUT_LABEL } from '../apps/control-app/src/builder/config.js'
import { SIGN_OUT_PATH } from '../apps/control-app/src/sessions'

let host: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ''
  host = document.createElement('div')
  document.body.append(host)
})

const PERSON = { name: 'Sam', email: 'sam@example.test' }
const BUSINESSES = [{ id: 'acct_live', name: 'Salon', selectable: true, lapse: null }]

/** The sign-out form, as the document holds it. */
const control = (): HTMLFormElement | null =>
  document.querySelector<HTMLFormElement>('.builder-account__sign-out')

describe('REQ-204 — signing out of the account dialog', () => {
  it('test_UAT_FC_REQ-204_a_session_of_ours_gets_a_sign_out_that_posts_to_the_endpoint', () => {
    openAccountSurface({
      host,
      person: PERSON,
      businesses: BUSINESSES,
      selected: 'acct_live',
      session: true,
    })

    const form = control()
    expect(form, 'no sign-out control in the dialog').not.toBeNull()
    // `method` and `action` as the browser resolved them: a form that defaults
    // to GET would put the session-ending request in a URL a browser will
    // happily repeat from history.
    expect(form!.method.toLowerCase()).toBe('post')
    expect(new URL(form!.action, 'https://app.example.test').pathname).toBe(SIGN_OUT_HREF)

    const button = form!.querySelector('button')
    expect(button, 'the form has no button in it').not.toBeNull()
    expect(button!.type).toBe('submit')
    expect(button!.textContent).toBe(SIGN_OUT_LABEL)
  })

  it('test_UAT_FC_REQ-204_a_session_we_cannot_end_is_offered_no_sign_out_at_all', () => {
    // Both shapes of "not ours": told so, and not told. A caller that does not
    // know must draw nothing, because a control that may do nothing is worse
    // than a dialog without one.
    for (const spec of [{ session: false }, {}]) {
      document.body.innerHTML = ''
      host = document.createElement('div')
      document.body.append(host)

      openAccountSurface({ host, person: PERSON, businesses: BUSINESSES, selected: 'acct_live', ...spec })

      expect(control()).toBeNull()
      // And nothing else in the dialog reaches the endpoint by another route —
      // the claim is that this session cannot be signed out of here, not that
      // one particular class name is missing.
      expect(document.body.innerHTML).not.toContain(SIGN_OUT_HREF)
      // The dialog is otherwise the dialog: its way out is still there.
      expect(document.querySelector('.builder-modal__footer')?.textContent).toContain('Close')
    }
  })

  it('test_UAT_FC_REQ-204_the_form_posts_to_the_path_the_worker_actually_serves', () => {
    expect(SIGN_OUT_HREF).toBe(SIGN_OUT_PATH)
  })
})
