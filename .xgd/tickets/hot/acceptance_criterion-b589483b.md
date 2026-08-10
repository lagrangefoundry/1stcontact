---
uid: acceptance_criterion-b589483b
id: AC-1076
type: acceptance_criterion
title: Arguments are checked against the declaration before any value reaches the
  site, and each fault is refused with a message naming it
created_by: xgd
created_at: '2026-08-10T09:06:18.656404+00:00'
updated_at: '2026-08-10T09:15:03.575283+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

Every call's arguments are validated against the declared parameters before the
operation runs. A value of the wrong kind, a missing required parameter, and a
parameter the operation does not declare are each refused with a message naming
the specific fault. Nothing is written, and each refusal is recorded as a decision
made on the declaration — not as a failure reported back from the site's write
path.

## Verification

Issue three calls: one with a declared parameter given the wrong type, one omitting
a required parameter, one carrying an undeclared parameter. Assert each answer
names its fault (wrong type, the missing parameter by name, the unaccepted
parameter). Assert the draft bytes are unchanged, and that every audit record
written by these calls shows a refusal decided by the schema rule.