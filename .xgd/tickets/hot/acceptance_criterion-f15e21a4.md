---
uid: acceptance_criterion-f15e21a4
id: AC-426
type: acceptance_criterion
title: Structurally invalid input is rejected with path-located errors
created_by: xgd
created_at: '2026-07-08T19:13:09.251173+00:00'
updated_at: '2026-07-08T19:13:09.251173+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A site definition whose module instance omits a required field (for example its `type` or `version`) is rejected. The verdict reports failure and carries one or more errors; each error exposes a JSON-pointer-style path locating the offending node (e.g. `/pages/0/modules/1/version`) and a human-readable message.

## Verification
Submit a site whose module instance is missing a required field. Assert the result reports failure, that the errors list is non-empty, and that at least one error's path is a JSON-pointer string pointing at the offending node.
