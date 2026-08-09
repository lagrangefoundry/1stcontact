---
uid: acceptance_criterion-70f63c60
id: AC-730
type: acceptance_criterion
title: A text-free element that paints a standalone surface folds to a box leaf
created_by: xgd
created_at: '2026-07-29T04:05:06.541745+00:00'
updated_at: '2026-08-09T08:19:41.820693+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A text-free element that is not media and not a form control, but that paints a
standalone surface (a fill, a gradient, a border, a shadow, a rounded corner, a
partial opacity, a backdrop blur or a blend mode), folds to an L1 box leaf carrying
those surface axes and a geometry track pinning all four sides at every present
sampled width, plus a stable identifier and its visibility rule. Axes the element
does not paint are omitted rather than emitted at their default.

## Verification
Fold a capture containing a decorative panel/divider that carries no text; assert a
box leaf is emitted with the captured fill/gradient/border/radius/opacity/backdrop-
blur/blend axes and a height-bearing keyframe at each present width; render it and
assert the surface paints.