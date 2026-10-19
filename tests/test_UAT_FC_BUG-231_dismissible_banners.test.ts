// @vitest-environment jsdom
/**
 * BUG-231 — **a banner the client can act on can be put away; a banner that
 * explains a lock cannot.**
 *
 * The publish failure banner used to stay at the top of the preview until
 * something else replaced it, so a client who had read it — or already fixed
 * the cause — still had an alarm on screen. Every actionable banner now has a
 * dismiss ×, drawn by one shared helper (`banner.js`), and dismissing removes
 * the banner and nothing else: the next failure draws a fresh one.
 *
 * The banners that are the reason the builder is locked — not configured
 * (REQ-173), no business (REQ-179) and a running publish (REQ-222) — have no ×,
 * because hiding them would leave a locked builder with no explanation.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-231 dismissible-banner suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

type App = { shell: { element: HTMLElement }; destroy(): void }

const SITES = [{ site: 'bakery', latest: 1 }]

function mountWithPublish(publish: () => Promise<unknown>): App {
  return mountBuilder(root, { sites: SITES, storage: memoryStorage(), publish }) as unknown as App
}

const publishButton = () => root.querySelector<HTMLButtonElement>('.builder-toolbar__publish')!
const failedBanner = () => root.querySelector<HTMLElement>('.builder-banner--publish-failed')
const dismissButtons = (el: Element) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].filter(
    (b) => b.getAttribute('aria-label') === 'Dismiss',
  )

describe.skipIf(!WEBUI_INSTALLED)('BUG-231 — the publish failure banner can be dismissed', () => {
  it('test_UAT_FC_BUG_231_a_failed_publish_banner_dismisses_and_the_next_failure_shows_again', async () => {
    let gate = deferred<unknown>()
    let calls = 0
    const app = mountWithPublish(() => {
      calls += 1
      return gate.promise
    })
    await settle()

    publishButton().click()
    await settle()
    gate.reject(new Error('The address is not set up.'))
    await settle()
    await settle()

    const first = failedBanner()
    expect(first, 'a failed publish reports itself').toBeTruthy()
    const [dismiss, ...extra] = dismissButtons(first!)
    expect(dismiss, 'the failure banner has a Dismiss button').toBeTruthy()
    expect(extra).toHaveLength(0)
    expect(dismiss.type).toBe('button')
    // THE BANNER'S TEXT IS STILL ITS WORDS — the × is drawn by CSS. Since
    // [[BUG-230]] those words are the plain line, with the server's sentence
    // behind a Details toggle.
    expect(first!.textContent).toBe(
      'This site was not published. Something went wrong — try again in a minute, and tell us if it keeps happening.' +
        'Details' +
        'The address is not set up.',
    )

    dismiss.click()
    expect(failedBanner(), 'dismissing removes the banner').toBeNull()
    // …AND NOTHING ELSE: the builder is not locked, and Publish still works.
    expect(publishButton().disabled).toBe(false)

    // The SAME message again is a NEW failure, and it is shown again.
    gate = deferred<unknown>()
    publishButton().click()
    await settle()
    gate.reject(new Error('The address is not set up.'))
    await settle()
    await settle()
    expect(calls).toBe(2)
    expect(failedBanner(), 'a second failure draws a fresh banner').toBeTruthy()
    expect(failedBanner()).not.toBe(first)
    app.destroy()
  })

  it('test_UAT_FC_BUG_231_escape_inside_the_banner_dismisses_it', async () => {
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()
    gate.reject(new Error('nope'))
    await settle()
    await settle()

    const banner = failedBanner()!
    const [dismiss] = dismissButtons(banner)
    dismiss.focus()
    expect(document.activeElement).toBe(dismiss)
    dismiss.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(failedBanner()).toBeNull()
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-231 — banners that explain a lock have no ×', () => {
  it('test_UAT_FC_BUG_231_not_configured_no_business_and_publishing_banners_are_not_dismissible', async () => {
    // Not configured (REQ-173).
    let app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      aiStatus: { ai: false, message: 'No Anthropic API key is set.' },
    }) as unknown as App
    await settle()
    const blocked = root.querySelector('.builder-banner')!
    expect(blocked).toBeTruthy()
    expect(dismissButtons(blocked)).toHaveLength(0)
    blocked.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(blocked.isConnected).toBe(true)
    app.destroy()

    // No business selectable (REQ-179).
    document.body.replaceChildren(root)
    root.replaceChildren()
    app = mountBuilder(root, {
      businesses: [
        { id: 'acct_salon', name: 'Salon', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
      ],
      person: { name: 'Sam', email: 'sam@example.test' },
      storage: memoryStorage(),
      loadSites: async () => [],
    }) as unknown as App
    await settle()
    const none = root.querySelector('.builder-banner--no-business')!
    expect(none).toBeTruthy()
    expect(dismissButtons(none)).toHaveLength(0)
    app.destroy()

    // A publish running (REQ-222).
    root.replaceChildren()
    const gate = deferred<unknown>()
    app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      publish: (_slug: string, onProgress: (p: unknown) => void) => {
        onProgress({ total: 5, done: 0 })
        return gate.promise
      },
    }) as unknown as App
    await settle()
    publishButton().click()
    await settle()
    const publishing = root.querySelector('.builder-banner--publishing')!
    expect(publishing).toBeTruthy()
    expect(dismissButtons(publishing)).toHaveLength(0)
    gate.resolve({})
    await settle()
    app.destroy()
  })
})

describe('BUG-231 — one helper draws every dismissible banner', () => {
  it('test_UAT_FC_BUG_231_every_dismissible_banner_has_exactly_one_dismiss_button', async () => {
    const { createBanner } = await import('../apps/control-app/src/builder/banner.js')
    const { createOperatorBanner } = await import('../apps/control-app/src/builder/business.js')

    const plain = createBanner({ className: 'builder-banner', content: 'Something to read.', dismissible: true })
    const locked = createBanner({ className: 'builder-banner', content: 'Locked.' })
    // The operator banner (REQ-367) keeps its own "back" control beside the ×.
    let wentBack = false
    const operator = createOperatorBanner({ name: 'Salon', back: { name: 'Lab', onBack: () => (wentBack = true) } })
    const operatorNoBack = createOperatorBanner({ name: 'Salon' })

    for (const el of [plain, operator.element, operatorNoBack.element]) {
      root.append(el)
      const dismiss = dismissButtons(el)
      expect(dismiss, `${el.className} has exactly one Dismiss`).toHaveLength(1)
      // Its accessible name is "Dismiss" and nothing else: no text content to compete.
      expect(dismiss[0].textContent).toBe('')
      expect(dismiss[0].classList.contains('builder-banner__dismiss')).toBe(true)
      // At the top right: the last thing in the banner.
      expect(el.lastElementChild).toBe(dismiss[0])
    }
    expect(dismissButtons(locked)).toHaveLength(0)

    // The back control still works and is still the first button.
    operator.element.querySelector('button')!.click()
    expect(wentBack).toBe(true)
    dismissButtons(operator.element)[0].click()
    expect(operator.element.isConnected).toBe(false)

    // The look: the CSS draws the glyph, and grows the target on a phone.
    expect(CSS).toMatch(/\.builder-banner__dismiss::before\s*\{[^}]*content:\s*'×'/)
    expect(CSS).toMatch(/@media \(pointer: coarse\)\s*\{\s*\.builder-banner__dismiss\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/)
  })
})
