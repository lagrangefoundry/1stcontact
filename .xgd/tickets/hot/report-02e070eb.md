---
uid: report-02e070eb
id: REPORT-11470
type: report
title: 'Report: batch_quality_check for STORY-144'
created_by: xgd
created_at: '2026-11-08T14:11:48.453372+00:00'
updated_at: '2026-11-08T14:11:48.453372+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-144
  parent_report_uid: report-7bb22111
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T14:08:39.855193Z",
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
      "duration_seconds": 1.7938217921182513,
      "passed": 5,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 5,
      "deselected": 11,
      "test_filter": [
        "test_UAT_AC1717",
        "test_UAT_AC2086",
        "test_UAT_AC1718"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ed_here_filter\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-library-badges-the-exception.test.ts\\x1b[2m > \\x1b[22mAC-1717 \u2014 the file itself, and the record read-only\\x1b[2m > \\x1b[22mtest_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on\\x1b[32m 32\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-library-badges-the-exception.test.ts\\x1b[2m > \\x1b[22mAC-2018 \u2014 the warning and the Placed on row read one list\\x1b[2m > \\x1b[22mtest_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-library-badges-the-exception.test.ts\\x1b[2m > \\x1b[22mAC-2020 \u2014 icon, title, role pill on one line\\x1b[2m > \\x1b[22mtest_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-library-badges-the-exception.test.ts\\x1b[2m > \\x1b[22mAC-2161 \u2014 only the never-placed site asset is marked\\x1b[2m > \\x1b[22mtest_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m5 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m11 skipped\\x1b[39m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 06:08:41\n\\x1b[2m   Duration \\x1b[22m 860ms\\x1b[2m (transform 292ms, setup 0ms, import 137ms, tests 480ms, environment 899ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-l20cxzvn.json\n\n{\"numTotalTestSuites\":20,\"numPassedTestSuites\":20,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":5,\"numFailedTests\":0,\"numPendingTests\":11,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794146921159,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1715 \u2014 the whole business, and a switch leaves nothing behind\"],\"fullName\":\"AC-1715 \u2014 the whole business, and a switch leaves nothing behind test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis\"],\"fullName\":\"AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1717 \u2014 the file itself, and the record read-only\"],\"fullName\":\"AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on\",\"duration\":31.509165999999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2018 \u2014 the warning and the Placed on row read one list\"],\"fullName\":\"AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 icon, title, role pill on one line\"],\"fullName\":\"AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2161 \u2014 only the never-placed site asset is marked\"],\"fullName\":\"AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146921993,\"endTime\":1794146922024.5093,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-badges-the-exception.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member\"],\"fullName\":\"AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot\"],\"fullName\":\"AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot\",\"status\":\"passed\",\"title\":\"test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot\",\"duration\":47.89949999999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2087 \u2014 a link in any description opens away from the builder, through every repaint\"],\"fullName\":\"AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146921910,\"endTime\":1794146921957.8994,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-capture-detail.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1717 \u2014 the file itself, and the record read-only but for an upload's role\"],\"fullName\":\"AC-1717 \u2014 the file itself, and the record read-only but for an upload's role test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role\",\"status\":\"passed\",\"title\":\"test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role\",\"duration\":36.66670899999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1718 \u2014 the description, and on an upload the role, are the editable fields\"],\"fullName\":\"AC-1718 \u2014 the description, and on an upload the role, are the editable fields test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored\",\"status\":\"passed\",\"title\":\"test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored\",\"duration\":18.82570800000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed\"],\"fullName\":\"AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2459 \u2014 no role control where the origin chose the role\"],\"fullName\":\"AC-2459 \u2014 no role control where the origin chose the role test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2461 \u2014 a placed material's narrowing is refused and the select reverts\"],\"fullName\":\"AC-2461 \u2014 a placed material's narrowing is refused and the select reverts test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146921910,\"endTime\":1794146921965.8257,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-role-correction.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes\"],\"fullName\":\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1718 \u2014 the description is the one editable thing\"],\"fullName\":\"AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"status\":\"passed\",\"title\":\"test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"duration\":26.044875000000047,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146921991,\"endTime\":1794146922017.045,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-tab.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only but for an upload's role test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description, and on an upload the role, are the editable fields test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
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