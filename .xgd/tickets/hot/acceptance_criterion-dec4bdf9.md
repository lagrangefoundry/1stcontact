---
uid: acceptance_criterion-dec4bdf9
id: AC-1734
type: acceptance_criterion
title: Dismissing the overlay creates nothing, and the next raise starts clean
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:51.098019+00:00'
updated_at: '2026-09-11T05:32:51.098019+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The client may decline to answer. Dismissing the overlay — by the cancel control or by pressing
Escape while it is showing — withdraws it and creates nothing: no file is handed over and no role
is assigned.

The next time the overlay is raised it starts clean: any "you must drop it on one of these two"
message from a previous ambiguous drop is gone, and neither area carries the awaiting-a-choice
marking.

## Verification

Raise the overlay, drop a file outside both areas so the awaiting-a-choice state is showing, then
dismiss it by the cancel control; assert it is not showing and nothing was handed over. Raise it
again and assert the message is absent and neither area is marked. Repeat the dismissal via
Escape.
