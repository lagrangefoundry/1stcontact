---
uid: report-c0c24789
id: REPORT-635
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-19T02:59:14.047994+00:00'
updated_at: '2026-07-19T02:59:14.047994+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-2c7069fe
---

All checks pass. Here is the completion report.

```
UATs generated for story story-2c7069fe (plan item 4 of 8)

Story: story-2c7069fe  (1c responsive-diff — cross-size N-way node table + classifier)
Test file(s) created:
  - tests/reconciliation-responsive-diff.test.ts

Tests written: 8
Tests passed: 8
Tests failed: 0

test_files_created:
  - "tests/reconciliation-responsive-diff.test.ts"
```

**One test per AC, all exercising the `1c responsive-diff` CLI at its boundary via `run(argv)`:**

| Test | AC | Verifies |
|------|-----|----------|
| `test_UAT_AC648_produces_nway_table_with_default_size_columns` | AC-648 | `--json` yields 3 columns (mobile/tablet/desktop + widths), a known node as a row with a per-column value |
| `test_UAT_AC649_sizes_flag_selects_and_orders_columns_and_rejects_unknown` | AC-649 | `--sizes mobile,desktop` → 2 columns in order, tablet omitted; unknown token rejected naming the vocabulary, no table |
| `test_UAT_AC650_partitions_changed_steady_and_flags_presence_flips` | AC-650 | font-step→changed, identical→steady, absent-column→presence-flip, sub-pixel box jitter→steady |
| `test_UAT_AC651_aligns_repeated_identical_text_in_document_order` | AC-651 | repeated "Read more" → 2 distinct rows, occurrence-0↔occurrence-0 alignment (weights don't cross-pair) |
| `test_UAT_AC652_classify_labels_moves_and_groups_structural_first` | AC-652 | value-step/layout-swap/presence-flip labels; structural groups precede value-step; no-change→single "holds steady" |
| `test_UAT_AC653_terminal_fails_on_stale_reference_with_recapture_guidance` | AC-653 | no ladder → throws naming bundle + re-capture, no table emitted |
| `test_UAT_AC654_terminal_fails_on_uncaptured_width_listing_available_widths` | AC-654 | missing width → throws naming missing width + available widths, no partial table |
| `test_UAT_AC655_json_is_parseable_and_ref_is_required` | AC-655 | `--json` and `--classify --json` parse; no `--ref` → non-zero exit + `--ref` error + no stdout |

**Notes on the approach:**
- Modeled the file on the sibling reconciliation test `tests/reconciliation-size-aware-diff.test.ts` (same capability family) — same temp-dir plumbing, `writeMultiState`/`MultiStateCapture`/`StateProjection` fixtures, and `run(argv)` boundary invocation.
- Added a small `runCli` helper that captures stdout/stderr and resets `process.exitCode` so a command's non-zero code can't leak into the vitest process.
- No runtime code changed, no existing tests modified. The pre-existing `tests/req61-responsive-diff.test.ts` FC-named tests remain — renaming/removing those FC orphans is the downstream reconciliation-review step's responsibility, not this UAT-generation task's.
