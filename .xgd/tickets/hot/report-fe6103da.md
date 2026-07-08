---
uid: report-fe6103da
id: REPORT-278
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-08T19:17:05.888407+00:00'
updated_at: '2026-07-08T19:17:05.888407+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-6fc151b1
---

All 8 test names conform, one per AC, and all pass against the existing code.

```
UATs generated for story story-6fc151b1 (plan item 2 of 4)

Story: story-6fc151b1
Test file(s) created:
  - tests/reconciliation-site-schema.test.ts

Tests written: 8
Tests passed: 8
Tests failed: 0

test_files_created:
  - "tests/reconciliation-site-schema.test.ts"
```

**AC → UAT mapping** (one per acceptance criterion, boundary = the exported `validateSite()` entry point):

| AC | Test | Verifies |
|----|------|----------|
| AC-425 | `test_UAT_AC425_valid_site_validates_and_returns_value` | Minimal + full site both validate; success value reproduces submitted structure (`toEqual`) |
| AC-426 | `test_UAT_AC426_invalid_module_rejected_with_json_pointer_path` | Module missing `version` → `ok:false`, non-empty errors, JSON-pointer path `/pages/0/modules/0/version` + message |
| AC-427 | `test_UAT_AC427_unrecognized_nav_pattern_rejected` | Nav pattern outside the enum → error at `/nav/pattern` |
| AC-428 | `test_UAT_AC428_missing_theme_token_slot_rejected` | Omitted spacing slot → error at `/theme/spacing/4` |
| AC-429 | `test_UAT_AC429_non_hex_color_token_rejected` | `palette.primary='blue'` → error at `/theme/palette/primary` |
| AC-430 | `test_UAT_AC430_duplicate_structural_identifiers_rejected` | Dup module id → `/pages/0/modules/1/id`; dup page slug → `/pages/1/slug`; each message says "duplicate" |
| AC-431 | `test_UAT_AC431_catalog_membership_not_validated` | Unknown `type`/`variant` still validates (structure-only boundary) |
| AC-432 | `test_UAT_AC432_nav_targets_accepted_for_each_kind` | Nav entries using page/anchor/url target kinds all validate |

Notes:
- No runtime code was modified, and no existing test files were touched. The pre-existing `test_UAT_FC_REQ-3_*` tests in `tests/site-schema.test.ts` are left in place — resolving those FC orphans (rename/delete) is the reconciliation review phase's responsibility, not this UAT-generation step.
- Fixtures are self-contained copies of the valid-site shape (the existing test file doesn't export its builders), grounded in the current REQ-4 token superset in `packages/site-schema/src/schema.ts`.
