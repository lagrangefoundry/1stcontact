---
uid: acceptance_criterion-e7ed430e
id: AC-615
type: acceptance_criterion
title: A systemic subscale gap is reported as one theme finding, rolling up its per-element
  rows
created_by: xgd
created_at: '2026-07-13T20:49:22.538612+00:00'
updated_at: '2026-07-13T20:57:03.439413+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
When a badge or checklist subscale differs between the reference and the reproduction, the fidelity value-diff report contains exactly one theme-level finding for that named subscale — stating the differing axes with reference-vs-reproduction values and the number of elements it explains — and the individual per-element badge/checklist rows explained by that gap are suppressed (rolled up) from the report, with the count of rolled-up rows recorded. Per-element deltas that are not explained by the subscale gap remain in the report.

## Verification
Diff a reproduction whose badge and checklist subscales differ systemically from the reference and confirm the report shows one theme-level finding per differing subscale, the explained per-element rows are absent, the rolled-up count is reported, and unrelated deltas still appear.