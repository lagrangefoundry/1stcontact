---
uid: request-b88b79fe
id: REQ-154
type: request
title: 'The headless browser in the cloud: a Browser Rendering driver behind the existing
  seam'
created_by: xgd
created_at: '2026-08-20T23:16:00.449069+00:00'
updated_at: '2026-08-31T05:05:09.416379+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-147
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-ec45248c
  commits:
  - working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e
    reconcile_sha: null
    main_sha: null
  version: 0.2.16
  bundled_in: bundle-8eef3846
---

# The headless browser in the cloud: a Browser Rendering driver behind the existing seam

## Why this is small: the seam was cut for it

[[DOC-13]] §2 anticipated this on the day the capture pipeline was written:

> **Behind a Cloudflare-Browser-Rendering-shaped driver seam.** A pure `BrowserDriver` interface mirrors the CF Browser Rendering / `@cloudflare/puppeteer` surface; a **local Playwright** driver implements it now, a CF driver later.

And §8 states the whole migration in one line: _"Swap the Playwright driver for a CF Browser Rendering driver behind the same _`BrowserDriver`_ seam."_

So this ticket is not a design, it is the second implementation of an interface that already exists. `BrowserDriver` / `BrowserDriverFactory` are declared in `tools/generate/src/cli/capture/types.ts`; `createPlaywrightDriver` (`capture/playwright-driver.ts:320`) is one implementation; `createEngineDriver` already selects between engines. What is missing is the driver and the binding it needs — no `wrangler.toml` in this repo declares a browser binding, and `@cloudflare/puppeteer` is not a dependency.

## Two transports, not a mode flag

The same shape as `RouterDeps` ([[REQ-145]]) and `HostDeps` ([[REQ-146]]): the Worker passes the Browser Rendering driver, the CLI passes what `createPlaywrightDriver` returns, and nothing anywhere detects which environment it is running in. The Playwright driver is not deleted and not wrapped — the Node path keeps it unchanged.

## The part that is NOT mechanical: our own output is behind Access

[[DOC-13]] §6 — _"Screenshots — the AI's eyes"_ — is about screenshotting **our own** output. In the cloud our own output is served from `app.1stcontact.io/preview/<slug>/<channel>/…`, which [[REQ-147]] put behind Cloudflare Access.

A browser launched by the Worker is a **new, unauthenticated client**. It will be challenged, and it will faithfully screenshot the challenge page. Nothing errors; the picture is simply wrong. This is the one genuine design question in the ticket and it must be settled here, with reasons recorded, rather than discovered inside [[REQ-157]].

Three candidates:

1. **A service token for the renderer** — `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers on the browser's navigation, the same mechanism `bin/publish --production` already uses. It is an identity Access can see and revoke, which is the argument for it; it is also a credential the Worker now holds, which is the argument against.

2. **An Access bypass policy on a dedicated internal path.** Cheap, and a hole in the exact wall REQ-147 built. Named here to be rejected explicitly rather than silently.

3. **No self-fetch at all** — render in-process and hand the browser the document (`setContent` / a `data:` URL). Removes the credential entirely, and is the cheapest. But it must reproduce what the preview route does about asset URLs, and DOC-13 §6 records that serving over a real origin is precisely what fixed first contact's blank-screenshot bug (_"screenshotting a page that couldn't reach its own assets"_). That history is a warning against this option, not a veto.

## Sessions are billed and capped

Browser Rendering meters per session and limits concurrency. A driver that leaks a session on a failure path degrades into an outage that looks like a hang. Release on every path, including throw and timeout, and prove it in a test rather than by reading the code.

## Acceptance criteria

1. A second `BrowserDriver` implementation, backed by the Browser Rendering binding, selected by injection. No `playwright` import is reachable from the Worker bundle.

2. `1c shot --url <public url>` returns a PNG when the code runs inside workerd.

3. Screenshotting an **authored** page at `/preview/<slug>/draft/` from inside the Worker returns the page, not an Access challenge. A UAT asserts the returned bytes are not the challenge document — an assertion that fails today under every one of the three options.

4. The approach chosen for AC3 is recorded in [[DOC-13]] with the reasons the other two were not, so the next person does not re-litigate it from scratch.

5. The Playwright driver is unchanged, and every CLI verb that uses it behaves identically.

6. A browser session is released on success, on failure and on timeout; a test asserts it.

## Origin

[[CHAT-27]]. The assistant has no eyes in the cloud, and this is the first of the four things standing between it and a picture.

---

# What was built

## AC3 was answered by a fourth option: in-process request fulfilment

The three candidates above were investigated and a fourth was found that beats all of them, and it is what shipped. **The Worker fulfils the request itself.** The browser navigates the real absolute preview URL — `https://app.1stcontact.io/preview/<slug>/draft/…` — and the driver intercepts every request to that host and answers it from the same `PreviewRenderer` the `/preview/*` route serves from. No request reaches the network, so Access never sees one, so a challenge is not merely unlikely but **unreachable**.

