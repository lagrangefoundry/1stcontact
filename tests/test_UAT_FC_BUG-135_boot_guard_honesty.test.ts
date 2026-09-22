/**
 * BUG-135 — the boot guard reported a working builder as failed, and broke its
 * layout doing it.
 *
 * The production builder crosses four seconds on the mount path (Cloudflare
 * Access in front of every module fetch, plus the composer's cross-origin
 * engine), so the guard fired on a healthy boot, wrote **"The builder did not
 * start."** into `#app`, and the shell then mounted underneath it. The panel was
 * an unclassed `div` as first child of the mount point, ahead of everything the
 * shell laid out, and the chat composer rendered with no input at all.
 *
 * Three separable claims are asserted here, matching the three in the ticket:
 * the guard renders outside `#app`; it retracts when the builder arrives; and it
 * no longer treats a clock as evidence of failure — with `main.js` recording its
 * own progress so "slow" can say which kind of slow.
 *
 * Everything runs the guard against a real DOM, because a test that asserted the
 * source string would pass on a guard that threw on its first line.
 */
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  APP_ID,
  BOOT_DEADLINE_MS,
  BOOT_GUARD,
  BOOT_NOTICE_MS,
  BOOT_PHASE_ATTR,
  BOOT_PHASE_LOADING,
  BOOT_PHASE_MOUNTING,
  BOOT_WATCH_MS,
  GUARD_ID,
} from '../apps/control-app/src/boot-guard'

let dom: JSDOM

/** A document shaped like the chrome, with the guard armed but not yet fired. */
function boot(): void {
  dom = new JSDOM(`<!doctype html><html><body><div id="${APP_ID}"></div></body></html>`, {
    runScripts: 'outside-only',
    url: 'https://app.example/',
  })
  const win = dom.window as unknown as { fetch?: unknown; eval(code: string): void }
  win.fetch = () => Promise.resolve({ status: 503, body: '', text: () => Promise.resolve('boom') })
  win.eval(BOOT_GUARD)
}

function app(): Element {
  return dom.window.document.getElementById(APP_ID)!
}

function guard(): Element | null {
  return dom.window.document.getElementById(GUARD_ID)
}

function guardHtml(): string {
  return guard()?.innerHTML ?? ''
}

/** The shape every fatal boot takes: the module graph rejects. */
function moduleRejected(message: string): void {
  dom.window.dispatchEvent(
    Object.assign(new dom.window.Event('unhandledrejection'), { reason: new Error(message) }),
  )
}

/** The builder arriving — late, but arriving. */
function builderMounts(): void {
  app().innerHTML = '<div class="builder-shell">the real thing</div>'
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  dom?.window.close()
})

