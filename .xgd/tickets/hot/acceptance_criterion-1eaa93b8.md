---
uid: acceptance_criterion-1eaa93b8
id: AC-716
type: acceptance_criterion
title: L1 leaf axes carry the absolute literal as the base of the value model, validated
  by the envelope
created_by: xgd
created_at: '2026-07-22T20:28:07.019876+00:00'
updated_at: '2026-08-09T05:40:32.480194+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The absolute (literal) value is the **base** of the value model, carried directly by
L1 leaf axes and guaranteed well-formed by the envelope validator. For colour it is
the base of a two-form model rather than the only admissible form:

- A colour axis on an L1 leaf accepts a hex literal (`#rgb` / `#rrggbb` /
  `#rrggbbaa`) which is emitted verbatim, **or** a reference into the site palette
  which resolves to a hex before anything paints. A non-hex value (e.g. `rgb(...)`,
  a keyword, or `url(...)`) is rejected by validation in either form.
- A length / geometry / radius axis accepts a finite numeric px literal, emitted
  verbatim, and is rejected by the envelope validator when non-finite or out of
  range (font-size 1–400, geometry ±100k, length within envelope bounds). These
  axes are literal-only — no named scale exists for them.

A document that uses only literals needs no palette and is unaffected by the
widening, so a captured site's concrete values still land verbatim with no inference
and nothing gated on a palette existing.

## Verification

Author (or fold from a capture) an L1 document whose leaf axes set distinct absolute
colour and length/radius literals; validate and render it, and confirm each literal
is carried through verbatim, that the same document validates and renders identically
with no palette declared, and that a malformed literal (non-hex colour, non-finite /
out-of-range number) is rejected by the envelope validator. Detailed L1 axis and
envelope behaviour is owned by the L1 substrate story.