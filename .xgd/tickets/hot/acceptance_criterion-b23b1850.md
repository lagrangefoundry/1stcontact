---
uid: acceptance_criterion-b23b1850
id: AC-2268
type: acceptance_criterion
title: Events belong to the contact's own business; cross-business reads see nothing
  and cross-business writes are refused as unknown contact
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:35.034965+00:00'
updated_at: '2026-11-04T17:21:35.034965+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
Events are scoped to the contact's business.
- Every recorded event belongs to the business the contact belongs to. The writer cannot choose a different business.
- Read from another business, a contact's history is empty and their provenance is none. This is the same answer a contact id that never existed gets, while the owning business still sees the events.
- Writing an event from one business against a contact in another business is refused with the same "no such contact in this business" error an unknown contact id gets. Nothing is written to the other business's timeline.

## Verification
In business B, create a contact and record an event. From business A, assert an empty history and null provenance for that contact, while B sees one event. From A, attempt a write against B's contact and assert the unknown-contact refusal and an unchanged event count in B. Record from B and assert that the returned event's business is B.
