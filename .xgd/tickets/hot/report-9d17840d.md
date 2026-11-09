---
uid: report-9d17840d
id: REPORT-11627
type: report
title: 'Scoped quality: pass (23 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T00:07:44.506700+00:00'
updated_at: '2026-11-09T00:07:44.506700+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-e214a00d
  commit: 37e5a59fe5b128a809cdbe63fd27af337cfaed98
---

{
  "timestamp": "2026-11-09T00:03:08.385925Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001555001363158226,
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
      "duration_seconds": 1.868867457844317,
      "passed": 23,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 23,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2426_",
        "test_UAT_AC2427_",
        "test_UAT_AC2428_",
        "test_UAT_AC2429_",
        "test_UAT_AC2430_",
        "test_UAT_AC2431_",
        "test_UAT_AC2432_",
        "test_UAT_AC2433_",
        "test_UAT_AC2434_",
        "test_UAT_AC2435_",
        "test_UAT_AC2436_",
        "test_UAT_AC2437_",
        "test_UAT_AC2438_",
        "test_UAT_AC2439_",
        "test_UAT_AC2440_",
        "test_UAT_AC2441_",
        "test_UAT_AC2442_",
        "test_UAT_AC2491_",
        "test_UAT_AC2492_",
        "test_UAT_AC2493_",
        "test_UAT_AC2494_",
        "test_UAT_AC2495_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "fu.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":10,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":23,\"numPassedTests\":23,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794182589504,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the edit render carries for a modal\"],\"fullName\":\"story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"duration\":55.562875000000076,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 reading what the page is showing\"],\"fullName\":\"story-e214a00d \u2014 reading what the page is showing test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"duration\":14.24912500000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"status\":\"passed\",\"title\":\"test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"duration\":23.709416999999917,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"status\":\"passed\",\"title\":\"test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"duration\":19.97129099999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"status\":\"passed\",\"title\":\"test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"duration\":11.99816700000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the mechanism does not reach\"],\"fullName\":\"story-e214a00d \u2014 what the mechanism does not reach test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"status\":\"passed\",\"title\":\"test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"duration\":15.080832999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794182590442,\"endTime\":1794182590583.0808,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modal_page_state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"duration\":7.59379100000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"duration\":0.24937499999998636,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"duration\":0.444582999999966,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"duration\":0.7475829999999632,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"duration\":0.7227910000000293,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"duration\":25.12783300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"duration\":6.065582999999947,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"duration\":2.9427499999999327,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"duration\":0.46774999999990996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"status\":\"passed\",\"title\":\"test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"duration\":12.29829099999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"duration\":5.558166000000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"status\":\"passed\",\"title\":\"test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"duration\":2.3092080000000124,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"duration\":0.1831250000000182,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"status\":\"passed\",\"title\":\"test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"duration\":23.614749999999958,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"duration\":17.101916999999958,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"status\":\"passed\",\"title\":\"test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"duration\":6.673167000000035,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 the reference\"],\"fullName\":\"story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"status\":\"passed\",\"title\":\"test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"duration\":13.154290999999944,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794182590462,\"endTime\":1794182590588.1543,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modals.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 reading what the page is showing test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the mechanism does not reach test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules",
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