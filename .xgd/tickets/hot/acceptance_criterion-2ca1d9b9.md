---
uid: acceptance_criterion-2ca1d9b9
id: AC-643
type: acceptance_criterion
title: pixel diff --size pairs the reproduction shot at that viewport against the
  same-width reference screenshot
created_by: xgd
created_at: '2026-07-19T02:37:37.992655+00:00'
updated_at: '2026-07-23T10:49:31.750021+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Running the pixel diff command with `--size mobile`, `--size tablet`, or `--size desktop` against a reference bundle that carries per-width reference screenshots shoots the reproduction at the selected viewport and compares it against the reference bundle's same-width screenshot (not the desktop full-page shot). The resulting ranked-region report therefore reflects a width-for-width visual comparison.

## Verification
Run pixel diff `--size tablet` against a bundle that holds a tablet-width reference screenshot; assert the reproduction is rendered/shot at the tablet viewport and the reference image used is the tablet-width one, and that a desktop-only visual difference does not contaminate the tablet report.