---
uid: acceptance_criterion-eca0afe0
id: AC-2448
type: acceptance_criterion
title: Run axes are bounded by the L1 envelope; a superscript's ordinary values are
  admitted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:27.932983+00:00'
updated_at: '2026-11-08T13:51:40.561873+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
Validation refuses, with an error naming the offending axis and its permitted range: a run `sizeScale` below 0.1 or above 8; a run `baselineShiftEm` below −10 or above 10; a run `fontWeight` outside the envelope's existing font-weight bounds. Values at the bounds and the ordinary values a superscript or ordinal uses (e.g. sizeScale 0.6, baselineShiftEm 0.4, weight 700) are admitted.

## Verification
Validate documents with sizeScale 0.05 and 9, baselineShiftEm −11 and 11, and an out-of-range weight; assert each fails and the message names the axis. Validate sizeScale 0.6 / baselineShiftEm 0.4 / weight 700 and the boundary values; assert they pass.