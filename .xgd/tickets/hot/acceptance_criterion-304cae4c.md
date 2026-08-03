---
uid: acceptance_criterion-304cae4c
id: AC-691
type: acceptance_criterion
title: Each folded node carries a geometry keyframe per sampled width matching the
  captured box
created_by: xgd
created_at: '2026-07-22T19:42:27.611238+00:00'
updated_at: '2026-08-03T02:07:17.808873+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Each folded node carries a geometry keyframe at every sampled width it is present
at, and each keyframe resolves to the node's captured box at that width (within
integer rounding). A box, image or backing-surface leaf additionally pins its
height at every keyframe, because its extent is not derivable from its content; a
text leaf's keyframes carry no height, leaving its height natural from flow.

A keyframe's position and width need not be a literal absolute value: where the
ladder's evidence supports it, a node's `x` and `width` may instead be expressed
against the document's centred column, and a keyframe's extent may carry a
viewport-height response measured against the height that keyframe was captured
at. Whichever form is used, the node still resolves to its captured box at every
sampled width — the closed-form expressions are alternative statements of the same
measured geometry, never an approximation of it.

A node's authored axes are taken from its widest present sample (the desktop
rendering) for every axis that holds one value across the ladder; a numeric type
axis or padding side that varies is carried as a per-width track instead, so no
axis is silently pinned to the widest sample's value.

## Verification
Fold a fixture capture; for a chosen text node, assert its keyframe widths equal
the sampled ladder, each keyframe's x/y/width equal the captured box at that width,
and no keyframe carries a height. For a folded image leaf and a folded box leaf,
assert every keyframe carries a height equal to the captured box height. Assert an
invariant typography axis matches the widest sampled cell. Fold a capture whose
content sits in a centred column and one containing a viewport-height block, and
assert that every node still evaluates to its captured box at every sampled width
despite being expressed against the column or the height response.
