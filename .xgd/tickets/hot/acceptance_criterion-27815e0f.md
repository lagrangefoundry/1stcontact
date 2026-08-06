---
uid: acceptance_criterion-27815e0f
id: AC-905
type: acceptance_criterion
title: Only snapshots the site's deploy index references are servable; an orphaned
  snapshot is unreachable
created_by: xgd
created_at: '2026-08-06T18:48:54.054985+00:00'
updated_at: '2026-08-06T18:59:31.500544+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

What is servable is determined by the site's deploy index, not by what happens
to be present in storage. A snapshot whose bytes are in storage but which the
index does not reference — an interrupted upload, or one an operator has
unlinked without sweeping — is not reachable at any URL. Correspondingly, an
identifier taken from the requested URL is only ever used to look the snapshot
up in the index; the location actually read is the one the index records, so no
part of the request can name stored bytes the index has not vouched for.

## Verification

Place snapshot bytes in storage without an index entry referencing them and
assert that a request for their would-be address returns not-found while an
indexed snapshot for the same site still serves. Unlink a previously indexed
preview from the index and assert its URL stops serving even though its bytes
remain. Assert that requests whose identifier differs from any indexed entry
return not-found rather than reading any stored location.