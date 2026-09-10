---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-09-10T14:41:03.535412+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The capture attributes a card/panel/section fill onto each text run rather than to a
standalone element, so the fold reconstructs it.

**The page base is chosen by painted extent, not by run count.** The folded
document's background band — the fill painted by the document body — is the solid
fill covering the **greatest total band height**, measured across the reconstructed
full-bleed bands **and the captured backdrops alike** (AC-812 owns why a backdrop
counts). Only when no full-bleed band was reconstructed at all does the fold fall
back to the fill the greatest number of runs sit on, and only failing that to the
captured canvas fill as a last resort. The order matters: where bands do not quite
meet, the dominant band reads truer than the canvas hiding behind them, and on a
page whose panels are all nested the measured backdrops are the only honest evidence
of what the page is mostly painted in.

**A full-bleed bar seeds a band, not a row of tiny cards.** Same-fill,
no-treatment runs sharing a horizontal row whose union spans the page's content
width — but which are individually narrow and horizontally *distributed*, items
hugging the left and right edges with a large empty stretch between them, as a
footer or nav strip is — reconstruct as one full-bleed **band**, even though no
single run is full-width. An evenly-tiled card grid sharing one fill, whose
inter-tile gaps are small and even, stays cards. Without the distinction each bar
item becomes its own tiny card and the page background shows through the bar.

A run whose **own** border box already spans the surface it paints is
**self-painting**: it folds that surface onto its own text leaf and emits **no**
backing box. Two families qualify — a run whose corner radius reaches at least half
its painted height (a pill badge), and a run carrying an authored *vertical* padding
inset (a padded control such as a button or submit link). A gradient surface or a
left-accent rule keeps a run on the backing-box path, because a text leaf's own axes
cannot carry those treatments.

Every other run whose composited surface differs from the band — or that carries a
gradient the body cannot paint — folds an additional backing box leaf carrying that
fill/gradient, all four sides pinned, plus its visibility rule. That box's edges,
radius and grouping identity come from the **captured surface rect** (the element the
capture resolved as painting the run, and that element's own box and radius); only a
run whose surface the capture did not resolve falls back to the runs' own union, and
then reaches no further than that box. No card geometry is inferred from where the
text sits, and nothing is outset by an estimated ancestor padding.

Runs sitting on the band get no backing box. All backing boxes are ordered ahead of
the content leaves, so every leaf paints over its own surface.

## Verification
Fold a multi-viewport capture whose runs carry composited fills; assert the document
background equals the fill covering the greatest total band height, that runs on that
fill emit no backing box, that a run on a differing fill (and a run carrying a
gradient even when its solid equals the band) emits one, and that every backing box
precedes the content leaves in document order. Fold a capture whose tallest
reconstructed band is *not* the fill the most runs sit on and assert the taller band
wins the page base; fold a capture that reconstructs no full-bleed band at all and
assert the most-common run fill is used, and one with neither band nor run fill and
assert the captured canvas fill is.

Fold a capture whose footer paints one fill edge-to-edge behind two narrow runs
hugging opposite edges, and assert a single full-bleed band spans the bar rather than
one card per run; fold a capture whose evenly-spaced tile row shares one fill and
assert it still folds to cards.

Assert that a run with a fully-rounded radius and a run with authored vertical
padding each carry their surface on their own text leaf and emit no backing box, and
that a run whose padded element also carries a gradient or a left-accent rule still
gets one. For a run whose capture carried a surface shape, assert the backing box's
keyframes equal that captured surface rect (not the run's union) and that it carries
the captured radius; assert two runs sharing one surface rect fold to a single box
and two runs on different rects never merge. Render and assert both the body
background and the panel fill paint.
