---
uid: acceptance_criterion-34437b43
id: AC-2302
type: acceptance_criterion
title: A contact with no messages shows 'Nothing has been sent to them yet.', and
  a failed read says it could not be read rather than showing nothing sent
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:34.644260+00:00'
updated_at: '2026-11-04T18:03:34.644260+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
- When the contact has no messages, the Messages section shows the sentence "Nothing has been sent to them yet." and no list.
- When reading the contact's messages fails, the section shows "Their messages could not be read: <reason>" instead, and does not show the nothing-sent sentence.
- The per-contact messages read answers 200 with an empty list for a contact id that has no messages, does not exist, or belongs to another business. It does not answer 404, so it cannot be used to probe whether a person exists.

## Verification
Open the pane for a contact with no messages and assert the exact empty sentence. Make the messages transport fail with a known error and assert "Their messages could not be read: <error>". Call the messages read with an unknown id and with a contact id from a different business, and assert 200 with `messages: []` in both cases.
