---
uid: acceptance_criterion-e01f3d34
id: AC-2426
type: acceptance_criterion
title: The overlay role is accepted only on box/container and the action verb only
  on box/container/text
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:08:16.477873+00:00'
updated_at: '2026-11-08T13:08:16.477873+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
A site definition passes validation when a `box` or `container` node carries `dialog`, and when a `box`, `container` or `text` node carries `action`. Validation refuses the document, with an error at that node's path, when `dialog` appears on a `text`, `image`, `control` or `slot` node, or when `action` appears on an `image`, `control` or `slot` node.

## Verification
Validate small documents that put each role on each node kind. Assert the accepted kinds return no errors and each refused kind returns at least one error located at the offending node.