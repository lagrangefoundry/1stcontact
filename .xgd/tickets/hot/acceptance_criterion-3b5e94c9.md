---
uid: acceptance_criterion-3b5e94c9
id: AC-586
type: acceptance_criterion
title: The tolerant opt-out restores loose matching on every default-exact axis
created_by: xgd
created_at: '2026-07-13T20:00:57.911731+00:00'
updated_at: '2026-07-13T20:00:57.911731+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
When the comparison is run with the single tolerant opt-out, every axis that is
exact by default reverts wholesale to its prior loose band. Differences that fail
by default — e.g. a 1px font-size difference, a small near-neighbour colour drift,
or an element position offset under the old ~24px band — produce no delta under
the opt-out. This is a single switch, not a per-axis one, and it is the only
blanket loosening control.

## Verification
Take a reference/reproduction pair that reports multiple deltas by default
(covering a Group A axis and a Group B axis within the old loose bands). Re-run
the same comparison with the tolerant opt-out and assert those deltas are no
longer reported.
