---
uid: acceptance_criterion-7e9460cf
id: AC-1771
type: acceptance_criterion
title: A bundle's members are enumerable and narrowable by prefix, sorted and forward-slashed
  identically on every backing
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:24.497466+00:00'
updated_at: '2026-09-14T05:00:55.453249+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
A bundle can be asked which members it holds, and the answer is the same shape on
every backing:

- every written member key is returned, including the nested `assets/<name>` keys
- the keys are sorted
- the keys are forward-slashed regardless of the host operating system's path
  separator — a member key is a key inside the artifact, not a filesystem path,
  so two backings must not enumerate the same bundle differently
- the enumeration can be narrowed to a prefix, which is what lets the mirrored
  subresources be asked for on their own: narrowing to `assets/` returns exactly
  the subresources that were mirrored and nothing else, sorted

Enumerating mirrored subresources matters because a bundle's asset set is recorded
nowhere else, and offline re-extraction rewrites absolute URLs only for the
subresources the bundle actually holds.

## Verification
Write a bundle carrying the fixed members plus two mirrored subresources, on each
backing. Assert the full enumeration contains each fixed member key and is sorted;
assert narrowing to the asset prefix returns exactly the two subresource keys in
sorted order, forward-slashed.