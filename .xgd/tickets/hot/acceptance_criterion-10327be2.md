---
uid: acceptance_criterion-10327be2
id: AC-607
type: acceptance_criterion
title: rowWidth boxes a grouped multi-column row via the same scale and literal hatch
created_by: xgd
created_at: '2026-07-13T20:38:10.081914+00:00'
updated_at: '2026-07-13T20:44:28.514317+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: false
---

## Criterion
A grouped multi-column row honors a `rowWidth` value using the same width vocabulary as `contentWidth`: a named step caps the grouped row to that step's measure, and a literal (a px number or a CSS length string) caps it to exactly that value. For example, a row whose columns carry `rowWidth: "3xl"` is boxed to the 3xl (768px) measure, and `rowWidth: 896` boxes it to 896px.

## Verification
Compose a grouped row with `rowWidth: "3xl"` and confirm the row is boxed to the 3xl measure; compose one with `rowWidth: 896` and confirm it is boxed to 896px.