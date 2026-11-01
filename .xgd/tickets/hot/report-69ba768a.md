---
uid: report-69ba768a
id: REPORT-7608
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T13:10:22.162126+00:00'
updated_at: '2026-11-01T13:10:22.162126+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-71b1019e
  parent_report_uid: report-4ac069c7
  batch_index: '0'
---

The three tests that link AC-2104, AC-2105 and AC-2106 are in place and pass, so those criteria are no longer orphaned. The run covered the batch scope: the new file plus the existing BUG-48 suite, 11 tests in total, all passing. The run also logged a wrangler error about writing its log file, which has nothing to do with these tests.

- **Change:** one new file, `tests/reconciliation-l1-reference-coverage.test.ts`. No production code, criteria or existing tests were touched.
- **Tests added:** `test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach`, `test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words` and `test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none`. Every expected value comes from the code's own declarations when the test runs.
- **Where I departed from the plan:** it asked for each rule's message text to appear word for word in the limits section. The reference actually prints each rule's explanatory comment there, not the message, so that check would have failed against unchanged code. Instead the test runs the existing coverage check on the limits section alone, and checks the message text against the refusals the validator actually produces. That keeps both claims tested without weakening either.
- **New check:** the test also confirms that a keyframe at a width the page doesn't declare is refused with "not one of the document widths". No other test checked this.
- **Wrong line numbers in the plan:** `validate.ts` has only 1030 lines. The real locations are line 106 for the rules table, lines 181 and 262 for the width message, 651 for the image URL message and 1011 for the duplicate id.
- **Type check:** `tsc --noEmit` reported no errors in the new file.
- **Lint:** not run. ESLint isn't installed locally, and fetching it from the npm registry was blocked by the network allow list.

No upstream changes were needed.

```yaml
## Assessment
blocked_by: null
status: fixed
evidence: "npx vitest run tests/reconciliation-l1-reference-coverage.test.ts tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts -> Test Files 2 passed, Tests 11 passed"
files_changed:
  - tests/reconciliation-l1-reference-coverage.test.ts (new)
```
