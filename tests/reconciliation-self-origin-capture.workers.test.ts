import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { previewRenderer } from '../apps/control-app/src/router'
import { shotPreview, shotUrl, type ShotEnv } from '../apps/control-app/src/shot'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import type { PreviewChannel, PreviewRenderer } from '../tools/generate/src/cli/preview'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * story-7fa314f5 — **self-origin fulfilment**: a picture of my own draft is the
 * draft, not a sign-in challenge.
 *
 * WHY THESE RUN IN workerd. The claim is about the deployed builder answering
 * its own browser, and every part of it is runtime-shaped: the draft lives in a
 * real D1 database, its assets in a real R2 bucket, and the rendering that
 * answers the browser is the one the deployed `/preview/*` route produces. A
 * node-side test of the same functions would pass while proving nothing about
 * the deployment.
 *
 * THE ONE FAKE IS THE BROWSER, and it sits at the boundary rather than inside
 * it. A Browser Rendering session is a third party reached over a wire protocol
 * and is never the thing under test. It is also not a stub that answers: it
 * *drives* the driver — it emits the navigation through the driver's own
 * interception handler, takes whatever the handler fulfils as the document,
 * parses that document for subresources exactly as a browser would, and issues
 * each one resolved against the page's real `baseURI`. Everything between the
 * seam and us is production code.
 *
 * THE ORACLE IS THE PREVIEW SURFACE ITSELF. Where a criterion says "what the
 * preview surface serves", these tests fetch it — through the Worker's own
 * `fetch`, over HTTP, on the `/preview/*` route — rather than re-deriving it
 * from the renderer the capture already used. Comparing the capture against the
 * object that produced it would be a tautology; comparing it against the route
 * the operator's own browser hits is the claim.
 */

/** The host this deployment owns, and the origin every capture below names. */
const ORIGIN = 'https://app.1stcontact.io'
const OWN_HOST = new URL(ORIGIN).host

/** The account this deployment serves. The fixture seeds into it and the Worker
 *  is configured for it, so the route and the capture see the same sites. */
const TENANT = 'story-7fa314f5'

/** The PNG file signature — eight bytes an HTML error page cannot forge. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Every test injects its launcher, so the Browser Rendering binding is never
 *  read. Its absence belongs to the sibling story and is asserted there. */
const NO_BROWSER: ShotEnv = {}

beforeAll(async () => {
  await applySchema()
})

/** The Worker's bindings, exactly as `wrangler.toml` declares them. */
function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // Access is unconfigured here, and the gate fails closed — correctly — so
    // this is the loopback-dev opening the deployed Worker cannot use.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as Env
}

/** THE PREVIEW SURFACE — the real route, over HTTP, on this deployment's host. */
function previewSurface(path: string): Promise<Response> {
  return worker.fetch(new Request(new URL(path, ORIGIN).toString()), workerEnv())
}

/** A slug unique to this run, so no two cases share a site or a render memo. */
function uniqueSlug(): string {
  return `so-${Math.random().toString(36).slice(2, 10)}`
}

interface Authored {
  slug: string
  store: TenantSiteStore
  /** The renderer the `/preview/*` route memoises for this store. */
  renderer: PreviewRenderer
}

/** One real site in D1 + R2, plus the renderer the preview route would use. */
async function authoredSite(
  pages?: Record<string, Record<string, unknown>>,
): Promise<Authored> {
  const slug = uniqueSlug()
  const fixture = await makeD1Site({ slug, tenantId: TENANT, pages })
  const store = fixture.store as TenantSiteStore
  return { slug, store, renderer: previewRenderer(store) }
}

/** The URL the browser is pointed at for a channel's root page. */
const draftUrl = (slug: string, channel: PreviewChannel = 'draft'): string =>
  `${ORIGIN}/preview/${slug}/${channel}/`

/** Requests to this deployment's own host that were handed to the network. */
function escapedToNetwork(log: { continued: string[] }): string[] {
  return log.continued.filter((u) => new URL(u).host === OWN_HOST)
}

