/**
 * REQ-149 AC-11 — a builder that cannot start says so in the page.
 *
 * The guard is executed against a real DOM here rather than asserted as a
 * substring of the chrome document. A test that only checked the string was
 * present would pass on a guard that threw on its first line, which is the one
 * failure mode that matters: this is the code that runs when everything else has
 * already gone wrong.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { APP_ID, BOOT_DEADLINE_MS, BOOT_GUARD } from '../apps/control-app/src/boot-guard'
import { chromeHtml } from '../apps/control-app/src/chrome'

let dom: JSDOM

/** A document shaped like the chrome, with the guard armed but not yet fired. */
function bootWith(apiResponse: { status: number; body: string } | Error | null): JSDOM {
  dom = new JSDOM(`<!doctype html><html><body><div id="${APP_ID}"></div></body></html>`, {
    runScripts: 'outside-only',
    url: 'https://app.example/',
  })
  const win = dom.window as unknown as {
    fetch?: unknown
    eval(code: string): void
  }
  win.fetch =
    apiResponse === null
      ? undefined
      : apiResponse instanceof Error
        ? () => Promise.reject(apiResponse)
        : () =>
            Promise.resolve({
              status: apiResponse.status,
              text: () => Promise.resolve(apiResponse.body),
            })
  win.eval(BOOT_GUARD)
  return dom
}

function app(): Element {
  return dom.window.document.getElementById(APP_ID)!
}

/** Run the guard's deadline and let its promise chain settle. */
async function reachDeadline(): Promise<void> {
  vi.advanceTimersByTime(BOOT_DEADLINE_MS)
  vi.useRealTimers()
  // Two macrotask turns: the probe resolves, then `render` runs on its `then`.
  await new Promise((r) => setTimeout(r, 0))
  await new Promise((r) => setTimeout(r, 0))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  dom?.window.close()
})

describe('REQ-149 — the builder does not fail silently', () => {
  it('test_UAT_FC_REQ-149_a_missing_asset_is_named_in_the_page', async () => {
    // The commonest cause and the one with the least visible symptom: a module
    // in the import graph 404s, so nothing ever mounts. The error event fires on
    // the ELEMENT and does not bubble, which is why the guard listens in the
    // capture phase — a listener that did not would see nothing at all.
    bootWith({ status: 200, body: '[]' })
    const script = dom.window.document.createElement('script')
    script.setAttribute('src', '/webui/webui-shell/src/index.js')
    dom.window.document.body.appendChild(script)
    script.dispatchEvent(new dom.window.Event('error'))

    await reachDeadline()

    const html = app().innerHTML
    expect(html).toContain('The builder did not start')
    expect(html).toContain('/webui/webui-shell/src/index.js')
    // Named cause, named fix — including the restart, because the assets
    // manifest is read once at startup and rebuilding alone changes nothing.
    expect(html).toContain('1c assets')
    expect(html).toContain('restart')
  })

  it('test_UAT_FC_REQ-149_a_store_with_no_tenant_is_named_in_the_page', async () => {
    // `main.js` awaits `/api/sites` at TOP LEVEL, so a refusal rejects the
    // module and nothing mounts. The guard asks the API itself rather than
    // guessing, so "no tenant" reads as itself.
    bootWith({ status: 503, body: "No tenant '1stcontact'." })
    dom.window.dispatchEvent(
      Object.assign(new dom.window.Event('unhandledrejection'), {
        reason: new Error('GET /api/sites → 503'),
      }),
    )

    await reachDeadline()

    const html = app().innerHTML
    expect(html).toContain('The builder did not start')
    expect(html).toContain('503')
    expect(html).toContain("No tenant")
    expect(html).toContain('bin/publish')
  })

  it('test_UAT_FC_REQ-149_a_builder_that_mounted_is_never_overwritten', async () => {
    // The guard must never race a slow-but-successful mount. Every write path
    // re-checks that `#app` is empty immediately beforehand, so a builder that
    // arrived late keeps its page.
    bootWith({ status: 200, body: '[]' })
    app().innerHTML = '<div class="builder-shell">the real thing</div>'

    await reachDeadline()

    expect(app().innerHTML).toBe('<div class="builder-shell">the real thing</div>')
  })

  it('test_UAT_FC_REQ-149_an_unreachable_api_still_produces_a_page', async () => {
    // The diagnostic must survive its own diagnostics failing — an origin that
    // refuses the connection outright is exactly when an operator needs a page
    // rather than a second silent failure.
    bootWith(new Error('Failed to fetch'))

    await reachDeadline()

    const html = app().innerHTML
    expect(html).toContain('The builder did not start')
    expect(html).toContain('unreachable')
  })

  it('test_UAT_FC_REQ-149_the_guard_is_inline_and_precedes_the_module', () => {
    // Inline, because serving it as a file would make the diagnostic depend on
    // the assets binding — the thing most likely to be broken when it is needed.
    // Before the module, because a classic script runs at parse time and a
    // module is deferred: that ordering is what lets the guard's listeners be
    // registered in time to see the module's own load failure.
    const html = chromeHtml()
    expect(html).toContain(BOOT_GUARD)
    expect(html.indexOf(BOOT_GUARD)).toBeLessThan(html.indexOf('src="/builder/main.js"'))
    expect(html).not.toContain('boot-guard.js')
  })
})
