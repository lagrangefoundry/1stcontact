---
uid: acceptance_criterion-5d6bb323
id: AC-2179
type: acceptance_criterion
title: Each list row shows the resolved current name and the primary address, reading
  No name yet when the person has no current name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:34.343387+00:00'
updated_at: '2026-11-04T21:36:39.790438+00:00'
completed_at: null
last_field_updated: body
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
not any other address the person holds — including when the primary is not the
person's oldest address. The name cell is never blank.

## Verification
Server half: through the real `GET /b/<business>/api/people` route, seed a person
with two addresses and move the primary flag to the newer one; assert the row's
address is the newer (primary) address, not the older one.
Panel half: render the list from a payload with one person with a current name,
one with no name row, and one whose current name row has empty text. For the
named row, assert the name cell holds the displayed name and the address cell
holds the address the payload carries. For the other two rows, assert the name
cell reads "No name yet" and the address cell holds their address.

## Reconciliation Decisions
- (review report-0cfddba5 gap 3) The list payload carries exactly one address per
  person — the primary, chosen server-side by `PRIMARY_EMAIL_SQL` — so "primary,
  not the other one" is proved at the route where the choice is made, and the
  panel is proved to display the address it is given.
