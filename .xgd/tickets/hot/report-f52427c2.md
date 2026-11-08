---
uid: report-f52427c2
id: REPORT-11622
type: report
title: 'Scoped quality: fail (23 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T23:57:29.240516+00:00'
updated_at: '2026-11-08T23:57:29.240516+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e214a00d
  commit: dd3cabb050db622ed92f3ae657b2eefb0ce0ac93
---

{
  "timestamp": "2026-11-08T23:52:52.649291Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00018187472596764565,
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
      "duration_seconds": 2.6411482081748545,
      "passed": 22,
      "failed": 1,
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
      "stdout": "iledTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":23,\"numPassedTests\":22,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794181974219,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the edit render carries for a modal\"],\"fullName\":\"story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute\",\"duration\":65.46733300000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 reading what the page is showing\"],\"fullName\":\"story-e214a00d \u2014 reading what the page is showing test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none\",\"duration\":36.29641700000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"status\":\"passed\",\"title\":\"test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels\",\"duration\":54.432458999999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"status\":\"passed\",\"title\":\"test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls\",\"duration\":53.195916999999895,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 putting a page into a state\"],\"fullName\":\"story-e214a00d \u2014 putting a page into a state test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"status\":\"passed\",\"title\":\"test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other\",\"duration\":41.081916999999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the mechanism does not reach\"],\"fullName\":\"story-e214a00d \u2014 what the mechanism does not reach test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"status\":\"passed\",\"title\":\"test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application\",\"duration\":30.493875000000116,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794181975442,\"endTime\":1794181975723.494,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modal_page_state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"duration\":15.832209000000034,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"duration\":0.33104100000002745,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"duration\":0.5102079999999205,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"duration\":0.8765000000000782,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"duration\":0.5845420000000559,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"duration\":45.73358299999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"duration\":8.678040999999894,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"duration\":8.989542000000029,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"duration\":0.6151250000000346,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"status\":\"passed\",\"title\":\"test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"duration\":33.70733300000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"status\":\"failed\",\"title\":\"test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"duration\":6.812584000000015,\"failureMessages\":[\"SecurityError: localStorage is not available for opaque origins\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"status\":\"passed\",\"title\":\"test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"duration\":10.413000000000011,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"duration\":0.24366699999995944,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"status\":\"passed\",\"title\":\"test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"duration\":89.71437500000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"duration\":31.44995800000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"status\":\"passed\",\"title\":\"test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"duration\":10.21004199999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 the reference\"],\"fullName\":\"story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"status\":\"passed\",\"title\":\"test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"duration\":14.809167000000116,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794181975471,\"endTime\":1794181975750.809,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_l1_modals.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute",
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}