---
uid: acceptance_criterion-7ccfc613
id: AC-778
type: acceptance_criterion
title: Behavioural control facts are excluded from the painted comparison
created_by: xgd
created_at: '2026-08-03T02:28:48.106660+00:00'
updated_at: '2026-08-03T02:44:34.689601+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
A captured form control carries behavioural facts that no painted axis can hold — its control type (the resolved input type / textarea) and its enclosing form's action. These describe behaviour, not paint, and are excluded from the painted comparison: a difference in either **never** produces a delta, and their presence or absence never changes any other axis's outcome. They remain available to the consumers that need them (form composition and module configuration).

## Verification
Diff two manifests identical except that the paired control's captured control type and form action differ (and again where one side records them and the other does not). Assert no delta is reported in either case, and that the axes actually compared for that control (geometry, surface, border, shape) report exactly as they do when the behavioural facts match.