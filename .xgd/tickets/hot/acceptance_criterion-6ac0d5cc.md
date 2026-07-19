---
uid: acceptance_criterion-6ac0d5cc
id: AC-668
type: acceptance_criterion
title: Per-breakpoint form honoured across the full enumerated length-dial set
created_by: xgd
created_at: '2026-07-19T03:20:43.385814+00:00'
updated_at: '2026-07-19T03:31:27.000558+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
The per-breakpoint object form is accepted and applied for each enumerated length dial — spacing top, spacing bottom, gap, logo size, content offset, content inset, and panel padding — on its owning module, not merely one dial. Setting a per-breakpoint value on any of these dials changes the corresponding rendered length at the specified breakpoint width.

## Verification
For each enumerated dial on its module, render with a per-breakpoint override defined at one breakpoint and observe that the rendered length changes at/above that breakpoint width and holds the base value below it.