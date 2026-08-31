---
uid: acceptance_criterion-f53db14b
id: AC-1405
type: acceptance_criterion
title: A transcript is stored in one language-neutral form byte for byte, so a conversation
  written by either host loads in the other
created_by: xgd
created_at: '2026-08-31T10:37:57.123084+00:00'
updated_at: '2026-08-31T10:37:57.123084+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A conversation is stored in one language-neutral form, byte for byte, whichever
host wrote it. A transcript written by the deployed host loads unchanged in the
host that runs on the operator's machine, and in the separate implementation of
the same session model that reads the same form — and the reverse holds too. No
host writes a storage-shaped record of its own.

The consequence is the one that matters to the operator: a conversation is a
property of the site, not of the machine that happened to be answering when it
was spoken.

## Verification

Hold a conversation on the deployed host, then read that same stored transcript
with the host that runs locally: it loads, and replays the same turns with the
same text and the same attribution. Do the reverse — write with the local host,
read with the deployed one. Compare the stored bytes of a transcript written by
each: they are the same form, header and turns alike, and neither carries a field
particular to one host's storage.
