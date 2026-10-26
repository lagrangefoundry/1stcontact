---
uid: report-2cb8e623
id: REPORT-6775
type: report
title: 'Report: batch_quality_check for story-1500b111'
created_by: xgd
created_at: '2026-10-26T01:55:55.566244+00:00'
updated_at: '2026-10-26T01:55:55.566244+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-1500b111
  parent_report_uid: report-835bb45a
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-26T01:51:31.116048Z",
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
      "duration_seconds": 58.05410808394663,
      "passed": 6,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 6,
      "deselected": 2654,
      "test_filter": [
        "test_UAT_AC1715",
        "test_UAT_AC1716",
        "test_UAT_AC1717",
        "test_UAT_AC1722"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_FC_REQ-165_a_projection_says_where_its_facts_came_from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792979492234,\"endTime\":1792979492234,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-165_projected_reference.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the content type decides the reader\"],\"fullName\":\"REQ-172 \u2014 the content type decides the reader test_UAT_FC_REQ-172_the_reader_is_chosen_by_content_type_and_document_is_not_one_answer\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_the_reader_is_chosen_by_content_type_and_document_is_not_one_answer\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_markdown_is_rendered_into_a_scrolling_window_above_the_metadata\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_markdown_is_rendered_into_a_scrolling_window_above_the_metadata\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_a_txt_is_shown_as_itself_and_is_never_put_through_the_markdown_parser\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_txt_is_shown_as_itself_and_is_never_put_through_the_markdown_parser\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_a_pdf_is_given_the_browsers_own_viewer_at_the_file_route\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_pdf_is_given_the_browsers_own_viewer_at_the_file_route\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_what_nothing_can_render_is_offered_exactly_as_it_was_before\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_what_nothing_can_render_is_offered_exactly_as_it_was_before\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_an_image_keeps_the_img_it_already_had_and_gains_no_reader\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_an_image_keeps_the_img_it_already_had_and_gains_no_reader\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_a_record_whose_bytes_are_gone_says_so_rather_than_showing_an_empty_window\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_record_whose_bytes_are_gone_says_so_rather_than_showing_an_empty_window\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 a document is shown in the pane\"],\"fullName\":\"REQ-172 \u2014 a document is shown in the pane test_UAT_FC_REQ-172_a_cold_load_repaints_the_window_once_the_markdown_engines_land\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_cold_load_repaints_the_window_once_the_markdown_engines_land\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_the_button_in_the_top_right_opens_the_document_in_a_modal\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_the_button_in_the_top_right_opens_the_document_in_a_modal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_a_pdf_expands_to_the_same_viewer_and_escape_closes_it\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_a_pdf_expands_to_the_same_viewer_and_escape_closes_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the expand button opens the same document larger\"],\"fullName\":\"REQ-172 \u2014 the expand button opens the same document larger test_UAT_FC_REQ-172_browsing_to_another_document_takes_its_expanded_window_with_it\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-172_browsing_to_another_document_takes_its_expanded_window_with_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792979492234,\"endTime\":1792979492234,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_library_document_preview.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_the_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_the_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_a_new_session_is_recorded_and_reported_under_the_new_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_a_new_session_is_recorded_and_reported_under_the_new_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the assistant is told it is a consultant\"],\"fullName\":\"REQ-174 \u2014 the assistant is told it is a consultant test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 a conversation started under the old name still opens\"],\"fullName\":\"REQ-174 \u2014 a conversation started under the old name still opens test_UAT_FC_REQ-174_a_session_stored_under_the_old_role_name_resumes_and_takes_another_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_a_session_stored_under_the_old_role_name_resumes_and_takes_another_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-174 \u2014 the old word survives in exactly one place\"],\"fullName\":\"REQ-174 \u2014 the old word survives in exactly one place test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792979492234,\"endTime\":1792979492234,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-174_consultant_role.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the Library row\"],\"fullName\":\"REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792979492234,\"endTime\":1792979492234,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole account, with the open site as a badge test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole account\u2019s material, with the open site as a badge test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
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