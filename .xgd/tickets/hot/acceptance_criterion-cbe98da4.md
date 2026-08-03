---
uid: acceptance_criterion-cbe98da4
id: AC-761
type: acceptance_criterion
title: A text leaf paints its own chip surface under the box axes' bounds
created_by: xgd
created_at: '2026-08-03T01:33:30.554379+00:00'
updated_at: '2026-08-03T02:03:12.573484+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A text leaf may **paint its own surface** — a fill colour, a corner radius, a drop
shadow and a border — so that a run whose own element is a chip, pill or badge
reproduces as that chip rather than as bare text. The published page shows the
surface on the text element itself, at the same box the run occupies, so a chip
is painted exactly once and needs no separate box behind it.

The chip axes are bounded by the envelope **exactly as the equivalent box axes
are**: hex-only fill and border colour, the shared length range for the radius,
the effect-length bounds for the shadow's offsets/blur/spread and the border's
width, and no unknown keys. A run therefore cannot paint a surface the substrate
would refuse on a box.

Where a run somehow declares both a chip fill and a glyph gradient, the **glyph
gradient wins** the background-image slot — the gradient is what paints the text
itself, and a run does not carry both in practice.

## Verification
Render a text leaf declaring a fill, a saturated (pill) radius, a shadow and a
border; observe all four appear on the text element's own rule and that no
additional box is emitted for the same surface. Render a text leaf declaring both
a chip fill and a glyph gradient and observe the gradient's text-clipped paint is
what reaches the background-image slot. Submit a chip radius or shadow outside the
envelope bounds, and a non-hex chip fill, and observe rejection.