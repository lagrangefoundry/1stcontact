---
uid: acceptance_criterion-042865ff
id: AC-576
type: acceptance_criterion
title: Every object card shows the object's box position as a first-class parameter
created_by: xgd
created_at: '2026-07-13T19:51:21.406763+00:00'
updated_at: '2026-07-13T19:51:21.406763+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
Every object card includes the object's box `{x, y, width, height}` as a
parameter row, present regardless of whether the box differs and regardless of
object kind. Position is never omitted or folded into another row: even an
object whose typography matches exactly still shows its box row, and the box row
is flagged mismatched when the position or size differs beyond tolerance and
matched otherwise.

## Verification
Compare objects where position differs while other axes match, and where all
axes (including position) match. Assert every object's card contains a box row
carrying an x/y and width×height value for both reference and reproduction, that
the box row is flagged mismatched in the position-drift case, and that it is
still present and flagged matched when nothing differs.
