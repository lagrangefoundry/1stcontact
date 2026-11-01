---
uid: acceptance_criterion-9b173545
id: AC-2209
type: acceptance_criterion
title: Every Contacts tab row draws its pipeline stage and, separately, a Member badge
  only when the contact is a Member
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:16.650552+00:00'
updated_at: '2026-11-01T20:12:51.730014+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
In the Contacts tab list, every row has a stage element showing the contact's stage label (Lead, Invited, or an unknown stage's own name). Rows for Members also carry a separate access badge reading **Member**. Rows for non-members have no access badge. All four combinations display correctly and are distinguishable:
- an invited non-member;
- a member who was never invited (a Lead);
- an invited member;
- a Lead who is neither.

## Verification
Render the tab over four contacts covering the four combinations. For each row, assert the text of the stage element ("Invited", "Lead", "Invited", "Lead") and whether a "Member" access badge is present (absent, present, present, absent). Assert that the stage element and the access badge are separate elements.