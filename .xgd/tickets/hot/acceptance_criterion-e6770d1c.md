---
uid: acceptance_criterion-e6770d1c
id: AC-2039
type: acceptance_criterion
title: check_fidelity returns 1c gate's full reconciled report over the real bundle,
  naming one of five verdicts
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:58.437975+00:00'
updated_at: '2026-10-27T21:13:42.941317+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`check_fidelity(actual, reference)` judges an actual picture against a named captured reference. It runs the structural gate, the reference-coverage check, the perceptual comparison and the value gates over the real bundle. It returns the same reconciled report `1c gate` produces for those inputs:
- `verdict`: exactly one of `pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`, `unexplained-disagreement`.
- `diagnosis`: a non-empty string.
- `nextStep`: a non-empty string.
- `pass`: a boolean, true only for `pass`.
- `floor`: the perceptual floor (mean and pct), equal to the gate's defaults.
- `perceptual`: mean difference, percent over threshold and region count.
- `values`: delta count, matched and unmatched.
- `coverage`: mirrored, referenced and unreferenced images, sections, px per section and findings, read from the bundle itself.

## Verification
Seed a reference bundle with one mirrored asset and a screenshot. Serve an identical draft. Call `check_fidelity` with `actual` = draft and `reference` = the bundle name. Assert:
- `verdict` is in the five-value set.
- `diagnosis` and `nextStep` are non-empty.
- `floor` equals the gate's default floor.
- Perceptual mean and percent are 0.
- `values` carries deltas and matched.
- `coverage.mirroredImages` equals 1, which proves coverage read this bundle.