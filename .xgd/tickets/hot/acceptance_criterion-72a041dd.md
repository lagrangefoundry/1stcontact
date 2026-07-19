---
uid: acceptance_criterion-72a041dd
id: AC-636
type: acceptance_criterion
title: A missing or differing panel surface gradient surfaces as a delta; a matching
  or absent one produces none
created_by: xgd
created_at: '2026-07-19T02:28:35.187988+00:00'
updated_at: '2026-07-19T02:28:35.187988+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
---

## Criterion
When a reference run sits on a panel/card whose surface is a gradient, and the reproduction paints that surface as a flat fill (or a differing gradient), `values-diff` reports a surface-gradient delta for that run — distinct from the run's text colour and from the solid surface-fill comparison. When both sides carry a matching surface gradient (same direction and stops), or neither side has a surface gradient, no surface-gradient delta is reported.

## Verification
Diff a reference whose card background is a linear gradient against a reproduction whose card is a solid fill; assert the output contains a surface-gradient delta for a run on that card. Re-diff with the reproduction painting the matching gradient and assert no surface-gradient delta. Re-diff a pair where neither card has a gradient and assert no surface-gradient delta.
