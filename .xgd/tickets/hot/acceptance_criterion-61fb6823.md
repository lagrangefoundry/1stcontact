---
uid: acceptance_criterion-61fb6823
id: AC-1096
type: acceptance_criterion
title: Omitting the group writes at the site's top level, and a top-level write that
  is not an object of settings is refused
created_by: xgd
created_at: '2026-08-10T09:33:52.728575+00:00'
updated_at: '2026-08-16T01:56:57.511370+00:00'
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
When no group is named, the settings object is merged into the site's top-level settings under the same merge rule. A top-level write whose value is not an object of settings is refused with a validation failure explaining that an object is required and how to write a single setting instead, and nothing is written.

## Verification
Write a top-level setting with no group named and read it back alongside a pre-existing top-level setting: both are present. Attempt a top-level write with a scalar value: the call fails with a schema-validation error and a hint naming the group-plus-object form, and the site's stored settings are byte-identical to before.