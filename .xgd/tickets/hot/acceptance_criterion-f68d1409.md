---
uid: acceptance_criterion-f68d1409
id: AC-2436
type: acceptance_criterion
title: The edit render ships no dialog script and no acting attribute
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:30.741709+00:00'
updated_at: '2026-11-08T13:25:16.083195+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
The edit render of a document with a modal contains no dialog script. Each action node is still a `<button>` with the same class and declarations as in the draft render, but has no attribute that would make it open or close a panel. The panel renders in flow and visible, so it can be edited. Apart from the missing behaviour, the edit render's tag, class, declarations and box for these nodes match the draft render.

## Verification
Render the same document via the edit channel and the draft channel. Assert the edit HTML contains no dialog script, assert the action node is a `<button>` with the same class but no target/acting attribute, and assert the draft render does carry that attribute.