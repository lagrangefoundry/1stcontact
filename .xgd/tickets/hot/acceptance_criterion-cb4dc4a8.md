---
uid: acceptance_criterion-cb4dc4a8
id: AC-583
type: acceptance_criterion
title: Element position is exact by default with a 1px rounding allowance
created_by: xgd
created_at: '2026-07-13T20:00:30.442588+00:00'
updated_at: '2026-07-13T20:09:23.587335+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
With default tolerances, an element position difference (in x or y) greater than
1px produces a position delta, while a difference of 1px or less — the integer
rounding of the captured box — produces no position delta.

## Verification
Compare a reference/reproduction pair whose box is offset by 8px in x (or y):
assert a position delta is reported by default. Compare a pair offset by exactly
1px: assert no position delta is reported.