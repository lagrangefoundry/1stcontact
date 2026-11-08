---
uid: acceptance_criterion-982d600d
id: AC-2446
type: acceptance_criterion
title: 'A one-element run array is refused: the plain string is the only spelling
  of single-run copy'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:26.404229+00:00'
updated_at: '2026-11-08T13:51:40.997047+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
A text node whose `text` is an array containing exactly one run fails validation, whether or not that run has axes. An empty array also fails. A two-run array validates.

## Verification
Validate documents with `text: [{ text: "x" }]`, `text: [{ text: "x", axes: { fontWeight: 700 } }]` and `text: []`; assert all fail. Validate a two-run array; assert it passes.