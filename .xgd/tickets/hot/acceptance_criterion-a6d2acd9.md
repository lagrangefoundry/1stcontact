---
uid: acceptance_criterion-a6d2acd9
id: AC-540
type: acceptance_criterion
title: 1c diff prints a summary with mean diff, percent over threshold, and band profile
created_by: xgd
created_at: '2026-07-09T23:10:30.631055+00:00'
updated_at: '2026-07-09T23:10:30.631055+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
Human-readable (non-`--json`) output includes the overall mean per-pixel diff on a 0–255 scale, the percentage of pixels whose diff exceeds the pixel threshold, the count of regions of interest, and a horizontal-band profile: one mean-diff value per band (default 16 bands), top to bottom. For a known reference/actual pair these values match the expected mean and per-band figures.

## Verification
Diff a synthetic pair with a known diff distribution; assert the printed mean, percent-over-threshold, region count, and per-band values equal the expected figures.
