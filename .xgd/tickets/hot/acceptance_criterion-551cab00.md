---
uid: acceptance_criterion-551cab00
id: AC-1440
type: acceptance_criterion
title: The displayed amount is exact, including at the top of the numeric range and
  for negative amounts
created_by: xgd
created_at: '2026-08-31T12:39:12.489803+00:00'
updated_at: '2026-08-31T12:47:20.901788+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

Every minor unit of the supplied amount appears in the output. An amount large
enough that dividing it by its scale would lose precision still renders its
final minor unit correctly — no unit is dropped or rounded away anywhere in the
range of integers the platform can represent exactly.

A negative amount renders as a negative amount using the locale's own convention
for showing a negative money value, and its magnitude is scaled and grouped
exactly as the equivalent positive amount would be.

## Verification

Format an amount at the top of the exactly-representable integer range in a
two-minor-unit currency and assert the full string, including the final
fractional digit that a floating-point division would lose. Separately format a
negative amount and assert the exact string, confirming both the sign and the
unchanged magnitude.