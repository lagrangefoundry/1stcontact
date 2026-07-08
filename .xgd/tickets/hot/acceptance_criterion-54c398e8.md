---
uid: acceptance_criterion-54c398e8
id: AC-422
type: acceptance_criterion
title: Version-bump tool advances the project version in the root package manifest
created_by: xgd
created_at: '2026-07-08T19:04:44.698517+00:00'
updated_at: '2026-07-08T19:04:44.698517+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
Invoking the project version-bump tool with no arguments increments the patch segment of the version in the root package manifest (X.Y.Z → X.Y.Z+1). Passing `--minor` increments the minor segment and resets the patch to zero (X.Y.Z → X.Y+1.0); passing `--major` increments the major segment and resets the lower segments to zero (X.Y.Z → X+1.0.0).

## Verification
Run the tool with no flags, with `--minor`, and with `--major` against a known starting version and assert the root manifest's version field is rewritten to the expected value in each case.
