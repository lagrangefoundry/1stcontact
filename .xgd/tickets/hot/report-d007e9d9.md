---
uid: report-d007e9d9
id: REPORT-6802
type: report
title: 'Scoped quality: pass (8 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-27T21:13:25.582979+00:00'
updated_at: '2026-10-27T21:13:25.582979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-47fb84e6
  commit: ed955463fe57059b08bb0f2f13e07f2775169969
---

{
  "timestamp": "2026-10-27T21:05:11.524930Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013845879584550858,
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
      "duration_seconds": 181.69862737506628,
      "passed": 8,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 8,
      "deselected": 2674,
      "test_filter": [
        "test_UAT_AC2036_",
        "test_UAT_AC2037_",
        "test_UAT_AC2038_",
        "test_UAT_AC2039_",
        "test_UAT_AC2040_",
        "test_UAT_AC2041_",
        "test_UAT_AC2042_",
        "test_UAT_AC2043_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "est_UAT_FC_REQ-172_a_cold_load_repaints_the_window_once_the_markdown_engines_land\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_the_button_in_the_top_right_opens_the_document_in_a_modal\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_the_button_in_the_top_right_opens_the_document_in_a_modal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_a_pdf_expands_to_the_same_viewer_and_escape_closes_it\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_pdf_expands_to_the_same_viewer_and_escape_closes_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_browsing_to_another_document_takes_its_expanded_window_with_it\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_browsing_to_another_document_takes_its_expanded_window_with_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793135114139,\"endTime\":1793135114139,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_library_document_preview.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_the_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_the_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_a_new_session_is_recorded_and_reported_under_the_new_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_a_new_session_is_recorded_and_reported_under_the_new_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 a conversation started under the old name still opens\"],\"fullName\":\"REQ-174 \u2014 a conversation started under the old name still opens test_UAT_FC_REQ-174_a_session_stored_under_the_old_role_name_resumes_and_takes_another_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_a_session_stored_under_the_old_role_name_resumes_and_takes_another_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the old word survives in exactly one place\"],\"fullName\":\"REQ-174 \u2014 the old word survives in exactly one place test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793135114139,\"endTime\":1793135114139,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-174_consultant_role.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793135114139,\"endTime\":1793135114139,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates\",\"duration\":203.9146249999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size\",\"status\":\"passed\",\"title\":\"test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size\",\"duration\":9.873582999999599,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side\",\"status\":\"passed\",\"title\":\"test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side\",\"duration\":5.012582999999722,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle\",\"status\":\"passed\",\"title\":\"test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle\",\"duration\":10.119166999999834,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step\",\"status\":\"passed\",\"title\":\"test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step\",\"duration\":0.7834579999998823,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for\",\"status\":\"passed\",\"title\":\"test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for\",\"duration\":6.588749999999891,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it\",\"duration\":10.123333999999886,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work\",\"status\":\"passed\",\"title\":\"test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work\",\"duration\":1.9816249999998945,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793135116933,\"endTime\":1793135117181.9817,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_reconciliation_fidelity_compare_and_judge.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work",
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