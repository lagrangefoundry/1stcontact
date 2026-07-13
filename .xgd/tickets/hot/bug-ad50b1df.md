---
uid: bug-ad50b1df
id: BUG-2
type: bug
title: capture→sandbox scaffold imports only a subset of captured assets (silent asset
  loss)
created_by: xgd
created_at: '2026-07-09T17:51:48.972285+00:00'
updated_at: '2026-07-12T20:59:08.866766+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Summary

The capture→sandbox scaffold populates a reproduction with only a **subset** of the assets the capture actually downloaded, with no signal that assets are missing. A repro then silently runs on the subset, and an operator/agent can wrongly conclude a needed asset is "unavailable."

## RESOLUTION (2026-07-12) — root cause was incomplete _download_, now fixed under REQ-36

The original framing below (a capture→sandbox _scaffold_ import that drops assets) was a misdiagnosis. The real root cause was that `1c capture`** was not downloading all assets in the first place**: below-fold **lazy-loaded** images (`loading="lazy"` / `data-src`, plus IntersectionObserver-gated content) never fired their network requests during navigation, so they were never intercepted, so they never entered the reference bundle. The "sandbox has only a subset" symptom was downstream of an incomplete _bundle_, not an incomplete _import_ — `buildAssets` (pipeline.ts) already mirrors _every_ intercepted response; the gap was that the lazy requests were never made.

**Fix:** `PlaywrightDriver.settlePage()` (commit `fdd1a239`, REQ-36) scrolls the full page height in viewport steps to trip lazy-load / entrance observers, promotes residual lazy images to eager (resolving `data-src`), waits for image decode, then waits for `networkidle` — so the newly-triggered subresource requests land in the interception cache before `driver.responses()` is harvested and mirrored by `buildAssets`.

**Evidence it's fixed:** UAT `test_UAT_FC_REQ-36_capture_*` (`tests/req36-capture-settle.test.ts`, real-Chromium fixture) proves a below-fold `fadeIn` block + lazy image now enter the capture. The joyfulculinary bundle now carries the full asset set (card photos `9.jpg`/`10.jpg`/`IMG_8708…`, `fa-solid-900.woff2`/`eicons.woff2` icon fonts, all three Lato weights).

**Disposition:** the download root cause is resolved by REQ-36's `fdd1a239`; no separate code work remains for this bug. Recommend the operator close this as fixed-by/duplicate-of REQ-36. (A belt-and-braces "unreferenced captured assets" report — the "at minimum" option below — remains a _possible_ future enhancement, but is no longer load-bearing now that the bundle is complete.)

## Original evidence (joyfulculinary / REQ-36) — kept for history

`1c capture` mirrored the full site into `storage/references/joyfulculinarycreations.com/index/assets/` — including `9.jpg`, `10.jpg`, `13-1536x1536.png`, `IMG_8708…` (card photos), `JCC-WEBSITE-LOGO…png`, Font Awesome/Elementor icon fonts, and **three** Lato weight files (100/300/400 per `lato.css`). The sandbox site `storage/sandbox/joyfulculinary/draft/assets/` had only **3 images**, **1 Lato woff2**, and **no icon fonts**. This led to a wrong "asset-blocked, supply source files" conclusion for the Offerings card photos, the icons, and the light-Lato lead — all of which were present in the bundle the whole time. (Now understood: these had been absent from the bundle at the earlier capture time because lazy-load was never triggered; a re-capture after `settlePage` carries them.)

## Expected

The capture→sandbox scaffold imports **all** captured assets (or, at minimum, emits a report of captured assets that are **not** referenced by the sandbox site, so gaps are visible). A repro should never silently run on a subset of the captured assets.

## Impact

Faithful reproduction is undermined at its foundation: agents build config around a partial asset set and mis-attribute missing content to "unavailable assets" rather than an incomplete import.

## References

[[DOC-19]] pass-4 update ("the capture bundle IS the asset source — check it first"); surfaced during REQ-36. Fixed by REQ-36 commit `fdd1a239` (`settlePage` lazy/animated settle before capture).