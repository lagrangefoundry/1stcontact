---
uid: acceptance_criterion-5d6bb323
id: AC-2179
type: acceptance_criterion
title: Each list row shows the resolved current name and the primary address, reading
  No name yet when the person has no current name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:34.343387+00:00'
updated_at: '2026-11-04T16:29:52.269396+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
Each row of the Contacts list shows, as two separate cells, the person's current
name and their primary address. A person with a current name shows its displayed
name in the name cell. A person with no current name — never named, named and then
cleared, or whose name has been redacted to empty text — shows exactly
**No name yet** in the name cell. The address cell shows the primary address,
not any other address the person holds. The name cell is never blank.

## Verification
Seed one person with a current name and two addresses (one primary), one person
with no name row, and one whose current name row has empty text. Render the list.
For the named row, assert the name cell holds the displayed name and the address
cell holds the primary address, not the other one. For the other two rows, assert
the name cell reads "No name yet" and the address cell holds their address.
