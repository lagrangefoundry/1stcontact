---
uid: acceptance_criterion-3db47b92
id: AC-1302
type: acceptance_criterion
title: A passage search returns a section of a document and says which document it
  came from
created_by: xgd
created_at: '2026-08-20T04:16:59.451391+00:00'
updated_at: '2026-08-20T04:37:24.302104+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Searching for a passage returns a **section** of a document rather than a whole document, and each result says which document it came from, so a citation resolves back to a source. A design document is far too coarse a unit to hand back as an answer; this is what makes a corpus of real documents answerable.

## Verification

Search the built passage index with a question whose answer lies in one section of one document; assert at least one result comes back, that a result is a passage rather than the whole document, and that its identity carries the parent document's identity so the source is recoverable.