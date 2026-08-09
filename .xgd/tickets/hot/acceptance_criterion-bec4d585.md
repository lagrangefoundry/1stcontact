---
uid: acceptance_criterion-bec4d585
id: AC-930
type: acceptance_criterion
title: Translucency is an axis of the reference, so one colour used at several opacities
  is one entry
created_by: xgd
created_at: '2026-08-06T20:37:46.135893+00:00'
updated_at: '2026-08-09T05:41:40.253273+00:00'
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

## Verification

Convert a site's colour literals that share one RGB at differing alphas and confirm
they collapse to a single palette entry referenced at the corresponding alphas, each
resolving back to the original literal byte-for-byte. Confirm exactness across the
whole alpha byte range, not only the sampled values.