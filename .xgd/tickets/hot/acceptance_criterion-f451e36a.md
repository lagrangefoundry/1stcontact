---
uid: acceptance_criterion-f451e36a
id: AC-1609
type: acceptance_criterion
title: Inter-row vertical spacing is compared as its own adjacent-row gap axis
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:48:06.632382+00:00'
updated_at: '2026-09-09T23:48:06.632382+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
The vertical rhythm of a page is compared as the **gap between consecutive visual
rows**. Paired elements carrying a box are grouped into visual rows by rendered
position — an element starting before the current row's reference bottom joins that
row, which is then measured to its greatest bottom — and the distance from one row's
bottom to the next row's top is compared as its own axis.

A difference beyond the tolerance — default **6px**, widened to **16px** under
`--tolerant` — is reported as a `gap` delta labelled with the two rows it sits
between and carrying both measured gaps, so reference-minus-ours is directly the
linear correction to apply to the one spacing knob. Rows that are not genuinely
stacked (overlapping on either side) contribute no gap.

This is the axis that catches "every element is right but the page breathes
differently": a reproduction whose paired elements all match while the spacing
between them does not.

## Verification
Diff a reproduction whose every paired element matches its reference but whose
spacing between two consecutive rows is ~12px wider. Assert a `gap` delta is reported
for that row pair, naming both rows and carrying both measured gaps; re-run with
`--tolerant` and assert it is absorbed. Assert a reproduction whose row gaps agree
raises no gap delta, and that a pair of overlapping (non-stacked) rows produces none
either. Assert a row of side-by-side cards is treated as one row rather than several.
