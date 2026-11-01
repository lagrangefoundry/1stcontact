---
uid: acceptance_criterion-cd4737b0
id: AC-2187
type: acceptance_criterion
title: No Contacts-tab style rule keys on a pipeline-stage, access or grant-status
  value
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:50.138548+00:00'
updated_at: '2026-11-01T19:00:50.138548+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
No style rule for the Contacts tab is selected by the value of a pipeline stage (for example lead, invited), an access value (for example member) or the grant status shown in the table. Elements carrying these values have a class that names the kind of fact (stage, access, grant status), and every value of that kind gets the same class. A stage value the stylesheet has never seen is therefore styled exactly like a known one.

## Verification
Parse the stylesheet's Contacts-tab selectors and assert that none contains a pipeline-stage, access or grant-status value as a class or attribute value. Render rows at the Lead and Invited stages, plus a row with a never-seen stage value. Assert all three stage elements carry the same single class, and assert the same for grant-status cells holding different statuses.
