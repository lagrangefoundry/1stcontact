---
uid: report-d16634d1
id: REPORT-7795
type: report
title: 'Scoped quality: fail (31 tests, 13 failed)'
created_by: xgd
created_at: '2026-11-01T18:12:41.701377+00:00'
updated_at: '2026-11-01T18:12:41.701377+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-7102ffe3
  commit: d0e23ef3fff6d73c5705b26ef2f39d1b5d2a9083
---

{
  "timestamp": "2026-11-01T18:07:27.634061Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011983397416770458,
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
      "duration_seconds": 8.957900499925017,
      "passed": 18,
      "failed": 13,
      "skipped": 0,
      "errors": 0,
      "total": 31,
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
        "test_UAT_AC2131_",
        "test_UAT_AC2166_",
        "test_UAT_AC2167_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "nner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a business-scoped route with nothing selectable\"],\"fullName\":\"a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"status\":\"failed\",\"title\":\"test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"duration\":0,\"failureMessages\":[\"TypeError: (0 , __vite_ssr_import_4__.provisionInvite) is not a function\\n    at invite (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts:137:24)\\n    at twoBusinesses (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts:145:23)\\n    at aWhollyLapsedAccount (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts:740:33)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts:771:36\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the operator keeps the existing 1stcontact business\"],\"fullName\":\"the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"status\":\"failed\",\"title\":\"test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"duration\":18,\"failureMessages\":[\"Error: D1_ERROR: table users has no column named platform_admin: SQLITE_ERROR\\n    at D1DatabaseSessionAlwaysPrimary._sendOrThrow (cloudflare-internal:d1-api:146:19)\\n    at cloudflare-internal:d1-api:361:41\\n    at runMigration (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/support/d1-site-factory.ts:98:39)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts:844:5\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793556456640,\"endTime\":1793556456680,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a path prefix selects one held business\"],\"fullName\":\"a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"status\":\"passed\",\"title\":\"test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business the caller does not hold\"],\"fullName\":\"a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a named business whose grant lapsed\"],\"fullName\":\"a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a request with no target\"],\"fullName\":\"a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"status\":\"passed\",\"title\":\"test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the platform_operator hosting bypass\"],\"fullName\":\"the platform_operator hosting bypass test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated\",\"duration\":45,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a deactivated business\"],\"fullName\":\"a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the loopback dev-open path\"],\"fullName\":\"the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"status\":\"passed\",\"title\":\"test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"store openers given an empty scope\"],\"fullName\":\"store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"status\":\"passed\",\"title\":\"test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a preview sub-resource keeps its business\"],\"fullName\":\"a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"chat hosts are per business within one isolate\"],\"fullName\":\"chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"status\":\"passed\",\"title\":\"test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached\",\"duration\":101,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session resumed after membership expiry\"],\"fullName\":\"a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an admitted account with nothing selectable keeps its chrome\"],\"fullName\":\"an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a business-scoped route with nothing selectable\"],\"fullName\":\"a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the operator keeps the existing 1stcontact business\"],\"fullName\":\"the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"PLATFORM_ADMINS is break glass that leaves its rows behind\"],\"fullName\":\"PLATFORM_ADMINS is break glass that leaves its rows behind test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying\",\"status\":\"passed\",\"title\":\"test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"entering a hosted business is not owning it\"],\"fullName\":\"entering a hosted business is not owning it test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793556456635,\"endTime\":1793556457065,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope_operator.workers.test.ts\"}]}",
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
          "status": "failed"
        },
        {
          "name": "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
          "file": "",
          "status": "failed"
        },
        {
          "name": "store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
          "file": "",
          "status": "failed"
        },
        {
          "name": "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
          "file": "",
          "status": "failed"
        },
        {
          "name": "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing",
          "file": "",
          "status": "failed"
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
        },
        {
          "name": "PLATFORM_ADMINS is break glass that leaves its rows behind test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying",
          "file": "",
          "status": "passed"
        },
        {
          "name": "entering a hosted business is not owning it test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing",
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
        "message": "13 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 13
        }
      }
    ]
  }
}