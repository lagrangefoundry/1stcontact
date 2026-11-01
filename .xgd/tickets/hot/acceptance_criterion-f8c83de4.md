---
uid: acceptance_criterion-f8c83de4
id: AC-2180
type: acceptance_criterion
title: A business switch empties the Contacts list, then re-reads it for the new business,
  never showing the old business's people
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:36.163779+00:00'
updated_at: '2026-11-01T19:28:17.841577+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
When the operator switches the builder to a different business, the Contacts list is emptied first. It is then repopulated from a fresh read scoped to the new business. At no point after the switch does the list show the previous business's people beside the new business's name. If the re-read fails, the list stays empty and does not fall back to the previous business's rows.

## Verification
Load the tab for business A with people listed. Switch to business B. Assert the list is empty immediately after the switch, before the new read resolves. Then assert it holds exactly B's people. Repeat with the read for B failing, and assert the list is empty rather than showing A's rows.