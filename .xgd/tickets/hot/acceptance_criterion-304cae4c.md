---
uid: acceptance_criterion-304cae4c
id: AC-691
type: acceptance_criterion
title: Each folded node carries a geometry keyframe per sampled width matching the
  captured box
created_by: xgd
created_at: '2026-07-22T19:42:27.611238+00:00'
updated_at: '2026-08-07T23:53:44.215658+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
Each folded node carries a geometry keyframe at every sampled width it is present
at, and each keyframe's position and width equal the node's captured box at that
width (within integer rounding). A box, image or backing-surface leaf additionally
pins its height at every keyframe, because its extent is not derivable from its
content; a text leaf's keyframes carry no height, leaving its height natural from
flow. A node's authored typography axes are taken from its widest present sample
(the desktop rendering).

## Verification
Fold a fixture capture; for a chosen text node, assert its keyframe widths equal
the sampled ladder, each keyframe's x/y/width equal the captured box at that width,
and no keyframe carries a height. For a folded image leaf and a folded box leaf,
assert every keyframe carries a height equal to the captured box height. Assert the
node's typography axes match the widest sampled cell.