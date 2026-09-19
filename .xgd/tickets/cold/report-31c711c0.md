---
uid: report-31c711c0
id: REPORT-839
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=uat)'
created_by: xgd
created_at: '2026-07-23T10:39:44.460051+00:00'
updated_at: '2026-07-23T10:39:44.460051+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: uat
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (BUNDLE-6; reproduces REQ-61, also carries REQ-58/59/62) | free_and_reconciled | merged_at_commit 7a42e182 | Established 1c size-aware diffing: shared `--size` selector on `values-diff` + pixel `diff`, per-viewport reference screenshots at capture, and the downstream `responsive-diff` cross-size N-way table + classifier (incl. `--json` and `--out` output modes) | YES |

Both stories (STORY-77, STORY-78) and the capability carry `intent_uid=bundle-ab9e0cb6`; no other intent has touched this tree. Single reconciled intent → trivially chronological ledger. Level cascade: story (REPORT-835) PASS and ac (REPORT-838) PASS, so the AC layer is the working reference; intent consulted only to confirm the `--out` behavior below is genuine reconciled scope (it is — named verbatim in the STORY-78 In-scope list).

## Alignment Ledger

Per test (uat level): which AC each UAT proves, and whether it substantively exercises that AC.

| Element (UAT) | AC | Outcome |
|---|---|---|
| test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width | AC-639 | aligned — invokes `cmdValuesDiff({size})`; asserts reference read from ladder at selected width; mobile %-vs-fixed reflow flags, desktop clean |
| test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands | AC-640 | aligned — exercises both `cmdValuesDiff` and `cmdDiff` default (no-`--size`) paths |
| test_UAT_AC641_values_diff_size_fails_loudly_when_bundle_has_no_ladder | AC-641 | aligned — asserts throw `/multistate.json…re-capture/` and no report written |
| test_UAT_AC642_values_diff_size_fails_loudly_and_names_available_widths | AC-642 | aligned — asserts error names requested width + available widths |
| test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference | AC-643 | aligned — asserts `report.ref` is the per-width screenshot, mean≈0 |
| test_UAT_AC644_pixel_diff_size_fails_loudly_without_same_width_reference | AC-644 | aligned — asserts throw naming missing `screenshot-<w>.png` + re-capture, no artifacts |
| test_UAT_AC645_invalid_size_rejected_naming_accepted_vocabulary | AC-645 | aligned — both commands via `run(argv)`; rejects `phone`, names vocabulary, no report |
| test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes | AC-647 | aligned — drives `cmdCapturePage` with fake driver; asserts per-width PNGs present, matrix byte-free |
| test_UAT_AC648_produces_nway_table_with_default_size_columns | AC-648 | aligned — `run(['responsive-diff','--json'])`; asserts 3 default columns + per-node cells |
| test_UAT_AC649_sizes_flag_selects_and_orders_columns_and_rejects_unknown | AC-649 | aligned — asserts `--sizes` selects/orders; also rejects unknown token |
| test_UAT_AC650_partitions_changed_steady_and_flags_presence_flips | AC-650 | aligned — asserts changed/steady partition, presence flip, sub-pixel jitter → steady |
| test_UAT_AC651_aligns_repeated_identical_text_in_document_order | AC-651 | aligned — asserts two distinct rows for repeated text, occurrence-by-occurrence |
| test_UAT_AC652_classify_labels_moves_and_groups_structural_first | AC-652 | aligned — asserts value-step/layout-swap/presence-flip labels + structural-first grouping |
| test_UAT_AC653_terminal_fails_on_stale_reference_with_recapture_guidance | AC-653 | aligned — asserts throw `/multistate.json…re-capture/`, no table emitted |
| test_UAT_AC654_terminal_fails_on_uncaptured_width_listing_available_widths | AC-654 | aligned — asserts throw naming missing width + available widths, no partial table |
| test_UAT_AC655_json_is_parseable_and_ref_is_required | AC-655 | aligned — asserts `--json` parses; missing `--ref` → non-zero exit, no stdout |
| — (none) — | **AC-721** (`--out` persists N-way table) | **GAP — no substantive UAT exists** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-721 (acceptance_criterion-1dc0667c) under STORY-78 (story-2c7069fe) | uat-add | AC-721 asserts `responsive-diff --out <file>` persists the raw N-way table to a named file (independent of `--classify`/`--json`). This behavior is reconciled intent (bundle-ab9e0cb6, free_and_reconciled — the STORY-78 In-scope list names "optional `--out <file>` to persist the table") and is implemented in code (`tools/generate/src/cli/responsive-diff.ts:197` writes the table; `tools/generate/src/cli/index.ts:509` wires `--out`; USAGE line 169). No `test_UAT_AC721_*` exists — `grep '--out'` over `tests/reconciliation-responsive-diff.test.ts` returns nothing; AC-655's UAT covers only `--json`, not `--out`. The `--out` output-mode surface has zero executable evidence. | Author `test_UAT_AC721_*` in `tests/reconciliation-responsive-diff.test.ts` per AC-721's Verification: invoke `responsive-diff --ref <ladderBundle> --out <tmpfile>`, assert the persisted file exists and parses as the raw table (size columns + node rows) while stdout still emits the table; then `--classify --out <tmpfile2>`, assert the persisted file is unchanged (raw table, not the classification) while stdout carries the classification. Activate AC-721 once the UAT passes. |

## Notes for the Editor

- This is the mirror of the ac-level fix: REPORT-836 (ac FAIL) added AC-721 via `ac-add` to close the `--out` coverage gap in the AC layer; the cascade now surfaces the same behavior as unproven at the uat layer. One `uat-add` closes it.
- `--out` is genuinely a missing test, NOT a code bug — the code path is present and matches AC-721's criterion (raw table only, independent of `--classify`). A RED-then-GREEN cycle is unnecessary; the UAT should pass against current code. Resolution is `uat-add`, not `code-issue`.
- AC-721 status is `pending` (created 2026-07-23 by the ac-level fix); the remaining 16 ACs are `active` and every one has a substantive, entry-point-exercising UAT. The pending status is the matrix flagging this behavior as not-yet-proven at the uat level — it does not exempt reconciled intent from uat coverage. Activating AC-721 without a UAT would leave `--out` with no gate.
- All 16 existing UATs are valid evidence: they drive real command entry points (`run(argv)`, `cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `cmdResponsiveDiff`), not structural/AST checks, with only the browser/driver thin-mocked at the external boundary. No exclusivity issues (each AC has exactly one distinct UAT). No consistency issues (each UAT exercises its AC's actual behavior).
