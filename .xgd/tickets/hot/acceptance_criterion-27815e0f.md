---
uid: acceptance_criterion-27815e0f
id: AC-905
type: acceptance_criterion
title: Only snapshots the site's deploy index references are servable; an orphaned
  snapshot is unreachable
created_by: xgd
created_at: '2026-08-06T18:48:54.054985+00:00'
updated_at: '2026-08-07T22:31:15.981373+00:00'
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

Servability is gated twice, in order: the store tree first, then the site's
deploy index. The tree gate is AC-927's criterion and is proven there — this
criterion assumes it and governs only what happens *within* the one servable
tree, where the tree is settled before the index is consulted at all.

Within the servable tree the index, not the storage key space, is the authority.
A snapshot whose bytes are in storage but which the index does not reference — an
interrupted upload, or one an operator has unlinked without sweeping — is not
reachable at any URL. Correspondingly, an identifier taken from the requested URL
is only ever used to look the snapshot up in the index; the location actually read
is composed of the fixed servable tree and the value the index records, so no part
of the request can name stored bytes the index has not vouched for.

## Verification

Place snapshot bytes in storage without an index entry referencing them and
assert that a request for their would-be address returns not-found while an
indexed snapshot for the same site still serves. Unlink a previously indexed
preview from the index and assert its URL stops serving even though its bytes
remain. Assert that requests whose identifier differs from any indexed entry
return not-found rather than reading any stored location. All three are exercised
inside the servable tree; that a complete index in the *other* tree grants no
reachability is AC-927's assertion and is not repeated here.