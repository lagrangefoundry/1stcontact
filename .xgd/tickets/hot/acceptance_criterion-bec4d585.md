---
uid: acceptance_criterion-bec4d585
id: AC-930
type: acceptance_criterion
title: Translucency and lightness are axes of the reference, so one colour used at
  several opacities or shades is one entry
created_by: xgd
created_at: '2026-08-06T20:37:46.135893+00:00'
updated_at: '2026-09-10T12:44:01.176606+00:00'
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

Opacity is carried by the **reference**, not by the palette entry: a reference may
name an alpha in the 0..1 range, resolving to the entry's colour at that opacity,
while the entry itself stays opaque.

The consequence is that one conceptual colour occupies **one** entry however many
opacities it is used at — the entry remains the unit of colour change. The measured
case: a brand colour used as `#2e86a3`, `#2e86a3a6` and `#2e86a355` is one entry
referenced at three alphas.

The conversion is exact rather than approximate: every alpha byte expressible in an
8-digit hex literal round-trips to the identical byte, so replacing such a literal
with a reference-plus-alpha reproduces it exactly.

**The argument generalises to both reference axes.** Alpha is on the reference
because an entry carrying it would make one conceptual colour occupy N entries;
lightness is on the reference for exactly the same reason, so a reference carries
`shade` and `alpha` side by side and an entry carries neither. What the entry holds
is the colour itself; what a reference holds is where within that entry's family and
at what opacity this particular use sits.

## Verification

Author a document whose colour axes reference **one** entry at several alphas, and
confirm the site validates, that the entry itself is rejected if it carries the
alpha instead, and that at the load boundary each use resolves back to the literal
it stands for byte-for-byte. Confirm exactness across the whole alpha byte range,
not only the sampled values. Confirm that neither reference axis displaces the
other — the same entry referenced at an alpha, at a shade, and at both resolves to
the opaque colour at that opacity, the shaded colour opaque, and the shaded colour
at that opacity respectively.

The *conversion* of an existing site's literals into that shape (`1c colors` →
`1c colors --assign`) is **not** this criterion's to verify: AC-942 drives the
census and retrofit commands over a site carrying one RGB at three opacities and
asserts the collapse to a single entry. This criterion verifies the value model the
conversion targets, authored directly.
