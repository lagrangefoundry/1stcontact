---
uid: acceptance_criterion-0acedec3
id: AC-801
type: acceptance_criterion
title: A painted, internally laid-out element is a single node
created_by: xgd
created_at: '2026-08-06T01:15:47.024695+00:00'
updated_at: '2026-08-08T00:42:21.988934+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A layout container carries the full painted surface — solid fill, surface
gradient, background image, scrim overlay, uniform border, left-accent border,
corner radius, drop shadow, backdrop blur, opacity and blend mode — and the
published page paints all of it **while the same element still lays out its
children** (stack / row / grid, gap, distribution, alignment).

A painted, internally laid-out element is therefore **one node, not two**. The
document no longer has to nest a painted box around a laying-out container (or
the reverse) to express a card, a panel or a bordered section: one node emits one
element carrying both the paint declarations and the layout declarations, and the
rendered page is visually equivalent to the two-node form it replaces while
containing one fewer element.

The same holds at the other seams the surface group reaches: a `slot` may be
filled, bordered, rounded and shadowed, so a mount point can be framed without a
decorative wrapper around it.

## Verification
Render a card authored two ways — (a) a painted box wrapping a laying-out
container, and (b) a single container declaring both the surface group and its
layout — and observe the second emits one fewer element while producing the same
paint and the same child placement. Confirm the single container's rule carries
both the surface declarations and its `display` / `gap` / `justify-content` /
`align-items` declarations. Render a `slot` declaring surface axes and observe the
mount point paints them.