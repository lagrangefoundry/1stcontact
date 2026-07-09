---
uid: acceptance_criterion-592a7edd
id: AC-543
type: acceptance_criterion
title: 1c diff exit code and --json output reflect regions found
created_by: xgd
created_at: '2026-07-09T23:10:42.580134+00:00'
updated_at: '2026-07-09T23:10:42.580134+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
`1c diff` exits non-zero when at least one region of interest is found and exits zero when none are found. With `--json`, the full report (top-level metrics plus the regions array with their crop paths) is printed as JSON instead of the human-readable summary.

## Verification
Diff a pair with known differences and assert a non-zero exit; diff two identical images and assert a zero exit. Re-run with `--json` and assert the parsed stdout is the report object including the regions array.
