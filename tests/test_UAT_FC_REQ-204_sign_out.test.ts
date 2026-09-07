// @vitest-environment jsdom
/**
 * REQ-204 — **the way out of the builder, drawn for everybody**.
 *
 * WHAT MAKES THIS EVIDENCE. The account dialog is mounted from the SHIPPED
 * `business.js` into a real DOM and read back out of the document, so what is
 * asserted is what an operator would see and click. `openAccountSurface`
 * composes `modal.js`, which is ours, so nothing here depends on the shared
 * `webui-*` components being installed.
 *
 * TWO CLAIMS:
 *
 *   1. THE CONTROL IS A POSTED FORM, ALWAYS. Signing out is a navigation — the
 *      Worker ends what it can and answers a 303 — so the control is a
 *      `<form method="post">` with a submit inside it and not a click handler.
 *      A `type="button"` in a form submits nothing, which is a control that
 *      looks identical and does nothing at all.
 *   2. THERE IS NO ARGUMENT THAT TAKES IT AWAY. This ticket first drew it only
 *      for a session of ours, on the grounds that `POST /sign-out` could not
 *      revoke a Cloudflare Access credential. That was true and the conclusion
 *      was wrong: it left every Access-admitted operator with a builder they
 *      could not leave. The endpoint ends whichever credential the request
 *      carries now ({@link ../apps/control-app/src/sign-in.ts}), so the client
 *      has nothing to branch on — and a dialog built with no knowledge of the
 *      session at all still has the control.
 *
 * THE PATH IS ALSO PINNED TO THE WORKER'S OWN. The builder is browser
 * JavaScript and cannot import the Worker's TypeScript, so the two literals are
 * held equal here rather than by an import — a control posting at a path
 * nothing serves is a 404 in place of a sign-out.
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
  it('test_UAT_FC_REQ-204_the_dialog_posts_a_sign_out_at_the_endpoint', () => {
    openAccountSurface({ host, person: PERSON, businesses: BUSINESSES, selected: 'acct_live' })

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

  it('test_UAT_FC_REQ-204_no_kind_of_session_is_offered_a_dialog_without_one', () => {
    // THE FALSIFIER FOR THE REVISION. A dialog built with the barest possible
    // spec — and with the field the first cut of this ticket branched on, in
    // both of its old shapes — still has the control. If a condition ever grows
    // back here, this is what fails.
    for (const spec of [{}, { session: false }, { session: true }]) {
      document.body.innerHTML = ''
      host = document.createElement('div')
      document.body.append(host)

      openAccountSurface({ host, ...spec })

      expect(control(), `no sign-out for ${JSON.stringify(spec)}`).not.toBeNull()
      // And the dialog is otherwise the dialog: its other way out is still there.
      expect(document.querySelector('.builder-modal__footer')?.textContent).toContain('Close')
    }
  })

  it('test_UAT_FC_REQ-204_the_form_posts_to_the_path_the_worker_actually_serves', () => {
    expect(SIGN_OUT_HREF).toBe(SIGN_OUT_PATH)
  })
})
