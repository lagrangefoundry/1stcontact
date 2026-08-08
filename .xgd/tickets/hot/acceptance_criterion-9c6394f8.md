---
uid: acceptance_criterion-9c6394f8
id: AC-880
type: acceptance_criterion
title: The accent works for both kinds of texture a node can carry — a typed repeating
  pattern and a background image asset — with a faint asset still lighting to full
  accent weight rather than being capped by its own faintness
created_by: xgd
created_at: '2026-08-06T18:09:16.351129+00:00'
updated_at: '2026-08-08T00:43:42.997326+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The pointer accent applies to whichever texture the node paints:

- a node carrying a typed repeating texture has that texture redrawn in the
  accent colour, shaped to the region around the cursor;
- a node carrying a background image instead has the image's own marks
  recoloured in place: the accent lands on exactly the strokes the image draws
  and nowhere else, with no second image and no colour baked into a file, at the
  identical sizing and placement the base image uses so the accented marks sit on
  the base ones at every viewport width.

A faint image asset still accents at full strength. An asset drawn at low opacity
is brought up to a clearly readable accent rather than being limited to the
weight of the marks it recolours; an already-solid asset is left where it is. How
that weight is reached is a property of the mechanism and is not an author-facing
value.

Where a node carries both kinds of texture, the typed texture is the one
accented.

## Verification
Render two pages — one node textured by a typed repeating pattern, one by a
background image — and drive each with a pointer. Assert both present accent-
coloured marks under the cursor. For the image case, assert the accent appears
only where the image draws marks, and that its sizing and placement match the
base image's. Render an image asset drawn at low opacity and measure the accented
marks against the surrounding fill, asserting the accent is clearly separated
from it rather than sitting at the asset's own faint weight. Assert no site
definition field controls that strength. Render a node carrying both texture
kinds and assert the typed texture is the one redrawn.