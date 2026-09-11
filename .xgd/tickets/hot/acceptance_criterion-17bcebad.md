---
uid: acceptance_criterion-17bcebad
id: AC-1676
type: acceptance_criterion
title: Above the floor with no describer, the rebuild refuses by name and the previous
  map stands
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:56.033029+00:00'
updated_at: '2026-09-11T04:01:56.165743+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

When a client's corpus has outgrown the listing budget and no describer is
available to the host, building the landscape **refuses**, and the refusal names
what is missing: that the corpus is now past the listing budget, that its
landscape therefore has to be clustered and described, that no describer was
supplied, and where one has to come from.

The previously published map stands: a refusal publishes nothing and replaces
nothing. Where a map had been published it is still the map that is read back;
where none had been, none appears.

## Verification

Open a client knowledge base with a listing budget of zero so any corpus is above
the floor, add documents, and build the landscape with no describer supplied.
Assert the operation fails with a refusal identifying the missing describer, and
that reading the published map afterwards yields nothing. Repeat the refusal in an
account whose map had previously been published, and assert the published map's
content is unchanged after the refusal.