// ── AC-1469 — the authored page, never a sign-in challenge ───────────────────

describe('AC-1469 — a capture of the operator\'s own draft returns the authored page', () => {
  it('test_UAT_AC1469_own_channel_capture_is_the_authored_page_not_a_challenge', async () => {
    // Both draft-side channels, because the criterion names the draft-side
    // channels rather than one of them, and `edit` renders in a different mode.
    for (const channel of ['draft', 'edit'] as const) {
      const { slug, renderer } = await authoredSite()
      const browser = fakeBrowser()

      const png = await shotPreview(
        NO_BROWSER,
        renderer,
        { slug, channel, origin: ORIGIN },
        { launch: browser.launch },
      )

      // 1. Image bytes — the PNG signature, not merely "some bytes": a returned
      //    HTML challenge document is also bytes and would pass a length check.
      expect([...png.slice(0, 8)], `${channel} bytes`).toEqual(PNG_SIGNATURE)

      // 2. The browser was pointed at the REAL ABSOLUTE address of that page on
      //    this deployment's own host — not at a document with no origin.
      const url = draftUrl(slug, channel)
      expect(browser.log.requested[0], `${channel} navigation`).toBe(url)
      expect(browser.log.continued, `${channel} navigation escaped`).not.toContain(url)

      // 3. The document it was given is a success, is HTML, and is what the
      //    PREVIEW SURFACE serves for the same site, channel and path — fetched
      //    from the route rather than re-derived from the renderer that
      //    answered, so the comparison is a claim and not a tautology.
      const navigation = browser.log.fulfilled.find((f) => f.url === url)
      expect(navigation, `${channel} fulfilled`).toBeDefined()
      expect(navigation!.status).toBe(200)
      expect(navigation!.contentType).toContain('text/html')

      const served = await previewSurface(`/preview/${slug}/${channel}/`)
      expect(served.status, `${channel} route status`).toBe(200)
      expect(navigation!.body).toBe(await served.text())

      // 4. Asserted separately from 3 ON PURPOSE: byte-equality proves the two
      //    pages match but does not NAME the property this story exists to
      //    guarantee. An Access challenge is HTML that redirects to the sign-in
      //    provider's own host.
      expect(navigation!.body).not.toMatch(/cloudflareaccess\.com/i)
      expect(navigation!.body).toMatch(/<!doctype html/i)
    }
  })
})

// ── AC-1470 — the owned host is owned outright ───────────────────────────────

describe('AC-1470 — every request to the owned host is answered in-process', () => {
  it('test_UAT_AC1470_no_path_on_the_owned_host_ever_reaches_the_network', async () => {
    const { slug, renderer } = await authoredSite()
    // Three shapes nothing authored, each of which a per-PATH rule would let
    // escape onto the sign-in gate: a favicon, a build asset, and an address
    // under the channel prefix naming a channel that does not exist.
    const favicon = `${ORIGIN}/favicon.ico`
    const buildAsset = `${ORIGIN}/builder/app.js`
    const unknownChannel = `${ORIGIN}/preview/${slug}/published/index.html`
    const browser = fakeBrowser({ extraRequests: [favicon, buildAsset, unknownChannel] })

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // 1. The whole guarantee, in one line: the list is EMPTY, not merely short.
    expect(escapedToNetwork(browser.log)).toEqual([])
    // …and stated the other way round, so it cannot be satisfied by a page that
    // simply made no requests: every request addressed to our host was answered.
    const ownRequests = browser.log.requested.filter((u) => new URL(u).host === OWN_HOST)
    const answered = new Set(browser.log.fulfilled.map((f) => f.url))
    expect(ownRequests.length).toBeGreaterThan(1)
    for (const url of ownRequests) expect(answered.has(url), url).toBe(true)

    // 2. The unauthored paths were answered not-found IN PROCESS.
    const notFound = browser.log.fulfilled.filter((f) => f.status === 404).map((f) => f.url)
    expect(notFound).toContain(favicon)
    expect(notFound).toContain(buildAsset)
    expect(notFound).toContain(unknownChannel)

    // 3. And the page kept a REAL ORIGIN: its own relative stylesheet reference
    //    (`href="./theme.css"`) resolved against the real host and came back as
    //    the site's stylesheet. This is what a `setContent()` / `data:` URL —
    //    the rejected alternative — would have given up.
    const css = browser.log.fulfilled.find(
      (f) => f.url === `${ORIGIN}/preview/${slug}/draft/theme.css`,
    )
    expect(css, 'the page resolved its own relative stylesheet').toBeDefined()
    expect(css!.status).toBe(200)
    expect(css!.contentType).toContain('css')
    expect(css!.body.length).toBeGreaterThan(0)
  })
})

