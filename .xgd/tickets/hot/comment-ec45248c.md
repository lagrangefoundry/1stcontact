---
uid: comment-ec45248c
id: COMMENT-1436
type: comment
title: Comment on request REQ-154
created_by: xgd
created_at: '2026-08-23T23:26:13.624723+00:00'
updated_at: '2026-08-23T23:45:12.468419+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b88b79fe
  kind: chat_transcript
---

<!-- xgd-turn id="ce374141-180c-4bed-98a5-e01cdfb9f922-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T23:24:39.911160+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="ce374141-180c-4bed-98a5-e01cdfb9f922-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-23T23:35:26.276996+00:00" -->
#### Claude
I've finished the investigation. No code changed. Here's what I found.

## 1. The seam is real, and the ticket is right that it was cut for this

`BrowserDriver` (`tools/generate/src/cli/capture/types.ts:96`) is a genuinely pure interface — nine methods, no Playwright types anywhere in it, `BrowserDriverFactory` injected at every call site. Every consumer already takes a factory: `pipeline.ts` (4 entry points), `shot.ts`, `conformance/harness.ts`, `l1/roundtrip.ts`, `gate.ts`, `perceptual.ts`. So "second implementation of an existing interface" is accurate as far as it goes.

Confirmed missing, exactly as the ticket says: no `browser` binding in either `wrangler.toml`, and `@cloudflare/puppeteer` is not a dependency.

## 2. Three corrections to the ticket's own text

**(a) `bin/publish --production` does not use `CF-Access-Client-Id`/`Secret`.** It takes a *pre-minted JWT* in `CF_ACCESS_TOKEN` and sends it as a `cf-access-jwt-assertion` header (`push.ts:116`). Nothing in the repo has ever exchanged a service-token pair. The header is the only string in the tree, and it's in prose in `ACCESS.md:73`. So option 1 is not "reuse an existing mechanism" — it's a new credential with a new lifecycle. (`bin/deploy.d/secrets/` gives it a home; the Worker's verifier already accepts `common_name`, `access.ts:257`.)

**(b) There is a fourth candidate the ticket doesn't list, and I think it's the best one.** Puppeteer request interception. The browser navigates to the *real* `https://app.1stcontact.io/preview/<slug>/draft/`, but the Worker intercepts every request over the DevTools socket and fulfils it in-process from `PreviewRenderer` — which is already worker-safe and is already what `servePreview` calls (`router.ts:702`). No request ever reaches the edge, so Access is never involved; no credential exists to leak; and the page still has a real origin, a correct `baseURI`, and working relative asset URLs — which is precisely what DOC-13 §6's blank-screenshot history warns option 3 away from. It gets option 3's "no credential" and option 1's "real origin" at once.

The thing I could not verify offline: whether `@cloudflare/puppeteer` exposes `setRequestInterception`/`Fetch.enable`. That needs checking before this is a recommendation rather than a proposal.

**(c) A fifth option existed until recently and is now gone — worth recording so nobody re-proposes it.** DOC-12 §5.1's link-private draft snapshots (`/site/<slug>/draft/<sha12>/`, served unauthenticated by public-site) would have sidestepped Access entirely. REQ-149 D7 deleted that channel; `apps/public-site/src/routes.ts:13-22` says so explicitly. Any variant of "shoot it from an unauthenticated URL" is now a *re-creation* of something deliberately removed, not a reuse.

## 3. What the ticket under-weights

**AC1 and AC2 are much bigger than "add a driver."**

- `capture/index.ts` re-exports `createPlaywrightDriver`. Every Worker import of `tools/generate` today is a **deep path**, never the barrel — that's a deliberate existing pattern (`router.ts:10-19`). A CF driver placed behind the barrel would drag `playwright-driver.ts`'s `await import('playwright')` into the Worker bundle and fail AC1 immediately.
- `shot.ts` cannot run in workerd at all as written: it statically imports `node:fs/promises`, `./serve` (`node:http`), and `./commands`. AC2 (`1c shot --url` inside workerd) requires splitting a pure navigate→screenshot core out of the Node file-writing/serving shell. That's a real refactor of a shipped verb, unmentioned.

**Session economics are worse than "release on every path."** `runMultiStateCapture` (`pipeline.ts:274`) constructs a **fresh driver per (engine × viewport)** — 6 ladder widths plus height probes, so roughly 8 browser acquisitions per capture per engine, each `close()`d. Under Browser Rendering's concurrency cap and per-minute acquisition limit that is not a leak, it's just unaffordable. Separately, `engineAvailable()` launches and closes a browser purely to answer a boolean — a whole billed session per call, and it imports `playwright`, so it needs injecting too. And Browser Rendering is Chromium-only, so the `webkit`/`firefox` ladder must report unavailable rather than fail.

**Puppeteer is not Playwright.** `newContext`→`createBrowserContext`, `reducedMotion`→`emulateMediaFeatures`, `waitUntil:'networkidle'`→`networkidle0`, `response.body()`→`response.buffer()`, and `actuate()`'s CDP `CSS.forcePseudoState` needs a session obtained a different way. `actuate`/`canActuate` are already optional-by-design, so the CF driver may legitimately omit them and the ladder will restrict itself to `'rest'` *and say so* — that's the seam working as intended, but it means cloud captures are rest-only until proven otherwise.

## 4. The good news, and it's significant for AC2/AC3/AC6

Miniflare 4.20260710 ships a **local browser-rendering plugin** (`browserRendering: { binding, headful }`) that spawns a real Chrome via `@puppeteer/browsers` and proxies the DevTools protocol into workerd. And `@cloudflare/vitest-pool-workers@0.18.5` types its `miniflare` option as the full `SourcelessWorkerOptions`, so that key passes straight through.

That means AC2, AC3 and AC6 are provable in the existing workers project against a real browser — not deferred to a deployed smoke test, which is what I'd assumed on first read. Caveats to confirm: Chrome download on first run, and CI runner capacity.

## 5. What I'd want to settle before writing anything

1. **Option 4 (interception) vs option 1 (service token)** — contingent on that `setRequestInterception` check. If interception works, option 1's credential is unnecessary and I'd argue against holding it.
2. **AC1's blast radius** — do we accept splitting `shot.ts` into a pure core plus a Node shell inside this ticket, or does that become its own scope?
3. **Session budget** — does the CF driver reuse one browser across the viewport ladder (a `keepAlive`/`connect` shape), or does the ladder itself change? Either way AC6's "released on every path" needs restating, because "one driver, one session" is currently false for the biggest consumer.

<!-- xgd-turn id="2e120256-d2bf-45dc-ac70-73aa97f18a90-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T23:45:12.334766+00:00" -->
#### You
1. ok lets go with 4
   2. lets keep everything in this ticket
   3. What do you think? If the browser can be reset reliably and it is cheaper to do so than restart it  ( I assume it would be ) then we should definitely reuse the browser rather than restarting it all the time

<!-- xgd-chat-end -->