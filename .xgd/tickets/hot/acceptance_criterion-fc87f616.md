---
uid: acceptance_criterion-fc87f616
id: AC-906
type: acceptance_criterion
title: Not-found is plain, never a listing, and never distinguishes an unknown site
  from an unpublished one
created_by: xgd
created_at: '2026-08-06T18:48:58.619787+00:00'
updated_at: '2026-08-06T18:48:58.619787+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

A request naming an unknown site, a known site with nothing published, a preview
identifier that names no snapshot, or a path that names no object within an
existing snapshot all return the same not-found status with the same plain
text-typed body. The response never enumerates what does exist at or beneath the
requested path, and the four cases are indistinguishable from one another in
status, headers and body — a stranger cannot learn from the response whether a
site exists.

## Verification

Issue requests for each of the four cases against a store containing at least
one real site and assert an identical not-found status and body for all of them,
byte-comparing the responses. Assert the body contains no path, key, filename or
count drawn from the store, and that requesting a directory-shaped path inside a
snapshot returns not-found rather than a list of its entries.
