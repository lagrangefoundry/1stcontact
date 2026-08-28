import { beforeAll, describe, expect, it } from 'vitest'
import {
  shotPreview,
  shotUrl,
  BrowserNotConfiguredError,
  type ShotEnv,
} from '../apps/control-app/src/shot'
import { previewRenderer } from '../apps/control-app/src/router'
import {
  withBrowserSession,
  BrowserSessionTimeoutError,
} from '../tools/generate/src/cli/capture/cf-driver'
import { screenshotUrl } from '../tools/generate/src/cli/capture/screenshot'
import { previewOriginResolver } from '../tools/generate/src/cli/preview'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { fakeBrowser } from './support/fake-puppeteer'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'

/**
 * REQ-154 — the headless browser in the cloud, inside workerd.
 *
 * WHAT MAKES THESE WORTH ANYTHING. Every assertion runs inside the runtime the
 * deployed Worker uses, against a REAL D1 database, a REAL R2 bucket and the
 * REAL `PreviewRenderer` the `/preview/*` route serves from. The one thing that
 * is not real is the browser on the far side of the seam — a third party reached
 * over a wire protocol, and never the thing under test. Everything between it
 * and us is the production code path: the interception decision, the per-host
 * ownership rule, the response cache, the context lifecycle, the lease.
 *
 * THE CENTRAL CLAIM. A browser the Worker launches is an unauthenticated client,
 * so a naive screenshot of our own preview captures a Cloudflare Access
 * challenge — with no error anywhere, which is what makes it dangerous. These
 * tests assert the mechanism that makes that outcome UNREACHABLE rather than
 * unlikely: no request to our own host ever leaves the browser.
 */

const ORIGIN = 'https://app.1stcontact.io'

/** Only the Browser Rendering binding matters here; it is never touched, because
 *  every test injects its launcher. Its absence is itself asserted below. */
const NO_BROWSER: ShotEnv = {}

beforeAll(async () => {
  await applySchema()
})

/** A real seeded site plus the real renderer the preview route would use. */
async function authoredSite(): Promise<{
  slug: string
  store: TenantSiteStore
  renderer: PreviewRenderer
}> {
  const fixture = await makeD1Site({ slug: `req154-${Math.random().toString(36).slice(2, 8)}` })
  const store = fixture.store as TenantSiteStore
  return { slug: fixture.slug, store, renderer: previewRenderer(store) }
}

describe('REQ-154 AC2 — `1c shot --url` returns a PNG from inside workerd', () => {
  it('test_UAT_FC_REQ_154_shot_url_returns_png_in_workerd', async () => {
    const browser = fakeBrowser()
    const png = await shotUrl(NO_BROWSER, 'https://example.com/', 'mobile', {
      launch: browser.launch,
    })

    // The PNG signature, not merely "some bytes" — a screenshot that came back
    // as an HTML error page would still be bytes.
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    // The mobile width was applied. `1c shot` loads at the driver's default and
    // resizes at screenshot time, so the target width is the LAST one applied.
    expect(browser.log.viewports.at(-1)).toEqual({ width: 375, height: 667 })
    // A third-party URL is not ours to serve: it went to the network.
    expect(browser.log.continued).toContain('https://example.com/')
    expect(browser.log.fulfilled).toEqual([])
  })

  it('test_UAT_FC_REQ_154_shot_without_binding_names_the_missing_binding', async () => {
    await expect(shotUrl(NO_BROWSER, 'https://example.com/')).rejects.toBeInstanceOf(
      BrowserNotConfiguredError,
    )
  })
})

describe('REQ-154 AC3 — our own preview, not an Access challenge', () => {
  it('test_UAT_FC_REQ_154_preview_shot_serves_the_authored_page', async () => {
    const { slug, renderer } = await authoredSite()
    const browser = fakeBrowser()

    const png = await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    const navigation = browser.log.fulfilled[0]
    expect(navigation?.url).toBe(`${ORIGIN}/preview/${slug}/draft/`)
    expect(navigation?.status).toBe(200)
    expect(navigation?.contentType).toContain('text/html')

    // THE ASSERTION THE TICKET ASKS FOR, stated positively: the bytes are the
    // authored page — byte-identical to what the `/preview/*` route would serve
    // — rather than any other document.
    const expected = await renderer.file(slug, 'draft', '/')
    expect(expected?.kind).toBe('text')
    expect(navigation?.body).toBe(expected?.body)

    // And stated negatively, because "not a challenge" is the property that
    // matters and equality alone would not name it. Access challenges are HTML
    // that redirects to `<team>.cloudflareaccess.com`.
    expect(navigation?.body ?? '').not.toMatch(/cloudflareaccess\.com/i)
    expect(navigation?.body ?? '').toMatch(/<!doctype html/i)
  })

  it('test_UAT_FC_REQ_154_no_request_to_our_host_ever_reaches_the_network', async () => {
    const { slug, renderer } = await authoredSite()
    const browser = fakeBrowser({
      // Two same-host paths this resolver does NOT own — the shapes that would
      // otherwise slip past a per-PATH rule and land on the Access gate.
      extraRequests: [`${ORIGIN}/favicon.ico`, `${ORIGIN}/builder/app.js`],
    })

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // The whole guarantee, in one line: nothing addressed to our own host was
    // ever handed to the network, so Access can never answer it.
    const escaped = browser.log.continued.filter((u) => new URL(u).host === 'app.1stcontact.io')
    expect(escaped).toEqual([])

    // The unowned paths were answered 404 in-process rather than fetched.
    const notFound = browser.log.fulfilled.filter((f) => f.status === 404).map((f) => f.url)
    expect(notFound).toContain(`${ORIGIN}/favicon.ico`)
    expect(notFound).toContain(`${ORIGIN}/builder/app.js`)

    // The page really did request its own relative assets, resolved against the
    // real origin — which is what a `setContent()` / `data:` URL would give up.
    expect(browser.log.requested.length).toBeGreaterThan(1)
    for (const url of browser.log.requested) expect(url.startsWith(ORIGIN)).toBe(true)
  })

  it('test_UAT_FC_REQ_154_third_party_subresources_still_reach_the_network', async () => {
    const { slug, renderer } = await authoredSite()
    const browser = fakeBrowser({ extraRequests: ['https://fonts.example/inter.woff2'] })

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // The rule is per-host, and a capture that silently dropped a third-party
    // font would be a different kind of wrong picture.
    expect(browser.log.continued).toContain('https://fonts.example/inter.woff2')
  })

  it('test_UAT_FC_REQ_154_unknown_slug_is_404_not_a_fetch', async () => {
    const { renderer } = await authoredSite()
    const browser = fakeBrowser()

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug: 'no-such-site', channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    expect(browser.log.continued).toEqual([])
    expect(browser.log.fulfilled[0]?.status).toBe(404)
  })
})

