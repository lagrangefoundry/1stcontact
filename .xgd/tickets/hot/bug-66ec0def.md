---
uid: bug-66ec0def
id: BUG-204
type: bug
title: 'capture_site is far slower than the page load: navigation timeouts on pages
  that load in under 4 s, retried silently'
created_by: xgd
created_at: '2026-10-04T18:31:02.629706+00:00'
updated_at: '2026-10-04T18:43:35.119700+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What happened
In one consultant turn, three `capture_site` calls were made on public small-business marketing sites:
- **Site A** failed with `Capture failed ... after 3 attempt(s): Navigation timeout of 30000 ms exceeded`. A retry on the same host without `www.` failed the same way, after 3 more attempts.
- **Site B** failed with `Navigation timeout of 30000 ms exceeded`. A retry with `www.` got past navigation but failed in `foldToL1` (a separate validation issue: `viewportResponse.yFactor` outside ±10 on scroll-animation keyframes).
- **Site C** succeeded: 12 pages, 73 assets, 300 `data:` URL refusals.

The whole turn took about 20 minutes on the wall clock: the client uploads were timestamped about 17:05 and the successful capture finished at about 17:26.

## Expected
The product owner can download each of these pages in a normal browser in **under 4 seconds**. A capture should take tens of seconds, not tens of minutes, and should not hit a 30-second navigation timeout on a page that loads in 4.

## Things worth checking
- **What the navigation is waiting for.** If it waits for `networkidle`, sites with analytics beacons, chat widgets, cookie banners or background audio and video never go idle. `domcontentloaded` or `load`, plus a short settle, may be enough.
- **Whether bot detection or a missing user agent / headers make some hosts stall headless Chromium.**
- **The retry policy.** 3 attempts × 30 s for each URL, with nothing reported in between, means one bad URL can cost 90+ seconds in silence.
- **Site C reports `pages: 12`.** Is the capture crawling the whole site (12 pages × several viewports) when a single page was asked for? That alone could explain several minutes.
- **The `data:` refusals** (300 on one site) are reported as refusals. They are inline SVGs and could be kept as-is, not fetched.

## Reproduction
Call `capture_site` on a typical local-trades marketing site built with WordPress or a page builder, with a cookie banner and analytics. The exact URLs are in the session's work log and can be supplied by the session operator.

## Related
The user-visibility side (no notice that a slow operation is running) is filed separately as a capability request.