---
uid: acceptance_criterion-c7661426
id: AC-2259
type: acceptance_criterion
title: A changing delivery outcome appends events against the same message ref, never
  replaces one
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:28.318958+00:00'
updated_at: '2026-11-04T17:21:28.318958+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
When a message's delivery outcome changes, each outcome becomes an additional event. None of them replaces an earlier one. Recording `email.sent`, `email.bounced` and `email.delivered` for one contact with the same message reference gives that contact exactly three events, one of each kind, and all three carry the same message reference. An earlier outcome such as the bounce is still present after a later one such as delivered is recorded.

## Verification
Through the scoped event write path, record the three delivery kinds against one contact with one message reference. Read the history and assert three events, the set of kinds {email.sent, email.bounced, email.delivered}, and a single distinct ref equal to the message reference.
