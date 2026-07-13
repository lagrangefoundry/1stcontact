---
uid: acceptance_criterion-2aeb342b
id: AC-604
type: acceptance_criterion
title: Named width step caps content column to the matching Tailwind measure
created_by: xgd
created_at: '2026-07-13T20:37:47.834945+00:00'
updated_at: '2026-07-13T20:37:47.834945+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: false
---

## Criterion
Setting a module's `contentWidth` dial to a named step caps that section's content column to the width of the matching Tailwind `max-w` step. The named scale is exactly `sm 384 · md 448 · lg 512 · xl 576 · 2xl 672 · 3xl 768 · 4xl 896 · 5xl 1024 · 6xl 1152 · 7xl 1280` (px @ root-16), plus `bleed`. In particular a module with `contentWidth: "4xl"` renders a content column with a max-width of 896px (56rem) — a width the previous scale (which jumped 768 → 1152) could not express.

## Verification
Render a module with `contentWidth: "4xl"` and confirm the content column is constrained to the 896px measure. Confirm each named step in the rendered/generated output corresponds to its Tailwind px value across the full scale.
