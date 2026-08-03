---
uid: acceptance_criterion-f15b6285
id: AC-785
type: acceptance_criterion
title: Controls cluster into the forms they visibly belong to, separating side-by-side
  forms at the widest sampled width
created_by: xgd
created_at: '2026-08-03T03:20:49.799271+00:00'
updated_at: '2026-08-03T03:33:07.970156+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

Captured controls are grouped into forms by how near their painted rects sit at
the widest sampled width, using a proximity scale derived from the controls' own
size rather than a fixed pixel constant. Two forms standing in adjacent columns —
whose controls overlap vertically and are therefore as close in vertical distance
as one form's own fields — are recovered as two separate groups, not one. Groups
come back ordered by position, topmost first and then left to right, and each
group's fields are ordered the same way.

## Verification

Cluster a set of captured control rects taken from a page with a single-field
signup beside a three-field contact column and assert two groups come back with
the expected member counts, in the expected order, each group containing exactly
the controls of its own form. Fold the real multi-form capture and assert the
same split with the correct field labels per group.