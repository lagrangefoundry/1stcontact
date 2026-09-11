---
uid: acceptance_criterion-a060a56b
id: AC-1637
type: acceptance_criterion
title: Each corpus producer removes only what it no longer produces, and never the
  other's documents
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:40.807615+00:00'
updated_at: '2026-09-11T02:51:27.221001+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The two corpus producers share one directory and each removes only what it itself
no longer produces. A generated reference that is no longer generated is deleted
when the references are regenerated; a document whose source ticket has been
withdrawn is deleted when the tickets are exported; and neither run deletes the
other's live output, in either order.

Getting this wrong in either direction rots the corpus: a stale file that is
spared stays searchable and confidently wrong forever, and a live file that is
swept leaves the assistant silently missing part of what it knows.

## Verification

In a corpus that already holds the current generated references and current
exported documents, plant two stale files — one in the generated namespace that
no source produces, and one exported document whose ticket no longer exists.
Regenerate the references and export the tickets, in either order. Each run
reports removing exactly its own stale file and no other; both stale files are
gone from the directory; and every current generated reference and every current
exported document is still present.