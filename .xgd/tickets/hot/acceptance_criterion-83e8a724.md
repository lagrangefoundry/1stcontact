---
uid: acceptance_criterion-83e8a724
id: AC-706
type: acceptance_criterion
title: Off-sample probe asserts the layout envelope holds at unsampled intermediate
  widths
created_by: xgd
created_at: '2026-07-22T20:07:11.256057+00:00'
updated_at: '2026-07-23T06:35:01.847223+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The off-sample probe evaluates a reproduced document at intermediate widths the capture
never sampled (default 500 and 900px) and reports pass = true with empty findings at
each width exactly when no two leaf boxes overlap and no leaf clips beyond the viewport.

- Any sibling overlap or horizontal clip at an evaluated width is reported as a finding
  at that width, and pass = false.
- The report lists findings per evaluated width.

## Verification
Run the probe on a folded fixture document at 500 and 900px and assert pass = true with
empty findings per width. Construct a document whose interpolation degrades between
captured widths so a clip/overlap appears at an intermediate width, and assert the
probe reports that finding at the affected width with pass = false.