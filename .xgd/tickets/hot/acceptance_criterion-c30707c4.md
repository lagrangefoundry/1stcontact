---
uid: acceptance_criterion-c30707c4
id: AC-774
type: acceptance_criterion
title: A split text+box control compares its shape, border and surface geometry against
  the bearing box
created_by: xgd
created_at: '2026-08-03T02:28:32.414332+00:00'
updated_at: '2026-08-03T02:28:32.414332+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
Where the reference represents a control as ONE node (a button carrying its label, fill and rounding together) and the reproduction represents the same control as TWO nodes (a text leaf for the label plus a sibling box that paints the surface), the control's **radius, shadow, border and the surface's geometry** are compared against the box that actually bears the surface, not against the label.

The capture records, for each element, which box paints the surface behind it — its rect, corner radius, shadow and border — together with whether that box is the element's own. The resolution fires only where the two sides genuinely disagree about node identity (reference self-painting, reproduction not), so:
- a control whose backing box carries the reference's radius reports **no** shape delta (previously a phantom `radius 8px → 0px`, classified as a top-priority "copy this value" repair that was a no-op);
- the backing box's geometry is compared against the reference control's box, so a reproduction painting that control at twice the reference height **is** reported (previously invisible, while the phantom stood in front of it);
- a reproduction whose backing box genuinely lost the rounding still reports the shape defect;
- a control that paints its own surface on both sides keeps the own-axis comparison unchanged;
- an ordinary run sitting on its band gains no surface-geometry rows (no per-run band noise);
- a bundle captured before the surface-bearing box was recorded produces no new deltas.

## Verification
Diff a reference control captured as one node (label + fill + radius 8 + a 123×50 box) against a reproduction folding it as a 123-wide label plus a 173×100 sibling backing box carrying the fill and radius. Assert: no shape delta; a surface-geometry (size) delta naming the reference and reproduction surface rects. Repeat with a square backing box (assert the shape delta returns), with both sides self-painting (assert unchanged own-axis comparison), with an ordinary band run (assert no surface-geometry rows), and with a manifest lacking the surface-bearing record (assert inert).
