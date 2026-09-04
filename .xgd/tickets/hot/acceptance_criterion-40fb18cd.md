---
uid: acceptance_criterion-40fb18cd
id: AC-1600
type: acceptance_criterion
title: Where an account holds several live grants, the one that keeps access longest
  decides admission
created_by: xgd
created_at: '2026-09-04T05:52:43.093687+00:00'
updated_at: '2026-09-04T05:52:43.093687+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

Where an account holds more than one live grant covering the moment of the login, admission
is decided by the grant that keeps access longest: a grant with no end outranks any bounded
grant, and among bounded grants a later end outranks an earlier one. The admission reports
that grant, so the plan the caller is treated as holding is the most generous one they
currently hold rather than whichever grant storage happened to return first.

The choice is deterministic: the same set of grants always yields the same one.

## Verification

Give one account several active grants covering now — one ending soon, one ending later,
one with no end — created in an order that does not match their ranking. Assert admission
reports the open-ended grant. Remove it and assert admission reports the later-ending one.
Repeat the admission and assert the same grant is reported both times.
