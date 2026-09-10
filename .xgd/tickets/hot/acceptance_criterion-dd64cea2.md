---
uid: acceptance_criterion-dd64cea2
id: AC-1614
type: acceptance_criterion
title: --collapse deduplicates cell rows to one row per defect; the per-cell view
  stays the default
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:53:47.357080+00:00'
updated_at: '2026-09-10T00:40:16.231640+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
`--collapse` reports **per defect, not per cell**. A single real defect that
reproduces at all six rungs is one defect seen six times, not six defects: the cell
rows are deduplicated to one row per distinct defect — keyed on the element and the
property it fired on — so the ×N-viewport multiplier stops inflating the count and the
report's headline number is a count of *things to fix*. Each surviving row carries the
set of widths it fires at, the reference value to transcribe, and the worst tier it
reached across those widths.

The **un-collapsed cell view remains the default**: `values-diff --multi-viewport`
without the flag keeps the per-cell rows and their width attribution, because which
rungs a defect appears at is itself diagnostic — a defect present only at the narrow
rungs is a breakpoint problem, not a value problem, and collapsing that away by
default would hide the distinction the ladder exists to expose.

## Verification
Diff a reproduction whose one defect fires identically at every rung of a
multi-viewport run. Assert the un-collapsed run reports one row per rung (the default,
with no flag), and that the same run with `--collapse` reports exactly one row whose
width list names every rung. Then give a second defect that fires at the narrow rungs
only: assert its collapsed row carries just those widths, distinguishing it from the
all-width one, and assert the collapsed headline count is the number of distinct
defects rather than the number of cells.