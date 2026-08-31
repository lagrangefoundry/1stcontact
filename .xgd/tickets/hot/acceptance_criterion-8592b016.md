---
uid: acceptance_criterion-8592b016
id: AC-1389
type: acceptance_criterion
title: A write carrying a stale version is refused with both versions, and exactly
  one of two racing writers survives
created_by: xgd
created_at: '2026-08-31T09:47:34.193388+00:00'
updated_at: '2026-08-31T09:47:34.193388+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A change may carry the site version it was computed against. Carried and still current, the change
lands. Carried and stale, the change is refused with a typed conflict that states **both** the
version the writer expected and the version the site actually holds.

Of two writers that read the same version and then both write carrying it, **exactly one
succeeds**: the winner's content is what the site holds afterwards, the loser receives the
conflict, and the site's content shows no trace of the loser's change.

The refusal is distinguishable from any other failure — a caller can report "someone else changed
this, re-read and try again" from it without parsing a database message.

## Verification

Read a site's version. Apply one change carrying it and confirm it lands. Apply a second change
carrying the same, now-stale, version and observe a conflict carrying the expected version and the
current one, with the current one greater. Then run the race directly: two writers read the same
version, both write different content carrying it, and afterwards the site holds exactly one of
the two — the one whose write did not raise.
