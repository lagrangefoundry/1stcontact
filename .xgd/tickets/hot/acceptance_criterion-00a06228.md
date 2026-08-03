---
uid: acceptance_criterion-00a06228
id: AC-777
type: acceptance_criterion
title: A repeated projection at a seen (engine, width, state) key is evidence, not
  a second ladder cell
created_by: xgd
created_at: '2026-08-03T02:28:44.130626+00:00'
updated_at: '2026-08-03T02:44:34.851920+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
A capture may contain more than one projection at the same `(engine, viewport width, state)` key — a height probe that re-shoots a ladder width at a second viewport height so a viewport-relative extent becomes identifiable. Viewport height is deliberately not part of that key, because it is not what a responsive comparison is about. The diff therefore partitions projections: the **first** projection at a key defines the width-ladder cell, every later projection at that key is evidence and is not diffed as a cell.

Consequently: a capture carrying a height probe produces the same number of diff cells as one without it (no duplicate cell for the re-shot width), and the re-shot width's cell compares the ladder reproduction rather than being overwritten by the probe's taller render (which previously produced 59 phantom deltas on a reproduction that had not changed). The partition applies identically to the reference and reproduction sides.

## Verification
Diff a reference and reproduction whose projections include a second projection at an already-seen `(engine, width, state)` key with a different viewport height and a visibly different render. Assert exactly one cell is emitted for that width, that its reported deltas are those of the first (ladder) projection, and that no delta originating from the probe's render appears. Assert the cell count and contents are unchanged from the same capture with the probe removed.