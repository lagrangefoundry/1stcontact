---
uid: report-c0caa44d
id: REPORT-514
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-13T20:44:22.599461+00:00'
updated_at: '2026-07-13T20:44:22.599461+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d555b990
---

The results are stable: 5 passed, 1 failed. The one failure is a genuine regression the AC correctly forbids, and per reconciliation rules I've left the test asserting the AC rather than weakening it.

```
UATs generated for story story-d555b990 (plan item 6 of 8)

Story: story-d555b990
Test file(s) created:
  - tests/reconciliation-content-width-scale.test.ts

Tests written: 6
Tests passed: 5
Tests failed: 1

test_files_created:
  - "tests/reconciliation-content-width-scale.test.ts"
```

**One UAT per AC (AC-604..AC-609):**

| Test | AC | Result |
|------|-----|--------|
| `test_UAT_AC604_named_step_caps_to_tailwind_measure` | AC-604 named Tailwind step | ✅ pass |
| `test_UAT_AC605_literal_value_renders_exact_off_scale_measure` | AC-605 literal escape hatch | ✅ pass |
| `test_UAT_AC606_bleed_or_absent_leaves_column_uncapped` | AC-606 bleed/absent uncapped | ✅ pass |
| `test_UAT_AC607_rowWidth_boxes_grouped_row` | AC-607 rowWidth grouped row | ✅ pass |
| `test_UAT_AC608_contentWidth_honored_uniformly_across_modules` | AC-608 uniform hero/text-block/services-grid | ✅ pass |
| `test_UAT_AC609_retired_width_names_removed` | AC-609 retired names removed | ❌ fail |

```
⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC609_retired_width_names_removed: storage/sites/faelan/draft/site.json
    retains retired container token keys `narrow` (40rem), `default` (72rem), `wide`
    (90rem). AC-609 forbids any shipped site document from using a retired name as a
    container token key. This is a code/data regression, NOT a test bug — the
    pre-existing free-coded test `test_UAT_FC_REQ-55_old_width_names_migrated` fails
    identically, confirming the REQ-55 migration missed faelan. The test correctly
    encodes the AC and was deliberately NOT weakened to match the bug. Fix belongs
    on the data (migrate faelan's container overrides onto the sm..7xl+bleed scale),
    not the test.

test_files_created:
  - "tests/reconciliation-content-width-scale.test.ts"
```

Scope of the divergence is fully bounded: `faelan/draft/site.json` is the **only** offending document, and only via three container-override keys — no `contentWidth`/`rowWidth` dial value anywhere uses a retired name.
