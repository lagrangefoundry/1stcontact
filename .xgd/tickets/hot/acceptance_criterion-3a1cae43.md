---
uid: acceptance_criterion-3a1cae43
id: AC-717
type: acceptance_criterion
title: Per-viewport value variation is delivered by L1 geometry keyframes
created_by: xgd
created_at: '2026-07-22T20:33:17.812093+00:00'
updated_at: '2026-07-22T20:33:17.812093+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
An L1 document declares a node's geometry as per-viewport **keyframes** — an ascending-by-width track of `{ at, x, y, width, height? }` values — together with per-segment **`interpolate|snap`** flags (one per adjacent keyframe pair). The published page varies that geometry per viewport width accordingly: an `interpolate` segment produces a value that changes continuously across the width band between its two keyframes, and a `snap` segment holds the lower keyframe's value until the upper keyframe's width, then jumps. Per-viewport variation is carried by this L1 substrate, not by per-breakpoint module dials (which no longer exist).

## Verification
Author an L1 document with a node whose width keyframes differ across the sampled widths — one segment marked `interpolate`, one marked `snap` — render it, and observe the rendered/computed width at representative widths: the interpolated band changes continuously between its endpoints while the snapped band holds then jumps at the keyframe boundary.
