---
uid: acceptance_criterion-fa74adda
id: AC-1409
type: acceptance_criterion
title: Transcripts and the assistant's record live outside the storage region site
  files are addressed within, so no request address can name them
created_by: xgd
created_at: '2026-08-31T10:38:49.147303+00:00'
updated_at: '2026-08-31T10:59:27.009699+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Transcripts and the record of what the assistant did are held outside the one
region of shared storage that a site's own files are addressed within. Because a
requested address is composed only within that region, and nothing derives a
storage root from a request, there is no address a visitor or an operator can ask
for that names a conversation or its record.

A transcript is somebody's business in their own words. It is not a site file and
must never be servable as one.

## Verification

Hold a conversation that makes a change, so both a transcript and a record of the
change exist. Enumerate what is stored and confirm the transcript and the record
sit outside the region site files are addressed within. Then ask the origin for
addresses constructed to reach them — including ones using traversal segments to
climb out of the site region — and assert none of them returns a transcript or a
record: each is refused or not found, and the stored objects are unchanged.