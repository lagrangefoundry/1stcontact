---
uid: acceptance_criterion-961015d3
id: AC-779
type: acceptance_criterion
title: A responsive type-axis track resolves per viewport in the analytic model, mirroring
  the rendered cascade
created_by: xgd
created_at: '2026-08-03T02:48:17.932255+00:00'
updated_at: '2026-08-03T02:48:17.932255+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
A numeric type axis (font size, line height, letter spacing) that carries a per-width
track resolves in the analytic model **exactly as the rendered cascade resolves it**,
so any expectation projected from a reproduced document is per-viewport rather than
single-valued.

Resolution rule (identical to the geometry track's, including its half-open
`[a.at, b.at)` intervals):
- At or below the first keyframe width, the base (smallest-width) value holds.
- Within a segment, the value interpolates linearly between the bracketing keyframes;
  a `snap` segment holds the lower keyframe's value across the segment.
- At or above the last keyframe width, the final value holds.
- At an exact interior breakpoint the segment **starting** there is active, so a
  sampled ladder width always evaluates to that width's own keyframe value.

Consequences, observable in the projected expectation:
- A document whose heading scales from 36px at 320 to 72px at 1440 yields an
  expectation of 36px at a mobile viewport and 72px at a desktop viewport — the
  expectation carries the value the browser actually paints there, so a correct
  responsive reproduction produces no phantom "desktop size at mobile" delta.
- An axis with no track contributes its single scalar value at every viewport, so
  static axes are unaffected.

## Verification
Evaluate a font-size track spanning the ladder (320→1440) at every ladder width, at
interior widths between keyframes, and below/above the ladder; assert each sampled
width returns its own keyframe value, interior widths interpolate, and out-of-ladder
widths hold the base and final values respectively. Fold a multi-width capture whose
heading is 36px at 320 and 72px at 1440, project its expectation at a 320 viewport and
at a 1440 viewport, and assert the heading's expected font size is 36 and 72
respectively.
