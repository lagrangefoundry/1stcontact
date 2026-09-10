---
uid: acceptance_criterion-1eaa93b8
id: AC-716
type: acceptance_criterion
title: L1 leaf axes carry the absolute literal as the base of the value model, validated
  by the envelope
created_by: xgd
created_at: '2026-07-22T20:28:07.019876+00:00'
updated_at: '2026-09-10T12:12:19.398078+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The absolute (literal) value is the **base** of the value model, carried directly by
L1 leaf axes and guaranteed well-formed by the envelope validator. This criterion owns
the literal itself; the palette overlay layered over that base is stated by its
siblings in this story.

- A colour axis on an L1 leaf accepts a hex literal (`#rgb` / `#rrggbb` /
  `#rrggbbaa`), which is emitted verbatim. A non-hex value (e.g. `rgb(...)`, a
  keyword, or `url(...)`) is rejected by validation. That the same axis *also* accepts
  a reference into the site palette is AC-928's claim, not restated here.
- A length / geometry / radius axis accepts a finite numeric px literal, emitted
  verbatim, and is rejected by the envelope validator when non-finite or out of
  range (font-size 1–400, geometry ±100k, length within envelope bounds). These
  axes are literal-only — no named scale exists for them.

So a captured site's concrete values land verbatim, with no inference on the way in.
What a literal-only document is guaranteed against the palette widening — that it
needs no palette and validates and renders exactly as before — is AC-931's claim.

## Verification

Author (or fold from a capture) an L1 document whose leaf axes set distinct absolute
colour and length/radius literals; validate and render it, and confirm each literal
is carried through verbatim and that a malformed literal (non-hex colour, non-finite /
out-of-range number) is rejected by the envelope validator. Reference acceptance is
verified by AC-928 and the literal-only guarantee by AC-931. Detailed L1 axis and
envelope behaviour is owned by the L1 substrate story.
