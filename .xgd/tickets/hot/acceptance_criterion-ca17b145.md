---
uid: acceptance_criterion-ca17b145
id: AC-1784
type: acceptance_criterion
title: 1c crop clamps a box that over-reaches the image rather than failing, and writes
  exactly that window's pixels
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:03.551657+00:00'
updated_at: '2026-09-14T05:16:32.485797+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Asking for a window that extends past the image's edge returns the part that
exists: the reported box is the clamped one, and the written image has the clamped
dimensions. A box wholly inside the image is returned unchanged, and in both cases
the output's pixels are exactly the source's pixels at the requested offset — the
first pixel of the crop is the source pixel at the box's top-left corner.

Clamping rather than failing is the deliberate trade: a region bounding box on the
bottom band of a tall page routinely over-reaches by a few pixels, and failing a
run over an edge the operator did not choose would be the wrong outcome.

## Verification
Crop a known pattern with a box that over-reaches both axes; assert the returned
box and the output dimensions are clamped to what exists. Crop the same image with
an interior box; assert the box is unchanged and compare the output's pixels
against the corresponding source window, pixel by pixel.