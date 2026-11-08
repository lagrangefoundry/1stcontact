---
uid: acceptance_criterion-23020204
id: AC-2403
type: acceptance_criterion
title: measure_drawing reports every relation the drawing records in comments, with
  its current delta
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:53.025423+00:00'
updated_at: '2026-11-08T07:26:20.387235+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
A drawing may record a relation as an SVG comment of the form `<node>.<anchor> = <node>.<anchor>`, optionally followed by `+`/`-` and a number. Such a drawing is accepted by `write_image` unchanged. `measure_drawing` returns a `recorded` list with one entry per recorded relation: the relation text, its current residual `delta`, and `holds` (true when the residual is within 0.05 units). A recorded relation that cannot be evaluated appears with a `why` reason instead. A drawing with no recorded relations returns an empty `recorded` list.

## Verification
Write a drawing containing `<!-- #ord.cap-top = #one.cap-top -->`. Change `#ord`'s font-size, then measure, and assert the recorded entry shows a non-zero delta with holds=false.