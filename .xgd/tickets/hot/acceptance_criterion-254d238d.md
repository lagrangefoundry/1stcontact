---
uid: acceptance_criterion-254d238d
id: AC-2501
type: acceptance_criterion
title: Resubmitting the same address (any case) creates no second contact
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:10.995196+00:00'
updated_at: '2026-11-09T00:30:10.995196+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Submitting the same address again, including with different letter case or surrounding whitespace, creates no second contact. The business still has exactly one contact for that address, and the second submission adds a second submission event to that same contact.

## Verification
Submit the same address twice (the second time in a different case) to the same site, then assert one contact row for the address in that business and two submission events on it.
