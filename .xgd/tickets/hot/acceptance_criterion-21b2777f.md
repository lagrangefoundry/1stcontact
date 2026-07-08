---
uid: acceptance_criterion-21b2777f
id: AC-449
type: acceptance_criterion
title: services-grid is a single column below md and multi-column from md up
created_by: xgd
created_at: '2026-07-08T19:29:15.049667+00:00'
updated_at: '2026-07-08T19:29:15.049667+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
Both services-grid variants are mobile-first: the cards render as a single column by default (below the `md` breakpoint) and expand to the variant's grid (three columns for `three-col`, two for `two-col`) at and above the `md` breakpoint.

## Verification
Inspect the rendered section's stylesheet and assert a single-column default with a min-width `md` media query that establishes three columns for `three-col` and two columns for `two-col`.
