---
uid: acceptance_criterion-1137fe92
id: AC-480
type: acceptance_criterion
title: 'Backgrounds are section-scoped: only modules that declare one are wrapped'
created_by: xgd
created_at: '2026-07-09T20:34:49.115950+00:00'
updated_at: '2026-07-09T20:34:49.115950+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A background applies only to the module that declares it. When a page is rendered and a single module declares a background while others do not, the rendered page contains exactly one background section wrapper, and modules without a background render unchanged (identical to how they render with no background feature present).

## Verification
Render a page in which exactly one module declares a background. Assert the rendered HTML contains exactly one background section wrapper and that the declared background value appears. Assert modules without a background are not wrapped.
