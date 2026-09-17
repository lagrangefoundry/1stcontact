// @vitest-environment jsdom
/**
 * [[REQ-264]] — **a control that cannot work is not drawn.**
 *
 * `resend.ts` had written the rule down before the failure happened: *"a
 * deployment that could send but not manage domains would offer the toggle and
 * refuse it, which is worse than not offering it."* It shipped offering it. This
 * is that sentence made mechanical.
 *
 * WHAT MAKES THIS EVIDENCE. It drives the SHIPPED section (`builder/domain.js`)
 * in a real document, over the shipped dialog shell — no stand-in for either,
 * which is [[REQ-259]]'s own standard for this file's neighbour. The seam that is
 * injected is the four network calls, whose answers are proven against real D1
 * by the `.workers` sibling.
 *
 * THE CLAIMS:
 *
 *  1. WITH `emailAvailable: false` THE TOGGLE IS ABSENT, on both the states that
 *     draw one — choosing a domain, and looking at the one already attached.
 *  2. NOTHING IS SAID ABOUT IT EITHER. A sentence explaining why a control is
 *     missing would put our configuration on a customer's screen, which is this
 *     epic's standing falsifier.
 *  3. THE ATTACH THEN ASKS FOR NO EMAIL, so the request matches what the
 *     customer was actually offered.
 *  4. EVERYTHING ELSE IN THE SECTION IS UNTOUCHED — this costs a feature, not
 *     the section.
 *  5. THE DEFAULT IS UNCHANGED. An answer that says nothing about availability
 *     still draws the toggle, so no deployment loses a working capability to
 *     this.
 */

import { beforeEach, describe, expect, it } from 'vitest'

let DOMAIN: Record<string, any>

const MINE = 'alicesplumbing.com'
let root: HTMLElement

const NOTHING_ATTACHED = (over: Record<string, unknown> = {}) => ({
  pool: [{ domain: MINE, available: true, refusal: null }],
  attached: null,
  email: 'off',
  mayAttach: true,
  refusal: null,
  ...over,
})

const ATTACHED = (over: Record<string, unknown> = {}) => ({
  pool: [],
  attached: MINE,
  email: 'verified',
  mayAttach: true,
  refusal: null,
  ...over,
})

beforeEach(async () => {
  if (!DOMAIN) DOMAIN = await import('../apps/control-app/src/builder/domain.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The shipped section, with its four calls recorded. */
function section(state: Record<string, unknown>) {
  const asked = { attached: [] as { domain: string; email: boolean }[] }
  const made = DOMAIN.createDomainSection({
    transport: {
      load: async () => state,
      attach: async (domain: string, email: boolean) => {
        asked.attached.push({ domain, email })
        return { domain, liveUse: { live: false, notes: [] }, email: 'off' }
      },
      release: async () => ({ released: MINE }),
      setEmail: async () => ({ email: 'off' }),
    },
  })
  root.append(made.element)
  made.setState(state)
  return { made, asked }
}

const toggle = () => root.querySelector('input.builder-domain__email')
const settle = () => new Promise((r) => setTimeout(r, 0))

describe('REQ-264 — the sending toggle is not offered where it cannot work', () => {
  it('test_UAT_FC_REQ-264_no_toggle_is_drawn_when_sending_is_unavailable', () => {
    section(NOTHING_ATTACHED({ emailAvailable: false }))
    expect(toggle()).toBeNull()
    // AND THE REST OF THE SECTION IS STILL THERE. A missing sending credential
    // costs a feature; it does not cost the section ([[REQ-259]]'s axis).
    expect(root.querySelector('select.builder-domain__select')).not.toBeNull()
    expect(root.querySelector('.builder-domain__attach')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-264_no_toggle_and_no_line_about_mail_on_an_attached_domain', () => {
    section(ATTACHED({ emailAvailable: false }))
    expect(toggle()).toBeNull()
    // NOTHING IS SAID ABOUT IT. Explaining the absence would be explaining our
    // configuration to somebody who has none, and there is nothing in it for
    // them to act on.
    expect(root.querySelector('.builder-domain__email-line')).toBeNull()
    expect(root.textContent).not.toMatch(/API key/i)
    expect(root.textContent).not.toMatch(/Resend/)
    // RELEASE IS STILL ALWAYS OFFERED — that rule belongs to the domain, not to
    // the mail.
    expect(root.querySelector('.builder-domain__release')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-264_the_attach_asks_for_no_email_when_none_was_offered', async () => {
    const { asked } = section(NOTHING_ATTACHED({ emailAvailable: false }))
    const button = root.querySelector('.builder-domain__attach') as HTMLButtonElement
    button.dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    // THE REQUEST MATCHES WHAT WAS ON THE SCREEN. Sending `email: true` from a
    // form with no email control would ask the Worker for something the customer
    // was never shown.
    expect(asked.attached).toEqual([{ domain: MINE, email: false }])
  })

  it('test_UAT_FC_REQ-264_an_answer_that_says_nothing_still_draws_the_toggle', () => {
    // NO DEPLOYMENT LOSES A WORKING CAPABILITY TO THIS. The section treats only
    // an explicit `false` as unavailable, so an older answer — or a new field
    // somebody forgot to send — behaves exactly as it did before.
    section(ATTACHED())
    expect(toggle()).not.toBeNull()
    section(NOTHING_ATTACHED({ emailAvailable: true }))
    expect(toggle()).not.toBeNull()
  })
})
