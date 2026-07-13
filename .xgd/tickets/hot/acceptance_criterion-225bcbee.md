---
uid: acceptance_criterion-225bcbee
id: AC-613
type: acceptance_criterion
title: Per-instance style overrides the theme subscale for a single card only
created_by: xgd
created_at: '2026-07-13T20:49:17.083488+00:00'
updated_at: '2026-07-13T20:57:03.633122+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
A single services-grid card may carry a per-instance badge label style and/or checklist item style (a style-only run using the same style axes as a subscale). When present, that card's badge label / checklist items render with the per-instance values, overriding the theme subscale, while every other card on the same page continues to render from the theme subscale. A card with no per-instance style follows the theme subscale unchanged. A per-instance style is accepted as valid module content.

## Verification
Render a services grid where one card sets a badge label style (or checklist item style) and another does not; confirm the styled card reflects the override values and the unstyled card reflects the theme subscale; confirm the per-instance style validates as content.