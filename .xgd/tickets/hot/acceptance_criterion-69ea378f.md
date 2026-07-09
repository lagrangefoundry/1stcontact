---
uid: acceptance_criterion-69ea378f
id: AC-481
type: acceptance_criterion
title: Structural background layer CSS is folded into the per-site stylesheet
created_by: xgd
created_at: '2026-07-09T20:34:53.119345+00:00'
updated_at: '2026-07-09T20:34:53.119345+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
The shared structural rules that position and stack a background's layers (background, overlay, content) are included in the rendered site's stylesheet, rather than repeated inline per module. A rendered site that uses at least one background produces a stylesheet containing the section-layering rules.

## Verification
Render a site whose page uses a background and read the generated per-site stylesheet. Assert it contains the structural rules that stack the background layers (e.g. the content-layer positioning rule), confirming the layering applies without per-module CSS.
