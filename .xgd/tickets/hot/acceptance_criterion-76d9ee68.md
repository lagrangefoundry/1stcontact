---
uid: acceptance_criterion-76d9ee68
id: AC-736
type: acceptance_criterion
title: A fold-synthesized backing surface is not a sibling overlap, but a captured
  one is — and both stay subject to the clip check
created_by: xgd
created_at: '2026-07-29T04:20:06.192885+00:00'
updated_at: '2026-08-20T14:39:42.128709+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A **fold-synthesized** backing surface — a band, section background or card box the
fold *invented* for a fill the capture composited onto runs, carried as a childless
`box` leaf behind the content it backs — is **not** reported as a sibling overlap, even
though its box intersects that content's box. A background sitting under its own content
is by design, not a collision.

The exemption is keyed on that **synthesized identity**, not on the shape of the leaf.
It is a consequence of the fold's surface reconstruction, not an independent rule: the
synthesized boxes are exactly the ones with no oracle counterpart, which is why the same
identity also excludes them from the sample-fidelity pairing queue.

- Evaluating a document whose content leaves sit on top of synthesized backing surface
  boxes yields no overlap findings attributable to those surfaces, at any width and under
  content perturbation.
- **A genuine captured standalone surface box is real painted content and still
  participates in the overlap check.** A childless fill-bearing box the capture resolved
  as its own element — not one the fold synthesized — is not exempt: two such boxes that
  intersect are still reported as an overlap. Being a painted surface is not itself a
  ground for exemption.
- Genuine collisions between content leaves are still reported; excluding synthesized
  surfaces does not suppress them.
- A synthesized surface box whose right edge extends beyond the viewport is still
  reported as a horizontal clip — the exempt leaves are exempt from the overlap check
  only, not from the envelope.
- Inert placeholder slots are likewise excluded from the overlap check — and likewise
  remain subject to the horizontal-clip check: a slot whose right edge runs past the
  viewport is still reported. **Both** overlap-exempt leaf kinds are exempt from that
  one check only; neither is exempt from the envelope.
- Adding synthesized backing surfaces to a document therefore does not change its
  off-sample or content-robustness verdict, and does not change its sample-fidelity
  verdict for the content leaves.

## Verification
Fold a capture whose runs carry a composited panel fill so synthesized backing surface
boxes are emitted, and assert evaluation reports no overlap findings naming those boxes
while the document's content-leaf findings are unchanged from the same capture folded
without surfaces.

Exemption is keyed on synthesized identity, not on being a painted surface: construct a
document holding **two genuinely captured standalone surface boxes that intersect** and
assert an overlap finding **is** reported naming both, while in the same document a
synthesized backing surface sitting under its own content yields none. A captured
standalone surface under content it visually backs is likewise still reported — it was
never exempt.

Construct a synthesized surface box extending beyond the viewport and assert a
horizontal-clip finding is reported for it. Construct a placeholder slot extending beyond
the viewport and assert a horizontal-clip finding is reported for it too, while a slot
sitting under its own content still yields no overlap finding. Assert the sample-fidelity
report for the text leaves is unchanged by the presence of the synthesized surfaces.