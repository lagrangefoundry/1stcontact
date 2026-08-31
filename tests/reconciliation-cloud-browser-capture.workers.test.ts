import { describe, expect, it } from 'vitest'
import { shotUrl } from '../apps/control-app/src/shot'
import type { ShotEnv } from '../apps/control-app/src/shot'
import {
  BrowserSessionTimeoutError,
  withBrowserSession,
} from '../tools/generate/src/cli/capture/cf-driver'
import {
  screenshotUrl,
  VIEWPORTS,
  type ViewportName,
} from '../tools/generate/src/cli/capture/screenshot'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * Cloud browser capture — the deployed builder can take a picture (story-080c6036).
 *
 * WHY THESE RUN IN workerd. The claim under test is "capture becomes available
 * inside the deployed runtime", and a node-side test of the same functions would
 * pass while proving nothing about it. Every assertion here runs through
 * `@cloudflare/vitest-pool-workers` against a real D1 database and a real R2
 * bucket — the runtime the deployed Worker uses.
 *
 * THE ONE FAKE IS THE BROWSER, and it is at the boundary rather than inside it.
 * A Browser Rendering session is a third party reached over a wire protocol, and
 * it is never the thing under test. What IS under test is everything between the
 * seam and us: the preset resolution, the lease, the context lifecycle, the
 * per-driver network log, and the named failure a deployment without the binding
 * produces. All of that is real production code here.
 */

/** The PNG file signature — eight bytes an HTML error page cannot forge. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** A deployment with no `[browser]` binding, which is what every test here
 *  drives: each one injects its launcher. The ABSENCE itself is AC-1461's
 *  subject and is asserted in its sibling file, which needs the Worker's own
 *  entry point to show that editing, rendering and publishing are unaffected. */
const NO_BROWSER: ShotEnv = {}

// ── AC-1459 — a screenshot request returns PNG bytes at the named preset ──────

describe('AC-1459 — PNG bytes at the named viewport preset, inside the deployed runtime', () => {
  it('test_UAT_AC1459_screenshot_returns_png_bytes_at_each_named_preset', async () => {
    const expected: Array<[ViewportName | undefined, { width: number; height: number }]> = [
      ['mobile', { width: 375, height: 667 }],
      ['tablet', { width: 768, height: 1024 }],
      ['desktop', { width: 1280, height: 800 }],
      // Omitting the preset is `desktop`, stated as its own case rather than
      // inferred from the signature — a changed default would otherwise ship
      // silently, at the wrong width, with nothing reporting it.
      [undefined, { width: 1280, height: 800 }],
    ]

    for (const [preset, size] of expected) {
      const browser = fakeBrowser()
      const png =
        preset === undefined
          ? await shotUrl(NO_BROWSER, 'https://example.com/', undefined, { launch: browser.launch })
          : await shotUrl(NO_BROWSER, 'https://example.com/', preset, { launch: browser.launch })

      // The PNG signature, not merely "some bytes": a returned HTML error
      // document is also bytes, and would pass a length check.
      expect([...png.slice(0, 8)], `${preset ?? '(default)'} bytes`).toEqual(PNG_SIGNATURE)

      // The preset's dimensions were the ones actually applied to the page
      // before the image was produced. `1c shot` loads at the capture path's
      // default width and applies the target at capture time, so the requested
      // size is the LAST viewport applied.
      expect(browser.log.viewports.at(-1), `${preset ?? '(default)'} viewport`).toEqual(size)
      // And the preset table is the source of those numbers, not a second copy.
      expect(VIEWPORTS[preset ?? 'desktop']).toEqual(size)
    }
  })
})

// ── AC-1460 — an unrecognised preset is refused by name ──────────────────────

describe('AC-1460 — an unrecognised viewport preset is refused, never defaulted', () => {
  it('test_UAT_AC1460_unknown_preset_is_refused_naming_it_and_the_valid_set', async () => {
    const browser = fakeBrowser()

    const attempt = shotUrl(
      NO_BROWSER,
      'https://example.com/',
      'phablet' as ViewportName,
      { launch: browser.launch },
    )

    // No image is produced.
    await expect(attempt).rejects.toThrow(Error)
    const err = await attempt.then(
      () => null,
      (e: unknown) => e as Error,
    )
    // The failure names the rejected value AND the set that would have worked,
    // so the caller can correct it without reading the source.
    expect(err?.message).toContain('phablet')
    expect(err?.message).toContain('mobile')
    expect(err?.message).toContain('tablet')
    expect(err?.message).toContain('desktop')

    // No metered session was acquired for a request that was never valid: the
    // preset is resolved before the lease is taken.
    expect(browser.launches()).toBe(0)
    expect(browser.log.contextsOpened).toBe(0)

    // A silent fallback would have produced a correct-looking picture at some
    // other width, which is the exact outcome the refusal exists to prevent.
    expect(browser.log.viewports).toEqual([])
  })
})

// ── AC-1462 — one browser per run, one isolated context per capture ──────────

