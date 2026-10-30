---
uid: acceptance_criterion-c72effd0
id: AC-2020
type: acceptance_criterion
title: 'A Library row lays out on one line: icon, a 13px title that takes the remaining
  space and truncates, then pills that never wrap or shrink'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:39:01.939721+00:00'
updated_at: '2026-10-30T20:06:03.830844+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A Library row lays out on one line: the type icon, then the title, then the row's pills.

Specifically:

- The row's elements sit on a single horizontal axis, in the order icon, title, pills — the
  pills no longer drop to a second line beneath the title.
- The title takes the space the icon and pills leave, may shrink below its natural width, stays
  on one line and truncates with an ellipsis when it does not fit.
- The title is set at 13px, the same size as the rows of the workspace's shared list component,
  rather than inheriting the larger body size.
- The icon and the pills keep their intrinsic width: they neither shrink nor wrap, so truncation
  always lands on the title and never cuts a pill.
- The shared list component other surfaces use is not restyled by this; the change is the
  Library's own row presentation.

## Verification

Layout is asserted through the stylesheet contract that produces it (a DOM without a layout
engine measures no boxes), reading every stylesheet block that styles each element rather than
the first one found: the row is a row-axis flex container; the title is allowed to grow
and shrink with a zero minimum width, is 13px, does not wrap and ellipses on overflow; the icon
and the pill strip do not flex and the pill strip does not wrap — and no other block for the
same element declares a conflicting value. Order along the axis is the DOM's, so mount the
Library and assert every row's content is, in order, the icon, the title, then the pill strip,
with every pill inside that strip.
