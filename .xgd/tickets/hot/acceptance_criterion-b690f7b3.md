---
uid: acceptance_criterion-b690f7b3
id: AC-1601
type: acceptance_criterion
title: An account may hold several grants at once, and a grant may name a plan or
  status not in today's set, without a storage change
created_by: xgd
created_at: '2026-09-04T05:52:44.129222+00:00'
updated_at: '2026-09-04T06:00:22.049885+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

The stored shape of a grant admits growth without a storage change:

- one account may hold several grants at the same time — recording a second grant against an
  account that already has one is accepted, and both are readable back;
- a grant may name a plan and a status that are not in today's set — recording a grant whose
  plan or status is a value the system does not use yet is accepted and readable back
  unchanged, rather than being refused by the store.

So introducing a trial plan, or a warning state before expiry, is a change to the code that
decides admission and not a migration of what is stored.

## Verification

Record two grants against a single account and assert both are readable back. Record a
grant carrying a plan name and a status name that no current code path produces, and assert
it is accepted and reads back with those exact values. Assert that the declared storage
shape places no closed value set on either the plan or the status of a grant, and no
one-grant-per-account restriction.