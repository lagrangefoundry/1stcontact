---
uid: request-40def173
id: REQ-42
type: request
title: 'Conformance harness: cross-browser dimension (full tier, Blink/WebKit/Gecko
  layout-equivalence, regression-scoped)'
created_by: xgd
created_at: '2026-07-03T23:18:05.104730+00:00'
updated_at: '2026-07-08T18:59:06.515084+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 602a57c6c1b3cd78720ef805cdaacd8d5072449a
    reconcile_sha: null
    main_sha: null
  version: 0.0.65
---

## Goal

Add the **cross-browser dimension** (`tier: 'full'`) to the conformance harness ([[REQ-39]] core): assert a module's layout is equivalent across Blink, WebKit and Gecko within tolerance. Architecture: [[DOC-20]] (AC-M3). Regression-scoped — too heavy for the per-cycle tree.

## Why

The framework's promise includes consistent rendering across Chrome/Edge (Blink), Safari (WebKit) and Firefox (Gecko). This is a *surveillance* concern (does main still hold across engines?), so it belongs in regression, not the fast leaf. The live faelan bug (percentage-`top` on layer children shifting ~1 line in Safari/FF — [[DOC-19]], [[REQ-32]]) is the calibration case.

## Scope / behaviour

`assertModuleConforms(slug, fixtures, { dimension: 'x-browser', tier: 'full' })`:
- Render in **3 engines** (Edge == Blink, so 3 not 4): Chromium, WebKit, Firefox (Playwright drives all).
- **Not pixel-equality** — extract element **layout boxes** in each engine and assert positions/sizes match within a calibrated tolerance (tune until it just-catches the faelan 1-line shift; too tight = flaky, too loose = misses bugs).
- **Perceptual backstop:** reuse the [[REQ-38]] block-averaged diff with the Chromium render as reference, at a looser cross-engine tolerance, to catch movement not in the box list.
- Wire into the **regression** run (cuts from main), not the per-cycle tree.
- **Prerequisite:** WebKit + Firefox browser binaries (`playwright install webkit firefox`) — a permissioned install; regression runtime rises ~3×. Flag to operator before installing.

## Dependencies
[[REQ-39]] (harness core), [[REQ-38]] (perceptual diff engine, reused for the cross-engine backstop). Depends on the browser-binary install decision.

## UATs (`test_UAT_FC_<TICKET-ID>_*`)
- `_engine_consistent_module_passes` — a module that lays out identically across engines passes.
- `_webkit_shift_fixture_flagged` — a fixture reproducing the faelan %-top WebKit/FF shift is flagged red (tolerance calibration).
- `_layout_box_tolerance_respected` — sub-tolerance AA/font jitter does not trip a false positive.
- `_perceptual_backstop_catches_unboxed_move` — a change not covered by the box list is caught by the block-diff backstop.

## Out of scope
Real-device Safari (Playwright WebKit is a proxy, not identical shipping Safari — stated caveat); visual-polish judgment (that is the eyes pass, advisory).

## Notes
Framework/test-infra code → full free-coding ceremony. Adds cross-engine negative fixtures to the [[REQ-39]] self-test set.


## Implementation design (free-coding session, 2026-07-08)

Built as a fourth `dimension` on the REQ-39 harness — no new module, mirroring the
security/responsive dimensions.

- **Per-engine driver seam.** New `driverFactoryFor?: (engine) => BrowserDriverFactory`
  on `ConformanceOptions`; default `createEngineDriver(engine)` (REQ-48). Engines
  default to `['chromium','webkit','firefox']` for `tier:'full'`; an engine whose
  binary is absent is skipped (advisory) via `engineAvailable`. If <2 engines are
  available the check is a clean no-op (nothing to compare).
- **Layout-box comparison is parent-relative.** `X_BROWSER_BOX_PROBE` extracts each
  visible element's box **relative to its `offsetParent`** (`dx,dy,w,h`), keyed by
  document-order index. Parent-relative offsets cancel whole-page text-reflow drift
  (cross-engine line-height rounding that accumulates down the page) and isolate a
  *local* shift — which is exactly the faelan `%`-`top` layer-child bug (its offset
  from its positioned containing block moves ~1 line). `evaluateXBrowser` compares
  Chromium (reference) against each other engine within a calibrated tolerance
  (`x-browser.layout-shift`), asserting structural parity first (`x-browser.structure`).
- **Perceptual backstop.** Reuses REQ-38 `computeDiff` on the Chromium vs other-engine
  full-page screenshots (decoded via new `decodeImageBytes`, cropped to common dims),
  flagging `x-browser.perceptual` when a region's mean intensity exceeds a *looser*
  cross-engine threshold — catches movement not covered by the box list.
- **Tolerance calibration.** Position tol / size tol / backstop threshold are dialled
  so they just-catch the faelan 1-line (~20px) shift without tripping on sub-pixel
  AA/font-metric jitter; empirically checked against real Chromium/WebKit/Firefox
  (all three binaries present on this runner).
- **Regression-scoped:** `tier:'full'` — too heavy for the per-cycle leaf; wired for
  the regression run, not the fast tree.

Calibration UATs use per-engine **fake** drivers feeding controlled geometry/screenshots
(deterministic — a real fixture forcing a cross-engine shift is Playwright-version-flaky,
the "too tight = flaky" trap the ticket warns of), plus a real 3-engine smoke UAT proving
a clean module passes without false positives.