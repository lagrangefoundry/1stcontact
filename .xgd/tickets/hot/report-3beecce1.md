---
uid: report-3beecce1
id: REPORT-11452
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T13:25:12.861958+00:00'
updated_at: '2026-11-08T13:25:12.861958+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-e214a00d
  commit: 8e89556e800a67b11f9bf77bffffe5fdcae794ae
---

{
  "timestamp": "2026-11-08T13:22:10.645361Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015241699293255806,
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
      "duration_seconds": 1.7443786673247814,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
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
        "test_UAT_AC2442_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the renderer emits\\x1b[2m > \\x1b[22mtest_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the reader can do\\x1b[2m > \\x1b[22mtest_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\\x1b[32m 22\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the reader can do\\x1b[2m > \\x1b[22mtest_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 what the reader can do\\x1b[2m > \\x1b[22mtest_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_l1_modals.test.ts\\x1b[2m > \\x1b[22mstory-e214a00d \u2014 the reference\\x1b[2m > \\x1b[22mtest_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:22:11\n\\x1b[2m   Duration \\x1b[22m 935ms\\x1b[2m (transform 160ms, setup 0ms, import 455ms, tests 116ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-_iafog7e.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794144131775,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"duration\":7.05637500000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"duration\":0.22545900000000074,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"duration\":0.4224169999999958,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"duration\":0.7216250000000173,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"duration\":0.45329099999992195,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"duration\":23.621375000000057,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"duration\":6.174792000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"duration\":2.800958000000037,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"duration\":0.42250000000001364,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"status\":\"passed\",\"title\":\"test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"duration\":10.557084000000032,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"duration\":4.712750000000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"status\":\"passed\",\"title\":\"test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"duration\":2.30600000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"duration\":0.1569170000000213,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"status\":\"passed\",\"title\":\"test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"duration\":22.120874999999955,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"duration\":16.075541999999928,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"status\":\"passed\",\"title\":\"test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"duration\":5.0820830000000115,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 the reference\"],\"fullName\":\"story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"status\":\"passed\",\"title\":\"test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"duration\":11.990333999999962,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794144132600,\"endTime\":1794144132714.9902,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_l1_modals.test.ts\"}]}",
      "stderr": "",
      "tests": [
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