---
uid: acceptance_criterion-d5e4dfaa
id: AC-591
type: acceptance_criterion
title: Standard rgb()/rgba() colours resolve to hex even without a rendering surface
created_by: xgd
created_at: '2026-07-13T20:13:24.309597+00:00'
updated_at: '2026-07-13T20:20:48.251726+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-79e068e5
  kind: behavior
  regression_only: false
---

## Criterion
In an environment where no colour-rendering surface is available (e.g. a
canvas-less test environment), standard `rgb()` / `rgba()` computed colours
still resolve to their `#rrggbb` hex value, and a fully-transparent `rgba()`
value still resolves to the inferred sentinel. Colour resolution degrades
gracefully rather than failing wholesale when the primary rendering path is
absent.

## Verification
Run extraction in a canvas-less environment. Assert an `rgb(...)`/`rgba(...)`
computed colour yields the correct `#rrggbb`, and that a zero-alpha `rgba()`
yields the `#000000` sentinel with the colour-inferred flag set.