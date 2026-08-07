---
uid: acceptance_criterion-922c2d11
id: AC-976
type: acceptance_criterion
title: Every option declared for a tab reaches the workspace chrome intact
created_by: xgd
created_at: '2026-08-07T01:45:03.595854+00:00'
updated_at: '2026-08-07T21:19:47.557598+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A tab is declared once, whole, and every property of that declaration is honoured
by the chrome that mounts it — including options beyond identity and label, such
as the viewport-filling behaviour. Adding a new option to a tab declaration
requires no change to the mounting step, and no declared option is silently
discarded.

## Verification

Declare a tab carrying every supported option and assert the mounted chrome
received each declared key, iterating over the declaration's keys rather than a
fixed list, so an option added later is covered automatically. Mutation check:
removing the viewport-filling option from the declaration must cause the
displayed-area measurement to fail, proving the option is load-bearing and
actually delivered.