---
uid: acceptance_criterion-89a6f94c
id: AC-428
type: acceptance_criterion
title: Missing required theme-token slot is rejected at the slot path
created_by: xgd
created_at: '2026-07-08T19:13:14.619703+00:00'
updated_at: '2026-07-08T19:13:14.619703+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A site definition that omits any required theme-token slot is rejected. The verdict reports failure with an error whose path identifies the missing slot. (The theme-token contract requires every slot to be present with a value of the correct primitive type; this asserts the completeness contract, independent of the exact slot enumeration.)

## Verification
Submit a site whose theme tokens omit a required slot. Assert the result reports failure and an error path identifies the missing slot's location.
