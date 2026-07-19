---
uid: story-16f2793c
id: STORY-77
type: story
title: 'Size-aware diffing: compare a captured site at a chosen viewport across the
  persisted ladder'
created_by: xgd
created_at: '2026-07-19T02:36:39.277949+00:00'
updated_at: '2026-07-19T02:48:19.133529+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-18a822ac
  story_kind: feature
  story_points: 3
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** both fidelity-diff commands to take a `--size mobile|tablet|desktop` selector that compares my reproduction against the reference *at that viewport width*, **so that** a layout that reflows only on a narrow screen (a `%`-vs-fixed width, a component that departs on mobile) is compared like-for-like at the width where it differs, instead of always being judged at desktop.

## Description
Extends the two existing single-width fidelity commands — `values-diff` (mechanical per-element value comparison) and `diff` (perceptual/pixel screenshot comparison) — with a shared, optional `--size` viewport selector, plus the capture-side support the pixel path needs.

In scope:

1. **`values-diff --size <size>`** — the reference side is read from the reference bundle's persisted viewport ladder (the multi-viewport capture recorded at capture time) at the selected size's width, and the actual (reproduction) side is rendered at that same viewport, so the two are compared width-for-width. Without `--size`, the pre-existing single-width (≈ desktop) path is used unchanged.

2. **`diff --size <size>`** (pixel) — the actual side is shot at the selected viewport and paired against the reference bundle's *same-width* reference screenshot rather than the desktop full-page shot. Without `--size`, the pre-existing desktop screenshot path is used unchanged.

3. **Fail-loud on missing reference data** — a size-aware diff against a bundle that predates per-viewport capture must terminate with an actionable re-capture message rather than silently falling back to a desktop comparison the caller did not ask for. This applies to a values-diff against a bundle with no persisted ladder, a values-diff at a width the ladder never reached (the message names the widths it does carry), and a pixel diff against a bundle with no same-width reference screenshot.

4. **Per-viewport reference screenshots at capture time** — capturing a page persists one full-page reference screenshot per ladder width as a sibling artifact of the desktop shot, so a later size-aware pixel diff has a same-width reference to compare against. These are image siblings only; the persisted value matrix carries no image bytes.

Out of scope: the standalone cross-size `responsive-diff` analysis command (separate story, builds on this one); per-breakpoint reproduction dials; inferring CSS units or between-size transitions (REQ-61 fixes the objective at "looks the same at each discrete size").

## Technical Context
- Shares the `mobile|tablet|desktop` viewport vocabulary already used by the shot/viewport preset system; the same vocabulary is reused by the downstream `responsive-diff` command.
- The values-diff reference at a size comes from the persisted multi-viewport ladder; a single deterministic reference cell is chosen per width (prefer the primary engine at rest). This reuses the multi-viewport capture landed under REQ-58.
- Generalizes CAP-63 (1c Values-Diff Fidelity), which compares at a single fixed width, to a caller-chosen width across the ladder.
- Divergence note for regression: `--size` is optional and defaults to the legacy single-width path, so existing single-width diff behavior is preserved byte-for-byte when the flag is absent.

## Dependencies
None. (Downstream: the `responsive-diff` command — plan item 4 — builds on the ladder + same-width-selection machinery introduced here.)

## Story Points
3