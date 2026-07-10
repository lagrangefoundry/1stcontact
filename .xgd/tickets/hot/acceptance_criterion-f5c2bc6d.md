---
uid: acceptance_criterion-f5c2bc6d
id: AC-570
type: acceptance_criterion
title: Capture runs across a viewport ladder, cross-engine seam and interaction-state
  loop, persisted with noted gaps
created_by: xgd
created_at: '2026-07-10T01:23:45.065401+00:00'
updated_at: '2026-07-10T01:23:45.065401+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Capture can be orchestrated across the full `engines × viewports × interaction-states` matrix. It shoots a responsive viewport ladder `{320, 375, 768, 1024, 1280, 1440}` (each projection tagged with its viewport); a cross-engine seam over `chromium | webkit | firefox` where an engine that cannot launch on the runner is skipped and recorded as a note (never silently absent); and an interaction-state loop actuating `:hover`/`:focus`/`:active` on the already-open page (no re-navigation per state). Each resulting cell is a provenance-tagged manifest stamped with its `{engine, viewport, state}`, and the whole matrix is persisted to `multistate.json` in the bundle (readable back, and absent/null when a bundle predates multi-state capture). A driver that cannot actuate interaction states (a non-Blink engine, or a bare test fake) is honestly held to the `rest` state and noted, rather than emitting a hover/focus cell filled with an unactuated frame.

## Verification
Run a multi-state capture against a fixture URL with an actuating (Chromium) driver and viewports from the ladder. Assert the produced matrix contains one provenance-tagged cell per `{engine, viewport, state}` combination (each carrying its `viewport`, `engine`, and `state`), and that it round-trips through `multistate.json` in the bundle. Then run with an unavailable engine and a non-actuating driver: assert the unavailable engine and the skipped non-rest states appear as explicit notes on the matrix (with only `rest` cells emitted for the non-actuating driver), and that reading a bundle written before multi-state capture yields null rather than an error.
