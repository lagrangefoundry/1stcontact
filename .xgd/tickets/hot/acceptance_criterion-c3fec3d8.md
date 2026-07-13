---
uid: acceptance_criterion-c3fec3d8
id: AC-610
type: acceptance_criterion
title: Theme badge subscale drives every badge label's rendered type
created_by: xgd
created_at: '2026-07-13T20:48:40.248421+00:00'
updated_at: '2026-07-13T20:57:03.942446+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
Changing the theme's `badge` subscale (any of its axes: font size, weight, line-height, letter-spacing, family, colour) changes the type applied to every rendered badge label across the site, with no per-instance authoring. When the badge subscale is left at its default, badge labels render with the framework's baseline badge type (the previously hard-coded services-grid values), so existing sites are unchanged. Only axes the subscale actually sets take effect; unset axes fall through to the inherited/baseline value.

## Verification
Render (or emit the type declarations for) the services-grid badge with two different theme `badge` subscales and confirm the applied size/weight/line-height/letter-spacing change to match the subscale; confirm the default subscale reproduces the baseline badge type.