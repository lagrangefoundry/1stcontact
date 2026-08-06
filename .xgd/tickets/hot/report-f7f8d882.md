---
uid: report-f7f8d882
id: REPORT-1372
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T03:38:03.870316+00:00'
updated_at: '2026-08-06T03:38:03.870316+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-8685be2d
---

All 12 UATs pass and the new file typechecks clean.

## Completion Report

```
UATs generated for story story-8685be2d (plan item 10 of 12)

Story: story-8685be2d
Test file(s) created:
  - tests/reconciliation-font-provenance.test.ts

Tests written: 12
Tests passed: 12
Tests failed: 0

test_files_created:
  - "tests/reconciliation-font-provenance.test.ts"
```

**Coverage — one UAT per AC (12 ACs, 12 tests):**

| AC | Test | Boundary exercised |
|---|---|---|
| AC-857 | `..._record_entries_state_origin_licence_and_files_or_are_rejected` | `validateFontRegistry` over the shipped `fonts/registry.yaml` + 4 damaged candidates; bare/quoted/`Date` date normalisation |
| AC-858 | `..._unregistered_family_fails_and_exits_non_zero` | `cmdFontsCheck` + real CLI `run(['fonts','check'])` exit status |
| AC-859 | `..._recorded_family_with_unlisted_file_fails_naming_that_file` | per-file join; message names the unlisted weight only |
| AC-860 | `..._unreferenced_font_file_fails_and_derived_trees_are_not_scanned` | on-disk scan; `storage/dist` + `storage/node_modules` excluded, finding not doubled |
| AC-861 | `..._product_distribution_requires_settled_yes_redistribution` | 4-way matrix: unresolved/settled-no/settled-yes × internal/product |
| AC-862 | `..._site_definition_declares_internal_or_product_or_nothing` | `validateSite` accepts internal/product/absent, rejects other; absent → looser bar in the gate |
| AC-863 | `..._outstanding_actions_warn_with_family_actions_and_sites` | advisory channel: pass + one warning with verbatim actions and `usedBy` |
| AC-864 | `..._broken_record_stops_the_run_rather_than_passing_vacuously` | absent / unparseable / contract-invalid / duplicate family — each throws and exits non-zero |
| AC-865 | `..._scans_tracked_and_scratch_trees_and_attributes_violations` | `sites/` + `sandbox/` in one run, violation attributed to tree + slug |
| AC-866 | `..._reference_forms_reduce_to_the_recorded_file_key` | 6 reference forms → same key; query-bearing reference passes end-to-end |
| AC-867 | `..._report_states_families_references_and_files_scanned` | real project run passes with non-zero counts; rendered summary states all three; failing render carries kind/message/hint |
| AC-868 | `..._json_mode_emits_one_document_whose_flag_matches_the_exit_status` | CLI `--json` over a passing and a failing project; single document, empty stderr, flag agrees with exit code |

**One pre-existing failure observed** (not mine, not modified): `tests/req101-font-registry.test.ts::test_UAT_FC_REQ-101_shipped_registry_accounts_for_every_font_file_in_the_repo` fails in this worktree. It asserts the record's files are a *subset* of bytes on disk, and this worktree's `storage/` holds only `sites/` — the capture-derived faces the record lists live in trees absent here. No AC asserts that direction (the ACs demand on-disk ⊆ recorded, which holds), so this is an FC-test artifact for the reconciliation review to rename or delete under the FC orphan invariant.
