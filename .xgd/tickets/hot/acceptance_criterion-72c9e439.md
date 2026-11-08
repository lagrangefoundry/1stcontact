---
uid: acceptance_criterion-72c9e439
id: AC-2433
type: acceptance_criterion
title: Scrim, placement and panel paint come from the document
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:15.731937+00:00'
updated_at: '2026-11-08T13:09:15.731937+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
In the rendered stylesheet, the scrim colour and opacity are the document `backdrop` values, and the panel position in the covered viewport follows `placement`: `center` (the default when absent), `top` or `bottom`. The panel fill, radius, padding and width come from its own L1 axes. A dialog with no `backdrop` paints no scrim. None of these values appear in any module stylesheet. Two covered-viewport obligations always hold: the shell scrolls when the panel is taller than the viewport, and the panel does not shrink to fit.

## Verification
Render panels with different backdrop colours and opacities and each placement. Assert the stylesheet carries those values and the matching alignment, and that a backdrop-less panel produces no scrim paint. Assert the shell rule permits vertical scrolling and the panel rule prevents shrinking.