describe('REQ-154 AC6 — the session is released on every path', () => {
  it('test_UAT_FC_REQ_154_session_released_on_success', async () => {
    const browser = fakeBrowser()
    await withBrowserSession(browser.launch, async (session) => {
      await screenshotUrl('https://example.com/', { width: 800, height: 600 }, session.driverFactory())
    })
    expect(browser.log.browserClosed).toBe(true)
    expect(browser.log.contextsOpened).toBe(1)
    expect(browser.log.contextsClosed).toBe(1)
  })

  it('test_UAT_FC_REQ_154_session_released_on_failure', async () => {
    const browser = fakeBrowser({ failOnGoto: true })
    await expect(
      withBrowserSession(browser.launch, async (session) => {
        await screenshotUrl(
          'https://example.com/',
          { width: 800, height: 600 },
          session.driverFactory(),
        )
      }),
    ).rejects.toThrow(/ERR_CONNECTION_REFUSED/)

    // Both lifetimes, not just the outer one: the context the failed driver
    // opened is destroyed too, or a long-lived lease would accumulate them.
    expect(browser.log.browserClosed).toBe(true)
    expect(browser.log.contextsClosed).toBe(1)
  })

  it('test_UAT_FC_REQ_154_session_released_on_timeout', async () => {
    const browser = fakeBrowser({ hang: true })
    await expect(
      withBrowserSession(
        browser.launch,
        async (session) => {
          await screenshotUrl(
            'https://example.com/',
            { width: 800, height: 600 },
            session.driverFactory(),
          )
        },
        { timeoutMs: 25 },
      ),
    ).rejects.toBeInstanceOf(BrowserSessionTimeoutError)

    // The point of the ceiling: a wedged page costs a failed screenshot, not a
    // billed session held against the concurrency cap until the idle reaper.
    expect(browser.log.browserClosed).toBe(true)
  })

  it('test_UAT_FC_REQ_154_one_browser_many_contexts_across_a_ladder', async () => {
    const browser = fakeBrowser()
    const widths = [320, 480, 768, 1024, 1280, 1440]

    await withBrowserSession(browser.launch, async (session) => {
      for (const width of widths) {
        await screenshotUrl('https://example.com/', { width, height: 800 }, session.driverFactory())
      }
    })

    // The economics this ticket turns on. Six viewports used to mean six browser
    // acquisitions, each metered and each counted against the acquisition rate
    // limit; they are now six contexts inside one session.
    expect(browser.launches()).toBe(1)
    expect(browser.log.contextsOpened).toBe(widths.length)
    expect(browser.log.contextsClosed).toBe(widths.length)
    expect(browser.log.browserClosed).toBe(true)
  })

  it('test_UAT_FC_REQ_154_each_driver_sees_only_its_own_navigation', async () => {
    const { slug, renderer } = await authoredSite()
    const browser = fakeBrowser()
    const resolver = previewOriginResolver(renderer, new URL(ORIGIN).host)

    await withBrowserSession(browser.launch, async (session) => {
      const factory = session.driverFactory({ origin: resolver })
      const first = await factory()
      await first.navigate(`${ORIGIN}/preview/${slug}/draft/`)
      const firstUrls = first.diagnostics().requestedUrls.length
      await first.close()

      const second = await factory()
      await second.navigate(`${ORIGIN}/preview/${slug}/draft/`)
      // A driver reused across navigations would carry the first page's network
      // log into the second — and `requestedUrls` is what the security
      // conformance dimension checks egress against, so the corruption would
      // land as a false verdict rather than as a crash.
      expect(second.diagnostics().requestedUrls.length).toBe(firstUrls)
      expect(second.responses().length).toBeGreaterThan(0)
      await second.close()
    })
  })
})
