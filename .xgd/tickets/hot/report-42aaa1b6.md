---
uid: report-42aaa1b6
id: REPORT-11336
type: report
title: 'Scoped quality: pass (16 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T07:26:17.002043+00:00'
updated_at: '2026-11-08T07:26:17.002043+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-d2bee21c
  commit: 43306f7328cad975cad565418f68e7d068936909
---

{
  "timestamp": "2026-11-08T07:23:11.866144Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015862472355365753,
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
      "duration_seconds": 2.450905708130449,
      "passed": 16,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 16,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2393_",
        "test_UAT_AC2394_",
        "test_UAT_AC2395_",
        "test_UAT_AC2396_",
        "test_UAT_AC2397_",
        "test_UAT_AC2398_",
        "test_UAT_AC2399_",
        "test_UAT_AC2400_",
        "test_UAT_AC2401_",
        "test_UAT_AC2402_",
        "test_UAT_AC2403_",
        "test_UAT_AC2404_",
        "test_UAT_AC2405_",
        "test_UAT_AC2406_",
        "test_UAT_AC2407_",
        "test_UAT_AC2408_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "[32m 124\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c what a measurement reports\\x1b[2m > \\x1b[22mtest_UAT_AC2397_fonts_report_requested_and_resolved_face\\x1b[32m 123\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c what a measurement reports\\x1b[2m > \\x1b[22mtest_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged\\x1b[32m 41\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c relate and solve\\x1b[2m > \\x1b[22mtest_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c relate and solve\\x1b[2m > \\x1b[22mtest_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c relate and solve\\x1b[2m > \\x1b[22mtest_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c relate and solve\\x1b[2m > \\x1b[22mtest_UAT_AC2402_solve_refuses_what_one_translation_cannot_do\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c recorded relations and assert\\x1b[2m > \\x1b[22mtest_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c recorded relations and assert\\x1b[2m > \\x1b[22mtest_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c recorded relations and assert\\x1b[2m > \\x1b[22mtest_UAT_AC2405_write_image_without_assert_renders_nothing\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c the operations on the consultant surface\\x1b[2m > \\x1b[22mtest_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason\\x1b[32m 22\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c the operations on the consultant surface\\x1b[2m > \\x1b[22mtest_UAT_AC2407_write_image_description_gives_the_three_authoring_rules\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_measure_drawing.test.ts\\x1b[2m > \\x1b[22mstory-d2bee21c the operations on the consultant surface\\x1b[2m > \\x1b[22mtest_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m16 passed\\x1b[39m\\x1b[22m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 23:23:13\n\\x1b[2m   Duration \\x1b[22m 1.60s\\x1b[2m (transform 323ms, setup 0ms, import 527ms, tests 675ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-szairbjd.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":16,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794122593059,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-d2bee21c the anchor vocabulary\"],\"fullName\":\"story-d2bee21c the anchor vocabulary test_UAT_AC2393_anchors_are_a_closed_set_of_17_with_an_inferred_axis\",\"status\":\"passed\",\"title\":\"test_UAT_AC2393_anchors_are_a_closed_set_of_17_with_an_inferred_axis\",\"duration\":6.193124999999895,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c what a measurement reports\"],\"fullName\":\"story-d2bee21c what a measurement reports test_UAT_AC2394_measurement_is_root_space_primitives_fonts_once_no_internals\",\"status\":\"passed\",\"title\":\"test_UAT_AC2394_measurement_is_root_space_primitives_fonts_once_no_internals\",\"duration\":59.06445800000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c what a measurement reports\"],\"fullName\":\"story-d2bee21c what a measurement reports test_UAT_AC2395_text_reports_per_glyph_extents_and_tspan_runs_union_into_the_parent\",\"status\":\"passed\",\"title\":\"test_UAT_AC2395_text_reports_per_glyph_extents_and_tspan_runs_union_into_the_parent\",\"duration\":42.70770900000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c what a measurement reports\"],\"fullName\":\"story-d2bee21c what a measurement reports test_UAT_AC2396_ink_advance_and_font_lines_are_distinct_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC2396_ink_advance_and_font_lines_are_distinct_values\",\"duration\":123.65474999999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c what a measurement reports\"],\"fullName\":\"story-d2bee21c what a measurement reports test_UAT_AC2397_fonts_report_requested_and_resolved_face\",\"status\":\"passed\",\"title\":\"test_UAT_AC2397_fonts_report_requested_and_resolved_face\",\"duration\":122.82970799999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c what a measurement reports\"],\"fullName\":\"story-d2bee21c what a measurement reports test_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged\",\"duration\":40.58720900000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c relate and solve\"],\"fullName\":\"story-d2bee21c relate and solve test_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes\",\"duration\":0.5467919999998685,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c relate and solve\"],\"fullName\":\"story-d2bee21c relate and solve test_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix\",\"status\":\"passed\",\"title\":\"test_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix\",\"duration\":0.7983750000000782,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c relate and solve\"],\"fullName\":\"story-d2bee21c relate and solve test_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate\",\"status\":\"passed\",\"title\":\"test_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate\",\"duration\":0.726165999999921,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c relate and solve\"],\"fullName\":\"story-d2bee21c relate and solve test_UAT_AC2402_solve_refuses_what_one_translation_cannot_do\",\"status\":\"passed\",\"title\":\"test_UAT_AC2402_solve_refuses_what_one_translation_cannot_do\",\"duration\":0.39666699999997945,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c recorded relations and assert\"],\"fullName\":\"story-d2bee21c recorded relations and assert test_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta\",\"status\":\"passed\",\"title\":\"test_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta\",\"duration\":0.4099999999998545,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c recorded relations and assert\"],\"fullName\":\"story-d2bee21c recorded relations and assert test_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing\",\"duration\":0.35729200000014316,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c recorded relations and assert\"],\"fullName\":\"story-d2bee21c recorded relations and assert test_UAT_AC2405_write_image_without_assert_renders_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2405_write_image_without_assert_renders_nothing\",\"duration\":0.2559160000000702,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c the operations on the consultant surface\"],\"fullName\":\"story-d2bee21c the operations on the consultant surface test_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason\",\"duration\":21.5959170000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c the operations on the consultant surface\"],\"fullName\":\"story-d2bee21c the operations on the consultant surface test_UAT_AC2407_write_image_description_gives_the_three_authoring_rules\",\"status\":\"passed\",\"title\":\"test_UAT_AC2407_write_image_description_gives_the_three_authoring_rules\",\"duration\":0.48233300000015333,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d2bee21c the operations on the consultant surface\"],\"fullName\":\"story-d2bee21c the operations on the consultant surface test_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings\",\"status\":\"passed\",\"title\":\"test_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings\",\"duration\":1.597458000000188,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794122594224,\"endTime\":1794122594646.5974,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_measure_drawing.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d2bee21c the anchor vocabulary test_UAT_AC2393_anchors_are_a_closed_set_of_17_with_an_inferred_axis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2394_measurement_is_root_space_primitives_fonts_once_no_internals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2395_text_reports_per_glyph_extents_and_tspan_runs_union_into_the_parent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2396_ink_advance_and_font_lines_are_distinct_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2397_fonts_report_requested_and_resolved_face",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2402_solve_refuses_what_one_translation_cannot_do",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2405_write_image_without_assert_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2407_write_image_description_gives_the_three_authoring_rules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings",
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