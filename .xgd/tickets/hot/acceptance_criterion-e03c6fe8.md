---
uid: acceptance_criterion-e03c6fe8
id: AC-521
type: acceptance_criterion
title: Layer positioning geometry reproduces montages faithfully
created_by: xgd
created_at: '2026-07-09T22:36:36.055660+00:00'
updated_at: '2026-07-09T22:36:36.055660+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
Layer positioning geometry is faithful so an art-directed montage reproduces to the pixel: a rotated child rotates *in place* about its centre (`transform-origin: center`), not swung about a corner; the motion wrapper is transparent to image sizing so a definite-height image child fills its box whether or not it carries motion; a `shape: circle` child is a true circle (`aspect-ratio: 1`), not collapsed to an ellipse by a percentage height; the soft mask is a box-sized ellipse (`radial-gradient(ellipse 92% 92% at center, …)`); and a layer text link carries a tasteful underline offset.

## Verification
Inspect the per-site stylesheet / rendered markup and confirm: the positioned child rule sets `transform-origin: center`; an image child inside a motion wrapper still fills its box (`.fc-motion` is `width:100%; height:100%`) and a `shape-circle` child carries `aspect-ratio: 1`; the soft-mask rule uses a box-sized `ellipse 92% 92% at center` gradient; and a layer text link carries a non-zero `text-underline-offset`. Render a rotated circular image child and confirm it renders as a true circle tilted in place at its declared position.
