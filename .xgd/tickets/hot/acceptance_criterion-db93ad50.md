---
uid: acceptance_criterion-db93ad50
id: AC-2182
type: acceptance_criterion
title: Selecting a person opens a detail pane immediately that fills with Who they
  are (primary address) and Businesses sections
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:39.323043+00:00'
updated_at: '2026-11-04T19:42:33.205713+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
Selecting a person in the Contacts list opens a detail pane straight away, with no error and no blank pane. Once that person's detail has loaded, the pane contains:
- a **Who they are** section showing the person's record, including their **primary address**. The person record carries no name field (REQ-193 removed `users.display_name`), so Who they are shows no name. A person's name is shown and edited in its own **Their name** section (AC-2252).
- a **Businesses** section

The pane is never left empty after the detail has loaded, and no unhandled error is raised when it opens.

## Verification
Mount the panel and select a person. Assert a detail element is mounted at once. After the detail read resolves, assert the pane contains a "Who they are" heading, that the pane shows the person's primary email, and that it has a "Businesses" heading. Assert no unhandled rejection was recorded.
