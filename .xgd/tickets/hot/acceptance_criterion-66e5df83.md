---
uid: acceptance_criterion-66e5df83
id: AC-539
type: acceptance_criterion
title: 1c diff emits a per-pixel and a block-averaged heatmap
created_by: xgd
created_at: '2026-07-09T23:10:26.625844+00:00'
updated_at: '2026-07-09T23:10:26.625844+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
The diff writes two heatmap images: a full-resolution per-pixel heatmap whose intensity is the max-channel (R/G/B) absolute difference amplified for legibility, and a block-averaged heatmap in which each grid cell (default 16px) carries that cell's mean diff — the block-averaged form suppressing sub-pixel/registration jitter so that a 1px-shifted copy of an image yields a lower block-averaged mean than its raw per-pixel mean.

## Verification
Diff a known image pair; assert both heatmap PNGs are written at the cropped dimensions. Diff an image against a 1px-shifted copy of itself and assert the block-averaged mean diff is strictly lower than the raw per-pixel mean diff.
