---
uid: acceptance_criterion-82755ab3
id: AC-1586
type: acceptance_criterion
title: A Library-route upload puts no line in the conversation, whether or not one
  is open
created_by: xgd
created_at: '2026-09-04T04:52:18.428347+00:00'
updated_at: '2026-09-04T04:52:18.428347+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A file given to the platform through the Library adds no turn to the conversation — the transcript
is exactly as long and exactly as it was — whether or not a conversation is open at the time. The
deliberate path puts no line into a conversation it was not part of.

## Verification

With a conversation open and its transcript recorded, upload a file through the Library under each
answer. Confirm the transcript is unchanged, while the material record was nevertheless created.
