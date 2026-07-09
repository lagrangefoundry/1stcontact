---
uid: acceptance_criterion-bbe7bdf3
id: AC-479
type: acceptance_criterion
title: Color and gradient backgrounds render their fill; no overlay is emitted when
  none is declared
created_by: xgd
created_at: '2026-07-09T20:34:44.623289+00:00'
updated_at: '2026-07-09T20:34:44.623289+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A **color** background renders a background layer with a solid fill of the declared hex color. A **gradient** background renders a background layer painting the declared gradient. When a background declares no overlay, no overlay layer is present in the rendered output (only the background and content layers appear).

## Verification
Render a module with a color background and assert the output paints the declared color as a fill. Render a module with a gradient background and assert the output paints the declared gradient. For a background with no overlay, assert no overlay layer is present in the rendered markup.
