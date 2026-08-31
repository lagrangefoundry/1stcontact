---
uid: acceptance_criterion-9287f523
id: AC-1455
type: acceptance_criterion
title: The log-retention declaration is not a binding, so the environment-repetition
  check's binding set is unchanged
created_by: xgd
created_at: '2026-08-31T17:18:04.547059+00:00'
updated_at: '2026-08-31T17:18:04.547059+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The log-retention declaration is not a binding, and the check that requires every named
environment to repeat the top level's bindings does not count it as one — neither at the top level
nor under the named production environment.

A binding is identified **structurally**, as any declared block that names a binding, precisely so
that a binding kind introduced later is covered without the check being edited. The cost of that
generality is that any *non*-binding block added to the configuration must stay invisible to it.
Were retention to be miscounted, the criteria that assert an exact set of bindings under the
production environment would begin failing on a declaration that binds nothing — a false report
about the configuration whose correctness they exist to guard.

## Verification

Parse the operator surface's deployment configuration and read the binding set for the top level
and for the named production environment: neither set contains any entry derived from the
retention declaration. The production environment's binding set still holds exactly the
declarations it held before — its structured-data store, its object bucket, and its asset
binding.
