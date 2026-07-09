---
uid: acceptance_criterion-9bb0e01e
id: AC-544
type: acceptance_criterion
title: 1c crop extracts a bounds-clamped box from an existing image
created_by: xgd
created_at: '2026-07-09T23:10:46.655033+00:00'
updated_at: '2026-07-09T23:10:46.655033+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
`1c crop <image> --box x,y,w,h [--out <png>]` reads an existing on-disk image and writes a PNG containing exactly the requested box; when the box extends beyond the image, it is clamped to the image bounds so an over-reaching box never errors. A malformed or missing `--box` (not four numbers) produces an error. This operates only on files already on disk (distinct from the live screenshot command).

## Verification
Crop a known image with an in-bounds box and assert the output PNG has the requested width/height. Crop with a box overreaching the edges and assert the output is clamped to the image bounds rather than erroring. Invoke with a malformed `--box` and assert an error is reported.
