---
uid: acceptance_criterion-8ab00cd9
id: AC-594
type: acceptance_criterion
title: Positioned hero object is placed by band coordinates
created_by: xgd
created_at: '2026-07-13T20:23:12.577363+00:00'
updated_at: '2026-07-13T20:23:12.577363+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
When a hero object (eyebrow, heading, subhead, or cta) carries a position, the
published hero renders that object lifted out of normal content flow and
absolutely placed within a container that spans the full hero band. Its offset,
size, layering and rotation come from the position's coordinate values expressed
in band-relative units: x and y as percentages of the band, width as a
percentage, z as a unitless stacking value, and rotate in degrees.

## Verification
Render a hero whose heading carries a position (e.g. x=8, y=55, w=45). Inspect
the published markup/CSS: the heading is placed on the full-band absolute canvas
(not in the flowed content column) and its placement values appear as
`x → 8%`, `y → 55%`, `w → 45%`, with rotate carrying `deg` and z unitless.
