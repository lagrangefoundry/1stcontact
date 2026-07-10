---
uid: acceptance_criterion-c480ed31
id: AC-550
type: acceptance_criterion
title: A well-formed module passes conformance with no false-positive violation
created_by: xgd
created_at: '2026-07-10T00:15:02.544913+00:00'
updated_at: '2026-07-10T00:15:02.544913+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
A well-formed module rendered with ordinary content completes the conformance check without throwing and reports zero violations — in both the safety dimension and the security dimension with schema-derived benign content. The discriminator does not false-positive on a clean render.

## Verification
Run the check against a real catalog module with ordinary content (default/safety dimension) and against the same module with schema-derived benign content (security dimension); assert both complete without throwing.
