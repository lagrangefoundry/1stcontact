---
uid: acceptance_criterion-3ca3ebdf
id: AC-541
type: acceptance_criterion
title: 1c diff derives severity-ranked regions by connected components, scored by
  summed block diff
created_by: xgd
created_at: '2026-07-09T23:10:34.701278+00:00'
updated_at: '2026-07-09T23:10:34.701278+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
`regions.json` lists automatically-derived regions of interest, never hand-authored. Each region is a connected cluster of grid cells whose block-average exceeds the block threshold (4-connected flood fill), reported with an integer `id`, a `bbox` ({x,y,w,h} in cropped-image pixels), a `score` equal to the sum of the cluster's block-average diffs, a per-cluster `meanDiff`, and `area`. Regions are ordered by `score` descending and capped at the top-N (default 12). The top-level report carries `ref`, `actual`, `dims`, `blockPx`, `meanDiff`, `pctOverThreshold`, and `bands`.

## Verification
Diff a synthetic pair with two spatially separated hot patches and assert exactly two regions with the expected bounding boxes are produced. Diff a pair with one large-faint patch and one small-intense patch and assert the two regions are ordered by score such that summed-diff (not peak intensity or area alone) governs rank.
