---
uid: acceptance_criterion-a454df9b
id: AC-1668
type: acceptance_criterion
title: Material written is searchable by the time the write notification returns
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:37.296723+00:00'
updated_at: '2026-09-11T03:47:37.296723+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

When the client's knowledge base is told that material, a captured reference or a
brief has been written, the new document is searchable **by the time that
notification returns** — not after a later pass, a schedule, or the map rebuild
it also triggers.

The notification reports what the index pass did: how many documents the corpus
now holds, and how many of them needed embedding.

## Verification

In a client account holding some already-indexed material, add a new material
document with distinctive content. Await the material-written notification, then
— before releasing or awaiting anything else it may have started — search the
client's knowledge for a phrase that appears only in the new document and assert
it is among the hits. Assert the notification's reported document count includes
the new document.
