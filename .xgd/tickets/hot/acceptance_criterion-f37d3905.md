---
uid: acceptance_criterion-f37d3905
id: AC-1575
type: acceptance_criterion
title: 'A file released on neither answer creates nothing: the question stays up,
  both answers are marked, and it says what is missing'
created_by: xgd
created_at: '2026-09-04T04:51:50.421452+00:00'
updated_at: '2026-09-04T04:51:50.421452+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A file released on the question surface but on neither answer creates nothing at all — no record, no
stored bytes, no placement. The surface stays open, both answers are marked as the choice that is
missing, and a message states that the file has to be given to one of them. The client's file is not
discarded and no answer is chosen on their behalf.

## Verification

Release a file on the surface outside both answers. Confirm nothing was created, the surface is
still open, both answers carry the marking, and the message naming what is missing is shown. Then
release the file onto one of the answers and confirm it is created normally.
