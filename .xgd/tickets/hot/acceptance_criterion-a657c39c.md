---
uid: acceptance_criterion-a657c39c
id: AC-638
type: acceptance_criterion
title: A gradient-typed content field accepts a well-formed gradient and rejects a
  malformed value
created_by: xgd
created_at: '2026-07-19T02:28:51.641780+00:00'
updated_at: '2026-09-09T23:50:00.223807+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A content field declared as a gradient value **accepts** a well-formed gradient
object — a direction (a degrees literal or a direction alias) plus colour stops,
**each stop colour an absolute `#hex` literal** — producing no validation error.

A value that is not a gradient object (e.g. a string, a number, or an object missing
its required gradient fields) is **rejected** with a validation error that identifies
the offending field — and so is a stop colour given as a **palette-role alias**.
REQ-114 retired the module-level palette-role alias: a module's own colour fields
carry the absolute value, and colour by role is the L1 palette model's concern
(DOC-23 §5). Every stop is routed through the same colour rule, so a role-valued stop
fails exactly as a non-colour string does.

## Verification
Validate a module content payload whose gradient field holds a well-formed gradient
object — a direction alias plus `#hex` stops; assert no validation errors are produced
for that field. Validate a payload whose gradient field holds a non-object value (e.g.
a string); assert a validation error is produced that names the gradient field.
Validate a payload whose gradient field is well-formed except that a stop colour is a
palette-role alias; assert a validation error is produced naming that stop's colour
field.
