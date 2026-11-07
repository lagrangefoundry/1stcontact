/**
 * Admission & Onboarding (story-0cd18650, STORY-161): **where accepting sends
 * them**, reconciled in BUNDLE-38 (REQ-203).
 *
 * WHAT THIS FILE PROVES: AC-2342's navigation, by RUNNING the page's own accept
 * script. The workers suite (`test_reconciliation_terms_signup_provisioning`)
 * proves the server half: the accept POST answers 204 and the builder root then
 * serves the builder. workerd does not execute page scripts, so this file does
 * the browser half.
 *
 * THE PAGE IS THE ONE THE GATE SERVES. `guardTerms` is called with a navigation
 * request from an unaccepted contact, once at `/terms` and once at a builder URL.
 * Neither path touches the store, so no binding is needed. The served HTML is
 * loaded into a DOM at the URL it was served at, and its inline script runs
 * against that DOM.
 *
 * THE ONLY DOUBLES ARE THE BROWSER'S NETWORK AND NAVIGATION: `fetch` (records the
 * request and answers with a chosen status) and `location` (records assign and
 * reload). jsdom does not implement navigation and its `location` methods cannot
 * be replaced, so the script is given a `location` whose `pathname` comes from
 * the DOM's real URL.
 */

import { JSDOM } from 'jsdom'
import { describe, expect, it, vi } from 'vitest'
import {
  TERMS_ACCEPT_PATH,
  TERMS_PATH,
  TERMS_VERSION,
  guardTerms,
} from '../apps/control-app/src/terms'

const ORIGIN = 'https://build.example.test'

const NAVIGATION = { accept: 'text/html', 'sec-fetch-dest': 'document' }

/** An invited contact who has not accepted the terms and holds nothing yet. */
const admission = {
  ok: true,
  user: { id: 'user-ac2342', email: 'new@example.test', tos_version: null, tos_accepted_at: null },
  businesses: [],
} as never

async function servedPage(pathname: string): Promise<string> {
  const res = await guardTerms(
    new Request(`${ORIGIN}${pathname}`, { headers: NAVIGATION }),
    {} as never,
    admission,
  )
  expect(res, `${pathname}: the gate let an unaccepted navigation through`).toBeDefined()
  expect(res!.status).toBe(200)
  expect(res!.headers.get('content-type')).toContain('text/html')
  return res!.text()
}

const settle = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Load the served page at its URL and run its inline script with fetch and location doubled. */
async function openAndAccept(pathname: string, status: number) {
  const html = await servedPage(pathname)
  const dom = new JSDOM(html, { url: `${ORIGIN}${pathname}`, runScripts: 'outside-only' })
  const { window } = dom
  const scripts = [...window.document.querySelectorAll('script')]
  expect(scripts, 'the interstitial carries exactly one inline script').toHaveLength(1)

  const fetchStub = vi.fn(async () => ({ ok: status >= 200 && status < 300, status }))
  const location = { pathname: window.location.pathname, assign: vi.fn(), reload: vi.fn() }
  new window.Function('fetch', 'location', scripts[0]!.textContent!)(fetchStub, location)

  const button = window.document.getElementById('accept') as HTMLButtonElement | null
  expect(button, 'the accept control is present').not.toBeNull()
  const error = window.document.getElementById('error') as HTMLElement
  expect(error.hidden).toBe(true)

  button!.click()
  expect(button!.disabled, 'the control is disabled while the acceptance is in flight').toBe(true)
  await settle()

  return { fetchStub, location, button: button!, error }
}

function expectAcceptPost(fetchStub: { mock: { calls: unknown[][] } }) {
  expect(fetchStub).toHaveBeenCalledTimes(1)
  const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe(TERMS_ACCEPT_PATH)
  expect(init.method).toBe('POST')
  expect(new Headers(init.headers).get('content-type')).toBe('application/json')
  expect(JSON.parse(String(init.body))).toEqual({ version: TERMS_VERSION })
}

describe('where accepting sends them (executed in a DOM)', () => {
  it('test_UAT_AC2342_accepting_at_the_terms_path_runs_the_accept_post_and_goes_to_the_builder_root', async () => {
    expect(TERMS_PATH).toBe('/terms')
    const { fetchStub, location, error } = await openAndAccept(TERMS_PATH, 204)

    expectAcceptPost(fetchStub)
    expect(location.assign).toHaveBeenCalledTimes(1)
    expect(location.assign).toHaveBeenCalledWith('/')
    expect(location.reload).not.toHaveBeenCalled()
    expect(error.hidden).toBe(true)
  })

  it('test_UAT_AC2342_accepting_at_a_builder_url_reloads_the_requested_url_in_place', async () => {
    for (const pathname of ['/', '/people', '/b/biz-1/library']) {
      const { fetchStub, location, error } = await openAndAccept(pathname, 204)

      expectAcceptPost(fetchStub)
      expect(location.reload, `${pathname}: did not reload`).toHaveBeenCalledTimes(1)
      expect(location.assign, `${pathname}: navigated away instead of reloading`).not.toHaveBeenCalled()
      expect(error.hidden).toBe(true)
    }
  })

  it('test_UAT_AC2342_a_refused_acceptance_stays_on_the_page_re_enables_the_control_and_shows_the_error', async () => {
    for (const pathname of [TERMS_PATH, '/']) {
      const { fetchStub, location, button, error } = await openAndAccept(pathname, 500)

      expectAcceptPost(fetchStub)
      expect(location.assign, `${pathname}: navigated after a failed acceptance`).not.toHaveBeenCalled()
      expect(location.reload, `${pathname}: reloaded after a failed acceptance`).not.toHaveBeenCalled()
      expect(button.disabled, `${pathname}: the control stayed disabled`).toBe(false)
      expect(error.hidden, `${pathname}: the error was not revealed`).toBe(false)
      expect(error.textContent).toContain('did not save')
    }
  })
})
