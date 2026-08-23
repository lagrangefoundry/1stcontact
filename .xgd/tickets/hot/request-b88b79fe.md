---
uid: request-b88b79fe
id: REQ-154
type: request
title: 'The headless browser in the cloud: a Browser Rendering driver behind the existing
  seam'
created_by: xgd
created_at: '2026-08-20T23:16:00.449069+00:00'
updated_at: '2026-08-20T23:16:27.614503+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-147
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-ec45248c
---

# The headless browser in the cloud: a Browser Rendering driver behind the existing seam

## Why this is small: the seam was cut for it

[[DOC-13]] §2 anticipated this on the day the capture pipeline was written:

> **Behind a Cloudflare-Browser-Rendering-shaped driver seam.** A pure `BrowserDriver`
> interface mirrors the CF Browser Rendering / `@cloudflare/puppeteer` surface; a **local
> Playwright** driver implements it now, a CF driver later.

And §8 states the whole migration in one line: *"Swap the Playwright driver for a CF Browser
Rendering driver behind the same `BrowserDriver` seam."*

So this ticket is not a design, it is the second implementation of an interface that already
exists. `BrowserDriver` / `BrowserDriverFactory` are declared in
`tools/generate/src/cli/capture/types.ts`; `createPlaywrightDriver`
(`capture/playwright-driver.ts:320`) is one implementation; `createEngineDriver` already selects
between engines. What is missing is the driver and the binding it needs — no `wrangler.toml` in
this repo declares a browser binding, and `@cloudflare/puppeteer` is not a dependency.

## Two transports, not a mode flag

The same shape as `RouterDeps` ([[REQ-145]]) and `HostDeps` ([[REQ-146]]): the Worker passes the
Browser Rendering driver, the CLI passes what `createPlaywrightDriver` returns, and nothing
anywhere detects which environment it is running in. The Playwright driver is not deleted and not
wrapped — the Node path keeps it unchanged.

## The part that is NOT mechanical: our own output is behind Access

[[DOC-13]] §6 — *"Screenshots — the AI's eyes"* — is about screenshotting **our own** output. In
the cloud our own output is served from `app.1stcontact.io/preview/<slug>/<channel>/…`, which
[[REQ-147]] put behind Cloudflare Access.

A browser launched by the Worker is a **new, unauthenticated client**. It will be challenged, and
it will faithfully screenshot the challenge page. Nothing errors; the picture is simply wrong.
This is the one genuine design question in the ticket and it must be settled here, with reasons
recorded, rather than discovered inside [[REQ-157]].

Three candidates:

1. **A service token for the renderer** — `CF-Access-Client-Id` / `CF-Access-Client-Secret`
   headers on the browser's navigation, the same mechanism `bin/publish --production` already
   uses. It is an identity Access can see and revoke, which is the argument for it; it is also a
   credential the Worker now holds, which is the argument against.
2. **An Access bypass policy on a dedicated internal path.** Cheap, and a hole in the exact wall
   REQ-147 built. Named here to be rejected explicitly rather than silently.
3. **No self-fetch at all** — render in-process and hand the browser the document
   (`setContent` / a `data:` URL). Removes the credential entirely, and is the cheapest. But it
   must reproduce what the preview route does about asset URLs, and DOC-13 §6 records that
   serving over a real origin is precisely what fixed first contact's blank-screenshot bug
   (*"screenshotting a page that couldn't reach its own assets"*). That history is a warning
   against this option, not a veto.

## Sessions are billed and capped

Browser Rendering meters per session and limits concurrency. A driver that leaks a session on a
failure path degrades into an outage that looks like a hang. Release on every path, including
throw and timeout, and prove it in a test rather than by reading the code.

## Acceptance criteria

1. A second `BrowserDriver` implementation, backed by the Browser Rendering binding, selected by
   injection. No `playwright` import is reachable from the Worker bundle.
2. `1c shot --url <public url>` returns a PNG when the code runs inside workerd.
3. Screenshotting an **authored** page at `/preview/<slug>/draft/` from inside the Worker returns
   the page, not an Access challenge. A UAT asserts the returned bytes are not the challenge
   document — an assertion that fails today under every one of the three options.
4. The approach chosen for AC3 is recorded in [[DOC-13]] with the reasons the other two were not,
   so the next person does not re-litigate it from scratch.
5. The Playwright driver is unchanged, and every CLI verb that uses it behaves identically.
6. A browser session is released on success, on failure and on timeout; a test asserts it.

## Origin

[[CHAT-27]]. The assistant has no eyes in the cloud, and this is the first of the four things
standing between it and a picture.
