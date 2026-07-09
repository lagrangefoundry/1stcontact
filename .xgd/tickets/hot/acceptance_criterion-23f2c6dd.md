---
uid: acceptance_criterion-23f2c6dd
id: AC-542
type: acceptance_criterion
title: 1c diff writes a ref/ours/diff crop triptych per ranked region
created_by: xgd
created_at: '2026-07-09T23:10:38.643951+00:00'
updated_at: '2026-07-09T23:10:38.643951+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
For each region in `regions.json`, three cropped PNGs are written at that region's bounding box — one from the reference, one from the reproduction, and one from the diff heatmap — and the region entry records the three crop file paths under a `crops` object ({ref, actual, diff}).

## Verification
Diff a synthetic pair yielding one or more regions; for each region assert the three crop files exist on disk at the region's bbox dimensions and that the region entry's `crops` paths point to them.
