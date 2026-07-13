---
uid: acceptance_criterion-a339f2a0
id: AC-616
type: acceptance_criterion
title: Opt-out restores the rolled-up per-element subscale rows
created_by: xgd
created_at: '2026-07-13T20:49:41.343734+00:00'
updated_at: '2026-07-13T20:57:03.334274+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
When the fidelity value-diff is run with the keep-subscale-detail opt-out enabled, the same systemic subscale gap still surfaces its theme-level finding, but the individual per-element badge/checklist rows it explains are NOT rolled up — they appear in the report as individual deltas for debugging.

## Verification
Diff the same systemically-differing reproduction with the opt-out enabled and confirm the per-element badge/checklist rows that were suppressed by default are present.