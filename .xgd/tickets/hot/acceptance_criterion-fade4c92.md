---
uid: acceptance_criterion-fade4c92
id: AC-605
type: acceptance_criterion
title: Literal contentWidth value renders an exact off-scale measure
created_by: xgd
created_at: '2026-07-13T20:37:51.665405+00:00'
updated_at: '2026-07-13T20:37:51.665405+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: false
---

## Criterion
For a width off the named scale, `contentWidth` accepts a literal value and caps the content column to exactly that measure. A bare number is interpreted as pixels (matching captured render values) — `contentWidth: 896` renders an 896px content column. A CSS length string is applied verbatim — `contentWidth: "56rem"` renders a 56rem content column. No named step is required for these values.

## Verification
Render a module with `contentWidth: 896` and confirm the content column is capped to 896px; render one with `contentWidth: "56rem"` and confirm the column is capped to 56rem. Both must produce the measure without matching any named step.
