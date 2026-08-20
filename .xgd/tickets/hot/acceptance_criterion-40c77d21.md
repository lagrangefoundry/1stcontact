---
uid: acceptance_criterion-40c77d21
id: AC-1298
type: acceptance_criterion
title: A document that leaves the knowledge base is deleted from the corpus and stops
  being searchable
created_by: xgd
created_at: '2026-08-20T04:16:48.552286+00:00'
updated_at: '2026-08-20T04:37:25.915399+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A document that leaves the knowledge base is **deleted** from the corpus, not merely left unrefreshed — so it stops being searchable rather than becoming quietly stale. This holds for both ways of leaving:

- its ticket no longer exists
- it still exists but has opted back out

Both travel the same path and both are reported as removals by name. The generated map is never treated as a departed document and is never swept away by an export.

## Verification

Export, then place in the corpus a document with no corresponding opted-in ticket, then export again; assert the second export reports that file as removed and that the file is gone from the directory. Repeat for a document that had been in and is no longer opted in. Assert that an export run over a corpus that already contains a generated map leaves the map in place.