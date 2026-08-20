---
uid: acceptance_criterion-2fb6d5dd
id: AC-1257
type: acceptance_criterion
title: A record names the count, the time, the actor, the operation, the page, a human-readable
  label, and the words before and after
created_by: xgd
created_at: '2026-08-20T02:27:01.955903+00:00'
updated_at: '2026-08-20T02:27:01.955903+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

After a copy edit made from the client's page editor, asking for changes since a count taken before it returns one record carrying, at minimum:

- the change count that write produced,
- when it happened,
- who made it — distinguishing the assistant, the client's editor, and the operator's own tools, with an unattributed caller recorded as the operator's own tools,
- what kind of operation it was,
- the page it happened on,
- a human-readable label identifying the thing that changed,
- the text as it read **before** and the text as it reads **after**.

## Verification

Take the current count. Make a copy edit through the client-attributed path, changing a heading's words. Ask for changes since the earlier count and assert a single record whose page is the edited page, whose actor is the client, whose label names the edited element in words a person can recognise, and whose before/after values are the old and new text respectively.

Assert the same fields are present for a write that does not happen on a page (a settings or palette change), with the page absent rather than fabricated.
