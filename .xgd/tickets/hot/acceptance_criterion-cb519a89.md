---
uid: acceptance_criterion-cb519a89
id: AC-531
type: acceptance_criterion
title: Measurement jitter is suppressed by default; strict mode and per-metric flags
  adjust tolerances
created_by: xgd
created_at: '2026-07-09T22:59:06.872278+00:00'
updated_at: '2026-07-09T22:59:06.872278+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
By default, sub-pixel / sub-step measurement noise is not reported: font size within ~1px, line-height within a proportional band (larger of a small px floor or ~12% of the expected value), letter-spacing within ~0.5px, padding and left-bar width within ~1px, and a one-step nearest-loaded font-weight snap (e.g. 400↔500) all match. Passing `--strict` zeroes these measurement tolerances for an exact-match pass (colour compared as exact hex), surfacing the otherwise-suppressed jitter. A per-metric flag (e.g. `--line-height-tol`, `--color-tol`, `--weight-tol`) overrides a single tolerance. A genuine off-by-one-step design error (e.g. a two-step weight change 400↔600) still flags under defaults.

## Verification
Diff a draft that differs only by sub-step jitter and assert zero deltas by default; re-run with `--strict` and assert the jitter now surfaces; widen one metric via its flag and assert only that metric's delta is suppressed; assert a two-step weight difference flags under defaults.
