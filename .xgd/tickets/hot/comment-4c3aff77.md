---
uid: comment-4c3aff77
id: COMMENT-6130
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T10:55:23.048547+00:00'
updated_at: '2026-11-01T10:55:23.048547+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0cf7c88
  kind: note
---

UATs generated for story story-e674c60a (plan item 7 of 10)

Eight of the nine new UATs pass. One fails because the code doesn't do what AC-967 says, so the downstream fix-it loop needs to repair the code. I did not weaken the test.

Story: story-e674c60a
Test file(s) created:
  - `tests/reconciliation-builder-business-scope.test.ts` (jsdom, mounted over the real installed `webui-*` components, which are present here so nothing skipped)
  - `tests/reconciliation-builder-businesses-endpoint.workers.test.ts` (workerd, driven through the Worker's own `fetch` with real D1 and a real Access token)

| AC | Test | Result |
|---|---|---|
| AC-2143 | `test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped` | pass |
| AC-2144 | `test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call` | pass |
| AC-2145 | `test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library` | pass |
| AC-2146 | `test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list` | pass |
| AC-2147 | `test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes` | pass |
| AC-2148 | `test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant` | pass |
| AC-967 | `test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch` | **fail** |
| AC-970 | `test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site` | pass |
| AC-974 | `test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back` | pass |

AC-967, AC-970 and AC-974 already had UATs. Their bodies were revised in this bundle with business-switch clauses the existing tests don't cover, so these new tests cover only those clauses. That gives each of the three ACs a second test function, which is outside the strict one-test-per-AC rule.

For AC-2145 and AC-2146, every transport stays at its shipped default and only `globalThis.fetch` is stubbed. The URLs being checked are therefore the ones the shipped `api.js` builds.

Tests written: 9
Tests passed: 8
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - `test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch`: AC-967 says "a site listing that fails to answer leaves the pane showing what it had rather than an empty pane". Instead, `selectBusiness` in `apps/control-app/src/builder/app.js:700` does `loadSitesFor(...).catch(() => [])`, so a failed listing becomes an empty list and `panel.setSite(null)` runs. The test gets `null` where it expected the previous site (`shared`). The code comment above that line claims the pane keeps what it had, but the code doesn't.

Other notes:
- ESLint couldn't run because it isn't installed locally and the sandbox blocks npm from fetching it. The files haven't been linted.
- The `test_UAT_FC_REQ-179_*` and `test_UAT_FC_REQ-180_*` files are untouched, as the no-modification rule requires. The FC-orphan step still needs to rename or delete them.

test_files_created:
  - "tests/reconciliation-builder-business-scope.test.ts"
  - "tests/reconciliation-builder-businesses-endpoint.workers.test.ts"
