---
uid: acceptance_criterion-fc2b37b5
id: AC-732
type: acceptance_criterion
title: The fold carries the text pixel-mover families and populates the font resource
  table with painted families only
created_by: xgd
created_at: '2026-07-29T04:05:32.871377+00:00'
updated_at: '2026-08-09T08:19:43.758392+00:00'
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
A folded text leaf carries, alongside its typography axes, the text treatments the
capture recorded and the language expresses: gradient text fill, decoration line,
small-caps variant, list marker, and text shadow. Treatments the element does not
paint are omitted. Geometry-affecting treatments (rotation/scale, mask) are
deliberately not folded onto a leaf, because the pinned geometry is already
post-transform and folding them would apply the effect twice.

When the capture supplies font-face substance, the folded document's font resource
table binds only the families a folded text leaf actually paints — a supplied face
no text references is dropped from the table — so the reproduction resolves the
captured face rather than a fallback.

## Verification
Fold a capture whose runs carry a gradient fill, an underline, small-caps, a list
marker and a text shadow; assert each treatment appears on the corresponding leaf
and renders, and that re-folding the reproduction yields the same treatments. Fold a
capture supplying two font faces where only one family is painted; assert the
document's font table contains only the painted family.