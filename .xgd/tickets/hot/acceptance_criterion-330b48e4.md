---
uid: acceptance_criterion-330b48e4
id: AC-705
type: acceptance_criterion
title: Sample-fidelity probe matches reproduced boxes to the oracle at every captured
  width within tolerance
created_by: xgd
created_at: '2026-07-22T20:07:08.347043+00:00'
updated_at: '2026-07-23T06:35:01.145350+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Given a reproduced site definition and its retained capture oracle, the sample-fidelity
probe reports pass = true with an empty residual list and an empty unmatched list
exactly when, at every captured width, each reproduced text run's box (x, y, width) is
within the per-axis tolerance (default 2px) of the corresponding oracle box.

- Any reproduced run whose box exceeds tolerance on any axis is reported as a residual
  carrying the run text, the width, and the per-axis deltas (dx, dy, dw).
- Any oracle sample that has no matching reproduced run at that width is reported as an
  unmatched entry (text, width).
- If either the residual list or the unmatched list is non-empty, pass = false.
- The report also exposes the largest observed per-axis delta.

## Verification
Fold a fixture multi-width capture into a reproduced document and run the probe against
the same capture as oracle: assert pass = true, empty residuals, empty unmatched, and
max delta within tolerance, and that all captured widths were checked. Perturb one
reproduced box beyond tolerance and assert it surfaces as a residual with the correct
deltas and pass = false; drop a run and assert it surfaces as unmatched.