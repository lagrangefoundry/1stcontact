---
uid: report-17ca46fc
id: REPORT-11705
type: report
title: 'Report: batch_quality_check for report-d402710c'
created_by: xgd
created_at: '2026-11-09T04:59:57.667028+00:00'
updated_at: '2026-11-09T04:59:57.667028+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-d402710c
  parent_report_uid: report-d2b30b1e
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T04:56:03.245273Z",
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
      "duration_seconds": 3.1382030830718577,
      "passed": 12,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 12,
      "deselected": 22,
      "test_filter": [
        "test_UAT_AC2496_",
        "test_UAT_AC2517_",
        "test_UAT_AC968_",
        "test_UAT_AC1249_",
        "test_UAT_AC2497_",
        "test_UAT_AC2498_",
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
      "stdout": "s\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1243_a_site_with_no_colours_opens_on_an_invitation_to_add_the_first_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1243_a_site_with_no_colours_opens_on_an_invitation_to_add_the_first_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1244_selecting_an_entry_reveals_a_continuous_position_control_previewing_what_the_page_paints\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1244_selecting_an_entry_reveals_a_continuous_position_control_previewing_what_the_page_paints\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1245_moving_the_position_control_while_managing_writes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1245_moving_the_position_control_while_managing_writes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1246_confirming_a_pick_resolves_to_a_palette_reference_with_a_position_only_when_it_is_not_the_colour_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1246_confirming_a_pick_resolves_to_a_palette_reference_with_a_position_only_when_it_is_not_the_colour_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1247_closing_without_confirming_answers_the_opener_with_nothing_exactly_once\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1247_closing_without_confirming_answers_the_opener_with_nothing_exactly_once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1248_opened_over_a_held_reference_the_surface_starts_on_that_entry_at_that_position\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1248_opened_over_a_held_reference_the_surface_starts_on_that_entry_at_that_position\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1249_a_colour_is_typed_here_and_applying_repaints_the_displayed_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1249_a_colour_is_typed_here_and_applying_repaints_the_displayed_page\",\"duration\":112.55766600000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1250_after_every_accepted_edit_the_surface_redraws_from_the_returned_census\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1250_after_every_accepted_edit_the_surface_redraws_from_the_returned_census\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1251_a_refused_edit_leaves_the_surface_open_and_shows_the_stores_own_message_and_hint\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1251_a_refused_edit_leaves_the_surface_open_and_shows_the_stores_own_message_and_hint\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1252_the_surface_states_the_cost_of_removal_and_rename_from_the_counts_it_shows\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1252_the_surface_states_the_cost_of_removal_and_rename_from_the_counts_it_shows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4300366a the palette popup\"],\"fullName\":\"story-4300366a the palette popup test_UAT_AC1241_the_toolbars_colour_control_opens_the_surface_for_the_displayed_site_in_both_channels\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1241_the_toolbars_colour_control_opens_the_surface_for_the_displayed_site_in_both_channels\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794200166604,\"endTime\":1794200166716.5576,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/reconciliation-palette-popup-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel\",\"duration\":117.910708,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility\",\"status\":\"passed\",\"title\":\"test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility\",\"duration\":56.95833399999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not\",\"status\":\"passed\",\"title\":\"test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not\",\"duration\":36.034000000000106,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it\",\"duration\":44.89483300000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others\",\"status\":\"passed\",\"title\":\"test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others\",\"duration\":42.324957999999924,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel\",\"status\":\"passed\",\"title\":\"test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel\",\"duration\":44.68570799999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79)\"],\"fullName\":\"story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame\",\"duration\":38.740125000000035,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794200165861,\"endTime\":1794200166242.7402,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/test_reconciliation_builder_flip_in_place.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset\",\"duration\":104.01679200000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload\",\"status\":\"passed\",\"title\":\"test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload\",\"duration\":62.157790999999975,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state\",\"status\":\"passed\",\"title\":\"test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state\",\"duration\":73.94483300000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the page carried across a channel switch\"],\"fullName\":\"story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794200165861,\"endTime\":1794200166100.9448,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUG-79/tests/test_reconciliation_builder_page_carry.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1249_a_colour_is_typed_here_and_applying_repaints_the_displayed_page",
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
          "name": "story-e674c60a \u2014 the View/Edit flip is in place (BUG-79) test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame",
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