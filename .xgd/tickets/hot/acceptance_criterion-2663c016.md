---
uid: acceptance_criterion-2663c016
id: AC-2262
type: acceptance_criterion
title: An event keeps both when it happened and when it was recorded, and sorts by
  when it happened
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:30.611186+00:00'
updated_at: '2026-11-04T17:21:30.611186+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
Every event keeps two times: when it happened (occurred) and when the system learned of it (recorded). If a writer supplies an occurred time in the past, as with an imported event, the event keeps that occurred time and its recorded time is the time of the write, and the two differ. If no occurred time is supplied, the occurred time equals the recorded time. The event's position in the history follows its occurred time, so an imported event from months ago sorts beneath this week's events.

## Verification
Record an event with an occurred time months before now, plus a current event. Assert that the imported event's occurred time equals the supplied value, that its recorded time is the write time (not equal to occurred), and that it sorts after the current event in the newest-first history. Record an event with no occurred time and assert that occurred equals recorded.
