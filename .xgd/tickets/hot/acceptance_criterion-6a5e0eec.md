---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-09-10T14:08:59.217501+00:00'
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
standalone element, so the fold reconstructs it. The solid fill that the greatest
number of runs sit on becomes the folded document's background band, painted by the
document body.

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
background equals the dominant run fill, that runs on that fill emit no backing box,
that a run on a differing fill (and a run carrying a gradient even when its solid
equals the band) emits one, and that every backing box precedes the content leaves in
document order. Assert that a run with a fully-rounded radius and a run with authored
vertical padding each carry their surface on their own text leaf and emit no backing
box, and that a run whose padded element also carries a gradient or a left-accent rule
still gets one. For a run whose capture carried a surface shape, assert the backing
box's keyframes equal that captured surface rect (not the run's union) and that it
carries the captured radius; assert two runs sharing one surface rect fold to a single
box and two runs on different rects never merge. Render and assert both the body
background and the panel fill paint.
