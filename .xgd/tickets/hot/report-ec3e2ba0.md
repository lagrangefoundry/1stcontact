---
uid: report-ec3e2ba0
id: REPORT-7590
type: report
title: 'Report: batch_quality_check for story-1500b111'
created_by: xgd
created_at: '2026-11-01T12:30:32.998196+00:00'
updated_at: '2026-11-01T12:30:32.998196+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-1500b111
  parent_report_uid: report-64693a9f
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T12:27:15.169105Z",
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
      "duration_seconds": 5.153195459162816,
      "passed": 19,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 19,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC1714_",
        "test_UAT_AC1715_",
        "test_UAT_AC1716_",
        "test_UAT_AC1717_",
        "test_UAT_AC1718_",
        "test_UAT_AC1719_",
        "test_UAT_AC1720_",
        "test_UAT_AC1721_",
        "test_UAT_AC1722_",
        "test_UAT_AC1723_",
        "test_UAT_AC1724_",
        "test_UAT_AC1813_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2161_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ing_and_placed_on_row_agree_on_every_row\",\"duration\":28.312208000000055,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 icon, title, role pill on one line\"],\"fullName\":\"AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2161 \u2014 only the never-placed site asset is marked\"],\"fullName\":\"AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning\",\"status\":\"passed\",\"title\":\"test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning\",\"duration\":7.052000000000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536036817,\"endTime\":1793536036911.052,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-badges-the-exception.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member\"],\"fullName\":\"AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so\",\"duration\":20.006125000000054,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot\"],\"fullName\":\"AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot\",\"status\":\"passed\",\"title\":\"test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot\",\"duration\":32.731041000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2087 \u2014 a link in any description opens away from the builder, through every repaint\"],\"fullName\":\"AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint\",\"status\":\"passed\",\"title\":\"test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint\",\"duration\":27.517875000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536036719,\"endTime\":1793536036799.5178,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-capture-detail.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2019 \u2014 one labelled type icon per row, no kind pill\"],\"fullName\":\"AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill\",\"status\":\"passed\",\"title\":\"test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill\",\"duration\":23.10587499999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 the row is laid out icon, then title, then pills\"],\"fullName\":\"AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536036718,\"endTime\":1793536036741.106,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-placement-and-row.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes\"],\"fullName\":\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"status\":\"passed\",\"title\":\"test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"duration\":29.350250000000074,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1718 \u2014 the description is the one editable thing\"],\"fullName\":\"AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"status\":\"passed\",\"title\":\"test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"duration\":8.905040999999983,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536036818,\"endTime\":1793536036855.905,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-tab.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file\"],\"fullName\":\"AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536039776,\"endTime\":1793536039825,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-capture-file.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account\"],\"fullName\":\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1723 \u2014 a material\u2019s file comes back as itself\"],\"fullName\":\"AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing\"],\"fullName\":\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched\"],\"fullName\":\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1720 \u2014 a description the client wrote is recorded as theirs\"],\"fullName\":\"AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"status\":\"passed\",\"title\":\"test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards\"],\"fullName\":\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"duration\":73,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536039776,\"endTime\":1793536039925,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-library-surface.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1813 \u2014 every listed row carries what its bytes are\"],\"fullName\":\"AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"duration\":734,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536039776,\"endTime\":1793536040510,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-material-row-content-type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1715 \u2014 the whole business, and a switch leaves nothing behind test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
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