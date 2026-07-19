---
uid: acceptance_criterion-b94eb4c7
id: AC-647
type: acceptance_criterion
title: Capturing a page persists a per-width reference screenshot for each ladder
  width, keeping the value matrix free of image bytes
created_by: xgd
created_at: '2026-07-19T02:37:53.658441+00:00'
updated_at: '2026-07-19T02:48:19.250740+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
---

## Criterion
Capturing a page produces, in the reference bundle, one full-page reference screenshot per viewport-ladder width as a sibling of the default desktop screenshot, each identified by its width. These screenshots are image files only; the persisted per-element value matrix (the multi-viewport capture data) contains no embedded image bytes. A subsequent size-aware pixel diff can therefore resolve a same-width reference screenshot for each captured width.

## Verification
Run a page capture against a fixture site across the ladder; assert the bundle contains a distinct per-width reference screenshot file for each ladder width alongside the desktop shot, and that the persisted value-matrix artifact contains no image byte payloads.