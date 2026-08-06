---
uid: acceptance_criterion-71072579
id: AC-952
type: acceptance_criterion
title: Every segment is outlined by the render itself, and becoming a segment cannot
  move a box
created_by: xgd
created_at: '2026-08-06T21:26:20.789280+00:00'
updated_at: '2026-08-06T21:26:20.789280+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
---

## Criterion

The edit render draws a faint outline around every stamped editable region and
around nothing else — the outlines are produced by the render itself, which knows
each region's box, rather than left for a client to hit-test and compute. Exactly
one outline treatment is emitted, applying to precisely the stamped set.

The outline is painted outside the page's layout: a region's position and size in
the edit render are identical to its position and size in the preview render, so
a region cannot shift merely by becoming editable.

## Verification

Render the edit channel of a seeded page. Assert a single outline treatment is
emitted, selected on the presence of a region stamp, and that it is applied in a
way that reserves no space in the layout. Assert the same page's preview render
carries no such treatment.
