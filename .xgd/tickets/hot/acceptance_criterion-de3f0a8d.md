---
uid: acceptance_criterion-de3f0a8d
id: AC-485
type: acceptance_criterion
title: Per-breakpoint position overrides apply and reflow collapses to normal flow
  on narrow viewports
created_by: xgd
created_at: '2026-07-09T20:43:17.753051+00:00'
updated_at: '2026-07-09T20:43:17.753051+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A child position may declare per-breakpoint overrides for any subset of its fields; at and above each breakpoint the overridden values take effect ("override and up"), falling back through smaller breakpoints to the base value. Independently, a layer's `reflow` policy controls narrow-viewport behavior: `stack` (the default) collapses the absolutely-positioned stack to normal document flow below the layer's `reflowBelow` breakpoint (default the smallest), while `none` keeps absolute positioning at every width.

## Verification
Render a layer whose child declares a per-breakpoint override (e.g. an `md` x value) and confirm the override is emitted for that breakpoint. Render one layer with default reflow and one with `reflow: none`: the default carries the stack-below-breakpoint behavior, the `none` layer does not, and the stylesheet contains the max-width media block that returns children to normal flow and the min-width blocks that re-point positions per breakpoint.
