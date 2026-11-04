---
uid: acceptance_criterion-f5e46bc9
id: AC-2272
type: acceptance_criterion
title: History shows an Origin line from the server's earliest event, and none when
  there is no provenance
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:37.998074+00:00'
updated_at: '2026-11-04T17:21:37.998074+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
When the contact has a provenance event, the History section shows an origin line reading "Origin: <label>, <YYYY-MM-DD HH:MM>". It is built from the server-supplied provenance (the earliest event), not from the last row of the displayed list, so it stays correct when the list is capped. When the contact has no provenance, no origin line is shown.

## Verification
Open the pane for a contact whose earliest event is list.joined at 2026-03-04 12:00 and assert that the origin line reads exactly "Origin: list.joined, 2026-03-04 12:00". Open the pane for a contact with no events and assert that there is no origin line.
