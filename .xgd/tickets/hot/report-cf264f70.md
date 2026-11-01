---
uid: report-cf264f70
id: REPORT-7831
type: report
title: 'Scoped quality: pass (18 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T20:02:29.486836+00:00'
updated_at: '2026-11-01T20:02:29.486836+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-a55c2f35
  commit: 2e7060c63400f4144a405bf913182691e22a8395
---

{
  "timestamp": "2026-11-01T19:59:28.775967Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016262498684227467,
    "errors": 0,
    "warnings": 0,
    "error_list": [],
    "warning_list": []
  },
  "build": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0,
    "errors": 0,
    "error_list": [],
    "stdout": "No tsconfig.json \u2014 type-check skipped (JS-only project)",
    "stderr": ""
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 4.949214750202373,
      "passed": 18,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 18,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2188_",
        "test_UAT_AC2189_",
        "test_UAT_AC2190_",
        "test_UAT_AC2191_",
        "test_UAT_AC2192_",
        "test_UAT_AC2193_",
        "test_UAT_AC2194_",
        "test_UAT_AC2195_",
        "test_UAT_AC2196_",
        "test_UAT_AC2197_",
        "test_UAT_AC2198_",
        "test_UAT_AC2199_",
        "test_UAT_AC2200_",
        "test_UAT_AC2201_",
        "test_UAT_AC2202_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ner corrects who somebody is\\x1b[2m > \\x1b[22mtest_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 an owner corrects who somebody is\\x1b[2m > \\x1b[22mtest_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 an owner corrects who somebody is\\x1b[2m > \\x1b[22mtest_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 an owner corrects who somebody is\\x1b[2m > \\x1b[22mtest_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 grants\\x1b[2m > \\x1b[22mtest_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 grants\\x1b[2m > \\x1b[22mtest_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 grants\\x1b[2m > \\x1b[22mtest_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab_editing.workers.test.ts\\x1b[2m > \\x1b[22mstory-a55c2f35 \u2014 the login control, server-side only\\x1b[2m > \\x1b[22mtest_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m18 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:59:29\n\\x1b[2m   Duration \\x1b[22m 3.99s\\x1b[2m (transform 1.54s, setup 0ms, import 3.51s, tests 473ms, environment 267ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-cvy19xd3.json\n\n{\"numTotalTestSuites\":8,\"numPassedTestSuites\":8,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":18,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793563169928,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"status\":\"passed\",\"title\":\"test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"duration\":48.87258300000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"duration\":23.94599999999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"duration\":91.11416700000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"status\":\"passed\",\"title\":\"test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"duration\":9.826416999999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"duration\":10.543916999999965,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"duration\":7.183625000000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Provision a business\"],\"fullName\":\"story-a55c2f35 \u2014 Provision a business test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"duration\":30.195875,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793563170364,\"endTime\":1793563170585.1958,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"status\":\"passed\",\"title\":\"test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"status\":\"passed\",\"title\":\"test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"status\":\"passed\",\"title\":\"test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 the login control, server-side only\"],\"fullName\":\"story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793563173785,\"endTime\":1793563173928,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Provision a business test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    }
  },
  "overall": {
    "status": "success",
    "issues": []
  },
  "validation": {
    "anomalies": []
  }
}