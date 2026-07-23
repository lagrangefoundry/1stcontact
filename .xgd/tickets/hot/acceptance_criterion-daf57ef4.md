---
uid: acceptance_criterion-daf57ef4
id: AC-714
type: acceptance_criterion
title: Image object-position (crop within its box) is captured and compared exactly
created_by: xgd
created_at: '2026-07-22T20:17:38.620849+00:00'
updated_at: '2026-07-23T11:45:18.845084+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
For a paired media element, `values-diff` captures and compares `object-position` — how the image crops within its box, distinct from `object-fit`. A `top`/`bottom`/offset crop vs a centred one (at the same box and fit) yields a delta, compared exactly (null-normalised, case-folded). Matching positions, or the field absent on either side, produce no delta.

## Verification
Run the diff on paired images with the same box and `object-fit` but differing `object-position` (`top` vs `center`) and assert an object-position delta. Repeat with matching positions and with the field absent on one side; assert no delta in both cases.