---
uid: acceptance_criterion-aca2fb20
id: AC-519
type: acceptance_criterion
title: Layer image children carry token-backed shadow and border treatments
created_by: xgd
created_at: '2026-07-09T22:36:14.331645+00:00'
updated_at: '2026-07-09T22:36:14.331645+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A layer **image** child treatment may carry a `shadow` step (`none`|`sm`|`md`|`lg`|`xl`) bound to the theme shadow tokens — including a new `xl` token that is optional and backfilled from defaults so pre-existing themes still validate and `--shadow-xl` is always emitted — and a `border` (`{ width: none|thin|medium|thick, color: <palette-role> }`). The framework emits `box-shadow: var(--shadow-<step>)` and, for a non-`none` width, `border: <px> solid var(--color-<role>)` on the image so the shadow tracks the clipped shape and the border rings it. Both are token-backed; a raw CSS shadow/border string is rejected by the strict schema.

## Verification
Render a layer image child with `treatment.shadow: xl` and `treatment.border: { width: thin, color: accent }` and confirm the produced `<img>` carries `box-shadow: var(--shadow-xl)` and `border: 1px solid var(--color-accent)`, and that the per-site stylesheet emits a `--shadow-xl` custom property even for a theme that did not declare one. A `width: none` border emits no border declaration. A raw border/shadow string fails validation with a path-pointed error.
