---
uid: acceptance_criterion-6c782e66
id: AC-538
type: acceptance_criterion
title: 1c diff crops mismatched reference/reproduction to a common top-anchored rectangle
created_by: xgd
created_at: '2026-07-09T23:10:22.640105+00:00'
updated_at: '2026-07-09T23:10:22.640105+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
When the reference and reproduction images differ in width or height, the diff is computed over a common rectangle anchored at the top-left corner whose width and height are the minimum of the two images' dimensions. The report's `dims` reflect that common rectangle.

## Verification
Supply a reference and an actual PNG of differing dimensions; assert the diff completes without a dimension-mismatch error and that reported `dims.w`/`dims.h` equal the per-axis minimum of the two inputs.
