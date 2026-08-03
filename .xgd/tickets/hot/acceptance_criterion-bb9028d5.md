---
uid: acceptance_criterion-bb9028d5
id: AC-757
type: acceptance_criterion
title: An accent rule folds onto the bearing element's rect, not the run it insets
created_by: xgd
created_at: '2026-08-03T00:59:17.007898+00:00'
updated_at: '2026-08-03T01:27:46.245269+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
An asymmetric accent rule (a coloured left border) is painted on the rect of the
element that **bears** it, not on the run that element insets. A wrapper carrying the
rule commonly paints no fill of its own, so the run's composited fill resolves past it
to the section band — which the fold discards as viewport-wide — and drawing the rule
on the run instead would indent it by the wrapper's padding and, because a border
paints inside its own border box, overlap the first glyph.

The bearing rect is consulted only when no card-shaped surface was resolved, so a card
that paints both a fill and its accent keeps one rect for both. A rule falling back to
the bearing rect does not inherit a radius from the surface it bypassed; a run whose
accent is painted on its own element keeps its own rect.

## Verification
Fold a capture whose accent rule is borne by a fill-less wrapper that insets its run;
assert the emitted accent box matches the wrapper's captured rect (not the run's, and
not the band's), with no inherited radius. Fold a card painting both a fill and an
accent and assert one box carries both at the fill's rect. Fold a run whose accent is
on its own element and assert its rect is unchanged.