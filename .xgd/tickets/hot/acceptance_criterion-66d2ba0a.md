---
uid: acceptance_criterion-66d2ba0a
id: AC-494
type: acceptance_criterion
title: Motion on a layer child animates the child's content while preserving its positioning
created_by: xgd
created_at: '2026-07-09T20:52:36.202614+00:00'
updated_at: '2026-07-09T20:52:36.202614+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
When a layer child (image or text) carries a motion, rendering wraps the child's inner content in the motion element rather than the positioned child element itself, so the child's own positioning (offset, size, rotation) is retained while its inner content animates. A slide/scale motion on a positioned child does not displace the child from its authored position.

## Verification
Render a layer whose child has a non-zero position/rotation and a slide or scale motion. Assert the positioned child element retains its positioning styles and that the motion wrapper is applied to the child's inner content, not to the positioned element.
