---
uid: acceptance_criterion-f5b2ff4c
id: AC-1781
type: acceptance_criterion
title: A single-channel diff heatmap is stored as a true greyscale image, smaller
  than its colour equivalent and decoding identically
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:38.692519+00:00'
updated_at: '2026-09-14T05:05:38.692519+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Writing a one-channel raster — which is what the perceptual diff's heatmaps are —
produces a genuinely greyscale image file, not a three-channel one carrying the
same value three times. The same picture written as three channels is a larger
file, and both files decode to the same pixels, which is what makes the saving
free: the expansion contract hands back equal samples either way, so nothing
downstream can tell the difference.

Previously the native decoder converted to sRGB on the way *in*, so these heatmaps
were being stored at roughly three times the size they need.

## Verification
Write a one-channel raster with a varied pattern and assert the resulting file
declares greyscale. Write the identical picture as a three-channel raster — a
varied pattern, not a flat one, which would compress to nothing and prove nothing
— and assert the greyscale file is the smaller of the two. Decode both and assert
their pixel digests are equal.
