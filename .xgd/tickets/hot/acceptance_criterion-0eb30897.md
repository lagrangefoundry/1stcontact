---
uid: acceptance_criterion-0eb30897
id: AC-2207
type: acceptance_criterion
title: The pipeline stage is read from its own stored value, not inferred from timestamps
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:13.784884+00:00'
updated_at: '2026-11-01T20:12:52.206172+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
The pipeline stage that the people API reports, and the Contacts tab displays, is the contact's stored stage, whichever timestamps are set:
- a contact with an invite timestamp set but stored stage `lead` reports and shows **Lead**;
- a contact with stored stage `invited` and no invite timestamp reports and shows **Invited**;
- a stored stage this build does not recognise is reported as that value and displayed under its own name. It is not shown as Lead.

Lead is shown only when the contact has no stored stage at all.

## Verification
Seed contacts whose stored stage disagrees with their timestamps in each direction, plus one whose stored stage is an unrecognised value (for example `qualified`). Read through the people API and render the tab. Assert that `pipelineStage` and the row's stage label equal the stored value in each case ("Lead", "Invited", "qualified").