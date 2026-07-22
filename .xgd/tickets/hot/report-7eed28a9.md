---
uid: report-7eed28a9
id: REPORT-738
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T20:25:46.563378+00:00'
updated_at: '2026-07-22T20:25:46.563378+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-75
---

All green. Every test passes and names match the enforced convention.

## Summary

STORY-75 has **10 ACs**. AC-629–633 were already covered with proper `test_UAT_AC{N}` names in the existing `tests/reconcile-values-diff-fidelity.test.ts`. I wrote UATs for the **5 remaining ACs** (AC-711–715) in a new file, giving the story complete, non-duplicated AC coverage. Each UAT drives the exported `diffManifests` engine (the same code path the `1c values-diff` CLI runs) and asserts both the delta-surfaces and the matching/absent-is-inert legs the ACs require.

All tests pass against the existing code — no runtime code changed, no existing tests modified.

```
UATs generated for story STORY-75 (plan item 5 of 9)

Story: STORY-75
Test file(s) created:
  - tests/reconcile-values-diff-treatments.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconcile-values-diff-treatments.test.ts"
```

AC → test mapping (new file):
- **AC-711** → `test_UAT_AC711_typography_treatments_and_list_marker_per_run` — font-style / decoration / transform / small-caps at MEDIUM + list marker; matching & field-absent inert
- **AC-712** → `test_UAT_AC712_element_effects_captured_and_compared` — backdrop-filter/outline presence, blend mode & pseudo-content values, opacity (LOW) exact + `--tolerant` band
- **AC-713** → `test_UAT_AC713_border_line_style_and_capture_on_text_runs` — style folded into border delta label; style-absent inert; border on a text run
- **AC-714** → `test_UAT_AC714_object_position_crop_compared_exactly` — top vs centre crop delta; matching & field-absent inert
- **AC-715** → `test_UAT_AC715_reference_fout_does_not_flag_correct_render` — reverse FOUT direction not flagged; forward fallback still a defect

Note: AC-629–633 are intentionally **not** re-covered here — they already have `test_UAT_AC629`–`AC633` tests in `tests/reconcile-values-diff-fidelity.test.ts`, so duplicating them would violate the 1:1 AC→test mapping.
