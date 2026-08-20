---
uid: acceptance_criterion-a657c39c
id: AC-638
type: acceptance_criterion
title: A gradient-typed content field accepts a well-formed gradient and rejects a
  malformed value
created_by: xgd
created_at: '2026-07-19T02:28:51.641780+00:00'
updated_at: '2026-08-20T05:03:52.327136+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A content field declared as a gradient value accepts a well-formed gradient object — a direction (a degrees literal or a direction alias) plus colour stops, **each stop colour an absolute `#hex` literal** — producing no validation error. A value that is not a well-formed gradient is rejected with a validation error that identifies the offending field: a value that is not a gradient object (a string, a number, or an object missing its required gradient fields), a direction that is neither a degrees number nor a listed direction alias, and — since REQ-114 retired the module-level palette-role alias — **a stop colour given as a palette-role name rather than a `#hex` literal**.

## Verification
Validate a module content payload whose gradient field holds a well-formed gradient object (direction plus two `#hex` stops); assert no validation errors are produced for that field. Validate a payload whose gradient field holds a non-object value (e.g. a string); assert a validation error is produced that names the gradient field. Validate a payload whose gradient stop colour is a palette-role name (e.g. `accent`); assert a validation error is produced that names that stop's colour field — the role alias is rejected, not accepted. Validate a payload whose direction is neither a number nor a listed alias; assert an error naming the direction field.