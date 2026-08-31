---
uid: acceptance_criterion-fc87f616
id: AC-906
type: acceptance_criterion
title: Not-found is plain, never a listing, and identical across unknown, unpublished,
  missing and directory-shaped addresses
created_by: xgd
created_at: '2026-08-06T18:48:58.619787+00:00'
updated_at: '2026-08-31T11:52:56.946500+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request naming an unknown site, a known site that has never published, a path
that names no object within the live revision, or a directory-shaped path inside
it all return the same not-found status with the same plain text-typed body.
There is one addressing form, so these four cases are indistinguishable in
status, headers and body alike — a stranger cannot learn from the response
whether a site exists, whether it has published, or what a revision contains.

The response never enumerates what does exist at or beneath the requested path:
a directory-shaped path returns not-found rather than a listing, and the body
carries no path, key, filename or count drawn from the store.

## Verification

Against a store holding at least one real published site, issue requests for
each of the four cases and byte-compare the whole responses — status, headers
and body — pairwise, asserting they are identical. Assert the body contains no
filename or storage key drawn from the site that does exist.
