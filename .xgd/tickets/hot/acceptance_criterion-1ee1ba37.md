---
uid: acceptance_criterion-1ee1ba37
id: AC-2404
type: acceptance_criterion
title: write_image with an assert block always writes, then reports each stated relation's
  delta against the written drawing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:53.786795+00:00'
updated_at: '2026-11-08T07:26:20.149464+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`write_image` accepts an optional `assert` list of relation strings (`<node>.<anchor> = <node>.<anchor>`, optionally `+`/`-` n). The drawing is written whether or not the relations hold; an assertion never blocks or refuses a write. The response adds an `asserted` list with one entry per stated relation, in order. Each entry carries the relation text and either a `delta` with `holds` (true iff the residual's magnitude is ≤ 0.05), or a `why` explaining why it could not be evaluated. The `why` case covers a string that is not a relation, a misspelt anchor and a missing node. No stated relation is dropped. Evaluation measures the drawing as written, not the input as passed.

## Verification
Write a drawing with `assert` stating a relation it does not satisfy, plus one malformed string. Assert the drawing is stored, the first entry has a non-zero delta with holds=false, and the second has a `why`.