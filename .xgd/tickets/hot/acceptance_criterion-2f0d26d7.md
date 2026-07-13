---
uid: acceptance_criterion-2f0d26d7
id: AC-580
type: acceptance_criterion
title: Clean objects collapse to a count and non-object deltas render in a dedicated
  tail
created_by: xgd
created_at: '2026-07-13T19:51:31.969551+00:00'
updated_at: '2026-07-13T19:57:11.354635+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
Objects that reproduce with no mismatches do not render a full card; they are
summarised as a count of clean objects. Deltas that belong to no reference
object — section-level treatments, document/viewport checks, render-only checks,
and systemic aggregates — are preserved in a dedicated tail section so nothing
the comparison found disappears. When there are no differences at all (no dirty
objects, no unpaired objects, no non-object deltas), the output states plainly
that there are no value deltas.

## Verification
Compare a pair mixing clean objects, dirty objects, and at least one section- or
render-only delta. Assert clean objects appear only as a count (not as cards),
the non-object delta appears under a distinct tail section, and a fully-matching
comparison produces a single explicit no-value-deltas result with no spurious
cards.