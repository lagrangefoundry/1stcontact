---
uid: report-1967b24e
id: REPORT-7821
type: report
title: 'Scoped quality: fail (18 tests, 3 failed)'
created_by: xgd
created_at: '2026-11-01T19:43:01.881731+00:00'
updated_at: '2026-11-01T19:43:01.881731+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-a55c2f35
  commit: e34cab7bb69e82094ac25034b0fa4e598b5c431d
---

{
  "timestamp": "2026-11-01T19:39:28.089731Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015525007620453835,
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
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 6.553852875018492,
      "passed": 15,
      "failed": 3,
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
      "stdout": "90m563|\\x1b[39m\n    \\x1b[90m564|\\x1b[39m     const open = await post(asMember, GRANTS_PATH, { businessId: their\u2026\n    \\x1b[90m565|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(open\\x1b[33m.\\x1b[39mstatus\\x1b[33m,\\x1b[39m \\x1b[32m'a non-owner opened a grant'\\x1b[39m)\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[34m403\\x1b[39m)\n    \\x1b[90m   |\\x1b[39m                                                       \\x1b[31m^\\x1b[39m\n    \\x1b[90m566|\\x1b[39m     const revoke = await post(asMember, GRANT_REVOKE_PATH, { id: exist\u2026\n    \\x1b[90m567|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(revoke\\x1b[33m.\\x1b[39mstatus\\x1b[33m,\\x1b[39m \\x1b[32m'a non-owner withdrew a grant'\\x1b[39m)\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[34m403\\x1b[39m)\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[3/3]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m3 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m15 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:39:29\n\\x1b[2m   Duration \\x1b[22m 5.55s\\x1b[2m (transform 2.41s, setup 0ms, import 4.96s, tests 578ms, environment 269ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-5q7hd1_k.json\n\n{\"numTotalTestSuites\":8,\"numPassedTestSuites\":6,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":15,\"numFailedTests\":3,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793561969370,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"status\":\"passed\",\"title\":\"test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"duration\":49.861707999999965,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"duration\":24.18187499999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"duration\":103.768417,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"status\":\"passed\",\"title\":\"test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"duration\":10.229458000000022,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"duration\":12.284291999999937,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"duration\":7.728375000000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Provision a business\"],\"fullName\":\"story-a55c2f35 \u2014 Provision a business test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"duration\":35.13954100000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793561969797,\"endTime\":1793561970040.1396,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"duration\":51,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"status\":\"passed\",\"title\":\"test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"status\":\"failed\",\"title\":\"test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"duration\":14,\"failureMessages\":[\"AssertionError: expected 500 to be 400 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts:504:31\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"status\":\"failed\",\"title\":\"test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"duration\":16,\"failureMessages\":[\"AssertionError: expected 500 to be 400 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts:550:28\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"status\":\"failed\",\"title\":\"test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"duration\":8,\"failureMessages\":[\"AssertionError: a non-owner opened a grant: expected 200 to be 403 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts:565:55\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 the login control, server-side only\"],\"fullName\":\"story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793561974728,\"endTime\":1793561974923,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts\"}]}",
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
          "status": "failed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner",
          "file": "",
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "test_failure",
        "field": "test results",
        "message": "3 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 3
        }
      }
    ]
  }
}