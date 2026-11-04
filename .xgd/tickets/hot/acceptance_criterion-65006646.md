---
uid: acceptance_criterion-65006646
id: AC-2273
type: acceptance_criterion
title: An empty history still shows the History section with 'Nothing recorded yet.'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:38.785976+00:00'
updated_at: '2026-11-04T17:29:01.217600+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
The History section appears even for a contact with no events, such as one created before history was recorded. It shows the "History" heading, no event rows, no origin line, and the text "Nothing recorded yet.".

## Verification
Open the detail pane for a contact with an empty history. Assert that the "History" heading is present, that there are zero event rows and no origin line, and that an empty-state message reads "Nothing recorded yet.".