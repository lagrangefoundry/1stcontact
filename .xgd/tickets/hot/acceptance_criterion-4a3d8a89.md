---
uid: acceptance_criterion-4a3d8a89
id: AC-2271
type: acceptance_criterion
title: History rows show a recorded stamp only when it differs from the occurred time
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:37.217470+00:00'
updated_at: '2026-11-04T17:21:37.217470+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
In the History section, a row shows a second stamp, "recorded YYYY-MM-DD HH:MM", only when the event's recorded time differs from its occurred time. For events whose two times are equal, which covers everything the system records itself, the row shows no recorded stamp. An imported event with a differing recorded time still sits in the list at its occurred time.

## Verification
Open the pane for a contact with one imported event (occurred in March, recorded in September) and several same-time events. Assert that exactly one row carries a recorded stamp, reading "recorded 2026-09-01 09:00", and that the imported row's displayed time is its occurred time.
