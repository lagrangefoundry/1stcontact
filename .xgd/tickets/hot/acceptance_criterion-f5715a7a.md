---
uid: acceptance_criterion-f5715a7a
id: AC-1599
type: acceptance_criterion
title: A revoked grant, a withdrawn ownership or a suspended person each refuse independently
  of any date
created_by: xgd
created_at: '2026-09-04T05:52:42.047834+00:00'
updated_at: '2026-09-04T05:52:42.047834+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

A withdrawal refuses independently of any date, and each of the three withdrawals stands on
its own:

- a grant that has been revoked does not admit, however far in the future its end lies and
  even when it has no end at all;
- an ownership that has been withdrawn or has expired does not admit, however healthy the
  account's grants are;
- a person whose own record has been suspended does not admit, however healthy their
  ownership and grants are.

Each case is refused, and none of them is repaired: nothing is re-created to let the caller
through.

## Verification

For an invited person with an open-ended grant, in three independent scenarios: mark the
grant revoked; withdraw the ownership; suspend the person. Assert each attempt at admission
is refused. In each scenario assert the other two dimensions were left healthy, so the
refusal can only have come from the one under test.
