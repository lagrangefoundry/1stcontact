---
uid: acceptance_criterion-5b2d4ca2
id: AC-582
type: acceptance_criterion
title: Directly-authored axes require an exact match by default
created_by: xgd
created_at: '2026-07-13T20:00:27.666856+00:00'
updated_at: '2026-07-13T20:09:23.689022+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
With default tolerances (no opt-out, no override), any perceptible difference on a
directly-authored axis produces a mismatch delta for that axis in the comparison
output. This covers colour (any non-zero hex/perceptual difference), font size
(≥1px), font weight (≥1 step), line-height (≥1px), letter-spacing (any non-zero
difference), left padding (≥1px), border width (≥1px), and corner radius (≥1px).
Under the previous jitter-tolerant policy these sub-step differences were
suppressed; by default they must now be reported.

## Verification
Run the comparison on a reference/reproduction pair that differs by a single small
amount on each Group A axis in turn (e.g. 1px font-size, one weight step, a
near-neighbour colour, 1px line-height, 1px padding, 1px border, 1px radius).
Assert that each such pair yields the corresponding axis delta by default, whereas
an identical pair yields no delta on that axis.