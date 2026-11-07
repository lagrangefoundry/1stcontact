---
uid: report-a572b145
id: REPORT-11175
type: report
title: 'Scoped quality: pass (19 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-07T21:17:22.932117+00:00'
updated_at: '2026-11-07T21:17:22.932117+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-d5167ced
  commit: b9b0107e139255c9f4aa3a57cc2072ca0bba5a86
---

{
  "timestamp": "2026-11-07T21:12:36.978483Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013208389282226562,
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
      "duration_seconds": 21.76961816707626,
      "passed": 19,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 19,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1330_",
        "test_UAT_AC1331_",
        "test_UAT_AC1332_",
        "test_UAT_AC1333_",
        "test_UAT_AC1334_",
        "test_UAT_AC1335_",
        "test_UAT_AC1336_",
        "test_UAT_AC1337_",
        "test_UAT_AC1338_",
        "test_UAT_AC1339_",
        "test_UAT_AC1340_",
        "test_UAT_AC1341_",
        "test_UAT_AC1342_",
        "test_UAT_AC1425_",
        "test_UAT_AC1426_",
        "test_UAT_AC1427_",
        "test_UAT_AC1454_",
        "test_UAT_AC1455_",
        "test_UAT_AC1791_",
        "test_UAT_AC2356_",
        "test_UAT_AC2357_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ledTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":19,\"numPassedTests\":19,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794085958309,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place\"],\"fullName\":\"story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one\",\"duration\":2845.751666,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794085958767,\"endTime\":1794085961612.7517,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-platform-asset-tree-swap.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d5167ced \u2014 the environment preflight\"],\"fullName\":\"story-d5167ced \u2014 the environment preflight test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one\",\"duration\":5688.278208,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 the build discovers every Worker and bundles it for production\"],\"fullName\":\"story-d5167ced \u2014 the build discovers every Worker and bundles it for production test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight\",\"status\":\"passed\",\"title\":\"test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight\",\"duration\":6589.788625,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 a rehearsal is the same path as a real deploy\"],\"fullName\":\"story-d5167ced \u2014 a rehearsal is the same path as a real deploy test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation\",\"status\":\"passed\",\"title\":\"test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation\",\"duration\":1702.2213749999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 hooks are discovered by executability and run before the upload\"],\"fullName\":\"story-d5167ced \u2014 hooks are discovered by executability and run before the upload test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context\",\"status\":\"passed\",\"title\":\"test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context\",\"duration\":1120.0290000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 a hook that fails stops the code that assumes it ran\"],\"fullName\":\"story-d5167ced \u2014 a hook that fails stops the code that assumes it ran test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded\",\"status\":\"passed\",\"title\":\"test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded\",\"duration\":1024.7404580000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 deploy targets come from what is discovered\"],\"fullName\":\"story-d5167ced \u2014 deploy targets come from what is discovered test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused\",\"duration\":1988.464,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 the smoke check against an origin that serves correctly\"],\"fullName\":\"story-d5167ced \u2014 the smoke check against an origin that serves correctly test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_rather_than_forbidden\",\"status\":\"passed\",\"title\":\"test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_rather_than_forbidden\",\"duration\":84.91487499999857,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 each way a deploy is silently broken fails the smoke check\"],\"fullName\":\"story-d5167ced \u2014 each way a deploy is silently broken fails the smoke check test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected\",\"status\":\"passed\",\"title\":\"test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected\",\"duration\":49.6695409999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 a check with nothing to test against is skipped\"],\"fullName\":\"story-d5167ced \u2014 a check with nothing to test against is skipped test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted\",\"status\":\"passed\",\"title\":\"test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted\",\"duration\":42.09370800000033,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 every same-origin asset a published site references resolves\"],\"fullName\":\"story-d5167ced \u2014 every same-origin asset a published site references resolves test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets\",\"status\":\"passed\",\"title\":\"test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets\",\"duration\":1.0985409999993863,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 an unpublished site is indistinguishable from an unknown one\"],\"fullName\":\"story-d5167ced \u2014 an unpublished site is indistinguishable from an unknown one test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails\",\"status\":\"passed\",\"title\":\"test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails\",\"duration\":0.5626250000022992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 every named environment repeats every var and binding\"],\"fullName\":\"story-d5167ced \u2014 every named environment repeats every var and binding test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally\",\"status\":\"passed\",\"title\":\"test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally\",\"duration\":1.8158330000005662,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 no secret value is committed, and the push is piped\"],\"fullName\":\"story-d5167ced \u2014 no secret value is committed, and the push is piped test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name\",\"duration\":278.565416999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794085960511,\"endTime\":1794085979083.5654,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-platform-build-deploy-smoke.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d5167ced \u2014 the smoke check asserts the operator surface is private\"],\"fullName\":\"story-d5167ced \u2014 the smoke check asserts the operator surface is private test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option\",\"status\":\"passed\",\"title\":\"test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option\",\"duration\":128.022333,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 the build refuses a Worker type program that reaches the filesystem\"],\"fullName\":\"story-d5167ced \u2014 the build refuses a Worker type program that reaches the filesystem test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain\",\"status\":\"passed\",\"title\":\"test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain\",\"duration\":2984.814,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 the derived artifacts are generated before the typecheck\"],\"fullName\":\"story-d5167ced \u2014 the derived artifacts are generated before the typecheck test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it\",\"duration\":3925.88925,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794085958775,\"endTime\":1794085965813.8892,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-platform-build-order-and-private-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d5167ced \u2014 the operator surface retains every invocation log\"],\"fullName\":\"story-d5167ced \u2014 the operator surface retains every invocation log test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives\",\"status\":\"passed\",\"title\":\"test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives\",\"duration\":1.5835840000000019,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d5167ced \u2014 the retention declaration joins no binding set\"],\"fullName\":\"story-d5167ced \u2014 the retention declaration joins no binding set test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count\",\"status\":\"passed\",\"title\":\"test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count\",\"duration\":1.2915840000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794085958765,\"endTime\":1794085958768.2915,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-platform-invocation-log-retention.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the environment preflight test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build discovers every Worker and bundles it for production test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a rehearsal is the same path as a real deploy test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 hooks are discovered by executability and run before the upload test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a hook that fails stops the code that assumes it ran test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 deploy targets come from what is discovered test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the smoke check against an origin that serves correctly test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_rather_than_forbidden",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 each way a deploy is silently broken fails the smoke check test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a check with nothing to test against is skipped test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every same-origin asset a published site references resolves test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 an unpublished site is indistinguishable from an unknown one test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every named environment repeats every var and binding test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 no secret value is committed, and the push is piped test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the smoke check asserts the operator surface is private test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build refuses a Worker type program that reaches the filesystem test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the derived artifacts are generated before the typecheck test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the operator surface retains every invocation log test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the retention declaration joins no binding set test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count",
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