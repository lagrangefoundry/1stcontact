---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-08-20T11:17:39.675807+00:00'
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
document body. Every run whose composited surface differs from that band — or that
carries a gradient the body cannot paint — folds an additional backing box leaf
carrying that fill/gradient and the run's geometry (all four sides pinned) and its
visibility rule. Runs sitting on the band get no backing box. All backing boxes are
ordered ahead of the content leaves, so every leaf paints over its own surface.

A **self-painting run** — one whose own border box already spans the surface it
sits on (a fully-rounded pill, or a control with authored vertical inset) — is
excepted in both directions: it carries that surface on its own text leaf, and it
contributes nothing to this reconstruction. No row, no backing box, and its fill is
not evidence for the band or for any card signature; the enclosing card is defined
by its other runs. A backing box behind such a run would duplicate the pill as a
card.

## Verification
Fold a multi-viewport capture whose runs carry composited fills; assert the document
background equals the dominant run fill, that runs on that fill emit no backing box,
that a run on a differing fill (and a run carrying a gradient even when its solid
equals the band) emits one, and that every backing box precedes the content leaves in
document order. Render and assert both the body background and the panel fill paint.
Separately assert the exception: a fully-rounded pill run and a padded control run
each fold to a text leaf carrying their own fill/radius/border/shadow with no box
leaf behind them, while an ancestor-attributed treatment (a gradient, an accent
left border) on a modestly-rounded run still resolves to a card box.
