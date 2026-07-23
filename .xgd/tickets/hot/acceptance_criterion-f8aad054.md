---
uid: acceptance_criterion-f8aad054
id: AC-696
type: acceptance_criterion
title: The pre-L1 adopt-values reproduction command is removed
created_by: xgd
created_at: '2026-07-22T19:42:41.206847+00:00'
updated_at: '2026-07-23T07:16:18.533219+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: true
  uat_coverage: pass
---

## Criterion
Invoking the old `adopt-values` reproduction command via the 1c CLI is not
recognized: it returns an unknown-command error with a non-zero exit, and no
`adopt-values` reproduction path survives on the CLI surface. (The independent
`adopt-gaps` feature is unaffected.)

## Verification
Run `1c adopt-values <site> --ref <path>`; assert it exits non-zero with an
unknown-command message and that no adopt-values reproduction handler/symbol is
exposed. Assert `adopt-gaps` still functions.