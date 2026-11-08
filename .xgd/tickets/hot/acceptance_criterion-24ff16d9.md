---
uid: acceptance_criterion-24ff16d9
id: AC-2396
type: acceptance_criterion
title: Ink, advance and font-line anchors measure as distinct values, so different
  alignments give different answers
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:47.853086+00:00'
updated_at: '2026-11-08T07:26:21.943182+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
For a text glyph, `ink-right` (where the drawn ink ends) and `advance-end` (where the pen advances to) are reported as different values when the font's side-bearing differs from zero. On the 1st Contact wordmark fixture (DOC-52 §5.3) the "1" has `ink-right` and `advance-end` 8.4 units apart. For text whose ink rises above cap height (e.g. a `t` ascender), `ink-top` and `cap-top` differ, so `relate` against each gives a different delta. A font's `cap-top`, derived from its measured cap-height ratio, falls on a capital letter's measured ink top.

## Verification
Against the wordmark fixture, assert that relate(`#one.ink-right`, `#one.advance-end`) has magnitude 8.4. In a real browser, assert ink-right ≠ advance-end for the measured "1", ink-top ≠ cap-top for "st", and that cap-top matches "H"'s ink-top within rounding.