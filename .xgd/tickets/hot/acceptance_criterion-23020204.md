---
uid: acceptance_criterion-23020204
id: AC-2403
type: acceptance_criterion
title: measure_drawing reports every well-formed relation the drawing records in comments,
  with its current delta
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:53.025423+00:00'
updated_at: '2026-11-08T10:12:59.733116+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
A drawing may record a relation as an SVG comment of the form `<node>.<anchor> = <node>.<anchor>`, optionally followed by `+`/`-` and a number. Such a drawing is accepted by `write_image` unchanged. `measure_drawing` returns a `recorded` list with one entry per recorded relation, in document order: the relation text, its current residual `delta`, and `holds` (true when the residual is within 0.05 units). A recorded relation whose node cannot be found appears with a `why` reason instead. A drawing with no recorded relations returns an empty `recorded` list.

A comment is a recorded relation only when both sides parse as `<node>.<anchor>` with an anchor from the closed set (AC-2393). A relation-shaped comment with a misspelt anchor (e.g. `<!-- #ord.cap-tip = #one.cap-top -->`) is an ordinary comment. It stays in the stored drawing but is not reported in `recorded`, and no `why` is given for it. This differs from `assert`, where every stated entry comes back. (Narrowed at reconciliation; see the story's Reconciliation Decisions.)

## Verification
Write a drawing containing `<!-- #ord.cap-top = #one.cap-top -->`, `<!-- #gone.top = #one.top + 2 -->` and a plain note. Assert the stored bytes are unchanged and `recorded` holds the two relations: the first holding, the second with a `why` naming `#gone`. Change `#ord`'s font-size, then measure, and assert the recorded entry shows a non-zero delta with holds=false. Assert 0.04 off still holds, and a drawing with no comments has an empty list.

Write a drawing whose comments include `#ord.cap-tip = #one.cap-top` and `#ord.cap-top = #one.captop + 2` beside two well-formed relations. Assert the drawing is stored unchanged, and both `recordedRelations` and `measure_drawing`'s `recorded` list only the two well-formed relations, in order, with nothing for the misspelt ones.
