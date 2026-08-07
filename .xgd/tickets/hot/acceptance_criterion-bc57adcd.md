---
uid: acceptance_criterion-bc57adcd
id: AC-734
type: acceptance_criterion
title: Analytic evaluator tiles a flex row along the main axis; a well-formed row
  raises no overflow
created_by: xgd
created_at: '2026-07-29T04:19:39.574581+00:00'
updated_at: '2026-08-07T23:54:16.804961+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Evaluating a document at a width lays a row container out as the renderer does:
its in-flow children sit **side by side** along the main axis, each taking its own
main-axis width, and the row's height is that of its tallest child.

- A child that declares a fixed width (clamped to any declared min/max) takes that
  width; the remaining children share the leftover main-axis extent equally, after the
  container's gaps are deducted.
- The cursor advances by each child's own width plus the gap, so a row of N children
  spans its parent's width once — not N times.
- A well-formed row therefore raises **no** envelope finding: no sibling overlap
  between its children and no horizontal clip beyond the viewport.
- Fixed widths that genuinely exceed the available extent still surface as a horizontal
  clip; the flexible children collapse to zero width rather than masking it.
- Column/stack containers and boxes are unaffected: children fill the width and stack
  vertically. A grid container is modelled conservatively as a stack.

## Verification
Evaluate a document containing a row container of three geometry-free children inside a
known viewport and assert the three leaf boxes tile the parent (each roughly one third
of the gap-adjusted width, at ascending x, no two overlapping), that the row's resolved
height equals its tallest child, and that the evaluation reports no findings. Repeat with
one child declaring a fixed width and assert it keeps that width while the others share
the remainder. Give the row children fixed widths summing beyond the viewport and assert
a horizontal-clip finding is reported. Evaluate the equivalent stack container and assert
the children stack vertically at full width with no findings.