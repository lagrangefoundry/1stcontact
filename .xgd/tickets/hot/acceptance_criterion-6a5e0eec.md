---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-08-09T08:19:42.794720+00:00'
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
The capture attributes a card/panel/section fill onto each text run rather than to a
standalone element, so the fold reconstructs it. The solid fill that the greatest
number of runs sit on becomes the folded document's background band, painted by the
document body. Every run whose composited surface differs from that band — or that
carries a gradient the body cannot paint — folds an additional backing box leaf
carrying that fill/gradient and the run's geometry (all four sides pinned) and its
visibility rule. Runs sitting on the band get no backing box. All backing boxes are
ordered ahead of the content leaves, so every leaf paints over its own surface.

## Verification
Fold a multi-viewport capture whose runs carry composited fills; assert the document
background equals the dominant run fill, that runs on that fill emit no backing box,
that a run on a differing fill (and a run carrying a gradient even when its solid
equals the band) emits one, and that every backing box precedes the content leaves in
document order. Render and assert both the body background and the panel fill paint.