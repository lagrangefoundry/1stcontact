---
uid: acceptance_criterion-87e0402d
id: AC-1352
type: acceptance_criterion
title: The viewport-height probe pair folds to a measured per-node height response,
  attributed by section edge and representative row
created_by: xgd
created_at: '2026-08-20T12:53:27.275910+00:00'
updated_at: '2026-08-20T13:46:59.373216+00:00'
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
Width alone cannot tell a full-viewport-height hero from a hero that happens to be 800px
tall, so the ladder carries a second sampling axis: selected ladder widths are **re-shot at
a second viewport height**, and the fold reads that pair as **evidence about the height
axis rather than as a keyframe**.

- **The keyframe ladder skips the probe.** A re-shot projection never becomes a sampled
  width of its own, so no width gains a keyframe the page was never laid out at.
- **The response is a finite difference, so it needs a pair.** A probe is joined to the
  ladder projection at the **same width and the same engine**; a width with no such pair,
  or a pair whose viewport heights do not actually differ, simply contributes no response.
- Each node's measured change in **top edge** and in **height** per unit of viewport height
  folds to a small derivative carried on its geometry — a `yFactor` and a `heightFactor`,
  stating in the same units what a locally-pinned pixel height cannot: that this band grows
  with the viewport and everything below it starts a viewport height down.
- The response is **measured, never inferred**: the fold reads two boxes and a height
  difference, not an authored unit. Ratios are snapped to eighths so sub-pixel layout noise
  does not become structure (a measured 0.9975 is the full-viewport-height rule), while a
  ratio that is not near an eighth is carried as measured.
- **A response indistinguishable from zero emits no axis at all**, so a page with no
  viewport-relative rule gains nothing.
- The factors are measured at the probe width and applied at every width: the rules that
  produce them are not themselves width-varying, and re-probing at every width would
  multiply capture cost by the ladder length.

**Two attribution rules keep it honest.** Elements are joined across the pair by the same
identity-plus-document-order queue the responsive tables use, and:

1. **A band takes its response from its section edges**, not from the runs it contains. A
   full-viewport-height hero's copy sits in the top half and does not move, while the band
   below it starts a full viewport height down — so a band's response is the difference of
   its two measured edge responses, and a band whose sampled widths disagree about that
   rule carries no response rather than a fabricated one. Sections join across the pair by
   index.
2. **A reconstructed card inherits its representative row's** response, since a card is
   reconstructed from the runs it encloses and has no measured box of its own.

## Verification
Fold a multi-width capture whose ladder includes a width re-shot at a second viewport
height, over a page with a full-viewport-height hero and content below it.

Assert the folded document's sampled widths are the **ladder alone** — the re-shot
projection contributed no keyframe at any node — while the hero band carries a
`heightFactor` of 1 and the band below it a `yFactor` of 1.

Attribution: assert the hero band's response comes from its **section edges** by checking
that a run sitting in the hero's top half (which does not move between the pair) does not
suppress the band's own growth; and assert a reconstructed card carries the response of the
representative row it was built from.

Inert response: fold the same capture over a page with no viewport-relative rule and assert
no node carries a height response at all. Assert a node whose measured movement is a
fraction of a pixel per unit of viewport height likewise emits no axis.

Snapping: assert a measured ratio a hair off 1 folds to exactly 1, while a ratio that is
not near an eighth is carried as measured rather than snapped to one.

Missing pair: fold a capture with **no** re-shot projection and assert the fold succeeds
with no height response anywhere; fold one whose re-shoot is at the same viewport height as
its ladder projection and assert it contributes no response rather than a division by a
zero difference.