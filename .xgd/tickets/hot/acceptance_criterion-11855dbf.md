---
uid: acceptance_criterion-11855dbf
id: AC-1680
type: acceptance_criterion
title: One account's ingested material is invisible to another account's listing and
  search
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:44.466188+00:00'
updated_at: '2026-09-11T04:07:44.466188+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

Material created by one account's ingestion is invisible to another account — both as a
record and as something searchable.

After an upload made in the context of one account:

- a search performed in the context of that account returns the new material;
- a search performed in the context of a second account, after that account's own index has
  been brought up to date, does not return it, and the second account's listing of its
  material does not contain it.

## Verification

Ingest a file whose text is distinctive while scoped to one account. Search in that account's
context and assert the new material is among the hits. Then, in a second account's context,
refresh that account's index and search for the same distinctive text, asserting the material
is absent; assert likewise that it does not appear in the second account's material listing.
Both halves are required: an isolation claim proved only over stored records would miss a
shared index, and one proved only over search would miss a shared listing.
