---
uid: acceptance_criterion-fe3aef27
id: AC-2399
type: acceptance_criterion
title: relate returns one signed delta (b minus a) and its axis, and refuses anchors
  on different axes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:50.051853+00:00'
updated_at: '2026-11-08T07:26:21.296027+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`relate(a, b)` with two anchor references on the same axis returns both resolved anchors, the axis, and `delta` = value(b) − value(a), rounded to 3 decimal places. Zero means the two lines coincide, and a positive delta means b lies past a. Two anchors on different axes (e.g. `#a.top` with `#b.left`) are refused with a message about the axis mismatch, and no number is returned.

## Verification
Relate two measured nodes' `cap-top`s and check the sign and value against their measured lines. Relate `#a.top` to `#b.left` and assert a refusal.