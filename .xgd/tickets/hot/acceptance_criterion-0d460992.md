---
uid: acceptance_criterion-0d460992
id: AC-670
type: acceptance_criterion
title: Each per-breakpoint entry accepts an absolute literal or a named overlay
created_by: xgd
created_at: '2026-07-19T03:21:09.437567+00:00'
updated_at: '2026-07-19T03:31:26.797923+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
Every entry of a per-breakpoint length object (`base` and each of `sm`/`md`/`lg`/`xl`) independently accepts either an absolute px literal or a named step/overlay, resolving through the same rule as a scalar dial. For example `{ base: 24, md: "lg" }` renders 24px below 768px and the resolved `lg` step at/above 768px.

## Verification
Render a dial as `{ base: <px literal>, md: <named step> }` and confirm the base width resolves to the literal px below the md breakpoint and to the step's resolved length at/above it.