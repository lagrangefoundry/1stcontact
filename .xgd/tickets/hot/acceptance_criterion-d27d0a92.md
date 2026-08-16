---
uid: acceptance_criterion-d27d0a92
id: AC-1100
type: acceptance_criterion
title: A component configuration that violates its kind's own contract is refused
  at the field, before the site's definition validator runs
created_by: xgd
created_at: '2026-08-10T09:34:13.878469+00:00'
updated_at: '2026-08-16T01:57:09.607597+00:00'
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
An instance's configuration is checked against the contract declared by its kind — required fields, field types, permitted values — and a violation is refused with a schema-validation failure that names the offending field and the reason, plus a pointer to read the kind's contract. This check runs ahead of the site's own definition validation, so a configuration error is reported as a field error rather than surfacing later at render. The page is unchanged.

## Verification
Add a component omitting a field its kind declares required. The call fails with a schema-validation error naming that field. Describe the page afterwards: no instance of that name exists on it.