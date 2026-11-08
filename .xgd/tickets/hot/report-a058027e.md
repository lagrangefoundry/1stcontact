---
uid: report-a058027e
id: REPORT-11462
type: report
title: 'Report: batch_quality_check for story-1e340c9a'
created_by: xgd
created_at: '2026-11-08T13:48:15.077051+00:00'
updated_at: '2026-11-08T13:48:15.077051+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-1e340c9a
  parent_report_uid: report-10515fdd
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T13:44:53.859107Z",
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
      "duration_seconds": 14.05291458312422,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 14,
      "test_filter": [
        "test_UAT_AC2449"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "5_nesting_links_and_off_subset_axes_are_refused\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2446 one spelling of single-run copy\\x1b[2m > \\x1b[22mtest_UAT_AC2446_one_element_and_empty_run_arrays_are_refused\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2447 a run with no axes renders as bare text\\x1b[2m > \\x1b[22mtest_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2448 run axes are bounded by the L1 envelope\\x1b[2m > \\x1b[22mtest_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2449 capture records which text runs share an inline flow\\x1b[2m > \\x1b[22mtest_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\\x1b[33m 11720\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2450 a varying captured flow folds to one multi-run node\\x1b[2m > \\x1b[22mtest_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2451 a flow that varies in nothing stays separate nodes\\x1b[2m > \\x1b[22mtest_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2452 a rejoined node takes its axes from the longest run\\x1b[2m > \\x1b[22mtest_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2453 the fidelity measure and round-trip agree with the fold\\x1b[2m > \\x1b[22mtest_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2454 the editor opens a multi-run node as one plain-string field per run\\x1b[2m > \\x1b[22mtest_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2455 editing one run changes only that run\\x1b[2m > \\x1b[22mtest_UAT_AC2455_editing_text2_replaces_only_run_two_words\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2456 a copy field addressing no run is refused with no partial write\\x1b[2m > \\x1b[22mtest_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-multi-variate-text-runs.test.ts\\x1b[2m > \\x1b[22mAC-2457 text-height estimation over runs\\x1b[2m > \\x1b[22mtest_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m14 skipped\\x1b[39m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:44:54\n\\x1b[2m   Duration \\x1b[22m 13.28s\\x1b[2m (transform 552ms, setup 0ms, import 1.20s, tests 11.72s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-e4bqpgw8.json\n\n{\"numTotalTestSuites\":16,\"numPassedTestSuites\":16,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":14,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794145494897,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2443 a plain-string text node validates and renders as before runs existed\"],\"fullName\":\"AC-2443 a plain-string text node validates and renders as before runs existed test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2444 a run-array node validates and each varying run carries its own axes\"],\"fullName\":\"AC-2444 a run-array node validates and each varying run carries its own axes test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2445 the run form is closed\"],\"fullName\":\"AC-2445 the run form is closed test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2446 one spelling of single-run copy\"],\"fullName\":\"AC-2446 one spelling of single-run copy test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2447 a run with no axes renders as bare text\"],\"fullName\":\"AC-2447 a run with no axes renders as bare text test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2448 run axes are bounded by the L1 envelope\"],\"fullName\":\"AC-2448 run axes are bounded by the L1 envelope test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2449 capture records which text runs share an inline flow\"],\"fullName\":\"AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it\",\"duration\":11720.081875,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2450 a varying captured flow folds to one multi-run node\"],\"fullName\":\"AC-2450 a varying captured flow folds to one multi-run node test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2451 a flow that varies in nothing stays separate nodes\"],\"fullName\":\"AC-2451 a flow that varies in nothing stays separate nodes test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2452 a rejoined node takes its axes from the longest run\"],\"fullName\":\"AC-2452 a rejoined node takes its axes from the longest run test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2453 the fidelity measure and round-trip agree with the fold\"],\"fullName\":\"AC-2453 the fidelity measure and round-trip agree with the fold test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2454 the editor opens a multi-run node as one plain-string field per run\"],\"fullName\":\"AC-2454 the editor opens a multi-run node as one plain-string field per run test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2455 editing one run changes only that run\"],\"fullName\":\"AC-2455 editing one run changes only that run test_UAT_AC2455_editing_text2_replaces_only_run_two_words\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2455_editing_text2_replaces_only_run_two_words\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2456 a copy field addressing no run is refused with no partial write\"],\"fullName\":\"AC-2456 a copy field addressing no run is refused with no partial write test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2457 text-height estimation over runs\"],\"fullName\":\"AC-2457 text-height estimation over runs test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794145496461,\"endTime\":1794145508181.0818,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-multi-variate-text-runs.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
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