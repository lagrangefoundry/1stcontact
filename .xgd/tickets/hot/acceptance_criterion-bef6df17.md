---
uid: acceptance_criterion-bef6df17
id: AC-1126
type: acceptance_criterion
title: An adjustment at its identity emits nothing, and the identity differs per function
created_by: xgd
created_at: '2026-08-12T21:12:45.323080+00:00'
updated_at: '2026-08-12T21:23:00.814432+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A colour-adjustment function sitting at **its own identity emits nothing**: it
costs a compositing layer and moves no pixel, so the published page carries no
declaration for it. When every declared function is at its identity, no
adjustment declaration is emitted at all.

**The identity differs per function, and one rule for all of them would be
wrong.** For the scaling adjustments — saturation, brightness, contrast — the
no-op is *one* and *zero* is the extreme: zero saturation is a fully desaturated
surface. For the remaining adjustments — greyscale, sepia, invert, hue shift and
the node's own blur — the no-op is *zero* and *one* (or a non-zero angle or
length) is the extreme. A single "skip the zero" or "skip the one" rule would
therefore silently discard half of them: a fully desaturated photograph would
emit no adjustment and publish in full colour, which is a failure that reports
nothing and looks like the picture simply not having been adjusted.

The consequence is that an adjusted surface and an unadjusted one **never
collapse to the same output**. Every declared value that is not its own
function's identity reaches the page, and every value that is its own function's
identity does not.

## Verification
Render a node declaring each adjustment at its identity in turn and assert no
declaration is emitted for it; render the same node with every function at its
identity and assert no adjustment declaration is emitted at all. Then render the
opposing extreme of each function — a fully desaturated surface, a fully
greyscale one — and assert each is present in the emitted output, confirming the
skip rule is per-function rather than one constant applied to all.