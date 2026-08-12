---
uid: acceptance_criterion-ce707959
id: AC-1133
type: acceptance_criterion
title: A captured picture's framing folds to the typed pair, with the browser's own
  centre and an unreadable form folding to nothing rather than a guess
created_by: xgd
created_at: '2026-08-12T21:48:18.533293+00:00'
updated_at: '2026-08-12T21:57:26.689745+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A captured picture's framing — which part of itself its box shows — folds to the
typed percentage pair the substrate holds, so a reproduction pans the picture the
way the captured page did rather than centring it.

Three rules govern what is admitted:
- **The browser's own centre folds to nothing.** A picture shown dead centre is
  what a browser does unasked, so no framing axis is written for it; the folded
  definition carries the pair only when it says something the browser would not
  have done anyway.
- **An unreadable form folds to nothing, never to a guess.** A page may state its
  framing as keywords or as lengths rather than as a percentage pair; where the
  fold cannot read the form, it writes no axis at all, so the definition never
  claims a framing the page did not state. The gap stays findable because framing
  is an axis the reproduction comparison already checks — an unfolded one reports
  as a difference rather than being silently closed with an invented number.
- **The pair is whole or absent.** Only both components are ever written, because
  an unspecified one is silently defaulted by the browser and would make the
  definition say something the page never did.

Framing is carried on a folded picture only; a painted surface's own framing is a
different family and is not folded here.

## Verification
Fold a capture whose media element is framed off-centre and assert the image leaf
carries the typed pair with both components at the captured percentages. Fold one
framed dead centre and assert no framing axis is present on the leaf. Fold one
whose framing is stated in a form the fold does not read (keywords, a length pair)
and assert no framing axis is written and no value is invented. Assert the folded
document still validates against the envelope.