---
uid: acceptance_criterion-fc87f616
id: AC-906
type: acceptance_criterion
title: Not-found is plain, never a listing, and never distinguishes an unknown site
  from an unpublished one
created_by: xgd
created_at: '2026-08-06T18:48:58.619787+00:00'
updated_at: '2026-08-07T22:18:22.069397+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request naming an unknown site, a known site with nothing published, a preview
identifier that names no snapshot, or a path that names no object within an
existing snapshot all return the same not-found status with the same plain
text-typed body. The response never enumerates what does exist at or beneath the
requested path, and a stranger cannot learn from it whether a site exists.

Two of these cases are addressed on the published channel (the unknown site, the
site with nothing published) and the others on the preview channel, and the two
channels differ in exactly one response header: the no-index directive AC-910
requires on *every* preview-channel response, its not-found included. That
difference is not an existence oracle — the channel is chosen by the URL the
requester wrote, not revealed by what the store contains — so any probe that
compares one site against another stays within a single channel. Within a
channel, therefore, the not-found responses are indistinguishable in status,
headers and body alike.

## Verification

Issue requests for each of the four cases against a store containing at least
one real site and assert an identical not-found status and identical plain
text-typed body for all of them. Byte-compare whole responses — status, headers
and body — pairwise *within* each channel: the unknown site against the site
with nothing published on the published channel, and the unknown preview
identifier against a missing object inside a real snapshot on the preview
channel. Assert that the only header by which a preview-channel not-found
differs from a published-channel one is AC-910's no-index directive. Assert the
body contains no path, key, filename or count drawn from the store, and that
requesting a directory-shaped path inside a snapshot returns not-found rather
than a list of its entries.