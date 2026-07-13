---
uid: acceptance_criterion-5d003a95
id: AC-575
type: acceptance_criterion
title: Comparison output groups deltas into one card per reference object, worst object
  first
created_by: xgd
created_at: '2026-07-13T19:51:18.675527+00:00'
updated_at: '2026-07-13T19:51:18.675527+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
When a reproduction is compared against a reference, the output presents one
card per reference object (in document order) rather than a single flat
severity-sorted list. Each card carries a fixed parameter table with, for a text
object: font family, font size, font weight, colour, letter spacing, line
height, and box — each row showing the reference value and the reproduction
value side by side, and each row marked matched or mismatched. Cards that
contain at least one mismatch are ordered worst-object-first (the object with
the highest-severity difference appears first). An object whose four axes differ
shows those four flagged rows together on its own card, not scattered across the
whole stream.

## Verification
Run the comparison on a reference/reproduction pair where a single text object
differs on multiple axes (e.g. right family and colour, wrong size and
position). Assert the output contains one card for that object whose parameter
table lists all fixed parameters with both columns present, that exactly the
differing axes are flagged mismatched and the agreeing axes are flagged matched,
and that when several dirty objects exist they appear in descending order of
worst severity.
