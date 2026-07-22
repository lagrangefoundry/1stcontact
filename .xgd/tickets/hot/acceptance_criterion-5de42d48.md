---
uid: acceptance_criterion-5de42d48
id: AC-684
type: acceptance_criterion
title: 'Geometry keyframes produce per-viewport layout: interpolate varies continuously,
  snap holds'
created_by: xgd
created_at: '2026-07-22T19:32:01.904313+00:00'
updated_at: '2026-07-22T19:38:51.522324+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A leaf's per-viewport geometry track determines its absolute position and width
per viewport width. Between two adjacent keyframes an `interpolate` segment
produces position/size that varies continuously with viewport width and equals
the authored keyframe values at each endpoint (within tolerance); a `snap`
segment holds the lower keyframe's value unchanged until the next breakpoint.
Below the smallest keyframe width the smallest keyframe holds; above the largest,
the largest holds.

## Verification
Render a document with an interpolate track and observe the rendered output
varies position/width continuously between the two captured widths and pins the
endpoints to the authored keyframes; render a document with a snap track and
observe the lower keyframe's value is held (no interpolation) until the next
breakpoint. Confirm with a real-browser capture that an interpolate wordmark
moves and widens across the ladder while endpoints match the authored keyframes
within ~2px.