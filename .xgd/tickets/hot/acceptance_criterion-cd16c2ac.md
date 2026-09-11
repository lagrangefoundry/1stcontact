---
uid: acceptance_criterion-cd16c2ac
id: AC-1662
type: acceptance_criterion
title: Bringing the index up to date is incremental, and the new document is retrievable
  from that pass alone
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:44.185651+00:00'
updated_at: '2026-09-11T03:30:44.185651+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Bringing an account's index up to date is incremental, and the newly added
document is retrievable immediately from that pass alone. Starting from an index
covering N documents, adding one and refreshing embeds exactly one document and
keeps the other N; refreshing again over an unchanged corpus embeds none and
keeps all of them; and a search for the new document's content returns it right
after the pass that added it.

This is what makes indexing affordable on every write rather than on a cadence,
and it is the whole reason a client's upload can be searchable the moment it
arrives.

## Verification

With a counting model seam, record two documents and refresh: assert two
documents indexed and two embeddings computed. Record a third and refresh: assert
three documents, one embedding computed, two kept — measured by the model's own
call count rather than by a returned tally. Search for the third document's
content and assert it is returned. Refresh once more with nothing changed and
assert no embeddings were computed and all three were kept.
