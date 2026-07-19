---
uid: acceptance_criterion-3c0e50fa
id: AC-667
type: acceptance_criterion
title: Scalar length dial is constant across all widths
created_by: xgd
created_at: '2026-07-19T03:20:39.445849+00:00'
updated_at: '2026-07-19T03:20:39.445849+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
When a length-bearing dial is set to a single scalar value (an absolute px literal or a named step, not a per-breakpoint object), the resulting length is identical at every viewport width — no per-breakpoint variation is introduced. Scalar dials render the same as before the per-breakpoint capability existed.

## Verification
Render a module with a scalar spacing value and observe the rendered/computed length at several widths (e.g. 500px, 800px, 1300px); confirm the value does not change across widths.
