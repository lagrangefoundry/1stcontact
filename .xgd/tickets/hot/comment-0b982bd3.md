---
uid: comment-0b982bd3
id: COMMENT-569
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-29T04:30:46.041385+00:00'
updated_at: '2026-07-29T04:30:46.041385+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-936d1662
  kind: note
---

Done. All four UATs pass on first run, with no self-corrections needed.

```
UATs generated for story story-24098299 (plan item 3 of 5)

Story: story-24098299
Test file(s) created:
  - tests/reconciliation-3probe-gate-evaluator.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-3probe-gate-evaluator.test.ts"
```

**AC → test mapping (this file)**

| AC | Test |
|---|---|
| AC-734 | `test_UAT_AC734_row_tiles_along_main_axis_with_no_false_overflow` |
| AC-735 | `test_UAT_AC735_reflow_at_a_captured_breakpoint_does_not_cascade` |
| AC-736 | `test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips` |
| AC-737 | `test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel` |

Boundaries exercised: `evaluateLayout` / `foldToL1` / `sampleFidelityProbe` on the `tools/generate/src` surface, `cmdL1Gate` on the command surface, and `run(argv)` on the `1c` CLI surface (human-readable **and** `--json` output). No internal mocking; the only synthetic input is a capture bundle written to a temp dir. AC-735 includes the AC's counterfactual — a test-local closed-upper-bound resolver, asserted to return the stale pre-reflow frame the real evaluator no longer returns. AC-736 asserts the surface/content boxes genuinely intersect and that a real overlap was seen, so the exclusion assertions aren't vacuous.

Verification: new file passes (4/4); adjacent suites re-run green — `reconciliation-3probe-gate`, `bug6/7/8/9/11`, `req86/88/92`, `reconciliation-l1-fold`, `reconciliation-responsive-diff` (46 tests). `tsc --noEmit` reports no errors in the new file (the repo's root config has pre-existing errors in unrelated files). Root `eslint` has no flat config, so lint runs via the quality plugin's `source_dirs`, which don't include `tests/`.

**Two scoping notes for the downstream review step:**

1. **Only 4 of the story's 11 ACs are covered here.** AC-705, 706, 707, 708, 709 and 724 already have AC-named UATs in the pre-existing `tests/reconciliation-3probe-gate.test.ts`. The "no existing test modifications" constraint meant I could not extend that file, and duplicating those test names in a second file would break the 1:1 test→AC link.

2. **Consequence — a real coverage gap I could not close.** This bundle *extended* the bodies of AC-705/706/707/709 with clauses their existing UATs predate:
   - AC-705: non-text (image/box) pairing by kind + occurrence index, and non-text unmatched entries
   - AC-706/707: envelope probes on the recovered overlay of a **real multi-region capture**
   - AC-709: region-aware **recursive** promotion reporting multiple nested paths

   That evidence currently exists only in the FC files pending rename — `tests/bug9-region-aware-promote.test.ts` and `tests/req92-image-box-fold.test.ts`. If review deletes those as redundant rather than renaming them, those clauses lose coverage. They need either a rename onto the relevant AC or an extension of `tests/reconciliation-3probe-gate.test.ts`, which was out of scope for this step.
