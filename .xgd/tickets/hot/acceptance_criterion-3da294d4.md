---
uid: acceptance_criterion-3da294d4
id: AC-1670
type: acceptance_criterion
title: One map per client knowledge base, recycled in place by every rebuild
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:44.795677+00:00'
updated_at: '2026-09-11T03:47:44.795677+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

A client's knowledge base has exactly **one** published map, and a rebuild
recycles it in place: the record's content is replaced wholesale and its identity
is unchanged, so anything holding a reference to the map keeps pointing at the
current one.

A rebuild reports the identity of the map it published, and that is the same
identity a subsequent read of the client's published map returns. A second
rebuild does not produce a second map.

The map declares itself machine-generated and not to be hand-edited, since it is
regenerated rather than patched.

## Verification

In a client account, build and publish a map, recording its identity and content.
Read the published map back and assert the identity matches what the rebuild
reported. Change the corpus (add a document), rebuild, and assert: the reported
identity is unchanged; the published map's content reflects the new corpus; and
the client's store holds exactly one such map record. Assert the map's text
states that it is machine-generated and must not be hand-edited.
