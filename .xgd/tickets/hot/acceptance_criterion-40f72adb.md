---
uid: acceptance_criterion-40f72adb
id: AC-1735
type: acceptance_criterion
title: Several files are handed over and reported one by one, and the Library is re-read
  afterwards
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:55.287583+00:00'
updated_at: '2026-09-11T05:42:21.154863+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

Several files handed over in one gesture are treated individually: each is handed to the platform
in its own right with the chosen role, and — for a conversational handover — each is reported on
its own, so one failure among several is visible rather than hidden behind a single aggregate
confirmation.

After a handover, from either entry point, the Library's list is re-read from the platform rather
than assembled from what the handover returned, so it shows the state the platform actually holds
(including whether the file could be described, and whether it reached the site).

## Verification

Drop several files into one area in a conversational handover and assert one handover per file
occurred, each carrying the same role, and that the conversation reports each file separately.
Then assert the Library's list was re-read from the platform after the handover completed — both
for a handover begun in the conversation and for one begun in the Library.