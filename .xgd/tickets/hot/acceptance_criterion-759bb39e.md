---
uid: acceptance_criterion-759bb39e
id: AC-522
type: acceptance_criterion
title: Content runs record computed per-element style values
created_by: xgd
created_at: '2026-07-09T22:45:14.706944+00:00'
updated_at: '2026-07-09T22:45:14.706944+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Each captured text/box content run in `capture.json` additionally records the computed per-element style values used for mechanical value-level comparison, resolved from headless computed styles (Tailwind utilities and `var()` chains already flattened to concrete values): `lineHeightPx` (computed line-height in px when resolvable to a length), `letterSpacingPx` (px, 0 for `normal`), a normalized text-fill `gradient` (`{angleDeg, stops[]}`) when the element paints one via `background-clip: text`, a left-edge accent bar `borderLeft` (`{widthPx, color}`) when present, and `paddingLeftPx` (computed left padding/indent in px).

## Verification
Capture a fixture whose runs carry these treatments — e.g. a wordmark painted with a clipped horizontal `background-image` gradient and a callout line with a coloured `border-left`. Assert the corresponding content runs record `lineHeightPx`/`letterSpacingPx`/`paddingLeftPx` at their computed pixel values, that the gradient run resolves to `{angleDeg, stops}` with the concrete sweep angle (horizontal vs vertical distinguishable), and that the callout run records `borderLeft` with the painted width and colour.
