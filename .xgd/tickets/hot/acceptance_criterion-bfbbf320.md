---
uid: acceptance_criterion-bfbbf320
id: AC-2264
type: acceptance_criterion
title: Provenance is the earliest event, read past the history cap; two entry events
  both survive; none when there is no history
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:32.072585+00:00'
updated_at: '2026-11-04T17:21:32.072585+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
A contact's provenance (origin) is their earliest event by occurred time, and it is determined independently of the history cap. A contact with more events than the timeline shows still reports the true earliest event. A contact with two entry events, such as `list.joined` and later `consultation.booked`, keeps both: both appear in the history, and provenance is the earlier one. No separate stored field duplicates provenance. A contact with no events has no provenance (none/null), and no origin is inferred from the contact's creation date or anything else.

## Verification
Record one early event followed by several later ones. Read a capped history that excludes the early event and assert that provenance is still the early event. Record two entry kinds and assert that both are in the history and that provenance is the earlier one. Assert that the contact record exposes no source/provenance field. A contact with no events has null provenance.
