---
uid: acceptance_criterion-c2607622
id: AC-429
type: acceptance_criterion
title: Non-hex color value in a color token is rejected
created_by: xgd
created_at: '2026-07-08T19:13:17.273621+00:00'
updated_at: '2026-07-08T19:13:17.273621+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A color-valued theme token whose value is not a valid hex color (one of `#rgb`, `#rrggbb`, or `#rrggbbaa`) is rejected. The verdict reports failure with an error whose path locates the offending color token.

## Verification
Submit a site whose palette contains a non-hex color string. Assert the result reports failure and an error path points at that color token.
