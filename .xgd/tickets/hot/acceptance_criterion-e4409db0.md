---
uid: acceptance_criterion-e4409db0
id: AC-534
type: acceptance_criterion
title: Repeated identical texts pair in document order (FIFO)
created_by: xgd
created_at: '2026-07-09T22:59:35.787683+00:00'
updated_at: '2026-07-09T22:59:35.787683+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When several elements share the same text, each reference occurrence pairs with the actual occurrence at the same document-order position (first-in, first-out), so per-occurrence styling deltas are attributed to the correct occurrence rather than collapsing all identical texts to one.

## Verification
Diff a reference and draft that each contain the same text multiple times with differing per-occurrence styling; assert each occurrence's delta reflects its own position's values.