describe('BUG-135 — the guard tells the truth, and cannot break the page telling it', () => {
  it('test_UAT_FC_BUG-135_a_slow_mount_is_never_reported_as_a_failure', async () => {
    // The defect, stated directly. Nothing has failed — no load error, no
    // rejected module — the builder is simply slower than the clock. The guard
    // may say it is waiting; it may not say the builder did not start.
    boot()

    await vi.advanceTimersByTimeAsync(BOOT_DEADLINE_MS + BOOT_WATCH_MS * 4)

    const html = guardHtml()
    expect(html).not.toContain('did not start')
    expect(html).toContain('Still loading')
    // And the deadline that licenses a verdict is no longer the four seconds
    // that a production mount routinely crosses. The larger number is part of
    // the fix, not the fix: the split between the two sentences is the fix.
    expect(BOOT_NOTICE_MS).toBeLessThan(BOOT_DEADLINE_MS)
    expect(BOOT_DEADLINE_MS).toBeGreaterThan(4000)
  })

  it('test_UAT_FC_BUG-135_the_guard_never_writes_into_the_mount_point', async () => {
    // Claim 1. Whatever the guard shows, it shows somewhere that cannot
    // participate in the builder's layout — so the invisible chat composer is
    // unreachable however wrong everything else is. This is asserted for the
    // loud case (a real fault, the full panel), which is the one that did it.
    boot()
    moduleRejected('GET /api/sites → 503')

    await vi.advanceTimersByTimeAsync(BOOT_DEADLINE_MS)

    expect(guardHtml()).toContain('The builder did not start')
    // Nothing at all inside the mount point...
    expect(app().childElementCount).toBe(0)
    expect(app().innerHTML).toBe('')
    // ...and what it did write is a direct child of `body`, taken out of flow.
    expect(guard()!.parentElement).toBe(dom.window.document.body)
    expect(guard()!.getAttribute('style')).toContain('position:fixed')
  })

  it('test_UAT_FC_BUG-135_the_guard_retracts_when_the_builder_arrives_late', async () => {
    // Claim 2, and the half of the docstring's promise that was missing: the
    // guard must not overwrite a builder that mounted first (it never did), AND
    // it must withdraw for a builder that mounts second (it never did).
    boot()
    moduleRejected('GET /api/sites → 503')
    await vi.advanceTimersByTimeAsync(BOOT_DEADLINE_MS)
    expect(guard()).not.toBeNull()

    builderMounts()
    await vi.advanceTimersByTimeAsync(BOOT_WATCH_MS * 2)

    expect(guard()).toBeNull()
    expect(app().innerHTML).toBe('<div class="builder-shell">the real thing</div>')
  })

  it('test_UAT_FC_BUG-135_the_waiting_note_says_which_kind_of_slow', async () => {
    // Claim 3. "Has not started" and "has not started yet" are different
    // sentences, and which one is true is a thing only `main.js` knows. With no
    // phase recorded the module graph itself has not run; with one recorded it
    // has, and the wait is the server's.
    boot()
    await vi.advanceTimersByTimeAsync(BOOT_NOTICE_MS)
    expect(guardHtml()).toContain('code is still loading')

    dom.window.document.documentElement.setAttribute(BOOT_PHASE_ATTR, BOOT_PHASE_LOADING)
    await vi.advanceTimersByTimeAsync(BOOT_WATCH_MS * 2)
    expect(guardHtml()).toContain('waiting on the server')

    dom.window.document.documentElement.setAttribute(BOOT_PHASE_ATTR, BOOT_PHASE_MOUNTING)
    await vi.advanceTimersByTimeAsync(BOOT_WATCH_MS * 2)
    expect(guardHtml()).toContain('drawing')
    // Still no verdict at any point — nothing has failed.
    expect(guardHtml()).not.toContain('did not start')
  })

  it('test_UAT_FC_BUG-135_a_fault_that_arrives_after_the_deadline_is_still_reported', async () => {
    // The consequence of letting evidence rather than the clock license the
    // verdict: the guard can no longer look once and stop looking. A module that
    // 404s at eight seconds is as dead as one that 404s at one, and an operator
    // left with "still loading" forever would be back at the blank page.
    boot()
    await vi.advanceTimersByTimeAsync(BOOT_DEADLINE_MS)
    expect(guardHtml()).toContain('Still loading')

    const script = dom.window.document.createElement('script')
    script.setAttribute('src', '/webui/webui-shell/src/index.js')
    dom.window.document.body.appendChild(script)
    script.dispatchEvent(new dom.window.Event('error'))
    await vi.advanceTimersByTimeAsync(BOOT_WATCH_MS * 2)

    const html = guardHtml()
    expect(html).toContain('The builder did not start')
    expect(html).toContain('/webui/webui-shell/src/index.js')
    expect(html).toContain('1c assets')
  })

  it('test_UAT_FC_BUG-135_main_js_records_that_its_module_body_began', () => {
    // The phase attribute is the guard's only evidence, and the two files that
    // spell it cannot share a symbol: `boot-guard.ts` is bundled into the chrome
    // document and `main.js` is browser source served as-is, importing modules
    // by absolute URL that no bundler resolves. So the spellings are pinned
    // here instead — a rename that reached only one side would otherwise turn
    // every slow boot back into "the module graph never ran".
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'apps', 'control-app', 'src', 'builder', 'main.js'),
      'utf8',
    )
    expect(source).toContain(`setAttribute('${BOOT_PHASE_ATTR}', '${BOOT_PHASE_LOADING}')`)
    expect(source).toContain(`setAttribute('${BOOT_PHASE_ATTR}', '${BOOT_PHASE_MOUNTING}')`)
    // And in that order: the module body starts before its answers arrive.
    expect(source.indexOf(`'${BOOT_PHASE_LOADING}'`)).toBeLessThan(
      source.indexOf(`'${BOOT_PHASE_MOUNTING}'`),
    )
    // `loading` is written by the module BODY, so it has to sit below the
    // imports — above them it would be hoisted past nothing and prove nothing.
    expect(source.indexOf(`'${BOOT_PHASE_LOADING}'`)).toBeGreaterThan(
      source.lastIndexOf('\nimport '),
    )
  })
})