// ── AC-1471 — any other host still reaches the network ───────────────────────

describe('AC-1471 — requests to any other host are untouched and go to the network', () => {
  it('test_UAT_AC1471_third_party_subresources_are_fetched_not_substituted', async () => {
    const slug = uniqueSlug()
    const thirdParty = 'https://images.example.net/logo.png'
    // Authored INTO the page, not injected beside it: the browser issues this
    // request because the captured document genuinely references it.
    const page = starterHomePage(slug) as unknown as {
      l1: { root: { children: Record<string, unknown>[] } }
    }
    page.l1.root.children.push({
      kind: 'image',
      src: thirdParty,
      alt: 'A third-party logo',
    })
    const fixture = await makeD1Site({
      slug,
      tenantId: TENANT,
      pages: { 'home.json': page as unknown as Record<string, unknown> },
    })
    const renderer = previewRenderer(fixture.store as TenantSiteStore)
    const browser = fakeBrowser()

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // The page really did ask for it, and it was handed to the NETWORK — a
    // capture that silently dropped a third-party font or image would be a
    // different kind of wrong picture, arriving by the opposite route.
    expect(browser.log.requested).toContain(thirdParty)
    expect(browser.log.continued).toContain(thirdParty)
    expect(browser.log.fulfilled.map((f) => f.url)).not.toContain(thirdParty)

    // And the per-host rule still holds for OUR host in the same capture.
    expect(escapedToNetwork(browser.log)).toEqual([])
  })
})

// ── AC-1472 — an unknown site is answered not-found, not fetched ─────────────

describe('AC-1472 — capturing a site that does not exist is answered in-process', () => {
  it('test_UAT_AC1472_unknown_slug_is_not_found_and_never_a_fetch', async () => {
    // A deployment that holds OTHER sites, so "not found" is about this slug
    // rather than about an empty store.
    const { renderer } = await authoredSite()
    const missing = `absent-${Math.random().toString(36).slice(2, 10)}`
    const browser = fakeBrowser()

    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug: missing, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // 1. The navigation itself was answered not-found, from inside.
    const navigation = browser.log.fulfilled[0]
    expect(navigation?.url).toBe(draftUrl(missing))
    expect(navigation?.status).toBe(404)

    // 2. Nothing addressed to our host went to the network — so the failure is
    //    a legible not-found page rather than a sign-in challenge photographed
    //    as though it were the site.
    expect(escapedToNetwork(browser.log)).toEqual([])
    expect(browser.log.continued).toEqual([])
  })
})

// ── AC-1473 — a failure is answered, never passed through ────────────────────

