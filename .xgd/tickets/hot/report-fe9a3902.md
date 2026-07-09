---
uid: report-fe9a3902
id: REPORT-374
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T23:07:38.430357+00:00'
updated_at: '2026-07-09T23:07:38.430357+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-f826e5ca
---

All 11 UATs pass and there are no type errors attributable to the new file (no root eslint/tsconfig — lint/build are handled by the `javascript_vitest_open` quality plugin's package-local config downstream). The tests run through real entry points (`run(argv)` CLI dispatcher, `cmdValuesDiff` command, `diffManifests` API) with written capture bundles and manifests, matching the existing `req31`/`req35` patterns exactly.

```
UATs generated for story story-f826e5ca (plan item 6 of 8)

Story: story-f826e5ca
Test file(s) created:
  - tests/reconciliation-values-diff.test.ts

Tests written: 11
Tests passed: 11
Tests failed: 0

test_files_created:
  - "tests/reconciliation-values-diff.test.ts"
```

**One UAT per acceptance criterion (AC-525 … AC-535):**

| Test | AC | Boundary | What it proves |
|---|---|---|---|
| `test_UAT_AC525_report_exposes_counts_and_shaped_deltas` | AC-525 | `cmdValuesDiff` | integer matched/unmatched counts + deltas each carrying text/role/property/expected/actual, ranked most-severe first |
| `test_UAT_AC526_per_element_fields_flagged_by_property` | AC-526 | `diffManifests` | each of 9 styling fields flags as its own property; a field absent from the reference is not compared |
| `test_UAT_AC527_casing_flagged_whitespace_ignored` | AC-527 | `diffManifests` | casing → `text` delta (still matched); whitespace-only → no delta |
| `test_UAT_AC528_section_overlay_and_anchor_by_index` | AC-528 | `diffManifests` | `overlay` + `contentAnchor` by ordinal §index; one-sided section skipped |
| `test_UAT_AC529_deltas_ranked_most_severe_first` | AC-529 | `diffManifests` | missing > text > color > lineHeightPx ordering |
| `test_UAT_AC530_colour_compared_perceptually` | AC-530 | `diffManifests` | ±1/channel suppressed; gold-vs-gold flags; unparseable never silent-matches |
| `test_UAT_AC531_jitter_tolerances_strict_and_per_metric` | AC-531 | `diffManifests` | jitter suppressed by default; `--strict` surfaces it; per-metric flag overrides one metric; two-step weight still flags |
| `test_UAT_AC532_inferred_reference_colour_never_hard_delta` | AC-532 | `diffManifests` | inferred colour → no delta; confident colour → delta |
| `test_UAT_AC533_offline_actual_short_circuits_and_slug_required` | AC-533 | `run()` CLI | `--actual` produces a report with no browser/slug; missing both → usage error |
| `test_UAT_AC534_repeated_texts_pair_fifo` | AC-534 | `diffManifests` | repeated texts pair FIFO; delta attributed to the correct occurrence |
| `test_UAT_AC535_output_forms_and_exit_status` | AC-535 | `run()` CLI | human/`--json`/`--out` forms; exit 1 with deltas, exit 0 clean |

No runtime code, existing tests, or tickets were modified.
