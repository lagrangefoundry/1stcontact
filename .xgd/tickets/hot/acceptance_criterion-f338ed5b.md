---
uid: acceptance_criterion-f338ed5b
id: AC-634
type: acceptance_criterion
title: Text-fill gradient stop-position drift surfaces as a gradient delta
created_by: xgd
created_at: '2026-07-19T02:28:26.733969+00:00'
updated_at: '2026-07-19T02:28:26.733969+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
---

## Criterion
When two paired text runs each carry a text-fill gradient with the same stop colours and the same direction, but a colour stop's captured position offset differs between the two sides by more than the position tolerance (default 2 percentage points), `values-diff` reports a gradient delta for that run. When every stop's offsets are within the tolerance, no gradient delta is reported for the run.

## Verification
Diff a reference and a reproduction whose wordmark gradient share stop colours and direction, but a middle stop sits at ~60% on one side and ~40% on the other. Assert the output contains a gradient delta for that run. Re-diff with the two offsets within 2 percentage points of each other and assert no gradient delta is reported.
