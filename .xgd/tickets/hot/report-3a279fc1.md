---
uid: report-3a279fc1
id: REPORT-7799
type: report
title: 'Report: batch_quality_check for story-7102ffe3'
created_by: xgd
created_at: '2026-11-01T18:18:12.034122+00:00'
updated_at: '2026-11-01T18:18:12.034122+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-7102ffe3
  parent_report_uid: report-1a9fddd1
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T18:14:27.911835Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 8.199287458788604,
      "passed": 13,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 13,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC2117",
        "test_UAT_AC2118",
        "test_UAT_AC2119",
        "test_UAT_AC2120",
        "test_UAT_AC2121",
        "test_UAT_AC2122",
        "test_UAT_AC2123",
        "test_UAT_AC2126",
        "test_UAT_AC2127",
        "test_UAT_AC2128",
        "test_UAT_AC2129",
        "test_UAT_AC2130",
        "test_UAT_AC2131"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mthe loopback dev-open path\\x1b[2m > \\x1b[22mtest_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mstore openers given an empty scope\\x1b[2m > \\x1b[22mtest_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22ma preview sub-resource keeps its business\\x1b[2m > \\x1b[22mtest_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\\x1b[32m 40\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mchat hosts are per business within one isolate\\x1b[2m > \\x1b[22mtest_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\\x1b[32m 91\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22ma session resumed after membership expiry\\x1b[2m > \\x1b[22mtest_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\\x1b[32m 38\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22man admitted account with nothing selectable keeps its chrome\\x1b[2m > \\x1b[22mtest_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22ma business-scoped route with nothing selectable\\x1b[2m > \\x1b[22mtest_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\\x1b[32m 25\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mthe operator keeps the existing 1stcontact business\\x1b[2m > \\x1b[22mtest_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mPLATFORM_ADMINS is break glass that leaves its rows behind\\x1b[2m > \\x1b[22mtest_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_scope_operator.workers.test.ts\\x1b[2m > \\x1b[22mentering a hosted business is not owning it\\x1b[2m > \\x1b[22mtest_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m13 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m3 skipped\\x1b[39m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 10:14:29\n\\x1b[2m   Duration \\x1b[22m 6.84s\\x1b[2m (transform 2.73s, setup 0ms, import 5.75s, tests 529ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-x1l47rie.json\n\n{\"numTotalTestSuites\":17,\"numPassedTestSuites\":17,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":13,\"numFailedTests\":0,\"numPendingTests\":3,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793556869575,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"a path prefix selects one held business\"],\"fullName\":\"a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"status\":\"passed\",\"title\":\"test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business the caller does not hold\"],\"fullName\":\"a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business whose grant lapsed\"],\"fullName\":\"a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a request with no target\"],\"fullName\":\"a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"status\":\"passed\",\"title\":\"test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the platform_operator hosting bypass\"],\"fullName\":\"the platform_operator hosting bypass test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a deactivated business\"],\"fullName\":\"a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the loopback dev-open path\"],\"fullName\":\"the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"status\":\"passed\",\"title\":\"test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"store openers given an empty scope\"],\"fullName\":\"store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a preview sub-resource keeps its business\"],\"fullName\":\"a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"chat hosts are per business within one isolate\"],\"fullName\":\"chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"status\":\"passed\",\"title\":\"test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"duration\":91,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session resumed after membership expiry\"],\"fullName\":\"a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an admitted account with nothing selectable keeps its chrome\"],\"fullName\":\"an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a business-scoped route with nothing selectable\"],\"fullName\":\"a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the operator keeps the existing 1stcontact business\"],\"fullName\":\"the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"PLATFORM_ADMINS is break glass that leaves its rows behind\"],\"fullName\":\"PLATFORM_ADMINS is break glass that leaves its rows behind test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"entering a hosted business is not owning it\"],\"fullName\":\"entering a hosted business is not owning it test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793556876049,\"endTime\":1793556876430,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope_operator.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "name": "the platform_operator hosting bypass test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}