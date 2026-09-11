---
uid: acceptance_criterion-9d75e93a
id: AC-1746
type: acceptance_criterion
title: An account may hold several concurrent grants, with plan and status values
  the product does not issue today
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:45.660530+00:00'
updated_at: '2026-09-11T06:37:29.431714+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An account may hold several grants at the same time, and a grant may record a
plan name or a status value the product does not issue today. Recording a second
concurrent grant against an account succeeds and both grants are readable back;
recording a grant whose plan or status is an unrecognised value succeeds and the
value round-trips unchanged. Neither requires a change to how the records are
stored.

## Verification

Record two grants against one account and read both back, asserting both survive.
Record a grant carrying a plan name and a status value outside the set the
product issues, read it back, and assert the stored values are exactly what was
written — no rejection, no substitution.