---
uid: report-81cf329f
id: REPORT-494
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-13T19:57:05.724173+00:00'
updated_at: '2026-07-13T19:57:05.724173+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-74050e88
---

All 7 UATs pass and every test name matches the enforced `^test_UAT_AC\d+_\w+$` pattern. One UAT per acceptance criterion, grounded in both the AC specs and the existing implementation (`diffManifests` + `formatReport` in `tools/generate/src/cli/capture/values-diff.ts` and `fidelity.ts`).

```
UATs generated for story story-74050e88 (plan item 1 of 8)

Story: story-74050e88
Test file(s) created:
  - tests/reconciliation-object-grouped-report.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

test_files_created:
  - "tests/reconciliation-object-grouped-report.test.ts"
```

**AC → UAT mapping** (one per AC):

| AC | Test | Verifies |
|----|------|----------|
| AC-575 | `test_UAT_AC575_groups_deltas_into_one_card_per_object_worst_first` | One card per reference object; full fixed param table both columns; only differing axes flagged; worst-object-first ordering |
| AC-576 | `test_UAT_AC576_box_is_present_and_flagged_on_every_card` | `box {x,y w×h}` row present on every card; flagged on position drift, matched when identical |
| AC-577 | `test_UAT_AC577_reports_both_unpaired_directions_with_counts_and_labels` | Loud unpaired reporting both directions with counts + labels |
| AC-578 | `test_UAT_AC578_expected_column_is_pasteable_spec_value` | Expected column carries raw spec-unit value (`72`) under spec param name (`fontSizePx`) |
| AC-579 | `test_UAT_AC579_image_and_control_carry_own_tables` | Image (fit/aspect/box) and control (name/nameSource/box) kind-specific tables, mismatches flagged |
| AC-580 | `test_UAT_AC580_clean_count_tail_section_and_no_deltas` | Clean objects collapse to a count; section delta in tail; no-value-deltas line when fully matching |
| AC-581 | `test_UAT_AC581_structured_report_has_cards_and_unpaired_collection` | Machine-readable `report.objects` (param rows incl. box, mismatch flags, count, severity) + distinct `unpairedActual` collection |

**Notes for the reconciliation flow:**
- No runtime code was modified, no existing tests or tickets touched — only the new AC-named file was created.
- The tests are pure/browser-free, mirroring the existing `req51-object-grouped-report.test.ts` FC patterns exactly (imports, `textEl`/`fieldEl`/`mani` helpers, boundary via `diffManifests`/`formatReport`).
- Test run required building the workspace packages first (`pnpm -r build` — `packages/site-schema/dist` was absent), which affects the pre-existing FC test too; not a defect in these tests.
- The existing `test_UAT_FC_REQ-51_*` file remains on disk — renaming/deleting it to satisfy the FC-orphan invariant is the reconciliation review phase's responsibility, not this UAT-generation step's.
