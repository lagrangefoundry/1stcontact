---
uid: acceptance_criterion-411cb7f0
id: AC-1097
type: acceptance_criterion
title: A settings value the site's schema does not accept is refused whole, leaving
  the site unchanged
created_by: xgd
created_at: '2026-08-10T09:33:57.867738+00:00'
updated_at: '2026-08-16T01:56:59.116530+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A settings write whose merged result would not validate against the site's own definition schema is refused with a schema-validation failure identifying what was invalid. No part of the write lands: the site's settings are exactly as they were before the call.

## Verification
Write a setting into a known group with a value of the wrong shape (for example a palette family whose steps are not the declared form). The call fails with a validation error, and reading the group back shows the prior value with none of the rejected write's keys present.