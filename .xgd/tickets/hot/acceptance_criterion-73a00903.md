---
uid: acceptance_criterion-73a00903
id: AC-628
type: acceptance_criterion
title: List items hold child blocks, supporting nested lists and multiple paragraphs
created_by: xgd
created_at: '2026-07-13T21:01:02.258650+00:00'
updated_at: '2026-07-13T21:01:02.258650+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
A list item is a container of child blocks, so an item may nest a sub-list or span multiple paragraphs, and such items round-trip losslessly. A single-line item is represented as one paragraph block of one inherited run and still serializes to the compact `- text` (or ordered) single-line form.

## Verification
Round-trip a list item containing a nested list and a list item containing multiple paragraphs, asserting the nested block structure is reproduced; assert a single-line item still serializes as one line.
