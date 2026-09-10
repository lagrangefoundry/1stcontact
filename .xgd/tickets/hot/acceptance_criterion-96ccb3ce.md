---
uid: acceptance_criterion-96ccb3ce
id: AC-1627
type: acceptance_criterion
title: A height probe yields a measured per-node viewport-height response, and is
  never read as a keyframe
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:09:59.170832+00:00'
updated_at: '2026-09-10T14:09:59.170832+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
The fold consumes a second sampling axis — **viewport height**. A capture may pair a
ladder width with a resting projection at that same width and a *different* viewport
height (a **height probe**). From such a pair the fold derives, per node, a
`{yFactor, heightFactor}` viewport response carried on the node's geometry:

- The response is a **measured finite difference** over the probe pair — the node's
  change in y and in height divided by the change in viewport height — never an
  inference from a correlation across the width ladder. When a capture carries no
  height probe, the fold emits **no** response rather than guessing one, and the
  document is otherwise identical to what it folded before.
- A probe is **evidence about the height axis and never a keyframe of its own**. The
  ladder alone defines keyframes: the first resting projection at a given width
  defines that width's ladder cell, and any later projection at the same width is
  partitioned off as probe evidence. A probe therefore adds no geometry keyframe, no
  extra ladder cell, and no duplicate comparison cell.
- Each response is applied against its own keyframe's captured viewport height, so a
  keyframe still evaluates to exactly its captured pixels at capture size.
- A reconstructed surface (a card built from run rows) inherits the response of the
  representative row it was reconstructed from, rather than deriving its own.

## Verification
Fold a multi-viewport capture that includes a height probe at one ladder width, over
a fixture with a viewport-height-relative section (its height tracks the viewport)
and content below it that is pushed down by the same amount.

Assert: the section's geometry carries a `heightFactor` and the node below it a
`yFactor`, each equal to the measured ratio from the probe pair; a node unaffected by
viewport height carries no response; the folded keyframe widths still equal the
ladder (the probe contributed no keyframe and no duplicate width); and evaluating a
keyframe at its captured viewport height reproduces the captured box exactly. Fold
the same capture with the probe projection removed and assert every viewport response
is absent while the rest of the document is unchanged. Assert a reconstructed card's
response equals its representative row's.
