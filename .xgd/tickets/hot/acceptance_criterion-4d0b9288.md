---
uid: acceptance_criterion-4d0b9288
id: AC-475
type: acceptance_criterion
title: A module accepts an optional background of type color, image, or gradient
created_by: xgd
created_at: '2026-07-09T20:34:28.272466+00:00'
updated_at: '2026-07-09T20:34:28.272466+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A module instance may declare an optional `background` that is exactly one of three kinds:
- **color** — requires a hex color `value`
- **image** — requires an asset reference; may set `fit` to `cover` or `contain`
- **gradient** — requires a CSS gradient string

A site whose module declares any one of these background kinds passes validation. Each kind carries only the fields it needs; supplying the wrong shape for the declared `type` fails validation.

## Verification
Validate a site (through the schema validation boundary) for each of the three background kinds and assert the result reports success. Assert that a background declaring one `type` but the fields of another is rejected.
