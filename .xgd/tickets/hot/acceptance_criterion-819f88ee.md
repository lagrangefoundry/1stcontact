---
uid: acceptance_criterion-819f88ee
id: AC-822
type: acceptance_criterion
title: 'A state''s motion is added to the node''s authored placement rather than replacing
  it: a rotated or scaled node that lifts on hover keeps its rotation and scale while
  hovered'
created_by: xgd
created_at: '2026-08-06T02:03:27.210399+00:00'
updated_at: '2026-08-09T05:40:54.722185+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A node that declares a static placement adjustment (a rotation, a scale) and a
hover or focus state whose motion declares only an offset presents, while in
that state, both the authored placement and the state's offset. The authored
rotation and scale survive the state; they are not discarded by it.

Where the state's motion restates an axis the node already declares (its own
scale, its own rotation), the state's value is the one presented while the state
is active, and the node returns to its authored value when the state ends.

## Verification
Render a node carrying an authored rotation and scale plus a hover state whose
motion sets only a vertical offset, and assert the hovered presentation carries
the offset *and* the authored rotation and scale. Render the same node with a
hover motion that also sets a scale and assert the state's scale is the one
presented while hovered and the authored scale is restored after.