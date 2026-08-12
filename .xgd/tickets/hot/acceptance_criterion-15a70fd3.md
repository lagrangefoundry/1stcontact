---
uid: acceptance_criterion-15a70fd3
id: AC-1134
type: acceptance_criterion
title: A captured colour adjustment folds to the typed stack, with one fraction per
  spelling, a per-function no-op skip, and an over-envelope value carried at the nearest
  expressible one
created_by: xgd
created_at: '2026-08-12T21:48:37.872380+00:00'
updated_at: '2026-08-12T21:57:26.394717+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A captured colour adjustment — the treatment a page paints over a picture or a
surface — folds to the typed adjustment stack the substrate holds, on a folded
picture and on a folded painted surface alike, so a reproduction paints a
desaturated, dimmed, tinted or blurred element the way the captured page did.
Before this, the adjustment was a value the reproduction comparison checked and
nothing could ever satisfy.

Four rules govern what is admitted:
- **A ratio folds to the same fraction however the browser spelled it.** The same
  adjustment written as a percentage and as a decimal is one adjustment, and which
  spelling a browser reports is not something a reproduction depends on.
- **The value that changes nothing is skipped, per function.** Each adjustment has
  its own value at which it paints nothing, and they are not the same value: full
  desaturation and no desaturation sit at opposite ends of two differently
  oriented scales. Applying one rule to all of them would fold a fully desaturated
  photograph to no adjustment at all and reproduce it in full colour, so the skip
  is decided per adjustment. An element whose every adjustment sits at its own
  no-op value, or which states no adjustment, carries no adjustment axis.
- **A value past the envelope is carried at the nearest expressible one**, not
  dropped: a real treatment the captured page paints reproduces better near-missed
  than absent. A value that is not a treatment at all — a negative amount — is
  skipped, and the folded document always validates against the envelope.
- **A shadow expressed as an adjustment function is deliberately not read**, so
  the substrate keeps one way to say a shadow rather than two.

## Verification
Fold captures whose media element and whose painted surface each carry an
adjustment; assert both leaves carry the typed stack with the captured amounts as
fractions, and that the same adjustment stated as a percentage and as a decimal
folds identically. Fold one whose adjustments all sit at their own no-op values and
assert no adjustment axis is written; fold one at the opposite extremes and assert
both are carried. Fold one past the envelope ceiling and assert the nearest
expressible value is carried and the document validates; fold a negative amount and
assert it is skipped. Fold one stating a shadow as an adjustment function and
assert it is not carried in the adjustment stack.