---
uid: acceptance_criterion-4d6d2e84
id: AC-649
type: acceptance_criterion
title: --sizes selects and orders the table columns
created_by: xgd
created_at: '2026-07-19T02:50:57.222389+00:00'
updated_at: '2026-07-19T02:50:57.222389+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
The `--sizes` option chooses which sizes become columns and in what order. Given `--sizes mobile,desktop`, the table has exactly two columns, mobile then desktop, and omits tablet. An unrecognised size name produces an error naming the valid sizes and a non-zero exit, with no table emitted.

## Verification
Run `responsive-diff --sizes mobile,desktop` on a fixture with a full ladder; assert two columns in that order and no tablet column. Run again with an invalid size token; assert a non-zero exit and an error message listing the accepted size names.
