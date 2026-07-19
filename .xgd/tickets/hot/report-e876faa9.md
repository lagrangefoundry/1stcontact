---
uid: report-e876faa9
id: REPORT-627
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-19T02:48:10.716800+00:00'
updated_at: '2026-07-19T02:48:10.716800+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-16f2793c
---

All 8 UATs pass and every test name matches the enforced `^test_UAT_AC\d+_\w+$` pattern. No runtime code or existing tests were modified — only the new file was created.

```
UATs generated for story story-16f2793c (plan item 3 of 8)

Story: story-16f2793c
Test file(s) created:
  - tests/reconciliation-size-aware-diff.test.ts

Tests written: 8
Tests passed: 8
Tests failed: 0

test_files_created:
  - "tests/reconciliation-size-aware-diff.test.ts"
```

**AC → UAT mapping (1:1, all 8 ACs of the story):**

| AC | UAT | What it proves against the code |
|----|-----|--------------------------------|
| AC-639 | `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` | `cmdValuesDiff` with `--size` reads the ladder projection at that width (`expectedSource` names it); a wordmark that only reflows at mobile flags a `size` delta at `--size mobile` yet reports clean at `--size desktop`. |
| AC-640 | `test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands` | Without `--size`, `values-diff` compares against `capture.json` (no `multistate.json` present) and `diff` compares against `screenshot.full.png` — the pre-size single-width path, no ladder/per-width read required. |
| AC-641 | `test_UAT_AC641_values_diff_size_fails_loudly_when_bundle_has_no_ladder` | A bundle with no `multistate.json` rejects with a re-capture message and writes no report. |
| AC-642 | `test_UAT_AC642_values_diff_size_fails_loudly_and_names_available_widths` | A mobile-only ladder rejects a desktop diff, naming both the requested width and the width the ladder carries. |
| AC-643 | `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` | `cmdDiff --size tablet` uses `screenshot-<tabletWidth>.png` (not `screenshot.full.png`), so a desktop-only difference doesn't contaminate the tablet report. |
| AC-644 | `test_UAT_AC644_pixel_diff_size_fails_loudly_without_same_width_reference` | A bundle with only the desktop shot rejects a `--size mobile` diff, naming the missing `screenshot-<width>.png` + re-capture, and writes no `regions.json`. |
| AC-645 | `test_UAT_AC645_invalid_size_rejected_naming_accepted_vocabulary` | Through the real CLI `run()`, `--size phone` on both `values-diff` and `diff` rejects naming `phone` and `mobile\|tablet\|desktop`, with no report written. |
| AC-647 | `test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes` | `cmdCapturePage` (fake driver) writes one `screenshot-<width>.png` per `RESPONSIVE_VIEWPORTS` rung beside `screenshot.full.png`; the image-byte marker appears in the PNG siblings but never in `multistate.json`. |

Tests are offline (in-memory ladder, injected `--actual` manifest/PNG, fake `BrowserDriver`), matching the story's stated approach and the existing `req61-*` test patterns exactly (isolation via temp dirs, no writes to the project `.xgd/`).
