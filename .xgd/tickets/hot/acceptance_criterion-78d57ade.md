---
uid: acceptance_criterion-78d57ade
id: AC-753
type: acceptance_criterion
title: A distributed full-bleed bar folds as a band while an evenly-tiled card grid
  stays cards
created_by: xgd
created_at: '2026-08-03T00:58:09.921997+00:00'
updated_at: '2026-08-03T01:27:46.876856+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A full-bleed **bar** — a footer or nav strip — paints its fill edge to edge while its
text runs are individually narrow, so no single run is full-width and the band rule
would miss it, leaving each run as a tiny box with the page background showing across
the strip. A fill folds as a band when its same-fill, treatment-free runs share a
horizontal row whose union spans the content width AND whose largest internal
horizontal gap is dominant — the empty stretch showing between edge-hugging items.

An evenly-tiled card grid (several small, even gaps between equal tiles) is
explicitly not a bar and stays separate card boxes.

## Verification
Fold a capture with a footer of distributed same-fill runs (left- and right-hugging
with a large gap between); assert one full-bleed band box carrying that fill rather
than one box per run, and render it to assert the fill paints across the full
viewport width. Fold a capture with an evenly-tiled same-fill row of tiles spanning
the same width; assert it stays separate card boxes and produces no band.