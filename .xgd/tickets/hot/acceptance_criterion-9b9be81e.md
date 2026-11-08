---
uid: acceptance_criterion-9b9be81e
id: AC-2428
type: acceptance_criterion
title: An action naming neither verb or both verbs is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:08:28.751364+00:00'
updated_at: '2026-11-08T13:25:18.030392+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Validation refuses an `action` that names neither `opens` nor `closes`, and one that names both. The error is located at the node `action` path and states that an action must name exactly one of `opens` / `closes`. An action naming exactly one verb that targets a panel validates.

## Verification
Validate documents with `action: {}` and with `action: {opens, closes}`. Assert each produces the exactly-one-verb error at the action path. Assert a single-verb action against an existing panel produces none.