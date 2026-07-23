---
uid: report-9a5d1496
id: REPORT-841
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=uat)'
created_by: xgd
created_at: '2026-07-23T10:45:08.856469+00:00'
updated_at: '2026-07-23T10:45:08.856469+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (BUNDLE-6; reproduces REQ-61, also carries REQ-58/59/62) | free_and_reconciled | merged_at_commit 7a42e182 | Established 1c size-aware diffing: shared `--size` selector on `values-diff` + pixel `diff`, per-viewport reference screenshots at capture, and the downstream `responsive-diff` cross-size N-way table + classifier (incl. `--json` and `--out` output modes) | YES |

Single reconciled intent — both stories (STORY-77, STORY-78) and the capability carry `intent_uid=bundle-ab9e0cb6`; no other intent has touched this tree. Story (REPORT-835) and ac (REPORT-838) levels PASSED, so the AC layer is the working reference; intent was consulted only to confirm the `--out` behavior is genuine reconciled scope (it is — named in the STORY-78 In-scope list).

## Fix cycle resolved (attempt 1)

The prior uat-level check (REPORT-839, FAIL) flagged one `uat-add` gap: AC-721 (`--out` persists the N-way table) had no substantive UAT. Fix attempt 1 (REPORT-840, `fix_uat_validation` @done, commit 636c329c) resolved it:
- **AC-721 activated** — status `pending` → `active`.
- **UAT added** — `test_UAT_AC721_out_persists_raw_table_independent_of_classify` at `tests/reconciliation-responsive-diff.test.ts:365`.
- **Verified green** — `npx vitest run tests/reconciliation-responsive-diff.test.ts -t AC721` → 1 passed. The UAT exercises the real CLI (`run(['responsive-diff','--out',…])` and `--classify --out`), asserts the persisted file is the raw N-way table (size columns + per-node values, no `classifications`) while stdout still emits, and that `--classify` leaves the persisted file byte-identical — exactly AC-721's Verification. No internal mocking (browser boundary not involved; pure/offline fixture).

## Alignment Ledger

Per test (uat level): each active AC and the UAT that proves it.

| Element (AC → UAT) | Intent | Outcome |
|---|---|---|
| AC-639 → test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width | bundle-ab9e0cb6 | aligned — `cmdValuesDiff({size})`; ref read from ladder at selected width; reflow flags at mobile, clean at desktop |
| AC-640 → test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands | bundle-ab9e0cb6 | aligned — both `cmdValuesDiff` and `cmdDiff` default (no-`--size`) paths |
| AC-641 → test_UAT_AC641_values_diff_size_fails_loudly_when_bundle_has_no_ladder | bundle-ab9e0cb6 | aligned — throws `/multistate.json…re-capture/`, no report written |
| AC-642 → test_UAT_AC642_values_diff_size_fails_loudly_and_names_available_widths | bundle-ab9e0cb6 | aligned — error names requested + available widths |
| AC-643 → test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference | bundle-ab9e0cb6 | aligned — `report.ref` is the per-width screenshot, mean≈0 |
| AC-644 → test_UAT_AC644_pixel_diff_size_fails_loudly_without_same_width_reference | bundle-ab9e0cb6 | aligned — throws naming missing `screenshot-<w>.png` + re-capture, no artifacts |
| AC-645 → test_UAT_AC645_invalid_size_rejected_naming_accepted_vocabulary | bundle-ab9e0cb6 | aligned — both commands via `run(argv)`; rejects `phone`, names vocabulary |
| AC-647 → test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes | bundle-ab9e0cb6 | aligned — `cmdCapturePage` w/ fake driver; per-width PNGs present, matrix byte-free |
| AC-648 → test_UAT_AC648_produces_nway_table_with_default_size_columns | bundle-ab9e0cb6 | aligned — 3 default columns + per-node cells |
| AC-649 → test_UAT_AC649_sizes_flag_selects_and_orders_columns_and_rejects_unknown | bundle-ab9e0cb6 | aligned — `--sizes` selects/orders; rejects unknown token |
| AC-650 → test_UAT_AC650_partitions_changed_steady_and_flags_presence_flips | bundle-ab9e0cb6 | aligned — changed/steady partition, presence flip, sub-pixel jitter → steady |
| AC-651 → test_UAT_AC651_aligns_repeated_identical_text_in_document_order | bundle-ab9e0cb6 | aligned — two distinct rows for repeated text, occurrence-by-occurrence |
| AC-652 → test_UAT_AC652_classify_labels_moves_and_groups_structural_first | bundle-ab9e0cb6 | aligned — value-step/layout-swap/presence-flip labels + structural-first grouping |
| AC-653 → test_UAT_AC653_terminal_fails_on_stale_reference_with_recapture_guidance | bundle-ab9e0cb6 | aligned — throws `/multistate.json…re-capture/`, no table |
| AC-654 → test_UAT_AC654_terminal_fails_on_uncaptured_width_listing_available_widths | bundle-ab9e0cb6 | aligned — throws naming missing width + available widths, no partial table |
| AC-655 → test_UAT_AC655_json_is_parseable_and_ref_is_required | bundle-ab9e0cb6 | aligned — `--json` parses; missing `--ref` → non-zero exit, no stdout |
| AC-721 → test_UAT_AC721_out_persists_raw_table_independent_of_classify | bundle-ab9e0cb6 | aligned (fixed this cycle) — persisted raw table, `--out` independent of `--classify`; verified green |

## Findings

None. All 17 active ACs (STORY-77: AC-639…647; STORY-78: AC-648…655 + AC-721) have exactly one substantive UAT that exercises a real command entry point (`run(argv)`, `cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `cmdResponsiveDiff`), not a structural/AST check.

- **Consistency**: every UAT exercises its AC's actual behavior (verified by reading each test body).
- **Coverage**: every active AC has a substantive UAT; the sole prior gap (AC-721) is closed.
- **Exclusivity**: one distinct UAT per AC; no redundant tests of the same scenario in the same shape.

## Notes for the Editor

- The whole cascade for this capability is now green: story (REPORT-835) → ac (REPORT-838) → uat (this report). The `--out` behavior that surfaced as `ac-add` (REPORT-836) and then `uat-add` (REPORT-839) is fully resolved: AC-721 active, code present (`responsive-diff.ts:197`, wired at `index.ts:509`), and a passing UAT.
- No pending ACs remain in the tree; nothing deferred.
