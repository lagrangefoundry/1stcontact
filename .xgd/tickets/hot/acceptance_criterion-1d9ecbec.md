---
uid: acceptance_criterion-1d9ecbec
id: AC-2267
type: acceptance_criterion
title: Creating a seeded platform operator records contact.created (via platform_admins)
  exactly once
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:34.298665+00:00'
updated_at: '2026-11-04T17:21:34.298665+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
When a platform operator is created from the deployment's configured operator list, a `contact.created` event with detail `{via: "platform_admins"}` is recorded against them in the platform business. The event is recorded only when the person is created. Ensuring the same operator again, as happens on each later admission, adds no further event, so the operator's history is exactly [contact.created].

## Verification
Ensure the same configured operator address twice in the platform business. Resolve the operator's contact id from the address and assert that the history is exactly one contact.created event with detail {via: platform_admins}.
