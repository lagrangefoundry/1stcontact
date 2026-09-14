---
uid: acceptance_criterion-f53db14b
id: AC-1405
type: acceptance_criterion
title: A transcript is stored in one language-neutral form byte for byte, so a conversation
  written by either host loads in the other
created_by: xgd
created_at: '2026-08-31T10:37:57.123084+00:00'
updated_at: '2026-09-14T05:52:39.654121+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A conversation is stored in one language-neutral form, byte for byte, whichever
host wrote it. That form is the **session file** — the `xgd-session` JSON header
followed by the `xgd-chat` transcript — and it is what the host writes, not a
shape that merely converts to it.

Where the file is *carried* differs by host and the form does not. On the deployed
runtime the whole session file is the body of the conversation's transcript
comment; on the host that runs on the operator's machine it is a file held with
the workspace. A transcript written by either host loads unchanged in the other,
and in the separate implementation of the same session model that reads the same
form. No host writes a storage-shaped record of its own: nothing in the header
names a bucket, a database, an account, a key or a revision.

The consequence is the one that matters to the operator: a conversation is a
property of the site, not of the machine that happened to be answering when it
was spoken.

## Verification

Hold a conversation on the deployed host and read the session file back out of
the carrier it was written into: it is the header-plus-transcript form, both
speakers attributed, and re-serialising what the archive loaded yields exactly
those bytes. Check the header carries no field particular to one host's storage.
Then take those same bytes, file them as another site's conversation, and open
it: that conversation replays the same turns with the same text and the same
attribution. Do the reverse with the host that runs locally — write there, read
the bytes into the deployed host's carrier — and assert the same.