It takes option 1's real origin and option 3's absence of a credential at the same time, so there is no trade to make:

- **vs. option 1 (service token)** — strictly more machinery for strictly less guarantee. A credential can be misconfigured, leaked, or left unrotated; a request that is never made cannot be challenged.

- **vs. option 2 (Access bypass)** — rejected outright; it is a hole in the wall REQ-147 built.

- **vs. option 3 (**`setContent`**/**`data:`**)** — option 3 gives up the page's `baseURI`, so relative `/assets/` references stop resolving. That is precisely the blank-screenshot bug DOC-13 §6 records. Interception keeps the real origin.

**The rule is per-HOST, not per-path**, and that is what makes it mechanical rather than careful. An `OriginResolver` _owns_ a host outright: every request to it is fulfilled or 404'd in-process — not a favicon, not a stray absolute link. A per-path rule would leave exactly the gaps an attacker of one's own attention finds. Requests to any **other** host are untouched and go to the network, because a page legitimately loads third-party fonts and images and a capture that silently dropped them would be a different kind of wrong picture.

A resolver error is answered `500`, never `continue()`d — a silent fall-through would send the request to the gated origin, which is the one outcome the mechanism exists to make impossible.

`published` output is deliberately not served this way: published bytes live on public-site's own host, which no Access policy covers, so the browser simply fetches them.

## One browser per run, one context per driver

The Playwright driver launches a whole browser per navigation — eight of them for one responsive ladder. Locally that is merely wasteful; against a metered service with a concurrency cap _and_ an acquisition rate limit it is unaffordable. `withBrowserSession` leases **one browser per run**, and each driver takes a fresh browser **context** from it.

A context and not a bare page, because the context is the real reset boundary: own cookie jar, own cache, own storage, and closing it destroys all three. That reproduces today's semantics **exactly** — every viewport starts cold, as it does when every viewport gets its own browser — while collapsing eight acquisitions into one.

Sharing one _context_ across the ladder to warm the cache was considered and rejected: a consent or A/B cookie set at 320px would pin every wider viewport to that variant, which is a capture-fidelity change wearing a performance costume.

**Reuse stops strictly below the driver.** `responses()` and `diagnostics()` accumulate into instance fields, so a driver reused across two navigations would merge the first page's network log into the second's — and `requestedUrls` is what the security conformance dimension checks egress against, so the corruption would land as a **false verdict** rather than as a crash. One driver, one navigation, everywhere.

The lease is bounded in time and released on **every** exit — success, throw and timeout. A session that is never released counts against the concurrency cap until the platform's idle reaper takes it, so a handful of wedged runs degrade into an outage that looks like a hang. Bounding it means a hung page costs a failed screenshot, which is legible.

## `1c shot` split along the runtime line

`shot.ts` did three things — render a slug, serve it over loopback, screenshot the served page. Two of those need `node:fs` and `node:http`, so the third, the only part a Worker needs, could not run in workerd at all. The navigate-and-screenshot core moved to `capture/screenshot.ts`; `shot.ts` remains the Node shell that renders, serves and writes the PNG, and re-exports `VIEWPORTS` / `ViewportName` so every existing importer keeps its path unchanged.

## What the CF driver does not do

`actuate` / `canActuate` are **absent**. They are optional capability negotiation, not a legacy fallback: a driver that cannot force a pseudo-state omits them, and the multi-state loop restricts itself to `'rest'` **and says so**. A silent no-op would emit an unactuated frame labelled `hover` and read as a false clean. Cloud captures are therefore rest-only until the CDP path is proven there.

Browser Rendering is Chromium-only, so the `webkit` / `firefox` ladder reports unavailable rather than failing.

## Deliberately not done

- **No HTTP route answers the screenshot capability.** A metered session exposed over HTTP is a decision about rate limiting and authorisation, not a wiring step. It belongs to the ticket that gives the assistant the surface ([[REQ-157]]). What lands here is the capability and its proof.

- `storage/references/`** bytes have not moved to R2.** That is capture-in-the-cloud; what landed is _eyes_-in-the-cloud (DOC-13 §6), which is the half REQ-157 needs. DOC-13 §8 records both halves and which one is still open.

## Files

File

What

`tools/generate/src/cli/capture/cf-driver.ts`

The driver, the lease (`withBrowserSession`), and the puppeteer-shaped surface named rather than imported

`tools/generate/src/cli/capture/screenshot.ts`

The navigate-and-screenshot core, with no host in it

`tools/generate/src/cli/capture/page-scripts.ts`

The settle/font/decode scripts, extracted so both drivers run the same ones

`tools/generate/src/cli/capture/types.ts`

`OriginResolver` / `OriginFile`

`tools/generate/src/cli/preview.ts`

`previewOriginResolver` — the preview channels as an origin

`apps/control-app/src/shot.ts`

The composition root: the one file naming `@cloudflare/puppeteer`

`apps/control-app/src/router.ts`

`previewRenderer` exported (the shot must use the _same_ memoised renderer as the route); `BROWSER?` on `RouterEnv`

`apps/control-app/wrangler.toml`

`[browser]` and `[env.production.browser]` — restated, because a named environment inherits neither vars nor bindings

`tools/generate/src/cli/capture/index.ts`

`cf-driver` deliberately **not** re-exported — this barrel pulls in Playwright

`@cloudflare/puppeteer` is a dependency of `apps/control-app` only, never of `tools/generate`.

## Test plan

25 UATs across three files, all passing.

- `tests/test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts` — runs in **workerd**. PNG returned from inside the runtime (AC2); the authored page served rather than an Access challenge and **no request to our host ever reaching the network** (AC3); third-party subresources still reaching it; unknown slug 404 rather than a fetch; session released on success, on failure and on timeout (AC6); one browser many contexts across a ladder; each driver seeing only its own navigation.

- `tests/test_UAT_FC_REQ-154_no_playwright_in_the_worker.test.ts` — structural (AC1). No `playwright` reachable from the Worker's import graph; the Worker never imports the capture barrel; `@cloudflare/puppeteer` named in exactly one place; the CF driver naming no browser library at all; the `[browser]` binding declared for **both** dev and production; the page scripts having a single source.

- `tests/test_UAT_FC_REQ-154_page_scripts.test.ts` — the extracted scripts behave identically to the ones they replaced (AC5): lazy-image promotion, no-image pages, decode waiting and not hanging on a broken image, graceful degradation with no FontFace API, the font barrier, and the settle CSS landing animations.

`tests/support/fake-puppeteer.ts` is a legitimate fake: the browser is a genuine external boundary reached over a wire protocol, not a component we own.

**Regression scope run**: the three UAT files plus `req36-capture-settle`, `capture`, `shot`, `req39-conformance`, `req40-conformance-security`, `req61-ladder-screenshots`, `test_UAT_FC_REQ-138_live_preview`, `test_UAT_FC_REQ-147_access_gate`, `test_UAT_FC_BUG-37_preview_assemble_memo` — all pass. `tsc --noEmit` clean in both `apps/control-app` and `tools/generate`. `pnpm dryrun:control` confirms `env.BROWSER → Browser Run` on the production bundle.

Full-suite state is unchanged: the same 5 files fail identically with and without this branch (verified by stashing), and none touches capture, screenshot, preview or the browser.

## AC status

AC

Status

1 — second driver, injected; no `playwright` reachable from the Worker

Done, structurally asserted

2 — PNG returned from inside workerd

Done (`shotUrl`, proven in the workerd project)

3 — authored preview page, not an Access challenge

Done, by in-process fulfilment

4 — the decision recorded in DOC-13 with the rejected alternatives

Done — DOC-13 §6.1, §6.2, §6.3, §8

5 — Playwright driver unchanged, CLI verbs identical

Done — scripts extracted to a shared module, behaviour pinned by UAT

6 — session released on success, failure and timeout

Done, three UATs