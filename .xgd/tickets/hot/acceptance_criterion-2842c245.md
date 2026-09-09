---
uid: acceptance_criterion-2842c245
id: AC-1606
type: acceptance_criterion
title: Split-control surface axes resolve against the node bearing the backing surface
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:47:54.706217+00:00'
updated_at: '2026-09-09T23:47:54.706217+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
Pairing decides *which two elements* are compared (AC-633); attribution decides
*which node's* value each axis reads. Where a control is split — the reference
represents it as one self-painting node while the reproduction's flat tree carries
the label on a text node and paints the surface on a sibling backing box — the
surface axes resolve against the node that actually **bears** the surface: corner
radius / shape, box shadow, the uniform box border (hairline), and the surface's own
position and size.

A split control that renders identically on both sides therefore raises **no** delta.
Reading the axes off the text node the pair was keyed on reports the label's own 0px
radius and absent border, manufacturing a phantom `radius 8px → 0px` — which both
leads the repair order with a no-op and hides the backing box's real geometry defect
behind it.

The captured element carries its backing-surface reference explicitly, so resolution
is a lookup rather than a guess, and it fires only where the two sides genuinely
disagree about node identity: a self-painting control is self-bearing on both sides
and keeps the own-axis comparison untouched. A bundle captured before the reference
existed carries none, and the resolution stays **inert** — such a bundle behaves
exactly as it did.

## Verification
Diff a reference whose control is one self-painting node against a reproduction that
splits it into a label plus a backing box painting the identical radius, border and
rect; assert no shape, border, radius or size delta is reported. Give the backing box
twice the reference height and assert a size delta is reported against the *backing
box's* rect, not the label's. Assert a control that is self-painting on both sides is
still compared on its own axes. Assert a manifest carrying no backing-surface
reference produces the pre-existing per-node comparison unchanged.
