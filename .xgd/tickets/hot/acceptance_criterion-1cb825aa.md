---
uid: acceptance_criterion-1cb825aa
id: AC-476
type: acceptance_criterion
title: A background may carry an optional legibility overlay (hex color + 0..1 opacity)
created_by: xgd
created_at: '2026-07-09T20:34:32.502326+00:00'
updated_at: '2026-07-09T20:34:32.502326+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
Any background kind may additionally declare an optional `overlay` consisting of a hex `color` and an `opacity` that is a number between 0 and 1 inclusive. A site whose background includes a well-formed overlay passes validation. The overlay is optional: a background without one is equally valid.

## Verification
Validate a site whose module background includes an overlay with a valid hex color and an opacity within 0..1, and assert success. Validate an equivalent site with no overlay and assert success.
