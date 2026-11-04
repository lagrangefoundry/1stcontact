---
uid: acceptance_criterion-fcb29500
id: AC-2260
type: acceptance_criterion
title: Erasing a contact erases that contact's events and no one else's
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:29.128101+00:00'
updated_at: '2026-11-04T17:29:05.445155+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
Erasing a contact also erases that contact's events. Deleting the contact is not refused because events exist. After the deletion, no event that named that contact remains in the store. Events belonging to other contacts, in the same business or another one, are untouched.

## Verification
Create two contacts in one business and record events for both. Delete the first contact. Assert that the delete succeeds, that the store holds zero events for the deleted contact's id, and that the second contact's event count is unchanged.