---
uid: acceptance_criterion-acaea443
id: AC-1312
type: acceptance_criterion
title: Vertical spacing is compared as the gap between adjacent visual rows — one
  wrong gap is one delta
created_by: xgd
created_at: '2026-08-20T04:36:04.887872+00:00'
updated_at: '2026-08-20T05:13:04.041975+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
`values-diff` compares vertical spacing as the **gap between adjacent visual rows**:

- Paired elements carrying a box on both sides are grouped into visual rows by **reference** y-overlap — a row of cards is one row, measured to its lowest bottom — and the gap between each consecutive pair of rows is compared.
- A gap difference beyond tolerance emits a single `gap` delta at **HIGH** severity (visible spacing, not structure-breaking), with a default tolerance of 6px, widened to 16px under `--tolerant`.
- Rows that genuinely **overlap** rather than stack are skipped, so a negative separation is not reported as spacing drift.
- The axis is **drift-free**: one wrong gap yields exactly one delta, where absolute `position` turned the same single cause into a cascade of deltas on every element below it.
- The delta's `expected − actual` is the correction itself — the exact number of pixels to add to or remove from the one spacing knob.

## Verification
Diff a reference against a reproduction that differs by one wrong gap partway down the page, with everything below it consequently shifted; assert the output contains exactly **one** `gap` delta, at HIGH severity, naming the two adjacent rows, and that its `expected − actual` equals the pixel error. Assert a row of side-by-side cards is treated as a single row (one gap to the row above and one to the row below, not one per card). Assert a gap difference within 6px emits nothing, and that the same difference is emitted when the tolerance is tightened / suppressed under `--tolerant` at 16px. Assert two genuinely overlapping rows emit no `gap` delta.