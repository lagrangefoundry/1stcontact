---
uid: acceptance_criterion-038f5828
id: AC-772
type: acceptance_criterion
title: A node anchors x and width to the column independently, with a capped term
  for a nested maximum and a keyframed in-column offset across a layout mode change
created_by: xgd
created_at: '2026-08-03T02:08:42.456248+00:00'
updated_at: '2026-08-03T02:08:42.456248+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A node's `x` and its `width` are fitted to the document column **separately**, and
either may be anchored while the other keeps its keyframes. Alignment is a shared
property while width is a private one: requiring both to fit before anchoring
either meant that, on a hero where exactly one line's width happened to equal the
column extent, that line followed the column while its three neighbours kept
absolute keyframes — splitting text the reference keeps flush by 31px, which is
worse than not anchoring at all.

Each axis is expressed in closed form against the column and accepted only if it
reproduces every sampled width to within a pixel, with three guards against a fit
that is merely coincidence:

- **a width may be capped** — a nested narrower maximum looks like a run that fills
  the column until its own limit takes over — but a capped fit must be
  over-determined. A two-unknown fit through two points is interpolation, not
  evidence: a shrink-to-fit title under responsive type fits *any* two of its
  samples and then "verifies" against its own cap;
- **an x is never capped**, because an element does not stop moving right at some
  width;
- **every fitted share of the column is bounded** to a plausible fraction of it. A
  steep coefficient means the axis is tracking something else — responsive type, a
  glyph extent — that merely correlates with the column's growth over the sampled
  widths, and extrapolating it off-sample sends a run kilometres wide.

Where no closed form fits an `x`, the fold keyframes the small **offset inside the
column** rather than the absolute position, so the origin stays closed-form. That
offset track inherits the node's own geometry transition flags, because a layout
**mode** change (a 3-up grid stacking below a breakpoint) is not a fit: interpolating
an inset across a mode change slid a grid column 42px off the right edge. A node
spanning the full viewport is never anchored and never given an offset track — its
`x` is 0 absolutely, and writing that as an origin plus its negation walks it to a
negative x between samples.

## Verification
Fold a capture where a node's left edge follows the column but its width does not;
assert only the `x` is anchored and the width keeps its keyframes. Assert a node
with a nested narrower maximum anchors with a capped width term, and that one whose
cap is supported by fewer than three samples below it is not anchored. Assert a node
whose fitted share of the column is implausibly steep is not anchored. Assert a
full-bleed band is never anchored, and that the rendered reproduction has no
negative-x node and no horizontal overflow at any probed width, sampled or not.