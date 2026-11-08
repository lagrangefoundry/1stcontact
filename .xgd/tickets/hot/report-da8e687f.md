---
uid: report-da8e687f
id: REPORT-11466
type: report
title: 'Scoped quality: fail (44 tests, 3 failed)'
created_by: xgd
created_at: '2026-11-08T14:05:50.681694+00:00'
updated_at: '2026-11-08T14:05:50.681694+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-144
  commit: d2e3948dfdbb8d8cc8e8a81d821f2dca7b11e436
---

{
  "timestamp": "2026-11-08T14:02:32.038847Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001177079975605011,
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
      "duration_seconds": 10.59262124961242,
      "passed": 41,
      "failed": 3,
      "skipped": 0,
      "errors": 0,
      "total": 44,
      "deselected": 0,
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
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2161_",
        "test_UAT_AC2324_",
        "test_UAT_AC2325_",
        "test_UAT_AC2326_",
        "test_UAT_AC2327_",
        "test_UAT_AC2328_",
        "test_UAT_AC2458_",
        "test_UAT_AC2459_",
        "test_UAT_AC2460_",
        "test_UAT_AC2461_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " business switch closes the feed, then re-reads, then reopens test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope\",\"status\":\"passed\",\"title\":\"test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope\",\"duration\":72.85204199999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else\"],\"fullName\":\"AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll\",\"status\":\"passed\",\"title\":\"test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll\",\"duration\":53.18533400000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else\"],\"fullName\":\"AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write\",\"duration\":25.39300000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail\"],\"fullName\":\"AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description\",\"duration\":33.97812500000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146554541,\"endTime\":1794146554726.978,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-live-feed.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2019 \u2014 one labelled type icon per row, no kind pill\"],\"fullName\":\"AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill\",\"status\":\"passed\",\"title\":\"test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill\",\"duration\":23.21108300000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills\",\"status\":\"passed\",\"title\":\"test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills\",\"duration\":5.041166999999973,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2020 \u2014 the row is laid out icon, then title, then pills\"],\"fullName\":\"AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills\",\"status\":\"passed\",\"title\":\"test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills\",\"duration\":2.910833000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146554295,\"endTime\":1794146554326.911,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-placement-and-row.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1811 \u2014 the content type chooses the reader, bounded above the record, download kept\"],\"fullName\":\"AC-1811 \u2014 the content type chooses the reader, bounded above the record, download kept test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact\",\"duration\":97.19245799999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1812 \u2014 the expand control opens the same document in the workspace\u2019s own dialog\"],\"fullName\":\"AC-1812 \u2014 the expand control opens the same document in the workspace\u2019s own dialog test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it\",\"duration\":13.73275000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1814 \u2014 one render-then-sanitize path, markup shown as source, an SVG left a picture\"],\"fullName\":\"AC-1814 \u2014 one render-then-sanitize path, markup shown as source, an SVG left a picture test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run\",\"status\":\"passed\",\"title\":\"test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run\",\"duration\":27.945540999999935,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1815 \u2014 a surface painted before the engines settle repaints once they do\"],\"fullName\":\"AC-1815 \u2014 a surface painted before the engines settle repaints once they do test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability\",\"status\":\"passed\",\"title\":\"test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability\",\"duration\":25.813541999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146554296,\"endTime\":1794146554460.8135,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-reader.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1717 \u2014 the file itself, and the record read-only but for an upload's role\"],\"fullName\":\"AC-1717 \u2014 the file itself, and the record read-only but for an upload's role test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role\",\"status\":\"passed\",\"title\":\"test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role\",\"duration\":48.05479200000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1718 \u2014 the description, and on an upload the role, are the editable fields\"],\"fullName\":\"AC-1718 \u2014 the description, and on an upload the role, are the editable fields test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored\",\"status\":\"passed\",\"title\":\"test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored\",\"duration\":26.39387499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed\"],\"fullName\":\"AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row\",\"status\":\"passed\",\"title\":\"test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row\",\"duration\":15.414416999999958,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2459 \u2014 no role control where the origin chose the role\"],\"fullName\":\"AC-2459 \u2014 no role control where the origin chose the role test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one\",\"duration\":16.299583000000098,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2461 \u2014 a placed material's narrowing is refused and the select reverts\"],\"fullName\":\"AC-2461 \u2014 a placed material's narrowing is refused and the select reverts test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field\",\"duration\":5.92512499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794146554298,\"endTime\":1794146554409.925,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-role-correction.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes\"],\"fullName\":\"AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"status\":\"passed\",\"title\":\"test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header\",\"duration\":30.056375000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1718 \u2014 the description is the one editable thing\"],\"fullName\":\"AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"status\":\"failed\",\"title\":\"test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored\",\"duration\":9.065083000000072,\"failureMessages\":[\"AssertionError: expected [ 'role', 'body' ] to deeply equal [ 'body' ]\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-tab.test.ts:285:71\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794146554540,\"endTime\":1794146554579.0652,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-tab.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_list_cursor_ready_frame_seq_ids_last_event_id_precedence_head_default_and_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_an_idle_feed_is_kept_alive_with_sse_comment_heartbeats",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 an event's row is the list's own row, built from the change test_UAT_AC2326_event_row_equals_the_re_read_list_row_and_is_built_without_reading_ticket_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2327 \u2014 the feed carries only the scoped business's material test_UAT_AC2327_a_second_business_writes_and_non_material_tickets_never_reach_the_subscription",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2328 \u2014 the baseline carries the change-log tables as the component declares them test_UAT_AC2328_baseline_change_log_tables_match_the_component_and_deliver_a_material_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2458 \u2014 an upload's role is corrected, and republishable is derived server-side test_UAT_AC2458_upload_role_corrects_both_ways_validates_and_derives_republishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 fetched and captured material is refused 403; no recorded origin counts as uploaded test_UAT_AC2459_fetched_and_captured_roles_are_refused_403_unchanged_and_absent_origin_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2460 \u2014 widening places the bytes on the business's one site; otherwise not placed, not failed test_UAT_AC2460_widening_places_on_the_one_site_and_zero_several_or_failing_sites_leave_the_role_changed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 narrowing a placed material is refused 409 and changes nothing test_UAT_AC2461_narrowing_a_placed_upload_is_refused_409_naming_uid_and_placed_on_and_nothing_moves",
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
        },
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
          "status": "failed"
        },
        {
          "name": "AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception",
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
          "status": "failed"
        },
        {
          "name": "AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 a business switch closes the feed, then re-reads, then reopens test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1811 \u2014 the content type chooses the reader, bounded above the record, download kept test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1812 \u2014 the expand control opens the same document in the workspace\u2019s own dialog test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1814 \u2014 one render-then-sanitize path, markup shown as source, an SVG left a picture test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1815 \u2014 a surface painted before the engines settle repaints once they do test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability",
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
          "name": "AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 no role control where the origin chose the role test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 a placed material's narrowing is refused and the select reverts test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field",
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
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
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
        "message": "3 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 3
        }
      }
    ]
  }
}