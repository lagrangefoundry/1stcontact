---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-08-03T00:57:26.266388+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
The capture attributes a section/card/chip fill onto each text run rather than to a
standalone element, so the fold reconstructs a **three-level hierarchy** from those
runs rather than one band plus a rectangle per run.

- **Bands.** Runs that span the content width and carry no card treatment seed
  section bands. Consecutive same-fill runs group into one band, and each band
  tiles full-bleed (x=0, width=viewport) at every sampled width.
- **Cards.** A run whose composited surface differs from its band — or that carries
  any card treatment (accent rule, border, shadow, rounding, gradient) — folds into
  a card box carrying that fill/gradient and those treatments, with all four sides
  pinned and its visibility rule.
- **On the band.** A run carrying the band fill and no treatment of its own paints
  nothing: it emits no box, so band paragraphs are not each given a rectangle.

The page background band is the band fill covering the greatest total height (with
the most common run fill as the fallback when no band was reconstructed), painted by
the document body and showing only through the gaps between the full-bleed bands.

Paint order is bands, then section image/scrim boxes, then cards — larger cards
before smaller, so a badge contained in a card lands on top of it — then the content
leaves, so every leaf paints over its own surface.

## Verification
Fold a multi-viewport capture whose runs carry composited fills; assert full-width
same-fill runs produce full-bleed tiled band boxes, that a run sitting on its band
emits no box, that a run on a differing fill or carrying a card treatment produces a
card box carrying that fill and those treatments, that grid columns stay separate
cards while a card's stacked runs coalesce into one box, that the document
background equals the dominant band fill, and that bands precede cards which precede
the content leaves in document order. Render and assert the band, the card fill and
the accent rule all paint.
