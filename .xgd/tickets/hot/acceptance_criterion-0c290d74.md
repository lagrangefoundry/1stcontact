---
uid: acceptance_criterion-0c290d74
id: AC-2263
type: acceptance_criterion
title: An event kind never seen before is accepted and read back verbatim
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:31.352037+00:00'
updated_at: '2026-11-04T17:21:31.352037+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
An event's kind is an open-ended dotted string. A kind the system has never seen before, such as `consultation.booked`, is accepted on write without refusal and reads back exactly as written. Recording a new kind requires no schema or configuration change.

## Verification
Record an event with a kind the product defines no label for. Read the history and assert that the event is present with that exact kind string.
