---
uid: acceptance_criterion-a39377e9
id: AC-826
type: acceptance_criterion
title: A reader who jumps straight to the foot of the page finds every band jumped
  over settled and visible, not left blank while occupying space
created_by: xgd
created_at: '2026-08-06T02:04:21.743897+00:00'
updated_at: '2026-08-08T00:42:58.537495+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
On a page whose bands declare entrances, a reader who arrives at a position
below them without passing through them progressively — an end-of-document
keypress, an in-page anchor link, or a reload that restores a mid-page scroll
position — finds every band above the arrival point already settled and visible
when scrolled back to.

This holds even though those bands never occupied a frame in which they were
partially in view: a node that goes from below the viewport to above it in one
jump is never partially visible at any point, and must still settle.

Nodes still below the arrival point continue to enter normally as the reader
scrolls down to them.

## Verification
Drive a page with several revealing bands, jump the scroll position directly to
the foot of the document with no intermediate positions, and assert every band
above it is presented settled at its authored opacity and position when
inspected, while a band below the arrival point is still in its pre-entrance
appearance until reached.