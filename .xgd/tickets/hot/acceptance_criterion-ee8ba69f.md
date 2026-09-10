---
uid: acceptance_criterion-ee8ba69f
id: AC-1625
type: acceptance_criterion
title: An axis that varies across the sampled ladder folds to a per-width track; a
  constant one stays a scalar
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:09:29.328730+00:00'
updated_at: '2026-09-10T15:36:51.285723+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A numeric axis whose captured value differs across the sampled width ladder folds to
a **per-width keyframe track**, not to a single desktop value. This applies to the
numeric type axes — font size, line height, letter spacing — and to each padding side
independently.

A track is emitted only when at least two sampled widths carry the axis *and* their
values are not all equal; an axis holding one value across the whole ladder stays a
plain scalar on the leaf and emits no track, so a static axis is never bloated into
one. Each track carries one keyframe per sampled width the axis is present at, read
and rounded exactly the way the scalar form is read, so the widest keyframe equals
the scalar the leaf would otherwise have carried. Segments are omitted, so the
default transition is `interpolate`, mirroring geometry's fluid default.

## Verification
Fold a multi-viewport capture in which a text run's font size (and a padded element's
left/right padding) differ between the narrow and wide ladder cells, and a second run
whose type and padding are constant across every cell.

Assert: the varying run carries a responsive track for the varying axis with one
keyframe per sampled width, each keyframe's value equal to that width's captured
value; the widest keyframe equals the leaf's scalar axis; the varying padding side
carries a track while a constant side on the same element does not; and the constant
run carries no responsive track at all for either family. Assert the folded document
validates against the L1 envelope, and that rendering it at a narrow sampled width
paints the narrow value rather than the desktop one.