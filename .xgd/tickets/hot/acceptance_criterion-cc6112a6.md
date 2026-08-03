---
uid: acceptance_criterion-cc6112a6
id: AC-756
type: acceptance_criterion
title: No surface box is outset by padding its captured box already includes, and
  none is inferred
created_by: xgd
created_at: '2026-08-03T00:59:12.769059+00:00'
updated_at: '2026-08-03T00:59:12.769059+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
No folded surface box is outset by padding that its source box already includes. The
captured box is a border box, so a control whose padding the capture already recorded
folds at its captured height and width at every sampled width — never at twice its
height, and never bleeding past the viewport edges at the narrowest width.

Nor is any padding inferred: a single scalar derived from one width's row height is
never applied on all four sides, and never derived at the widest sample and replayed
at every narrower one. Where geometry genuinely requires a padding term it is read per
edge from that edge's own captured padding — never a vertical sum applied
horizontally.

## Verification
Fold a capture of padded controls whose captured boxes are known at every width;
assert each folded surface box matches the captured box within the gate's tolerance at
every sampled width, including the narrowest, where it must stay inside the viewport.
Assert that a card whose surface the capture did not resolve gains no padding at all,
and render a control to assert it paints at its captured size.
