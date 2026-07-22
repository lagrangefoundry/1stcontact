---
uid: report-20b985d0
id: REPORT-726
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T19:49:44.828310+00:00'
updated_at: '2026-07-22T19:49:44.828310+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-8acc338d
---

All 8 tests pass and every name matches the enforced `^test_UAT_AC\d+_\w+$` pattern.

```
UATs generated for story story-8acc338d (plan item 2 of 9)

Story: story-8acc338d
Test file(s) created:
  - tests/reconciliation-l1-fold.test.ts

Tests written: 8
Tests passed: 8
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-fold.test.ts"
```

**One UAT per acceptance criterion, all grounded in existing code and passing:**

| Test | AC | Boundary exercised |
|---|---|---|
| `test_UAT_AC689_capture_emits_one_validated_l1_document` | AC-689 | `cmdCapturePage` → bundle `l1.json` validates against `validateL1`, `widths === LADDER`, root is a `box`; `foldToL1` on an empty ladder throws explicitly |
| `test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle` | AC-690 | `multistate.json` retained alongside the fold; oracle widths == folded doc's declared widths |
| `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | AC-691 | `foldToL1` keyframe `.at`/`x`/`y`/`width` equal the captured box per width; axes taken from widest sample |
| `test_UAT_AC692_fluid_folds_interpolate_reflow_folds_snap` | AC-692 | fluid node segment `interpolate`, reflowing node segment `snap` |
| `test_UAT_AC693_subrange_node_carries_bounded_visibility_rule` | AC-693 | subrange node → `visibility.fromPx`; all-widths node → no rule |
| `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | AC-694 | `hints.json` written with ascending breakpoints + percent unit (always); real-Chromium branch asserts parent flex layout + `justify-content` (skips cleanly if engine absent) |
| `test_UAT_AC695_folded_document_renders_without_hint_sidecar` | AC-695 | `renderL1Document(doc)` produces html/css with no hint sidecar in scope |
| `test_UAT_AC696_adopt_values_command_removed` | AC-696 | `adopt-values` → exit 1 "Unknown command", no exported symbols; `adopt-gaps` still recognized + exported |

**Notes for downstream:**
- No runtime code was modified and no existing test files were touched — only the new file was created.
- The existing `tests/req83-capture-to-l1-fold.test.ts` still holds the `test_UAT_FC_REQ-83_*` free-coded tests. The FC-orphan gate in the review phase will need to reconcile those (rename/delete) — they are the pre-reconciliation evidence these AC tests now supersede.
