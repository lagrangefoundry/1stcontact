---
uid: acceptance_criterion-f1681807
id: AC-460
type: acceptance_criterion
title: Theme colors are the painted values with var() resolved
created_by: xgd
created_at: '2026-07-09T20:11:59.959342+00:00'
updated_at: '2026-07-09T20:11:59.959342+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
A color that the page only ever applies through a CSS custom property (a `var()` reference) appears in the captured theme as the actual painted hex value it resolved to. No unresolved `var(` reference survives anywhere in the structured essence.

## Verification
Capture a fixture whose brand color is defined once as a custom property and consumed only via `var()`. Assert the resolved hex (e.g. `#1a73e8`) is present in the theme colors and that the serialized essence contains no `var(` substring.
