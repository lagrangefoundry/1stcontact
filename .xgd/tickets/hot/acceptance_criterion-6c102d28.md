---
uid: acceptance_criterion-6c102d28
id: AC-2261
type: acceptance_criterion
title: A contact's events read as one newest-first sequence by occurred time, inbound
  and outbound interleaved, capped at 100
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:29.864366+00:00'
updated_at: '2026-11-04T17:21:29.864366+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
A contact's events read back as a single sequence, newest first, ordered by when each event happened (its occurred time), not by when it was recorded. Inbound kinds (e.g. `email.received`) and outbound kinds (e.g. `email.sent`) are interleaved in the same list, never grouped by kind or direction. Events with identical occurred times come back newest-written first, and that order is the same on every read. The sequence holds at most 100 events, which are the 100 most recent. A contact with no events returns an empty sequence, not an error.

## Verification
Record sent and received events with interleaved occurred times. Read the history and assert the exact newest-first order with directions interleaved. Record two events with the same occurred time and assert a stable newest-written-first order across repeated reads. With a cap smaller than the event count, assert that only the most recent events are returned. A contact with no events returns [].
