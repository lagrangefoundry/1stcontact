---
uid: acceptance_criterion-daec5ea8
id: AC-830
type: acceptance_criterion
title: A gradient is linear or radial and the branches cannot be mixed
created_by: xgd
created_at: '2026-08-06T02:21:08.231495+00:00'
updated_at: '2026-08-09T05:41:02.622052+00:00'
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
A gradient axis is **linear or radial**, and the branch a document declares is the
branch it gets.

- **Linear** is what a gradient is when it does not say otherwise: an optional
  angle plus at least two hex stops. Declaring the linear discriminator is
  optional, so a gradient carrying only an angle and stops still paints the same
  linear wash it always did.
- **Radial** must say so, and carries the axes a radial has and a linear does not:
  an optional **origin** drawn from the nine CSS box positions (`center`, the four
  edges, the four corners) and an optional **extent** keyword. An origin is never
  a freeform position string — `at 30% 40%` is refused — so no instance value
  reaches the stylesheet as syntax. Omitted origin/extent fall through to the
  browser's own defaults rather than being pinned by the renderer.

**The branches do not mix.** A radial declaring a linear-only axis (an angle) is
**rejected by the schema**, not silently ignored by the renderer, so a document
cannot express a gradient that means nothing.

A radial gradient paints the soft-falloff glow that had no representation at all
while the only gradient was linear.

## Verification
Render a node declaring a radial gradient with an origin and an extent and observe
a radial background layer carrying both keywords and the declared hex stops with
their percentage positions. Submit a radial declaring a freeform origin string and
observe rejection; submit a radial declaring an angle and observe rejection. Render
a gradient declaring only an angle and stops and observe the unchanged linear wash.