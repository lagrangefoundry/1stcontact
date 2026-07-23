---
uid: acceptance_criterion-1eaa93b8
id: AC-716
type: acceptance_criterion
title: L1 leaf axes carry the absolute (literal) value, validated by the envelope
created_by: xgd
created_at: '2026-07-22T20:28:07.019876+00:00'
updated_at: '2026-07-23T10:04:19.127497+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The absolute (literal) side of the absolute-or-overlay value model is carried
directly by L1 leaf axes and guaranteed well-formed by the envelope validator:

- A colour axis on an L1 leaf accepts a hex literal (`#rgb` / `#rrggbb` /
  `#rrggbbaa`) which is emitted verbatim; a non-hex value (e.g. `rgb(...)`, a
  keyword, or `url(...)`) is rejected by validation.
- A length / geometry / radius axis accepts a finite numeric px literal, emitted
  verbatim, and is rejected by the envelope validator when non-finite or out of
  range (font-size 1–400, geometry ±100k, length within envelope bounds).

The named-overlay affordance (palette role / named step / named shape) is an
authoring-layer convenience above L1, not part of the safe substrate — L1 carries
the literal, so a captured site's concrete values land verbatim.

## Verification

Author (or fold from a capture) an L1 document whose leaf axes set distinct
absolute colour and length/radius literals; validate and render it, and confirm
each literal is carried through verbatim and that a malformed literal (non-hex
colour, non-finite / out-of-range number) is rejected by the envelope validator.
Detailed L1 axis and envelope behaviour is owned by the L1 substrate story.