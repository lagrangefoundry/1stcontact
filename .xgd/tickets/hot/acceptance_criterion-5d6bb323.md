---
uid: acceptance_criterion-5d6bb323
id: AC-2179
type: acceptance_criterion
title: Each list row shows name and address in two cells, reading No name yet when
  the person has no display name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:34.343387+00:00'
updated_at: '2026-11-01T19:28:18.514903+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
Each row of the Contacts list shows the person's display name and their address as two separate cells. A person who has a display name shows both the name and the address. A person with no display name (null or empty) shows exactly **No name yet** in the name cell and still shows the address in the address cell. The name cell is never blank.

## Verification
Render the list with one named and one unnamed person. For the named row, assert the name cell holds the display name and the address cell holds the email. For the unnamed row, assert the name cell reads "No name yet" and the address cell holds the email.