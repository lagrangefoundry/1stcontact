---
uid: acceptance_criterion-7593b246
id: AC-2206
type: acceptance_criterion
title: Accepting the terms makes a contact a Member without operator action and without
  changing their pipeline stage
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:12.444507+00:00'
updated_at: '2026-11-01T20:05:12.444507+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
When a contact completes the terms-acceptance step, they become a **Member** (the terms-accepted value is set) with no operator action. Their stored pipeline stage is exactly what it was before: a Lead stays `lead` and an Invited contact stays `invited`.

## Verification
For one contact at stage `lead` and one at stage `invited`, both not yet members, have each accept the current terms through the terms-acceptance flow. Read both back through the people API. Assert that each now has a terms-accepted value and renders a Member badge, and that their `pipelineStage` values are still `lead` and `invited` respectively.