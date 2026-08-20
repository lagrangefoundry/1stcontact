---
uid: acceptance_criterion-902e13a5
id: AC-1239
type: acceptance_criterion
title: The assistant is offered the read and the four palette writes, the writes in
  one separately grantable group, and meets the same guards an operator does
created_by: xgd
created_at: '2026-08-20T01:20:55.408545+00:00'
updated_at: '2026-08-20T06:32:00.871120+00:00'
completed_at: null
last_field_updated: title
status: active
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
- A session granted the palette writes can change, add, rename and remove a colour, and meets the
  same guards an operator meets, enforced in the same place: a removal of an entry in use is
  refused, a rename onto an existing name is refused, both carry the `CONFLICT` code, and the
  draft is left byte-unchanged by each.
- The **count** those refusals turn on reaches the assistant through the read, not through the
  refusal sentence. Rendering a refusal belongs to the toolbox, which renders it from the text its
  declaration carries for that code, so the store's own sentence — the one the command line prints
  verbatim, naming the count — does not reach the model. `get_palette` reports the count per entry,
  and the removal operation's own declared description sends the model there, so a session can
  still say how many uses are at stake before proposing what to do about them.
- A session not granted the palette write group is not offered those operations at all, while the
  read remains available to it.

## Verification

Open an assistant session for a seeded site with the palette write grant and assert the five
operations are offered; run each write and assert the site definition changes as it does from the
command line. Run a removal of a referenced entry and a rename onto an existing name and assert
both are refused with the `CONFLICT` code the command line also returns, and that the draft is
byte-identical afterwards. Assert the command line's own refusal names the count, and that the
same count is reachable by the assistant from `get_palette`'s per-entry answer — and that the
removal operation's declared description names `get_palette` as where to find it. Open a session
without the palette write grant and assert the four writes are not offered and cannot be invoked,
while reading the palette with counts still works. Assert each of the five operations appears in
exactly one grantable group.