---
uid: acceptance_criterion-222a78c6
id: AC-585
type: acceptance_criterion
title: Art-directed axes remain tolerant by default
created_by: xgd
created_at: '2026-07-13T20:00:43.754718+00:00'
updated_at: '2026-07-13T20:00:43.754718+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
By default (with no opt-out), differences on the genuinely-emergent, art-directed
axes that fall within their documented tolerances produce no delta: gradient
direction within its angle band, overlay (scrim) opacity within its band, and
content vertical anchor within its band. These axes are measured perceptually,
never authored precisely, so they stay tolerant regardless of the exact-match
default.

## Verification
Compare reference/reproduction pairs that differ, one axis at a time, by an amount
within the documented tolerance for gradient angle, overlay opacity, and content
anchor. Assert that no delta is reported for that axis by default.
