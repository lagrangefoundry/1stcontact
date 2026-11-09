---
uid: report-859fb208
id: REPORT-11626
type: report
title: 'Report: batch_quality_check for story-e214a00d'
created_by: xgd
created_at: '2026-11-09T00:03:03.665122+00:00'
updated_at: '2026-11-09T00:03:03.665122+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e214a00d
  parent_report_uid: report-7c94bcea
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T23:58:48.022152Z",
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
      "duration_seconds": 4.31160358292982,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 21,
      "test_filter": [
        "test_UAT_AC2436"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 the reference\\x1b[2m > \\x1b[22mtest_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m21 skipped\\x1b[39m\\x1b[90m (23)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 15:58:49\n\\x1b[2m   Duration \\x1b[22m 2.77s\\x1b[2m (transform 708ms, setup 0ms, import 2.78s, tests 113ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-7m2a3nbk.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":10,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":23,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":21,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794182329924,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the edit render carries for a modal\"],\"fullName\":\"story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"duration\":73.39116599999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 reading what the page is showing\"],\"fullName\":\"story-e214a00d \u2014 reading what the page is showing test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the mechanism does not reach\"],\"fullName\":\"story-e214a00d \u2014 what the mechanism does not reach test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794182332623,\"endTime\":1794182332696.391,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modal_page_state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"duration\":37.81941700000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 the reference\"],\"fullName\":\"story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794182332662,\"endTime\":1794182332699.8193,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modals.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute",
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