---
uid: acceptance_criterion-a69306c2
id: AC-1585
type: acceptance_criterion
title: That turn reports what went wrong — a failed upload, an unplaced file, one
  nothing can search yet — rather than reading as added
created_by: xgd
created_at: '2026-09-04T04:52:13.637644+00:00'
updated_at: '2026-09-04T04:52:13.637644+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

The conversation turn reports what actually happened, including the parts that went wrong, and never
reads as a plain success when something failed:

- an upload that did not complete is reported as not uploaded, with the reason;
- a file that was kept but could not be put on the site says both — that it was added, and why it is
  not on the site yet;
- a file nothing can search yet says that it is stored but cannot be found by its contents.

A file that was stored but is unfindable is otherwise indistinguishable from a working one to the
only person who could tell us, which is why the turn has to say so.

## Verification

Drive three conversation-route drops — one where the upload fails, one where the upload succeeds but
placement on the site fails, one where the file is stored but not indexed — and read the resulting
turn in each case for the corresponding statement.
