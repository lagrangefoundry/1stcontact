---
uid: acceptance_criterion-ab316d33
id: AC-600
type: acceptance_criterion
title: A run's typography style and position combine losslessly
created_by: xgd
created_at: '2026-07-13T20:23:28.744147+00:00'
updated_at: '2026-07-13T20:29:23.111969+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
When a positioned object also carries intrinsic typography styling (family,
size, weight, colour, tracking, leading, gradient), both the resolved typography
declarations and the coordinate placement values render as valid, separate CSS
declarations. The coordinate values are neither fused onto nor consumed by the
final typography declaration, so no declaration is dropped or corrupted.

## Verification
Render a positioned heading that also sets typography (e.g. an explicit
line-height and a position). Confirm the typography declaration and the first
coordinate value each appear as their own valid declaration (e.g. the
line-height value is not fused with the leading `x` coordinate), so both the
style and the placement take effect.