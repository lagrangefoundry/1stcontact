---
uid: acceptance_criterion-1289ae1c
id: AC-1582
type: acceptance_criterion
title: An answer outside the two offered is refused by name and creates nothing, never
  coerced into one of them
created_by: xgd
created_at: '2026-09-04T04:52:10.423723+00:00'
updated_at: '2026-09-04T04:52:10.423723+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

An answer that is neither of the two offered is refused rather than interpreted. The request fails
with a message naming the two permitted answers, and nothing is created — no record, no stored
bytes, no placement. A misspelled or invented answer is never quietly treated as one of the two,
because both silent readings are wrong in a way nobody would notice: one publishes what the client
marked private, the other withholds what they meant to publish.

## Verification

Submit an upload carrying an answer outside the permitted set. Confirm it is refused with a message
naming the permitted answers, and that the client's library contains no new material afterwards.
