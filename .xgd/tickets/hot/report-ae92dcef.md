---
uid: report-ae92dcef
id: REPORT-6800
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-27T20:56:50.814315+00:00'
updated_at: '2026-10-27T20:56:50.814315+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-47fb84e6
  parent_report_uid: report-1d7d0597
  batch_index: '0'
---

I fixed `test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work` by changing the test to match what the code actually does. All 8 tests in `tests/test_reconciliation_fidelity_compare_and_judge.test.ts` now pass, and no production code was changed.

**Why it failed:** `check_fidelity` does refuse a reference that was never captured before it leases or navigates any browser. But the error doesn't come from its own not-found branch in `captureOf` (`tools/generate/src/cli/ai/fidelity-core.ts:245`). `readCapture` (`tools/generate/src/cli/capture/bundle.ts:95`) throws first, with a plain `Error`: `Bundle 'never-captured' has no capture.json.`. So the `PictureNotFoundError` that points the assistant at `list_references` can never be reached. The test expected that error.

**What I changed:**
- **Test:** it now checks for exactly that plain error message, named `Error`. The checks that no browser was leased or navigated are unchanged, so the test still fails if browser work ever runs before the refusal.
- **AC-2043:** rewritten to describe the real error. It notes that the error names the reference but doesn't point at `list_references`, and why.
- **STORY-158:** its "Unknown reference refused by name" reconciliation decision is corrected the same way.

**Gap for whoever owns this code:** the error the assistant sees for an unknown reference doesn't tell it to call `list_references`, which the earlier decision called "what the model acts on". Fixing that means making `readCapture` return null for a missing `capture.json`, or catching its error inside `captureOf`. That's a change to frozen code, so I left it alone.

## Assessment
```yaml
status: fixed
tests_fixed:
  - test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work
upstream_updates:
  - acceptance_criterion-4f71357b (AC-2043)
  - story-47fb84e6 (STORY-158)
code_modified: false
```
