---
uid: request-2e01ed95
id: REQ-41
type: request
title: 'Conformance harness: responsive dimension (viewport axis + mobile checks)'
created_by: xgd
created_at: '2026-07-03T23:18:02.847530+00:00'
updated_at: '2026-07-08T18:59:05.832849+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 3cfb7e9ddfc362ffa676cd0846abf15de1381861
    reconcile_sha: null
    main_sha: null
  version: 0.0.64
  story_points: 3
---

## Goal

Add the **responsive dimension** to the conformance harness ([[REQ-39]] core): assert every module stays safe, legible, and operable across the viewport range, and works on mobile with no per-viewport authoring. Architecture: [[DOC-20]] (AC-M4).

## Why

"Works on mobile with no change" is a core module-contract promise. Responsive is not a separate suite — it is the **viewport axis** over the fast safety checks, plus a few mobile-specific checks.

## Scope / behaviour

`assertModuleConforms(slug, fixtures, { dimension: 'responsive' })`:
- Runs the [[REQ-39]] safety checks (overflow / collapsed / clipped / console) at each of a viewport set **{320, 375, 768, 1024, 1280, 1440}** (the responsive default; `opts.viewports` still overrides). No horizontal overflow at any width ≥320 is the primary invariant.
- **Mobile-specific** (widths ≤ 480px, the "mobile band"): tap targets ≥44px (`responsive.tap-target`) and a text legibility floor (`responsive.font-floor`).
- Stays `tier: 'fast'` (Chromium) — this axis runs in the tree every cycle; it is cheap (a viewport loop, one engine).

## Implementation (as landed)

New AC ids: `responsive.tap-target`, `responsive.font-floor`. The safety-family ids (`safety.overflow`, `safety.collapsed`, `safety.clipped`, `safety.console-error`, …) are reused verbatim across the viewport ladder.

Design decisions made during implementation:
- **"Images scale within the viewport"** and **"no expected content hidden/clipped"** are enforced by reusing the existing safety checks across every viewport, not by new checks. An image wider than the viewport *is* horizontal overflow (`safety.overflow`); clipped/collapsed content is `safety.clipped` / `safety.collapsed`. A separate `responsive.image-scale` check would be a redundant code path for a signal `safety.overflow` already catches — omitted per the simplicity mandate.
- **Font floor = 12px**, matching the smallest design token (`--font-size-xs` = 0.75rem = 12px), so a well-formed module using the smallest token still passes.
- **Tap target = 44px** (Apple HIG). Inline-in-text anchors (`display: inline`) are exempt per WCAG 2.5.5's inline exception, so prose links do not false-positive; block-level controls (buttons, standalone CTAs, inputs) are always measured.
- **Mobile band = widths ≤ 480px** — the tap-target / font-floor checks run only at those viewports; the safety checks run at all widths.

## Dependencies
[[REQ-39]] (harness core + safety checks to loop over viewports).

## UATs (`test_UAT_FC_REQ-41_*`, `tests/req41-conformance-responsive.test.ts`)
- `_no_overflow_across_viewports` — a well-formed real module (`text-block`) has no horizontal overflow at any width ≥320.
- `_mobile_overflow_fixture_flagged` — a module that overflows only below 480px is flagged (`safety.overflow` at 320/375), and the same module passes a desktop-only sweep — proving the viewport axis is load-bearing.
- `_small_tap_target_flagged` — a standalone mobile interactive element under 44px is flagged (`responsive.tap-target`).
- `_font_floor_enforced` — text below the legibility floor on mobile is flagged (`responsive.font-floor`).
- `_responsive_clean_passes` — a properly responsive module (≥44px tap target + legible text) passes at every viewport, exercising the positive path of both mobile checks.

Negative/positive self-test fixtures (test infra, not shipping modules): `tests/fixtures/conformance/{mobile-overflow,small-tap-target,small-font,responsive-clean}.astro`.

## Out of scope
Cross-browser (separate engines) — this dimension is Chromium-only; cross-engine is [[REQ-42]]-style work.

## Notes
Framework/test-infra code → full free-coding ceremony. Adds responsive negative fixtures to the [[REQ-39]] self-test set.