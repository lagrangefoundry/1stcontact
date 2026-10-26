---
uid: acceptance_criterion-1e3b64e8
id: AC-2021
type: acceptance_criterion
title: The overlay's area labels, the Library's role pills and filter, and the assistant
  manual's reference to the drop area all read from one definition
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:39:03.611216+00:00'
updated_at: '2026-10-26T01:39:03.611216+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The names of the two hand-over areas are defined once, and every surface that names an area to
the client reads them from there — so the overlay, the Library and the assistant can never
describe the same area in different words.

Specifically:

- The upload overlay's two area labels, the Library's role pills, the Library's role filter
  options and the role shown in a selected material's detail record read identically for the
  same role (`site` → *Site asset*, `reference` → *Background information*), with both the
  overlay and the Library mounted together.
- The assistant's declared operating manual, where it tells the assistant to ask the client to
  drop a file on the conversation, names the area by exactly the label the overlay shows for the
  `site` role, so a client told which area to choose finds a button with that name.
- A role whose value is not one of the two areas is shown as its raw value rather than as an
  empty pill.

## Verification

Mount the overlay and the Library together and assert each role's overlay label equals its
Library role pill and filter option; read the assistant's declared surface and assert its
"cannot fetch a file" absence note quotes the `site` area's label as the shared definition gives
it — asserted against that definition, not against a literal, so a future relabel that misses a
surface fails.
