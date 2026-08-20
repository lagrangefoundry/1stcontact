---
uid: acceptance_criterion-902e13a5
id: AC-1239
type: acceptance_criterion
title: The assistant is offered the read and the four palette writes, the writes in
  one separately grantable group, and meets the same refusals an operator does
created_by: xgd
created_at: '2026-08-20T01:20:55.408545+00:00'
updated_at: '2026-08-20T01:20:55.408545+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

The site assistant reaches the same palette through its declared control surface:

- All five operations are offered — the read, and the four writes.
- The read is classified as a read and belongs to the same grant that carries the site's other
  reads; the four writes are classified as writes and belong to **one** grantable group of their
  own, so palette editing can be granted or withheld independently of the other write groups.
- Every operation belongs to exactly one grantable group.
- A session granted the palette writes can change, add, rename and remove a colour and sees the
  same refusals an operator sees — a removal of an entry in use is refused naming the count, and
  a rename onto an existing name is refused as a collision.
- A session not granted the palette write group is not offered those operations at all, while the
  read remains available to it.

## Verification

Open an assistant session for a seeded site with the palette write grant and assert the five
operations are offered; run each write and assert the site definition changes as it does from the
command line. Run a removal of a referenced entry and a rename onto an existing name and assert
both are refused with the same reasons the command line gives. Open a session without the palette
write grant and assert the four writes are not offered and cannot be invoked, while reading the
palette with counts still works. Assert each of the five operations appears in exactly one
grantable group.
