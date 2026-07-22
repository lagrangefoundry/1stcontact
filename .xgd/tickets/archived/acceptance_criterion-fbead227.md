---
uid: acceptance_criterion-fbead227
id: AC-666
type: acceptance_criterion
title: Per-breakpoint length dial applies override-and-up across viewport widths
created_by: xgd
created_at: '2026-07-19T03:20:35.667722+00:00'
updated_at: '2026-07-19T03:31:27.224011+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
When a length-bearing dial is set to a per-breakpoint object `{ base, sm?, md?, lg?, xl? }`, the published page applies each entry with "override and up" semantics: at a viewport narrower than the smallest defined override the parameter takes `base`; at or above a defined override's breakpoint width it takes that override's value; and a width between two overrides takes the nearest defined override at or below it. Breakpoint widths are sm=640px, md=768px, lg=1024px, xl=1280px.

## Verification
Render a module whose spacing dial is `{ base: A, md: B, xl: C }`, then observe the rendered/computed length at representative widths (e.g. 500px→A, 800px→B, 1300px→C) and confirm the value steps as specified.