describe('AC-1473 — a failure while producing the page is answered with a server error', () => {
  it('test_UAT_AC1473_a_render_failure_is_a_500_naming_it_and_never_a_fall_through', async () => {
    // A site whose stored definition cannot be rendered: `theme` removed from
    // `site.json`, so assembling the draft reports a validation failure and
    // producing the page raises.
    const { slug, store, renderer } = await authoredSite()
    const siteJson = (await store.readSiteJson(slug))!
    delete siteJson.theme
    await store.write(slug, { siteJson })

    const browser = fakeBrowser()
    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: browser.launch },
    )

    // 1. The document the browser was given is a SERVER ERROR whose body names
    //    the underlying failure — not empty, and not generic.
    const navigation = browser.log.fulfilled.find((f) => f.url === draftUrl(slug))
    expect(navigation, 'the navigation was answered in-process').toBeDefined()
    expect(navigation!.status).toBe(500)
    expect(navigation!.body).toContain(slug)
    expect(navigation!.body).toContain('theme')
    expect(navigation!.body.length).toBeGreaterThan(0)

    // 2. THE ASSERTION THAT MATTERS. An implementation that logged the error and
    //    continued would satisfy (1) in spirit while defeating the story: the
    //    fallen-through request lands on the sign-in gate and comes back as a
    //    challenge document the capture would faithfully record.
    expect(escapedToNetwork(browser.log)).toEqual([])
  })
})

// ── AC-1474 — the draft as it stands now ─────────────────────────────────────

describe('AC-1474 — the capture shows the draft as it stands now', () => {
  it('test_UAT_AC1474_a_capture_after_an_edit_shows_the_edited_draft', async () => {
    const MARKER = 'EditedBetweenTheTwoCaptures'
    const { slug, store, renderer } = await authoredSite()

    // 1. A capture matches what the preview surface serves right now.
    const before = fakeBrowser()
    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: before.launch },
    )
    const first = before.log.fulfilled.find((f) => f.url === draftUrl(slug))!.body
    expect(first).toBe(await (await previewSurface(`/preview/${slug}/draft/`)).text())
    expect(first).not.toContain(MARKER)

    // 2. Change the site's draft content.
    const page = starterHomePage(slug) as unknown as {
      l1: { root: { children: { text?: string }[] } }
    }
    page.l1.root.children[0].text = MARKER
    await store.write(slug, {
      pages: [{ name: 'home.json', page: page as unknown as Record<string, unknown> }],
    })

    // 3. The next capture carries the change — and again equals what the preview
    //    surface serves NOW. This step is what separates this criterion from the
    //    authored-page one: a capture drawing on a separately produced rendering
    //    could pass step 1 and fail this, silently, handing the operator a
    //    confident correctly-rendered picture of a draft that no longer exists.
    const after = fakeBrowser()
    await shotPreview(
      NO_BROWSER,
      renderer,
      { slug, channel: 'draft', origin: ORIGIN },
      { launch: after.launch },
    )
    const second = after.log.fulfilled.find((f) => f.url === draftUrl(slug))!.body
    expect(second).toContain(MARKER)
    expect(second).toBe(await (await previewSurface(`/preview/${slug}/draft/`)).text())
    expect(second).not.toBe(first)
  })
})

// ── AC-1475 — a published address is fetched over the network ────────────────

describe('AC-1475 — a capture of a published site is fetched like any other page', () => {
  it('test_UAT_AC1475_every_request_including_the_navigation_goes_to_the_network', async () => {
    // A public address on a host no sign-in gate covers, captured through the
    // deployment's own capture path without naming an owned host.
    const published = 'https://acme.1stcontact.site/'
    const browser = fakeBrowser({
      extraRequests: [
        'https://acme.1stcontact.site/theme.css',
        'https://fonts.example.net/inter.woff2',
      ],
    })

    const png = await shotUrl(NO_BROWSER, published, 'desktop', { launch: browser.launch })

    // 3. Image bytes are still returned.
    expect([...png.slice(0, 8)]).toEqual(PNG_SIGNATURE)

    // 1. EVERY request the page made — the navigation included — was handed to
    //    the network. Compared as sets rather than spot-checked, so a single
    //    substituted request fails it.
    expect(browser.log.requested).toContain(published)
    expect([...browser.log.continued].sort()).toEqual([...browser.log.requested].sort())

    // 2. Nothing was answered from inside the deployment. There is no gate to
    //    avoid here and nothing to substitute: the picture is of what a visitor
    //    sees.
    expect(browser.log.fulfilled).toEqual([])
  })
})
