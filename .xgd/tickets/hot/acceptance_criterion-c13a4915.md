---
uid: acceptance_criterion-c13a4915
id: AC-1397
type: acceptance_criterion
title: One extension yields one content type wherever an asset is served, and an unknown
  extension is generic binary
created_by: xgd
created_at: '2026-08-31T09:48:08.229941+00:00'
updated_at: '2026-08-31T09:48:08.229941+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

An asset's extension determines one content type, and every path that serves an asset gives that
same answer.

- The cloud store labels a stored asset with it, and the operator's own file server labels the same
  file with it — for every extension either serves, the two answers are identical, including the
  character-set qualifier where one is carried.
- An extension nothing in the product renders is labelled as generic binary content rather than
  guessed at, because labelling an unknown file as something it might be is how an
  image-shaped hole becomes a scripting one.
- A name with no extension at all is likewise labelled as generic binary content.

## Verification

For every extension the product recognises, compare the content type the cloud store puts on a
stored asset against the content type the local file server sends for a file of the same name, and
observe the two agree. Then serve a file with an invented extension and one with no extension from
each and observe the generic binary type from both. The point is that adding a new extension in
one place cannot leave the other path silently answering generic binary for a reason nobody would
connect to the change.
