---
uid: acceptance_criterion-2a3444fc
id: AC-611
type: acceptance_criterion
title: Theme checklist subscale drives every checklist item's rendered type
created_by: xgd
created_at: '2026-07-13T20:48:42.961109+00:00'
updated_at: '2026-07-13T20:48:42.961109+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
Changing the theme's `checklist` subscale (including its line-height / leading) changes the type applied to every rendered checklist item across the site, with no per-instance authoring. When left at its default, checklist items render with the framework's baseline checklist type. Only the axes the subscale sets take effect.

## Verification
Render (or emit the type declarations for) the services-grid checklist with two different theme `checklist` subscales and confirm the applied leading/size/weight change to match; confirm the default reproduces the baseline.
