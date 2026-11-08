---
uid: acceptance_criterion-7e961a7a
id: AC-2430
type: acceptance_criterion
title: A node carrying both link and action is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:08:42.543154+00:00'
updated_at: '2026-11-08T13:25:17.556529+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Validation refuses a node that carries both `link` and `action`, with an error stating that a node cannot carry both. The same node with only one of the two validates.

## Verification
Validate a `text` node with a link and an `opens` action and assert it is refused. Remove either field and assert the document is valid.