---
uid: acceptance_criterion-0b911c79
id: AC-748
type: acceptance_criterion
title: A translucent scrim blanketing a section is recorded as a colour with its opacity,
  in any colour syntax the browser accepts
created_by: xgd
created_at: '2026-08-03T00:25:06.785038+00:00'
updated_at: '2026-08-03T00:53:40.119586+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Where a section is blanketed by a translucent veil — a colour carrying its own
alpha, as opposed to element opacity — the section records that veil as a colour
plus an opacity value between 0 and 1.

This holds for any colour notation the rendering engine accepts, including modern
syntaxes (`color-mix(...)`, `oklab(...)`, `oklch(...)`, `color(...)`), not only
legacy `rgba(...)`. Negative cases record no veil: a section painted with an
opaque fill, and a section with neither image nor veil.

## Verification
Capture a fixture whose hero paints a translucent veil authored in a modern
colour syntax over a background image: the hero section records a veil colour and
an opacity matching the authored alpha. Controls: a section with an opaque band
records no veil; a section with neither image nor veil records no veil.