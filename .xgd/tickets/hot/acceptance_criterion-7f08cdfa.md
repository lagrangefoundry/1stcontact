---
uid: acceptance_criterion-7f08cdfa
id: AC-509
type: acceptance_criterion
title: services-grid gains a stacked variant and a grid + per-card size dial
created_by: xgd
created_at: '2026-07-09T22:11:06.193044+00:00'
updated_at: '2026-07-09T22:11:06.193044+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
services-grid exposes a `stacked` variant that holds every card full-width in a single column at all breakpoints (the multi-column `three-col`/`two-col` variants spread only from the `md` breakpoint up). It also exposes a `size` dial (`sm|md|lg`, default `md`) that scales the grid's intro/subhead, and each card accepts an optional per-card `size` (`sm|md|lg`) that scales that card's title/body/badge — so one grid can pair a featured `lg` card with quieter companions — consistent with the `size` dial on hero and text-block. Omitting the dials preserves the prior scale.

## Verification
Render a services-grid with `variant: stacked` and assert cards occupy a single full-width column at both a narrow and a wide viewport. Render a grid at `size: lg` and a card at per-card `size: lg` and assert the corresponding size classes/type-scale are emitted; render without them and assert the default `md` scale is applied.
