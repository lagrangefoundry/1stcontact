---
uid: comment-a6917753
id: COMMENT-8164
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T22:56:49.481426+00:00'
updated_at: '2026-11-09T22:56:49.481426+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f062f8cf
  kind: note
---

UATs generated for story story-179b8c06 (plan item 3 of 8)

Story: story-179b8c06
Test file(s) created:
  - `tests/reconciliation-behavior-strict-contract.test.ts`

Tests written: 5
Tests passed: 5
Tests failed: 0

| Test | Criterion |
|---|---|
| `test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully` | AC-2573: `labelMode` and the clipped invariant `<label>` |
| `test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders` | AC-2574: undeclared config keys and slots refused at write |
| `test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error` | AC-2575: slot errors localised; every error reported |
| `test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind` | AC-2330 (v2): the sign-in form and its confirmation |
| `test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint` | AC-2331 (v2): catalogued as `account-chrome@2` |

Each test calls the real entry points: the `1c` edit verbs over an in-memory site store, the publish pipeline, the catalog from both framework entry points, the preset library, the behavior catalogue and its reference projection, and the shipped `client.js` with an injected `fetch`. No runtime code or existing test was changed.

**Problem for the fix-it loop:** the older `tests/reconciliation-behavior-account-chrome.test.ts` fails 4 of 4. It still writes `account-chrome` as version 1, and the catalog now holds only version 2 (`Module not found in catalog: 'account-chrome' v1`).
- Its AC-2330 and AC-2331 tests describe the old contract: four slots, and a field and submit that are disabled after sending. The new v2 tests above replace them, so both files now carry tests for AC-2330 and AC-2331; the old ones should be deleted.
- Its AC-2329 and AC-2332 tests are not in this plan item. They fail only on the version: changing `version: 1` to `version: 2` and the hard-coded `getModule('account-chrome', 1)` call should be enough.
- I left that file alone because this step may not modify existing tests.

**Quality checks:** ESLint is not installed in this repo, and fetching it from npm was blocked by the sandbox. No `tsconfig` includes `tests/`. So the only check run on the new file was vitest, which compiled and ran it cleanly.

test_files_created:
  - "tests/reconciliation-behavior-strict-contract.test.ts"