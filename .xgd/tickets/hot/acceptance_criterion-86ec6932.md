---
uid: acceptance_criterion-86ec6932
id: AC-1143
type: acceptance_criterion
title: A run whose glyphs are painted by its own background previews with that glyph
  paint, drawn on the words themselves
created_by: xgd
created_at: '2026-08-16T22:01:53.109715+00:00'
updated_at: '2026-08-16T22:01:53.109715+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A run whose glyphs are painted by **its own background** — a background image
clipped to the text, with the text's fill colour transparent, so the words are
that image showing through their own shape — previews in the editing box with
that glyph paint reproduced. The image, the clip and the fill colour are read
off the rendering the operator is looking at, in the syntax the page itself
resolved them to, and any relative address in the image is resolved against the
document that painted it, since the box is drawn under a different origin.

The paint lands on the **element that draws the words**, not on the box around
them. The box's background is the mirrored backdrop — what sits *behind* the
copy — which is a different thing, and a paint of this kind does not reach the
words by inheritance, so putting it on the box would fill the box's own
rectangle and still leave the words unpainted.

A run with **no** such fill is completely unaffected: nothing is carried across
for it, and the words are drawn exactly as they were before this behaviour
existed. That inertness is a property of how the values are consumed — each is
consumed behind the corresponding CSS property's own initial value — and not of
a check performed per run.

## Verification

On a rendering carrying a run painted this way (a gradient wordmark) and an
ordinary run beside it, open the form over each.

For the gradient run: assert the box carries the run's own background image —
the gradient in the syntax the page resolved, with its stops — together with the
clip and the transparent fill colour; assert it carries **no** foreground colour
(the transparent one the run computes is withheld); and assert the backdrop
reproduced is still the band behind the copy, so the run's own background was
read as glyph paint and not mistaken for a surface.

For the ordinary run: assert its ordinary foreground colour is reproduced and
that none of the glyph-paint values is present at all.

Assert the glyph-paint values are consumed on the control that draws the words
rather than on the box, and that each is consumed behind its property's initial
value — so a run that carries none of them computes what it computed before.
