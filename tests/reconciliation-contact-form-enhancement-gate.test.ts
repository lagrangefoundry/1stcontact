import { afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'

import { contactFormMeta } from '../packages/framework/src/index'
import { contactForm as ContactForm } from '../packages/framework/src/modules/contact-form/component'
import { enhanceAllContactForms } from '../packages/framework/src/modules/contact-form/client.js'

/**
 * Reconciliation UATs for story-179b8c06 — the **client-side half of the
 * isolation obligation** (BUG-28): a behavior's shipped client behaviour must
 * never cancel a server-rendered baseline it cannot itself complete.
 *
 * `contact-form`'s own safety check accepts `mailto:` and `tel:` as legitimate
 * endpoints, but `fetch()` cannot send to either. The enhancement used to
 * `preventDefault()` unconditionally and only then attempt the submission — so
 * those forms reported a connection failure on a page that would have worked by
 * native submit, with the vetted no-JS baseline already cancelled. The decision
 * is now taken from the endpoint's **scheme, before** the submit is suppressed.
 *
 * One UAT per acceptance criterion (AC-877, AC-878), exercised at the real
 * boundary: the module SSR-rendered through the Astro container (the path
 * `tools/generate` uses), mounted into a real DOM, and driven by the shipped
 * `client.js` against a mocked `fetch` — the only thing here that is not ours.
 *
 * The DOM is built with an explicit `JSDOM` window rather than by switching this
 * file's test environment to jsdom: that environment's globals break the
 * `esbuild` invariant the Astro container depends on, so the two cannot share a
 * file. Everything under test is unchanged by that — the client reads its
 * elements from the form it is handed.
 */

// ── The instance under test: a real multi-field form dressed by a real L1 subtree
const FORM_CONFIG = {
  action: '',
  fields: [
    { name: 'your-name', label: 'Your name', type: 'text', required: true },
    { name: 'your-email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: false },
  ],
  successMessage: 'Thanks — we will be in touch.',
}

/** The form's whole presentation: one `control` node per declared element. */
const FORM_SLOT = {
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'control', control: 'your-name' },
    { kind: 'control', control: 'your-email' },
    { kind: 'control', control: 'message' },
    { kind: 'control', control: 'submit' },
  ],
}

interface Mounted {
  form: HTMLFormElement
  window: JSDOM['window']
  /** The module's inline error surface — the only error state the form can show. */
  error: () => HTMLElement
  /** The wrapper the client swaps for the success message. */
  root: () => HTMLElement
}

/**
 * SSR-render the real `contact-form` for `action`, mount it in a real document,
 * and attach the shipped client behaviour exactly as the browser would.
 */
async function mountForm(action: string): Promise<Mounted> {
  const html = ContactForm({ config: { ...FORM_CONFIG, action }, slots: { form: FORM_SLOT } })
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://site.test/contact',
  })
  const document = dom.window.document
  const form = document.querySelector('form[data-contact-form]') as HTMLFormElement | null
  expect(form, 'the module rendered a real form element').not.toBeNull()
  // The no-JS baseline the enhancement must not cancel when it cannot complete.
  expect(form!.getAttribute('method')).toBe('post')

  // `new FormData(form)` inside the client must build from THIS window's form.
  vi.stubGlobal('FormData', dom.window.FormData)
  enhanceAllContactForms(document)

  return {
    form: form!,
    window: dom.window,
    error: () => document.querySelector('[data-contact-error]') as HTMLElement,
    root: () => document.querySelector('[data-contact-form-root]') as HTMLElement,
  }
}

/** Give every named control a value, so a payload assertion is meaningful. */
function fillIn({ form }: Mounted): void {
  ;(form.querySelector('[name="your-name"]') as HTMLInputElement).value = 'Ada'
  ;(form.querySelector('[name="your-email"]') as HTMLInputElement).value = 'ada@example.test'
  ;(form.querySelector('[name="message"]') as HTMLTextAreaElement).value = 'Hello there'
}

