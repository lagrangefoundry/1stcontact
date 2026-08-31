/**
 * story-e674c60a — **a workspace that cannot start says so in the page**.
 *
 * The document always arrives 200, so three unrelated faults used to produce one
 * indistinguishable symptom: a blank page with the reason reachable only in a
 * developer console. The guard closes that, and it is carried INLINE in the
 * document because serving it as a file would make the diagnostic depend on the
 * very artifact layer most likely to be broken when it is needed.
 *
 * IT IS EXECUTED HERE, against a real document environment, rather than asserted
 * as a substring of the workspace document. A test that only checked the string
 * was present would pass on a guard that threw on its first line — which is the
 * one failure mode that matters, since this is the code that runs when
 * everything else has already gone wrong.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { APP_ID, BOOT_DEADLINE_MS, BOOT_GUARD } from '../apps/control-app/src/boot-guard'
import { chromeHtml } from '../apps/control-app/src/chrome'

/** What the site listing answered when the guard asked, or a refusal to answer. */
type Listing = { status: number; body: string } | Error

interface Booted {
  dom: JSDOM
  /** The mount point the workspace claims, and the guard writes into only if empty. */
  app: Element
  /** How many times the guard asked the site listing for its status. */
  listingCalls: () => number
  /** Fire the guard's deadline and let its promise chain settle. */
  reachDeadline(during?: () => void): Promise<void>
}

const OPEN: JSDOM[] = []

/** A document shaped like the workspace's, with the guard armed but not fired. */
function boot(listing: Listing): Booted {
  const dom = new JSDOM(`<!doctype html><html><body><div id="${APP_ID}"></div></body></html>`, {
    runScripts: 'outside-only',
    url: 'https://app.example/',
  })
  OPEN.push(dom)
  let calls = 0
  const win = dom.window as unknown as { fetch?: unknown; eval(code: string): void }
  win.fetch = () => {
    calls += 1
    return listing instanceof Error
      ? Promise.reject(listing)
      : Promise.resolve({
          status: listing.status,
          text: () => Promise.resolve(listing.body),
        })
  }
  win.eval(BOOT_GUARD)

  const app = dom.window.document.getElementById(APP_ID)!
  return {
    dom,
    app,
    listingCalls: () => calls,
    async reachDeadline(during?: () => void) {
      vi.advanceTimersByTime(BOOT_DEADLINE_MS)
      // The mount that lands *between* the deadline firing and the guard writing
      // is the race the guard exists not to lose.
      during?.()
      vi.useRealTimers()
      // Two macrotask turns: the listing resolves, then `render` runs on its `then`.
      await new Promise((r) => setTimeout(r, 0))
      await new Promise((r) => setTimeout(r, 0))
      vi.useFakeTimers()
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  while (OPEN.length) OPEN.pop()!.window.close()
})

describe('story-e674c60a — a workspace that cannot start', () => {
  it('test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page', async () => {
    // ── fault one: a build artifact the client imports fails to load ────────
    // The commonest cause and the one with the least visible symptom. The error
    // event fires on the ELEMENT and does not bubble, which is why the guard
    // listens in the capture phase; a listener that did not would see nothing.
    const missing = boot({ status: 200, body: '[]' })
    const script = missing.dom.window.document.createElement('script')
    script.setAttribute('src', '/builder/main.js')
    missing.dom.window.document.body.appendChild(script)
    script.dispatchEvent(new missing.dom.window.Event('error'))
    await missing.reachDeadline()

    const missingHtml = missing.app.innerHTML
    expect(missingHtml).toContain('The builder did not start')
    expect(missingHtml).toContain('/builder/main.js')
    // A NAMED FIX, not "check the console" — which would be the same non-answer
    // the blank page already gave. The restart is part of it: the assets
    // manifest is read once at startup, so rebuilding alone changes nothing.
    expect(missingHtml).toContain('1c assets')
    expect(missingHtml).toContain('restart')

    // ── fault two: the store holds no account for this deployment ───────────
    // The client awaits the listing at TOP LEVEL, so a refusal rejects the
    // module and nothing mounts. The guard asks the listing itself rather than
    // guessing, so the live answer is what the operator reads.
    const noAccount = boot({ status: 503, body: "No tenant 'story-e674c60a'." })
    noAccount.dom.window.dispatchEvent(
      Object.assign(new noAccount.dom.window.Event('unhandledrejection'), {
        reason: new Error('GET /api/sites → 503'),
      }),
    )
    await noAccount.reachDeadline()

    const noAccountHtml = noAccount.app.innerHTML
    expect(noAccountHtml).toContain('The builder did not start')
    expect(noAccountHtml).toContain('503')
    expect(noAccountHtml).toContain('No tenant')
    // Its own named fix, and a different one — the two causes an operator can
    // act on need different actions, so one hint for both would be no hint.
    expect(noAccountHtml).toContain('bin/publish')
    expect(noAccountHtml).not.toContain('1c assets')

    // ── fault three: the client throws while mounting ───────────────────────
    const threw = boot({ status: 200, body: '[]' })
    threw.dom.window.dispatchEvent(
      Object.assign(new threw.dom.window.Event('error'), {
        message: 'mountBuilder threw: cannot read properties of undefined',
      }),
    )
    await threw.reachDeadline()

    const threwHtml = threw.app.innerHTML
    expect(threwHtml).toContain('The builder did not start')
    expect(threwHtml).toContain('mountBuilder threw')
    // The live answer the listing gave when asked, so a healthy store is not
    // reported as the cause of a client that broke on its own.
    expect(threwHtml).toContain('200')

    // ── it never overwrites a workspace that started slowly ─────────────────
    // The mount lands AFTER the deadline has fired, while the guard is still
    // asking the listing. Every write path re-checks the mount point is empty
    // immediately beforehand, so the workspace survives.
    const slow = boot({ status: 200, body: '[]' })
    slow.dom.window.dispatchEvent(
      Object.assign(new slow.dom.window.Event('unhandledrejection'), {
        reason: new Error('something failed, and then the mount succeeded anyway'),
      }),
    )
    await slow.reachDeadline(() => {
      slow.app.innerHTML = '<div class="builder-shell">the real thing</div>'
    })
    expect(slow.app.innerHTML).toBe('<div class="builder-shell">the real thing</div>')

    // ── a healthy load costs nothing ────────────────────────────────────────
    // The listing is asked only once the page is already known to be broken.
    const healthy = boot({ status: 200, body: '[]' })
    healthy.app.innerHTML = '<div class="builder-shell">mounted</div>'
    await healthy.reachDeadline()
    expect(healthy.listingCalls()).toBe(0)
    expect(healthy.app.innerHTML).toBe('<div class="builder-shell">mounted</div>')

    // …and the broken loads did ask it, so the count above is not vacuous.
    expect(missing.listingCalls()).toBe(1)
    expect(noAccount.listingCalls()).toBe(1)

    // ── the guard is inline, and registered before the client it watches ────
    // Inline, because serving it as a file would make the diagnostic depend on
    // the artifact layer. Before the client, because a classic script runs at
    // parse time and a module is deferred: that ordering is what lets the
    // guard's listeners exist in time to see the module's own load failure.
    const document = chromeHtml()
    expect(document).toContain(BOOT_GUARD)
    expect(document.indexOf(BOOT_GUARD)).toBeLessThan(document.indexOf('src="/builder/main.js"'))
    expect(document).not.toContain('boot-guard.js')
  })
})
