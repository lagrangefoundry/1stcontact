---
uid: acceptance_criterion-a5d256ad
id: AC-1613
type: acceptance_criterion
title: values-diff --multi-viewport projects the draft across every persisted rung
  and reports worst-cell-first
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:53:43.139957+00:00'
updated_at: '2026-09-09T23:53:43.139957+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
`values-diff --multi-viewport` is the **ladder-wide** mode: rather than asking the
caller which width to judge, it projects the served draft across **every** rung the
reference bundle persisted, diffs **cell-for-cell** (one cell per element × width),
and reports **worst-cell-first** — a cell the reproduction never projected leads as a
coverage gap, then the remaining cells by descending severity of their worst delta.
The rung where the reproduction is furthest off therefore leads the report whether or
not the caller suspected it, and a clean cell collapses to a single line rather than
padding the output.

Like the `--size` path (AC-641) it **fails loud rather than degrading**: against a
bundle carrying no persisted ladder the command terminates with the re-capture
instruction and emits no report, instead of quietly collapsing to the desktop-only
comparison the caller did not ask for.

This is the mode the reproduction work was actually driven with, and the mode whose
cell counts the noise-audit tolerances were calibrated against; `--collapse` and
`--clusters` are reporting layers over its output.

## Verification
Run `values-diff --multi-viewport` against a bundle with a persisted ladder and a
reproduction that is correct at the wide rungs but reflows at a narrow one. Assert one
cell per persisted rung is diffed — the widths matching the bundle's ladder, none
skipped — and assert the narrow rung leads the report without the caller naming it.
Assert a rung the reproduction never projected is reported as a missing cell ahead of
the failing ones rather than counted clean, and that clean cells each collapse to one
line. Then run the same command against a bundle with no persisted ladder and assert
it terminates with the re-capture message, emitting no report.
