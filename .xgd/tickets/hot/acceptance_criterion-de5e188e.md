---
uid: acceptance_criterion-de5e188e
id: AC-2427
type: acceptance_criterion
title: A node carrying dialog without an id is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:08:23.539582+00:00'
updated_at: '2026-11-08T13:25:18.255740+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Validation refuses a document in which any node carrying `dialog` has no `id`. The error is located at that node `dialog` path and states that a node carrying `dialog` must declare an `id`. The same panel with an `id` validates.

## Verification
Validate a document with an id-less panel and assert one error at `<node path>/dialog` with that message. Add an `id` and assert the document is valid.