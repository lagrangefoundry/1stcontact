---
uid: acceptance_criterion-c6bc805e
id: AC-2076
type: acceptance_criterion
title: A business whose grant has lapsed, not started or been revoked stays in the
  list marked unselectable, while the person is still admitted if any other business
  is entitled
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:33:54.147912+00:00'
updated_at: '2026-11-01T01:33:54.147912+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A business whose grant has lapsed, has not started or has been revoked stays in
the person's list, reported unselectable and with no effective grant, while the
person is still admitted if any other business they hold is entitled. Dropping it
would make "your grant expired" indistinguishable from "this business was
deleted".

## Verification

Give one person two businesses, then lapse the grant of one of them leaving the
other alone. Attempt admission and assert it succeeds; that both businesses are
listed; that the lapsed one is unselectable with no grant; and that the other is
selectable with its grant.
