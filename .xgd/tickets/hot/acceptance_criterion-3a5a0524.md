---
uid: acceptance_criterion-3a5a0524
id: AC-461
type: acceptance_criterion
title: Section background images are captured with their text-over overlay
created_by: xgd
created_at: '2026-07-09T20:12:02.598128+00:00'
updated_at: '2026-07-09T20:12:02.598128+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
A section whose background image is applied by JavaScript/CSS at runtime is captured with a background of kind `image` pointing at the mirrored image asset, an overlay descriptor (color plus opacity in 0..1) reflecting the painted text-over-image scrim, and a layout flag indicating text is painted over a background image.

## Verification
Capture a fixture with a hero band whose `background-image` is applied by script. Assert the first section's background kind is `image`, its image path resolves to the mirrored hero asset, its overlay opacity matches the fixture's scrim (e.g. ~0.55), and its layout `textOverImage` flag is true.
