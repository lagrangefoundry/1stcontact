---
uid: acceptance_criterion-14d84ce7
id: AC-2258
type: acceptance_criterion
title: A recorded event cannot be rewritten, and events carry no mutable status
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:27.564152+00:00'
updated_at: '2026-11-04T17:29:06.219484+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
Once an event is recorded against a contact it cannot be rewritten. Any attempt to change a stored event's fields, including a direct statement against the store and not only through the product, fails with an error. Reading the contact's history afterwards returns the event with its original kind, times, ref and detail. Events also have no status (or similar mutable-outcome) field: asking the store for one is an error, not a value.

## Verification
Record an event for a contact, attempt an in-place change of its kind against the deployed schema, and assert that the attempt raises an error and that the history still shows the original kind. Query a `status` field on the event store and assert that the query is refused.