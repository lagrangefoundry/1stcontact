---
uid: acceptance_criterion-8ca4bb95
id: AC-645
type: acceptance_criterion
title: An unrecognized --size value is rejected with an error naming the accepted
  vocabulary
created_by: xgd
created_at: '2026-07-19T02:37:46.081665+00:00'
updated_at: '2026-07-19T02:48:19.372328+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
---

## Criterion
Supplying a `--size` value outside the accepted set (mobile, tablet, desktop) to either diff command terminates with an error and produces no diff report. The error states the invalid value and lists the accepted size names.

## Verification
Run a diff command with `--size phone` (an unsupported name); assert it exits with a failure, emits no report, and the error text includes both the rejected value and the accepted `mobile|tablet|desktop` vocabulary.