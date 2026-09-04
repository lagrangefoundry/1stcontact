---
uid: acceptance_criterion-f6850a72
id: AC-1571
type: acceptance_criterion
title: Dragging a file onto either the conversation or the Library raises the same
  one question about what the file is for
created_by: xgd
created_at: '2026-09-04T04:51:40.313019+00:00'
updated_at: '2026-09-04T04:51:40.313019+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

Dragging a file onto the conversation, or onto the Library, raises the same single question surface
asking what the file is for. The workspace has exactly one such surface however many places watch
for a dragged file, so the client is never asked the question twice or asked two different
questions depending on where they dragged.

## Verification

With the workspace open, drag a file over the conversation and observe the question surface become
visible; dismiss it, drag a file over the Library, and observe the same surface — the same instance,
not a second one — become visible again.
