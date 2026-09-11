---
uid: acceptance_criterion-89b1779c
id: AC-1728
type: acceptance_criterion
title: A file dropped outside both areas creates nothing, marks both answers and says
  what is missing
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:27.684641+00:00'
updated_at: '2026-09-11T05:32:27.684641+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

A file dropped on the overlay but not into either area creates nothing and is not assigned a
role. Instead the overlay stays showing, marks **both** answers as awaiting a choice — never one,
since marking either would be the recommendation this surface exists not to make — and displays a
message saying what is missing (that the file must be dropped on one of the two areas).

No default role is chosen, and the drag is not discarded: the client is mid-gesture and has
simply missed.

## Verification

With the overlay raised, drop a file on the overlay outside both areas. Assert: no handover
occurred; the overlay is still showing; a message is displayed telling the client to drop the
file on one of the two areas; and both areas — exactly two — carry the awaiting-a-choice marking.
