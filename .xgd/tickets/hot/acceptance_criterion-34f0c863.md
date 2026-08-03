---
uid: acceptance_criterion-34f0c863
id: AC-768
type: acceptance_criterion
title: A text leaf is never pinned narrower than its own measured glyph extent, while
  box and image leaves round to nearest
created_by: xgd
created_at: '2026-08-03T02:08:26.716246+00:00'
updated_at: '2026-08-03T02:08:26.716246+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A shrink-to-fit run's captured box **is** its glyph extent, so a folded text leaf's
width is rounded **up** to the smallest integer that still contains the measured
content — never down. Rounding such a box down by a fraction of a pixel makes it
narrower than the text it must hold, and the published page answers that by
wrapping: a hero title measured at 685.31px and pinned at 685px reflowed onto a
second line the reference never had.

Box and image leaves are rounded to nearest instead. They carry no reflow
constraint, and rounding them up would let a surface creep outward by a pixel every
time the reproduction is re-captured and re-folded.

The growth is bounded to at most one pixel and invents no room: the folded leaf is
the smallest whole-pixel box that still holds the reference's own glyphs.

## Verification
Fold a capture containing runs whose measured widths carry fractions both below and
above .5 at every sampled width; assert each folded text leaf's width is greater
than or equal to its captured glyph extent at that width, and no more than a pixel
above it. Assert a folded box leaf and a folded image leaf carry the nearest
integer to their captured width. Render the reproduction of a page whose hero title
sits at zero slack and assert it occupies the same number of lines as the
reference.