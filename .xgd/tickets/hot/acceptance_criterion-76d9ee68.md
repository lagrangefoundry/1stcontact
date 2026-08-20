---
uid: acceptance_criterion-76d9ee68
id: AC-736
type: acceptance_criterion
title: A painted backing surface is not a sibling overlap, but is still subject to
  the horizontal-clip check
created_by: xgd
created_at: '2026-07-29T04:20:06.192885+00:00'
updated_at: '2026-08-20T12:47:36.746241+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A painted surface leaf — a childless box carrying a card/panel/section fill, positioned
behind the content it backs — is **not** reported as a sibling overlap, even though its
box intersects that content's box. A background sitting under its own content is by
design, not a collision.

- Evaluating a document whose content leaves sit on top of backing surface boxes yields
  no overlap findings attributable to those surfaces, at any width and under content
  perturbation.
- Genuine collisions between content leaves are still reported; excluding surfaces does
  not suppress them.
- A surface box whose right edge extends beyond the viewport is still reported as a
  horizontal clip — surfaces are exempt from the overlap check only, not from the
  envelope.
- Inert placeholder slots are likewise excluded from the overlap check — and likewise
  remain subject to the horizontal-clip check: a slot whose right edge runs past the
  viewport is still reported. **Both** overlap-exempt leaf kinds are exempt from that
  one check only; neither is exempt from the envelope.
- Adding backing surfaces to a document therefore does not change its off-sample or
  content-robustness verdict, and does not change its sample-fidelity verdict for the
  content leaves.

## Verification
Fold a capture whose runs carry a composited panel fill so backing surface boxes are
emitted, and assert evaluation reports no overlap findings naming those boxes while the
document's content-leaf findings are unchanged from the same capture folded without
surfaces. Construct a surface box extending beyond the viewport and assert a
horizontal-clip finding is reported for it. Construct a placeholder slot extending beyond
the viewport and assert a horizontal-clip finding is reported for it too, while a slot
sitting under its own content still yields no overlap finding. Assert the sample-fidelity
report for the text leaves is unchanged by the presence of the surfaces.
