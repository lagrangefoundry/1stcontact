---
uid: acceptance_criterion-e6770d1c
id: AC-2039
type: acceptance_criterion
title: check_fidelity returns 1c gate's full reconciled report over the real bundle,
  naming one of five verdicts
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:58.437975+00:00'
updated_at: '2026-10-30T20:12:02.544707+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`check_fidelity(actual, reference)` judges an actual picture against a named captured reference. It runs four checks over the real bundle: the structural gate, the reference-coverage check, the perceptual comparison and the value gates. It returns the same reconciled report that `1c gate` produces for those inputs:
- `verdict`: exactly one of `pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`, `unexplained-disagreement`.
- `diagnosis`: a non-empty string.
- `nextStep`: a non-empty string.
- `pass`: a boolean, true only for `pass`.
- `floor`: the perceptual floor (mean and pct), equal to the gate's defaults.
- `perceptual`: mean difference, percent over threshold and region count.
- `values`: delta count, matched and unmatched.
- `coverage`: mirrored, referenced and unreferenced images, sections, px per section and findings, all read from the bundle itself.

## Verification
**Setup.** Seed a reference bundle with one mirrored asset and a screenshot, in an on-disk reference store. Serve an identical draft. The live-page read the browser returns is a fixed set of value signals.

**The assistant's call.** Call `check_fidelity` through the composed Toolbox, with `actual` = draft and `reference` = the bundle name. The result must be a non-error rendering inside the untrusted-content frame.

**The CLI's call.** Run `1c gate --json` (`cli.run`) against that same bundle directory. Hand it two inputs:
- the same draft bytes, as `--actual-image`;
- the same live-page read, flattened into a value manifest, as `--actual-manifest`.

**Assert the two reports are the same judgement.** These fields must be equal: `verdict`, `pass`, `diagnosis`, `nextStep`, `floor`, `values`, the perceptual region count, and every coverage field the surface returns. The perceptual mean and percent must also agree, at the two decimal places the CLI reports.

**Also assert:**
- `verdict` is in the five-value set.
- `diagnosis` and `nextStep` are non-empty.
- `floor` equals the gate's default floor.
- The perceptual mean and percent are 0.
- `values` carries deltas and matched.
- `coverage.mirroredImages` equals 1, which proves coverage read this bundle.
