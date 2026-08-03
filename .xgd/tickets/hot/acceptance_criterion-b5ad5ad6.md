---
uid: acceptance_criterion-b5ad5ad6
id: AC-745
type: acceptance_criterion
title: Each run records the box that bears its surface, with that box's rect, radius,
  shadow and border
created_by: xgd
created_at: '2026-08-03T00:24:54.571913+00:00'
updated_at: '2026-08-03T00:24:54.571913+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Alongside the composited surface colour, a run records the single box that
actually PAINTS that surface, as: the bearing box's own rect, its corner radius,
its shadow, its border (width, colour and line style when painted), and whether
the bearing box is the run's own element or a different box.

When nothing paints behind the run, no bearing box is recorded.

## Verification
Extract values from a page representing a control conventionally (one element
carrying both the label and the rounded fill): a bearing box is recorded, flagged
as the run's own element, with the control's rect and radius. Extract from a flat
page representing the same control as a label plus a separate backing box: a
bearing box is recorded, flagged as NOT the run's own element, carrying the
backing box's rect and radius. Extract a run sitting directly on an unpainted
region: no bearing box is recorded.
