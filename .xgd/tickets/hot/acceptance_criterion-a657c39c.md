---
uid: acceptance_criterion-a657c39c
id: AC-638
type: acceptance_criterion
title: A gradient-typed content field accepts a well-formed gradient and rejects a
  malformed value
created_by: xgd
created_at: '2026-07-19T02:28:51.641780+00:00'
updated_at: '2026-07-19T02:28:51.641780+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
---

## Criterion
A content field declared as a gradient value accepts a well-formed gradient object — a direction (a degrees literal or a direction alias) plus colour stops, each stop colour an absolute hex or a palette-role alias — producing no validation error. A value that is not a gradient object (e.g. a string, a number, or an object missing its required gradient fields) is rejected with a validation error that identifies the offending field.

## Verification
Validate a module content payload whose gradient field holds a well-formed gradient object; assert no validation errors are produced for that field. Validate a payload whose gradient field holds a non-object value (e.g. a string); assert a validation error is produced that names the gradient field.
