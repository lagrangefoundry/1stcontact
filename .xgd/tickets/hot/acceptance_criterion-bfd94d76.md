---
uid: acceptance_criterion-bfd94d76
id: AC-483
type: acceptance_criterion
title: Text renders legibly over a layered image with an overlay tint
created_by: xgd
created_at: '2026-07-09T20:43:09.823518+00:00'
updated_at: '2026-07-09T20:43:09.823518+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A layer may stack a text child over an image child, with an optional overlay tint sitting between the host module's content and the positioned child stack. In the rendered output the stacking order is fixed and observable: the host content is beneath the overlay, and the overlay is beneath the positioned child stack — so text placed in the stack renders above both the image and the tint. The overlay applies the author's hex color and 0..1 opacity.

## Verification
Render a layer containing an image child and a text child plus an overlay (color + opacity, e.g. 0.45). The output contains the image source, the text run's content, and an overlay carrying the specified opacity. The document order confirms content precedes the overlay, which precedes the positioned stack.
