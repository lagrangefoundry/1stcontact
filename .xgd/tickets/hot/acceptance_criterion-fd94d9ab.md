---
uid: acceptance_criterion-fd94d9ab
id: AC-812
type: acceptance_criterion
title: A captured backdrop folds to a box leaf in the background layer whose edges
  bound reconstructed bands
created_by: xgd
created_at: '2026-08-06T01:45:20.870131+00:00'
updated_at: '2026-08-09T08:19:45.605674+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A captured element that paints behind content — a background photograph at any
depth, or a full-bleed opaque panel fill — folds to an L1 box leaf carrying that
background image (and the fill painted beneath it) with a geometry track pinning
all four sides at every present sampled width.

The leaf is placed in the document's **background layer**: behind the text runs of
the band it sits under, and after the section-background boxes it is a peer of.
Placing it in captured document order instead would paint a hero photograph over
the hero's own headline, because the manifest lists a band's text-free elements
after that band's runs.

A folded backdrop's top and bottom edges join the section-edge set that bounds how
far a reconstructed band may tile, so a page whose panels are all nested inside one
wrapper — and which therefore yields no interior section edge of its own — still
clamps its bands at the real surface changes rather than tiling one fill down the
whole page. Its fill also counts toward the page-base inference alongside the
reconstructed bands, so the page base is chosen from measured evidence on a page
that reconstructs almost no bands.

## Verification
Fold a capture whose hero is a nested full-bleed background photograph over a solid
fill, with a white panel below it. Assert a box leaf carries the image handle and
the fill at every sampled width; assert it is ordered before the band's own runs in
the rendered document so the headline paints over it; assert the reconstructed band
beneath stops at the backdrop's bottom edge rather than tiling past it; and assert
the inferred page base is the fill the page is mostly painted in, not the hero's.