---
uid: acceptance_criterion-444da8e5
id: AC-747
type: acceptance_criterion
title: Every captured section records its own rect, independently of whether it paints
  a background image
created_by: xgd
created_at: '2026-08-03T00:25:02.840747+00:00'
updated_at: '2026-08-03T00:25:02.840747+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Each section of a captured page records its own rect. This is unconditional
geometry: a section that paints no background image records its rect exactly as
one that does.

A section's background image handle remains separately recorded and separately
gated — a section may record a rect and no image, an image and a rect, or a rect
alone.

## Verification
Capture a page with a mix of image-backed and plain sections: every section in
the recorded value set carries a rect with non-zero extent matching its rendered
bounds, and only the image-backed sections additionally carry an image handle.
