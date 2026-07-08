---
uid: acceptance_criterion-58cbd16f
id: AC-443
type: acceptance_criterion
title: Footer renders a copyright line with a deterministic build-time year and the
  configured holder
created_by: xgd
created_at: '2026-07-08T19:20:50.766476+00:00'
updated_at: '2026-07-08T19:20:50.766476+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Rendering the footer (minimal variant) produces a copyright line containing the configured copyright holder and a year. The year comes from a build-time constant, so rendering the same footer definition repeatedly yields identical copyright text regardless of when it is rendered (the output does not depend on the current wall-clock date).

## Verification
Render the footer with a copyright holder. Assert the output contains a copyright line with that holder and the build-time-constant year, and that repeated renders produce identical copyright text.
