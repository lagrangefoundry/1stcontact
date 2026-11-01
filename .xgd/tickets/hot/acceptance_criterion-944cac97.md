---
uid: acceptance_criterion-944cac97
id: AC-2211
type: acceptance_criterion
title: No stylesheet rule names a value of either axis; stage, access and facet styling
  is keyed on the axis
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:19.374817+00:00'
updated_at: '2026-11-01T20:05:19.374817+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
The stage label, the access badge and the facet controls in the Contacts tab carry class names that identify the axis (stage, access, facet), not the value they show. No stylesheet rule shipped with the builder has a selector naming a stage value (lead, invited) or an access value (member, not a member). The Lead and Invited labels therefore render with identical styling, and a newly added stage needs no stylesheet change to be styled.

## Verification
Render rows at stage Lead and Invited, member and non-member. Assert that the stage elements share the same class set whatever their value, and likewise the access badges. Parse the builder stylesheet and assert that no selector contains a stage or access value token (`lead`, `invited`, `member`, `not_member`/`not-member`), while selectors for the stage, access and facet classes exist.