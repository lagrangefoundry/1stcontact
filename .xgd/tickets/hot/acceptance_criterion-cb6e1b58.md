---
uid: acceptance_criterion-cb6e1b58
id: AC-1411
type: acceptance_criterion
title: The record of every call survives the host that wrote it, loses no entry to
  a concurrent caller, and is kept even for an abandoned turn
created_by: xgd
created_at: '2026-08-31T10:40:28.722749+00:00'
updated_at: '2026-08-31T10:40:28.722749+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

The record of what was done to a site outlives the host that wrote it. After the
host is gone and everything it held in memory with it, the records of the calls it
made are still readable, in full, from durable storage — which is what makes the
trail usable as evidence rather than as a hint.

Two properties make that true and are claimed with it:

- **Concurrent callers do not lose each other's entries.** Two turns writing at the
  same time both survive; the count afterwards is the sum, never fewer. Records are
  added, never folded into one another, so there is no window in which one caller
  reads a trail, another appends, and the first writes the older version back.
- **An abandoned or failed turn still records what it managed to do.** The write
  happens while the response is still open rather than after it, and it happens
  whether the turn succeeded, failed or was walked away from mid-stream. A trail
  that only survives success is not a trail.

A failure to write the record does not also fail the turn the operator already had:
the records are lost either way, and taking the answer with them helps nobody.

## Verification

Run a turn that makes a change, then discard all in-memory state as a replaced host
would, and read the trail back from durable storage: the call's records are there
in full. Flush two turns' records concurrently and assert the stored count is the
sum of both, with every record from each present — a fold would show fewer. Abandon
a turn part-way through its stream and assert the records for the calls it had
already made are stored. Make the durable write itself fail and assert the turn's
own answer still reached the caller.
