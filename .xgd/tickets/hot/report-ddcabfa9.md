---
uid: report-ddcabfa9
id: REPORT-7557
type: report
title: 'Scoped quality: pass (15 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T10:36:55.904020+00:00'
updated_at: '2026-11-01T10:36:55.904020+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-7102ffe3
  commit: b94a0b407139c21bd3fc7393af05951f30150de9
---

{
  "timestamp": "2026-11-01T10:33:57.096112Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017358316108584404,
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
      "duration_seconds": 5.760191249893978,
      "passed": 15,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 15,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2117_",
        "test_UAT_AC2118_",
        "test_UAT_AC2119_",
        "test_UAT_AC2120_",
        "test_UAT_AC2121_",
        "test_UAT_AC2122_",
        "test_UAT_AC2123_",
        "test_UAT_AC2124_",
        "test_UAT_AC2125_",
        "test_UAT_AC2126_",
        "test_UAT_AC2127_",
        "test_UAT_AC2128_",
        "test_UAT_AC2129_",
        "test_UAT_AC2130_",
        "test_UAT_AC2131_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "d_logged_no_entitlement\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22ma request with no target\\x1b[2m > \\x1b[22mtest_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22mthe platform admin bypass\\x1b[2m > \\x1b[22mtest_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\\x1b[32m 18\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22ma deactivated business\\x1b[2m > \\x1b[22mtest_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22mthe loopback dev-open path\\x1b[2m > \\x1b[22mtest_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22mstore openers given an empty scope\\x1b[2m > \\x1b[22mtest_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22ma preview sub-resource keeps its business\\x1b[2m > \\x1b[22mtest_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\\x1b[32m 25\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22mchat hosts are per business within one isolate\\x1b[2m > \\x1b[22mtest_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\\x1b[32m 64\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22ma session resumed after membership expiry\\x1b[2m > \\x1b[22mtest_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\\x1b[32m 22\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22man admitted account with nothing selectable keeps its chrome\\x1b[2m > \\x1b[22mtest_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22ma business-scoped route with nothing selectable\\x1b[2m > \\x1b[22mtest_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope.workers.test.ts\\x1b[2m > \\x1b[22mthe operator keeps the existing 1stcontact business\\x1b[2m > \\x1b[22mtest_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m15 passed\\x1b[39m\\x1b[22m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 02:33:58\n\\x1b[2m   Duration \\x1b[22m 4.92s\\x1b[2m (transform 3.70s, setup 0ms, import 5.95s, tests 319ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-sslw8y_0.json\n\n{\"numTotalTestSuites\":17,\"numPassedTestSuites\":17,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":15,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793529238105,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the platform-tenant setting is consulted only by scope resolution and identity\"],\"fullName\":\"the platform-tenant setting is consulted only by scope resolution and identity test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity\",\"status\":\"passed\",\"title\":\"test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity\",\"duration\":31.21095799999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793529239844,\"endTime\":1793529239875.211,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_scope_single_reader.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a path prefix selects one held business\"],\"fullName\":\"a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"status\":\"passed\",\"title\":\"test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business the caller does not hold\"],\"fullName\":\"a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business whose grant lapsed\"],\"fullName\":\"a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a request with no target\"],\"fullName\":\"a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"status\":\"passed\",\"title\":\"test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the platform admin bypass\"],\"fullName\":\"the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a deactivated business\"],\"fullName\":\"a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the loopback dev-open path\"],\"fullName\":\"the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"status\":\"passed\",\"title\":\"test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"store openers given an empty scope\"],\"fullName\":\"store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"status\":\"passed\",\"title\":\"test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a preview sub-resource keeps its business\"],\"fullName\":\"a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"chat hosts are per business within one isolate\"],\"fullName\":\"chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"status\":\"passed\",\"title\":\"test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"duration\":64,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session resumed after membership expiry\"],\"fullName\":\"a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an admitted account with nothing selectable keeps its chrome\"],\"fullName\":\"an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a business-scoped route with nothing selectable\"],\"fullName\":\"a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the operator keeps the existing 1stcontact business\"],\"fullName\":\"the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793529242807,\"endTime\":1793529243028,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_scope.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the platform-tenant setting is consulted only by scope resolution and identity test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
          "file": "",
          "status": "passed"
        },
        {
          "name": "store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing",
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