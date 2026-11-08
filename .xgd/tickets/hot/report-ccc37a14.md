---
uid: report-ccc37a14
id: REPORT-11456
type: report
title: 'Scoped quality: fail (15 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T13:36:40.968666+00:00'
updated_at: '2026-11-08T13:36:40.968666+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-1e340c9a
  commit: 12b3b344bc36859412897dbcae2e9065b53cd7a3
---

{
  "timestamp": "2026-11-08T13:33:17.698255Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001099579967558384,
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
      "duration_seconds": 15.633824207819998,
      "passed": 14,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 15,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2443_",
        "test_UAT_AC2444_",
        "test_UAT_AC2445_",
        "test_UAT_AC2446_",
        "test_UAT_AC2447_",
        "test_UAT_AC2448_",
        "test_UAT_AC2449_",
        "test_UAT_AC2450_",
        "test_UAT_AC2451_",
        "test_UAT_AC2452_",
        "test_UAT_AC2453_",
        "test_UAT_AC2454_",
        "test_UAT_AC2455_",
        "test_UAT_AC2456_",
        "test_UAT_AC2457_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "te-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2454 the editor opens a multi-run node as one plain-string field per run\\x1b[2m > \\x1b[22mtest_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2455 editing one run changes only that run\\x1b[2m > \\x1b[22mtest_UAT_AC2455_editing_text2_replaces_only_run_two_words\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2456 a copy field addressing no run is refused with no partial write\\x1b[2m > \\x1b[22mtest_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2457 text-height estimation over runs\\x1b[2m > \\x1b[22mtest_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2449 capture records which text runs share an inline flow\\x1b[2m > \\x1b[22mtest_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: expected undefined to be defined\\x1b[39m\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-multi-variate-text-runs.test.ts:\\x1b[2m318:34\\x1b[22m\\x1b[39m\n    \\x1b[90m316|\\x1b[39m       \\x1b[35mconst\\x1b[39m first \\x1b[33m=\\x1b[39m \\x1b[34mrunByText\\x1b[39m(c\\x1b[33m,\\x1b[39m \\x1b[32m'First captured line'\\x1b[39m)\n    \\x1b[90m317|\\x1b[39m       \\x1b[35mconst\\x1b[39m second \\x1b[33m=\\x1b[39m \\x1b[34mrunByText\\x1b[39m(c\\x1b[33m,\\x1b[39m \\x1b[32m'second captured line'\\x1b[39m)\n    \\x1b[90m318|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(first\\x1b[33m?.\\x1b[39minlineGroup)\\x1b[33m.\\x1b[39m\\x1b[34mtoBeDefined\\x1b[39m()\n    \\x1b[90m   |\\x1b[39m                                  \\x1b[31m^\\x1b[39m\n    \\x1b[90m319|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(second\\x1b[33m?.\\x1b[39minlineGroup)\\x1b[33m.\\x1b[39m\\x1b[34mtoBeDefined\\x1b[39m()\n    \\x1b[90m320|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(second\\x1b[33m!\\x1b[39m\\x1b[33m.\\x1b[39minlineGroup)\\x1b[33m.\\x1b[39mnot\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(first\\x1b[33m!\\x1b[39m\\x1b[33m.\\x1b[39minlineGroup)\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m14 passed\\x1b[39m\\x1b[22m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:33:18\n\\x1b[2m   Duration \\x1b[22m 14.83s\\x1b[2m (transform 538ms, setup 0ms, import 1.17s, tests 13.31s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-2pfb997x.json\n\n{\"numTotalTestSuites\":16,\"numPassedTestSuites\":14,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":14,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794144798803,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2443 a plain-string text node validates and renders as before runs existed\"],\"fullName\":\"AC-2443 a plain-string text node validates and renders as before runs existed test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans\",\"status\":\"passed\",\"title\":\"test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans\",\"duration\":4.887750000000096,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2444 a run-array node validates and each varying run carries its own axes\"],\"fullName\":\"AC-2444 a run-array node validates and each varying run carries its own axes test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes\",\"duration\":0.7561670000000049,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2445 the run form is closed\"],\"fullName\":\"AC-2445 the run form is closed test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused\",\"duration\":2.3275000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2446 one spelling of single-run copy\"],\"fullName\":\"AC-2446 one spelling of single-run copy test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused\",\"duration\":0.41495899999995345,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2447 a run with no axes renders as bare text\"],\"fullName\":\"AC-2447 a run with no axes renders as bare text test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned\",\"duration\":0.4949589999998807,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2448 run axes are bounded by the L1 envelope\"],\"fullName\":\"AC-2448 run axes are bounded by the L1 envelope test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass\",\"status\":\"passed\",\"title\":\"test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass\",\"duration\":0.6769170000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2449 capture records which text runs share an inline flow\"],\"fullName\":\"AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\",\"status\":\"failed\",\"title\":\"test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\",\"duration\":11700.059042,\"failureMessages\":[\"AssertionError: expected undefined to be defined\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-multi-variate-text-runs.test.ts:318:34\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2450 a varying captured flow folds to one multi-run node\"],\"fullName\":\"AC-2450 a varying captured flow folds to one multi-run node test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap\",\"status\":\"passed\",\"title\":\"test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap\",\"duration\":1.0381249999991269,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2451 a flow that varies in nothing stays separate nodes\"],\"fullName\":\"AC-2451 a flow that varies in nothing stays separate nodes test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information\",\"status\":\"passed\",\"title\":\"test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information\",\"duration\":0.666125000001557,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2452 a rejoined node takes its axes from the longest run\"],\"fullName\":\"AC-2452 a rejoined node takes its axes from the longest run test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier\",\"duration\":0.7151249999988067,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2453 the fidelity measure and round-trip agree with the fold\"],\"fullName\":\"AC-2453 the fidelity measure and round-trip agree with the fold test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched\",\"duration\":1594.364708000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2454 the editor opens a multi-run node as one plain-string field per run\"],\"fullName\":\"AC-2454 the editor opens a multi-run node as one plain-string field per run test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\",\"status\":\"passed\",\"title\":\"test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\",\"duration\":0.576375000000553,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2455 editing one run changes only that run\"],\"fullName\":\"AC-2455 editing one run changes only that run test_UAT_AC2455_editing_text2_replaces_only_run_two_words\",\"status\":\"passed\",\"title\":\"test_UAT_AC2455_editing_text2_replaces_only_run_two_words\",\"duration\":0.29099999999925785,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2456 a copy field addressing no run is refused with no partial write\"],\"fullName\":\"AC-2456 a copy field addressing no run is refused with no partial write test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\",\"status\":\"passed\",\"title\":\"test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\",\"duration\":0.2415419999997539,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2457 text-height estimation over runs\"],\"fullName\":\"AC-2457 text-height estimation over runs test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"status\":\"passed\",\"title\":\"test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"duration\":0.5023750000000291,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794144800331,\"endTime\":1794144813639.5024,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-multi-variate-text-runs.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-2443 a plain-string text node validates and renders as before runs existed test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2444 a run-array node validates and each varying run carries its own axes test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2445 the run form is closed test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2446 one spelling of single-run copy test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2447 a run with no axes renders as bare text test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2448 run axes are bounded by the L1 envelope test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2450 a varying captured flow folds to one multi-run node test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2451 a flow that varies in nothing stays separate nodes test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2452 a rejoined node takes its axes from the longest run test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2453 the fidelity measure and round-trip agree with the fold test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2454 the editor opens a multi-run node as one plain-string field per run test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2455 editing one run changes only that run test_UAT_AC2455_editing_text2_replaces_only_run_two_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2456 a copy field addressing no run is refused with no partial write test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2457 text-height estimation over runs test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}