function fetchReturning(value: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue(value)
  vi.stubGlobal('fetch', fn)
  return fn
}

function fetchRejecting(error: Error) {
  const fn = vi.fn().mockRejectedValue(error)
  vi.stubGlobal('fetch', fn)
  return fn
}

/** Submit the form and let the handler's awaited chain settle. */
async function submit(mounted: Mounted): Promise<Event> {
  const event = new mounted.window.Event('submit', { cancelable: true, bubbles: true })
  mounted.form.dispatchEvent(event)
  await new Promise((r) => setTimeout(r, 0))
  return event as unknown as Event
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ════════════════════════════════════════════════════════════════════════════
// AC-877 — A contact form whose endpoint the enhancement cannot send to keeps
//          its native submit
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — a non-fetchable endpoint keeps its native submit', () => {
  it('test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit', async () => {
    // ── mailto: / tel: — permitted by the module's own safety check, unsendable
    //    by fetch(). Both render, and both must decline enhancement silently. ──
    for (const action of ['mailto:hello@example.test', 'tel:+441234567890']) {
      const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
      const mounted = await mountForm(action)
      fillIn(mounted)
      // The endpoint really did survive the module's safety check onto the form.
      expect(mounted.form.getAttribute('action'), `${action} is a rendered endpoint`).toBe(action)

      const event = await submit(mounted)

      // The user agent performs its own `method="post"` navigation — exactly as
      // it does with JavaScript disabled.
      expect(event.defaultPrevented, `${action} keeps its native submit`).toBe(false)
      // Nothing was attempted on the visitor's behalf…
      expect(fetchMock, `${action} issues no request`).not.toHaveBeenCalled()
      // …and no error state was shown, because nothing failed.
      expect(mounted.error().hidden, `${action} shows no error banner`).toBe(true)
      expect(mounted.error().textContent).toBe('')
      // Nothing on the page was swapped: the form is still there, still filled.
      expect(mounted.root().querySelector('form[data-contact-form]')).not.toBeNull()
      expect((mounted.form.querySelector('[name="your-name"]') as HTMLInputElement).value).toBe(
        'Ada',
      )
    }

    // ── The rule is an ALLOWLIST, not a mailto/tel denylist ──────────────────
    // Any other scheme falls back the same way. (`ftp:`/`sms:`/`file:` never
    // reach a rendered `action` — the module's safety check rejects them — so
    // they are exercised where the client actually reads the endpoint: the DOM.)
    for (const action of ['ftp://host/intake', 'sms:+441234567890', 'file:///tmp/intake']) {
      const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
      const mounted = await mountForm('/api/lead')
      mounted.form.setAttribute('action', action)

      const event = await submit(mounted)

      expect(event.defaultPrevented, `${action} keeps its native submit`).toBe(false)
      expect(fetchMock, `${action} issues no request`).not.toHaveBeenCalled()
      expect(mounted.error().hidden).toBe(true)
    }

    // ── An endpoint that cannot be READ AT ALL falls back without throwing ────
    {
      const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
      const mounted = await mountForm('/api/lead')
      const unreadable = {
        toString() {
          throw new Error('this endpoint cannot be read')
        },
      }
      vi.spyOn(mounted.form, 'getAttribute').mockReturnValue(unreadable as unknown as string)

      // The defensive branch swallows it: no throw escapes to the page.
      const event = await submit(mounted)

      expect(event.defaultPrevented, 'an unreadable endpoint keeps its native submit').toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(mounted.error().hidden).toBe(true)
    }

    // ── A SCHEMELESS value is a relative URL, which the enhancement can send ──
    // It is enhanced, not mistaken for unparseable.
    {
      const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
      const mounted = await mountForm('/api/lead')
      mounted.form.setAttribute('action', '::::')

      const event = await submit(mounted)

      expect(event.defaultPrevented, 'a schemeless endpoint is still enhanced').toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe('::::')
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-878 — A fetchable endpoint is enhanced exactly as before, with no config
//          field governing the choice
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — a fetchable endpoint is enhanced exactly as before', () => {
  it('test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial', async () => {
    // `https:`, site-relative, and empty (post to self) — the three fetchable
    // shapes. Each is intercepted and sent as a flat JSON body.
    for (const action of ['https://api.example.com/lead', '/api/lead', '']) {
      const label = action || '(empty)'
      const fetchMock = fetchReturning({ ok: true, status: 200, json: async () => ({}) })
      const mounted = await mountForm(action)
      fillIn(mounted)

      const event = await submit(mounted)

      // The submit is intercepted — the visitor stays on the page.
      expect(event.defaultPrevented, `${label} is enhanced`).toBe(true)
      expect(fetchMock, `${label} issues exactly one request`).toHaveBeenCalledTimes(1)

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url, 'sent to the configured endpoint').toBe(action)
      expect(init.method).toBe('POST')
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')

      // A flat JSON body carrying every named control — the honeypot rides along
      // so the server can reject filled-honeypot submissions.
      const payload = JSON.parse(init.body as string)
      expect(payload, `${label} sends every named control`).toMatchObject({
        'your-name': 'Ada',
        'your-email': 'ada@example.test',
        message: 'Hello there',
        hp_company_url: '',
      })

      // A 2xx swaps the configured success message in place, without navigating.
      expect(mounted.root().innerHTML, `${label} swaps in the success message`).toContain(
        'Thanks — we will be in touch.',
      )
      expect(mounted.root().querySelector('form')).toBeNull()
      expect(mounted.window.location.pathname, `${label} did not navigate`).toBe('/contact')
    }

    // ── A non-2xx surfaces the SERVER's message inline, input preserved ───────
    {
      fetchReturning({ ok: false, status: 429, json: async () => ({ error: 'Too many messages' }) })
      const mounted = await mountForm('/api/lead')
      fillIn(mounted)

      await submit(mounted)

      expect(mounted.error().hidden).toBe(false)
      expect(mounted.error().textContent).toBe('Too many messages')
      // The visitor's input is still on the page so they can retry.
      expect(mounted.root().querySelector('form[data-contact-form]')).not.toBeNull()
      expect((mounted.form.querySelector('[name="your-name"]') as HTMLInputElement).value).toBe(
        'Ada',
      )
    }

    // ── …falling back to a STATUS-DERIVED message when the body carries none ──
    {
      fetchReturning({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError('not JSON')
        },
      })
      const mounted = await mountForm('/api/lead')

      await submit(mounted)

      expect(mounted.error().hidden).toBe(false)
      expect(mounted.error().textContent).toContain('500')
    }

    // ── An endpoint the page cannot reach still reports its connection error ──
    {
      fetchRejecting(new TypeError('Failed to fetch'))
      const mounted = await mountForm('/api/lead')

      const event = await submit(mounted)

      // It WAS enhanced (the scheme is fetchable), so the baseline is gone and
      // the inline error is the right — and only — thing to show.
      expect(event.defaultPrevented).toBe(true)
      expect(mounted.error().hidden).toBe(false)
      expect(mounted.error().textContent).toContain('Could not reach the server')
    }

    // ── No configuration governs WHICH forms are enhanced ─────────────────────
    // The endpoint's scheme already determines the answer, so a dial for it
    // would be an escape hatch the behavioural config may not express.
    const configFields = Object.keys(contactFormMeta.config)
    expect([...configFields].sort()).toEqual(['action', 'fields', 'submitLabel', 'successMessage'])
    for (const field of configFields) {
      expect(field, `config exposes no enhancement dial (${field})`).not.toMatch(
        /enhance|progressive|ajax|fetch|nojs|no_js|javascript/i,
      )
    }
  })
})
