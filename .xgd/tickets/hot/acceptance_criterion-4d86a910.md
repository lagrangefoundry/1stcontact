---
uid: acceptance_criterion-4d86a910
id: AC-1777
type: acceptance_criterion
title: Greyscale and indexed images arrive expanded to sRGB exactly as the previous
  decoder expanded them
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:04:58.535306+00:00'
updated_at: '2026-09-14T05:04:58.535306+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
A decoded raster reports the channel count the previous decoder reported, not the
source image's own:

- a greyscale image decodes to three channels, each pixel's three samples equal
- a greyscale-with-transparency image decodes to four channels
- an indexed image decodes to three channels when it carries no transparency
  table, and to four when it does — the transparency table alone is what promotes
  it
- a sub-byte greyscale or indexed image is scaled to the full 0..255 range rather
  than left in its own, and a palette index past the end of the transparency table
  reads as fully opaque rather than as an error

This is a compatibility contract rather than a preference: the diff strides its
reads by the raster's channel count, so a decoder returning the source's own count
would read across pixel boundaries and move every number the gate depends on.

## Verification
Decode a greyscale, a greyscale-plus-alpha, and a matched pair of indexed images
differing only in the presence of a transparency table. Assert the channel counts
are 3, 4, 3 and 4 respectively, and that the greyscale pixel's three samples are
equal. The sub-byte scaling and the past-the-end opacity rule are carried by the
recorded-witness digests for the corpus entries that exercise them.
