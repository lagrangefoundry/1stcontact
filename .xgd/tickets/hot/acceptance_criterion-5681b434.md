---
uid: acceptance_criterion-5681b434
id: AC-517
type: acceptance_criterion
title: Layer text children carry structured token-backed typography
created_by: xgd
created_at: '2026-07-09T22:35:51.228451+00:00'
updated_at: '2026-07-09T22:35:51.228451+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A layer **text** child may carry a structured `typography` field with any subset of `size` (font-scale step), `weight`, `color` (palette role), `font` (heading/body/display), `tracking` (closed enum), `align`, `leading` (line-height token), and a `shadow` preset (`soft` | `glow`). Every field resolves to a theme-token custom property (`--font-size-*`, `--font-weight-*`, `--color-*`, `--font-family-*`, `--line-height-*`) or a fixed framework value (`tracking` → em, `shadow` → a legibility text-shadow preset). No raw CSS string is accepted — the schema is strict — and an unstyled text child renders exactly as before.

## Verification
Render a layer text child carrying a typography treatment (e.g. `size: 5xl`, `weight: black`, `color: primary`, `tracking: wide`, `shadow: glow`) and confirm the produced markup emits the corresponding `font-size: var(--font-size-5xl)`, `font-weight: var(--font-weight-black)`, `color: var(--color-primary)`, a letter-spacing em value, and the glow text-shadow preset on the run — with the markdown children inheriting it. A text child with no typography emits no such declarations. A raw `style`/`css` field on the typography object fails validation with a path-pointed error.
