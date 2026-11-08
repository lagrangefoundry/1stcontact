---
uid: acceptance_criterion-ffd44f4d
id: AC-2429
type: acceptance_criterion
title: An action whose target does not exist or is not a panel is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:08:37.786435+00:00'
updated_at: '2026-11-08T13:08:37.786435+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Validation refuses an `action` whose `opens` or `closes` id matches no node in the document, and one whose id matches a node that does not carry `dialog`. The error is located at `<node path>/action/<verb>`, names the target id, and states that an action must name a node carrying `dialog`. The check covers the whole document: an action may name a panel that appears before or after it.

## Verification
Validate a document whose action names a missing id, and one whose action names an ordinary box id. Assert the target-must-be-a-dialog error at the verb path in both cases. Assert that an action naming a panel defined later in the document validates.