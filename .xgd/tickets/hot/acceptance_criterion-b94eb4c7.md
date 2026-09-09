---
uid: acceptance_criterion-b94eb4c7
id: AC-647
type: acceptance_criterion
title: Capturing a page persists the per-element value manifest and a reference screenshot
  at every ladder width, keeping the value matrix free of image bytes
created_by: xgd
created_at: '2026-07-19T02:37:53.658441+00:00'
updated_at: '2026-09-09T23:54:26.608120+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Capturing a page persists the reference **across the whole viewport ladder**, in two
artifacts that are siblings of one another:

- **The per-rung value manifest.** `1c capture` records the reference's per-element
  value manifest at **every** rung of the viewport ladder, not only at the default
  desktop width. The ladder is a capture-time artifact of this story rather than
  borrowed infrastructure, and it is what everything else here reads: the `--size`
  selector picks one rung from it, the pixel path pairs against its same-width
  screenshot, and `--multi-viewport` walks all of them.
- **The per-rung reference screenshot.** One full-page reference screenshot per ladder
  width is written as a sibling of the default desktop screenshot, each identified by
  its width, so a later size-aware pixel diff can resolve a same-width reference
  rather than falling back to the desktop shot.

The two are kept apart on purpose: the screenshots are image files only, and the
persisted per-element value matrix contains **no embedded image bytes**.

## Verification
Run a page capture against a fixture site across the ladder. Assert the persisted
value matrix carries a projection at **each** ladder width — not the default width
alone — so a `--size` or `--multi-viewport` run has a reference cell at every rung.
Assert the bundle also contains a distinct per-width reference screenshot file for
each ladder width alongside the desktop shot. Assert the value-matrix artifact
contains no image byte payloads, and that those bytes are present in the per-width
PNG siblings instead.
