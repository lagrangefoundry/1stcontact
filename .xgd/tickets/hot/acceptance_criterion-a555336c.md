---
uid: acceptance_criterion-a555336c
id: AC-635
type: acceptance_criterion
title: Gradient stops without an explicit offset are compared on colour only
created_by: xgd
created_at: '2026-07-19T02:28:30.769512+00:00'
updated_at: '2026-07-19T02:33:48.329267+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
---

## Criterion
When a gradient stop has no explicit captured position offset on one or both of the paired sides (an evenly-distributed stop), that stop is compared by colour alone: no position-based delta is produced for it. A gradient whose stops share colours and direction but record no explicit offsets therefore diffs clean.

## Verification
Diff a reference and a reproduction whose gradients have identical ordered stop colours and matching direction, where neither side records an explicit offset for its stops. Assert no gradient delta is reported. (Confirms absent offsets do not fabricate a false position delta.)