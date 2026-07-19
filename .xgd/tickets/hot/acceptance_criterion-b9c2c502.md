---
uid: acceptance_criterion-b9c2c502
id: AC-674
type: acceptance_criterion
title: services-grid cardVeil paints a translucent white fill at the chosen opacity;
  none keeps the solid surface
created_by: xgd
created_at: '2026-07-19T03:34:42.772838+00:00'
updated_at: '2026-07-19T03:34:42.772838+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a services-grid is authored with `cardVeil` set to an opacity step (one of 40, 50, 60, 70, 80, 90), each rendered card's background is a translucent white fill at that opacity (e.g. `cardVeil: 60` yields `rgba(255,255,255,0.6)`), composited over the section band rather than the opaque section surface colour. With `cardVeil` unset or `none` (the default), cards keep the solid surface fill and no translucent white overlay is applied.

## Verification
Render a services-grid page with a non-default section surface and `cardVeil` at a chosen step; inspect the published card's computed/authored background and confirm it is the translucent white value at the matching opacity. Render the same grid with `cardVeil` omitted and confirm the card background is the solid surface with no translucent overlay.
