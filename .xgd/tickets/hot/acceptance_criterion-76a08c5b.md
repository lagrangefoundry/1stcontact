---
uid: acceptance_criterion-76a08c5b
id: AC-659
type: acceptance_criterion
title: stdout is restored after the command runs, including when its computation fails
created_by: xgd
created_at: '2026-07-19T03:01:50.845026+00:00'
updated_at: '2026-07-19T03:06:25.828558+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

## Criterion
The temporary diversion of stdout during a command's render phase is always
undone once the phase completes. After the render phase — whether it succeeds or
throws an error — writes to stdout land on stdout again; stdout is never left
permanently aliased to stderr. When the command's computation fails, the error
surfaces (propagates as a failure) and stdout remains usable for subsequent
output.

## Verification
Exercise the stdout-hygiene wrapper around both a succeeding render and a
throwing render. In the success case, confirm a write issued after the wrapped
phase appears on stdout. In the failure case, confirm the error propagates and a
write issued after the wrapped phase still appears on stdout (not on stderr),
proving the original stdout was restored.