---
uid: acceptance_criterion-082830e7
id: AC-2195
type: acceptance_criterion
title: An address already held by someone else in the same business is refused with
  400; the same address in another business is accepted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:08.995909+00:00'
updated_at: '2026-11-01T20:02:33.217258+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
If a record change would give a person an email (compared after casefolding) that another person in the **same** business already holds, the response is **400** with the message "Somebody in this business already has that address." and neither person's record changes. It is never a server error. If the same address is held only by a person in a **different** business, the change is accepted (200), because the same address in two businesses is two separate people.

## Verification
Against real D1: create two people in business A and set the second's email to the first's address with different casing. Assert 400 with that message and that both rows are unchanged. Create a person in business B holding address X, then set a person in business A to X and assert 200.