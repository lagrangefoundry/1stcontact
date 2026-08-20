---
uid: comment-dfc0ac2b
id: COMMENT-1314
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T13:48:28.206983+00:00'
updated_at: '2026-08-20T13:48:28.206983+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-906d32ce
  kind: note
---

Report **report-906d32ce** (REPORT-2449) filed.

## This call

Call 1 closed all seven `uat-edit` findings. This call started the eight `uat-add` findings and closed **four** of them. All eight belong to `story-8acc338d`, so the tests went into one new suite following the existing per-upgrade-span file convention: `tests/reconciliation-l1-fold-measured-axes.test.ts` — the criteria whose shared shape is *an axis the fold measures off the reference rather than authoring*.

| AC | Test | Clause the FC suites didn't cover |
|---|---|---|
| AC-1345 | `test_UAT_AC1345_section_background_box_folds_on_image_or_scrim` | **Per-axis widest read** — image only at 1440, veil only at 768 → one box carrying both |
| AC-1346 | `test_UAT_AC1346_per_side_padding_folds_and_a_varying_side_earns_a_track` | Padding on all three leaf kinds from fixtures (the FC fold check is gated on a gitignored reference bundle) |
| AC-1347 | `test_UAT_AC1347_nowrap_threshold_is_the_measured_single_line_suffix` | Suffix rule, unmeasurable-breaks-the-suffix, and the below-threshold render together |
| AC-1352 | `test_UAT_AC1352_probe_pair_folds_a_measured_snapped_height_response` | **Snapping** in both directions (199.5/200 → exactly 1; 60/200 carried as 0.3) and the same-height-pair refusal |

Each AC's `uat_coverage` moved `fail` → `pass` in the same call as its test — 8 mutations total.

## Verification

New suite: 4/4 passing. Regression check across the eight AC-named reconciliation suites plus the three FC suites I sourced from: **11 files, 72 passed, 3 skipped**. The skips are pre-existing and not something these assertions lean on — two browser-gated, one gated on the gitignored `storage/references/` bundle; everything I added runs headlessly. The new file typechecks clean under `tsconfig.base.json`.

Two fixture calibrations, neither a defect: a folded standalone surface is identified by its `box-*` id (my first predicate matched the root box), and the section-background fold only keyframes widths where that section actually painted — so the split-axis fixture keyframes at `[768, 1440]`, which the test now asserts explicitly.

No code edits, no `needs_review` items.

## Remaining

4 violations: AC-1348 (seam config derivation), AC-1349 (`1c repro --ref` materialization), AC-1350 (content-column recovery), AC-1351 (per-axis column anchoring). AC-1350 and AC-1351 share a fixture family and go in the measured-axes suite; AC-1348 and AC-1349 are CLI-surface and want their own file.
