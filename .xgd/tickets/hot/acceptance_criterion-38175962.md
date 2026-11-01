---
uid: acceptance_criterion-38175962
id: AC-2204
type: acceptance_criterion
title: A contact begins at pipeline stage Lead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:09.731117+00:00'
updated_at: '2026-11-01T20:05:09.731117+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
A contact who has not been invited has stored pipeline stage `lead`. The people list and detail responses report it as `pipelineStage: "lead"`, and the Contacts tab shows the stage label **Lead** on that contact's row. This covers contacts created by any route other than the invite, and existing contacts that have no invite stamp.

## Verification
Create a contact by a non-invite route (for example, a direct insert with no stage specified). Read it back through the people API and render the tab. Assert `pipelineStage == "lead"`, and that the row shows a stage label with the text "Lead".