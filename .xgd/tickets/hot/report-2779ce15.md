---
uid: report-2779ce15
id: REPORT-11683
type: report
title: 'Report: batch_quality_check for story-e674c60a'
created_by: xgd
created_at: '2026-11-09T03:48:41.331031+00:00'
updated_at: '2026-11-09T03:48:41.331031+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e674c60a
  parent_report_uid: report-6d5e88e9
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T03:44:51.736554Z",
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
      "duration_seconds": 3.4378044167533517,
      "passed": 14,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 14,
      "deselected": 9,
      "test_filter": [
        "test_UAT_AC2496_",
        "test_UAT_AC2497_",
        "test_UAT_AC2498_",
        "test_UAT_AC2499_",
        "test_UAT_AC1029_",
        "test_UAT_AC1036_",
        "test_UAT_AC2517_",
        "test_UAT_AC2518_",
        "test_UAT_AC2519_",
        "test_UAT_AC2520_",
        "test_UAT_AC2521_",
        "test_UAT_AC2522_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "Removed\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794195893159,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a request-time render\"],\"fullName\":\"story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel\",\"duration\":56.577167000000145,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794195895282,\"endTime\":1794195895338.5771,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/reconciliation-builder-request-time-render.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a workspace mounted over its origin\"],\"fullName\":\"story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel\",\"duration\":63.00395800000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a workspace mounted over its origin\"],\"fullName\":\"story-e674c60a workspace mounted over its origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a workspace mounted over its origin\"],\"fullName\":\"story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site\",\"status\":\"skipped\",\"title\":\"test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a workspace mounted over its origin\"],\"fullName\":\"story-e674c60a workspace mounted over its origin test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering\",\"status\":\"skipped\",\"title\":\"test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794195895476,\"endTime\":1794195895539.004,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/reconciliation-builder-workspace-mounted.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel\",\"duration\":269.08445900000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility\",\"status\":\"passed\",\"title\":\"test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility\",\"duration\":58.40924999999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not\",\"status\":\"passed\",\"title\":\"test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not\",\"duration\":43.834333000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it\",\"duration\":40.49508300000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others\",\"status\":\"passed\",\"title\":\"test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others\",\"duration\":48.1714579999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel\",\"duration\":57.06962499999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794195894515,\"endTime\":1794195895032.0696,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/test_reconciliation_builder_flip_in_place.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset\",\"duration\":276.72612500000014,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload\",\"status\":\"passed\",\"title\":\"test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload\",\"duration\":62.598207999999886,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state\",\"status\":\"passed\",\"title\":\"test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state\",\"duration\":59.337999999999965,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload\",\"status\":\"passed\",\"title\":\"test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload\",\"duration\":57.912083000000166,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on\",\"duration\":47.52458299999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged\",\"duration\":39.18825000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794195894515,\"endTime\":1794195895059.1882,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/test_reconciliation_builder_page_carry.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged",
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