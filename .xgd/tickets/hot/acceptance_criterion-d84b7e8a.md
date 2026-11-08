---
uid: acceptance_criterion-d84b7e8a
id: AC-2434
type: acceptance_criterion
title: The dialog script is emitted once only for documents with a modal and carries
  no document values
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:20.781049+00:00'
updated_at: '2026-11-08T13:09:20.781049+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Rendering a document that contains one or more panels emits the dialog behaviour script and its invariant stylesheet exactly once, however many panels there are. A document with no panel emits no dialog script and no dialog stylesheet. The script text is identical across documents with different colours, ids, labels and placements. It contains no id, colour, label or other value taken from the document.

## Verification
Render documents with one and with two panels and assert one copy of the script and stylesheet each time. Render a modal-free document and assert neither is present. Render two documents with distinct instance values, assert the scripts are byte-identical, and assert none of the instance values appear in the script.