---
uid: report-abecbf4f
id: REPORT-11359
type: report
title: 'Report: batch_quality_check for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:25:02.877478+00:00'
updated_at: '2026-11-08T08:25:02.877478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-d87c1fe2
  parent_report_uid: report-4f55e936
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T08:21:59.767267Z",
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
      "duration_seconds": 2.193145665805787,
      "passed": 39,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 39,
      "deselected": 12,
      "test_filter": [
        "test_UAT_AC1054_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_FC_REQ_209_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "09_measure_reports_the_primitives_and_the_font_once\",\"duration\":2.849708000000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now\",\"duration\":0.51400000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_answers_one_number\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_relate_answers_one_number\",\"duration\":0.2064579999999978,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes\",\"duration\":0.47374999999999545,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there\",\"duration\":0.18437500000004547,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute\",\"duration\":0.22399999999998954,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation\",\"duration\":0.184708999999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap\",\"duration\":0.13212500000003047,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves\",\"duration\":0.17954099999997197,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node\",\"duration\":0.19737500000002228,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name\",\"duration\":0.16029100000002927,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so\",\"duration\":0.1430000000000291,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes\",\"duration\":0.225291000000027,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero\",\"duration\":0.09725000000003092,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped\",\"duration\":0.16433299999999917,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing\",\"duration\":0.117416999999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing\",\"duration\":0.11004200000002129,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794126121638,\"endTime\":1794126121649.1643,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-209_measure_a_drawing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_measuring_script_is_valid_javascript\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_the_measuring_script_is_valid_javascript\",\"duration\":1.3614999999999782,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_composed_runs_place_themselves\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_composed_runs_place_themselves\",\"duration\":59.89095800000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_ink_and_advance_are_measurably_different\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_ink_and_advance_are_measurably_different\",\"duration\":44.46224999999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_every_glyph_has_an_extent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_every_glyph_has_an_extent\",\"duration\":43.88508300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_node_with_no_id_appears_under_its_path\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_node_with_no_id_appears_under_its_path\",\"duration\":44.521334000000024,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_empty_node_is_flagged_not_omitted\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_empty_node_is_flagged_not_omitted\",\"duration\":46.082416999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved\",\"duration\":85.93791699999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_drawing_that_names_no_real_font_is_reported_as_such\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_drawing_that_names_no_real_font_is_reported_as_such\",\"duration\":43.272290999999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_absent_family_falls_through_to_the_fallback\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_an_absent_family_falls_through_to_the_fallback\",\"duration\":43.80083300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_nested_transform_is_resolved_away\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_a_nested_transform_is_resolved_away\",\"duration\":39.074542000000065,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring a drawing for real\"],\"fullName\":\"REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_viewbox_comes_back\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_209_the_viewbox_comes_back\",\"duration\":44.81904199999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794126121549,\"endTime\":1794126122046.819,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_ink_and_advance_are_different_places",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_cap_top_and_ink_top_are_different_alignments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_font_lines_derive_from_the_metrics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_axis_is_inferred_from_the_anchor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_shape_has_no_ink_or_baseline",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_node_reference_may_contain_a_dot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_relation_is_read_from_the_same_sentence_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_measure_reports_the_primitives_and_the_font_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_answers_one_number",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_measuring_script_is_valid_javascript",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_composed_runs_place_themselves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_ink_and_advance_are_measurably_different",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_every_glyph_has_an_extent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_node_with_no_id_appears_under_its_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_empty_node_is_flagged_not_omitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_drawing_that_names_no_real_font_is_reported_as_such",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_absent_family_falls_through_to_the_fallback",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_nested_transform_is_resolved_away",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_viewbox_comes_back",
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