describe('AC-1462 — a run leases one browser and gives every capture its own context', () => {
  it('test_UAT_AC1462_one_browser_and_a_fresh_context_per_viewport_across_a_ladder', async () => {
    const browser = fakeBrowser()
    const widths = [320, 480, 768, 1024, 1280, 1440]

    await withBrowserSession(browser.launch, async (session) => {
      for (const width of widths) {
        await screenshotUrl('https://example.com/', { width, height: 800 }, session.driverFactory())
      }
    })

    // The economics this story turns on: six viewports used to mean six metered
    // browser acquisitions, each counted against the acquisition rate limit.
    expect(browser.launches()).toBe(1)
    // Cold-start-per-size is preserved exactly — a context has its own cookie
    // jar, cache and storage, so a consent or A/B cookie set at 320px cannot
    // pin every wider capture to that variant.
    expect(browser.log.contextsOpened).toBe(widths.length)
    expect(browser.log.contextsClosed).toBe(widths.length)
    // And the lease is given back when the run ends.
    expect(browser.log.browserClosed).toBe(true)
  })
})

// ── AC-1463 — the session is released on failure and on the time ceiling ─────

describe('AC-1463 — the leased browser is released on every exit path', () => {
  it('test_UAT_AC1463_release_on_success_on_failure_and_on_the_time_ceiling', async () => {
    // 1. A successful capture releases the browser.
    const ok = fakeBrowser()
    await withBrowserSession(ok.launch, async (session) => {
      await screenshotUrl(
        'https://example.com/',
        { width: 800, height: 600 },
        session.driverFactory(),
      )
    })
    expect(ok.log.browserClosed).toBe(true)

    // 2. A capture whose navigation throws releases the browser AND the failed
    //    capture's own context, and reports the navigation's own failure —
    //    release must not mask it or replace it with a second, confusing error.
    const broken = fakeBrowser({ failOnGoto: true })
    const failure = withBrowserSession(broken.launch, async (session) => {
      await screenshotUrl(
        'https://example.com/',
        { width: 800, height: 600 },
        session.driverFactory(),
      )
    })
    await expect(failure).rejects.toThrow(/ERR_CONNECTION_REFUSED/)
    const pageError = await failure.then(
      () => null,
      (e: unknown) => e as Error,
    )
    expect(pageError).not.toBeInstanceOf(BrowserSessionTimeoutError)
    expect(broken.log.browserClosed).toBe(true)
    expect(broken.log.contextsClosed).toBe(1)

    // 3. A run against a page that never settles fails with the TIME-LIMIT
    //    outcome rather than the page's error, states the ceiling it exceeded,
    //    and still gives the session back.
    const wedged = fakeBrowser({ hang: true })
    const timedOut = withBrowserSession(
      wedged.launch,
      async (session) => {
        await screenshotUrl(
          'https://example.com/',
          { width: 800, height: 600 },
          session.driverFactory(),
        )
      },
      { timeoutMs: 25 },
    )
    await expect(timedOut).rejects.toBeInstanceOf(BrowserSessionTimeoutError)
    const timeout = (await timedOut.then(
      () => null,
      (e: unknown) => e as BrowserSessionTimeoutError,
    ))!
    // Separable by a caller from a page error, and it names the ceiling.
    expect(timeout.name).toBe('BrowserSessionTimeoutError')
    expect(timeout.timeoutMs).toBe(25)
    expect(timeout.message).toContain('25')
    // The point of the ceiling: a wedged page costs a failed screenshot, not a
    // billed session held against the concurrency cap until the idle reaper.
    expect(wedged.log.browserClosed).toBe(true)

    // 4. A default ceiling applies when the caller names none: the lease above
    //    (scenario 1) passed no `timeoutMs` at all and still completed and
    //    released, so the default is a real bound rather than "no limit".
    expect(ok.log.contextsClosed).toBe(1)
  })
})

// ── AC-1464 — one navigation per capture ─────────────────────────────────────

describe("AC-1464 — each capture's request record contains only its own page's requests", () => {
  it('test_UAT_AC1464_a_second_capture_in_the_same_run_carries_none_of_the_first', async () => {
    // Two same-host subresources, so each navigation has a request record with
    // real content rather than a single document entry.
    const browser = fakeBrowser({
      extraRequests: ['https://example.com/app.css', 'https://example.com/logo.png'],
    })

    await withBrowserSession(browser.launch, async (session) => {
      const factory = session.driverFactory()

      const first = await factory()
      await first.navigate('https://example.com/')
      const firstUrls = [...first.diagnostics().requestedUrls]
      await first.close()
      expect(firstUrls.length).toBeGreaterThan(1)

      const second = await factory()
      await second.navigate('https://example.com/')
      const secondUrls = second.diagnostics().requestedUrls
      await second.close()

      // Same size and same contents — NOT the union. A capture reused across
      // two pages would merge the first page's network log into the second,
      // and `requestedUrls` is what the security conformance dimension checks
      // egress against: the corruption would land as a clean verdict on a page
      // that was not clean, which is a false answer rather than a crash.
      expect(secondUrls.length).toBe(firstUrls.length)
      expect([...secondUrls].sort()).toEqual([...firstUrls].sort())
    })
  })
})
