---
uid: report-43baf2b3
id: REPORT-11447
type: report
title: 'Scoped quality: fail (17 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T13:17:32.887749+00:00'
updated_at: '2026-11-08T13:17:32.887749+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e214a00d
  commit: 2acc3a5d7af3f0665a824859c5833b353ecb9c63
---

{
  "timestamp": "2026-11-08T13:14:24.932913Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013129180297255516,
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
      "duration_seconds": 1.7093514585867524,
      "passed": 16,
      "failed": 1,
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
      "stdout": "m380|\\x1b[39m     // \u2026and no reveal marker on it either, so the observer never touch\u2026\n    \\x1b[90m381|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(p\\x1b[33m.\\x1b[39mclassList\\x1b[33m.\\x1b[39m\\x1b[34mcontains\\x1b[39m(\\x1b[32m'l1-rv'\\x1b[39m))\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[35mfalse\\x1b[39m)\n    \\x1b[90m   |\\x1b[39m                                           \\x1b[31m^\\x1b[39m\n    \\x1b[90m382|\\x1b[39m     \\x1b[35mconst\\x1b[39m innerCls \\x1b[33m=\\x1b[39m \\x1b[34mown\\x1b[39m(inner)\n    \\x1b[90m383|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(inner\\x1b[33m.\\x1b[39mclassList\\x1b[33m.\\x1b[39m\\x1b[34mcontains\\x1b[39m(\\x1b[32m'l1-rv'\\x1b[39m))\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[35mtrue\\x1b[39m)\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m16 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:14:26\n\\x1b[2m   Duration \\x1b[22m 931ms\\x1b[2m (transform 158ms, setup 0ms, import 446ms, tests 121ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-uavy4kw6.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":3,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":16,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794143666045,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text\",\"duration\":7.133290999999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path\",\"duration\":0.239750000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path\",\"duration\":0.4392080000000078,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused\",\"duration\":0.7445409999999697,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the envelope accepts and refuses\"],\"fullName\":\"story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused\",\"duration\":0.44895800000000463,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics\",\"duration\":23.58991599999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell\",\"duration\":5.91170800000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document\",\"duration\":2.75,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values\",\"duration\":0.44145800000001145,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"status\":\"passed\",\"title\":\"test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open\",\"duration\":10.149417000000085,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"status\":\"passed\",\"title\":\"test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute\",\"duration\":4.984208999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"status\":\"failed\",\"title\":\"test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is\",\"duration\":5.000874999999951,\"failureMessages\":[\"AssertionError: expected true to be false // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_l1_modals.test.ts:381:43\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the renderer emits\"],\"fullName\":\"story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before\",\"duration\":0.16870800000003783,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"status\":\"passed\",\"title\":\"test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener\",\"duration\":24.105458,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does\",\"duration\":15.990249999999946,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 what the reader can do\"],\"fullName\":\"story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"status\":\"passed\",\"title\":\"test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently\",\"duration\":5.941541000000029,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e214a00d \u2014 the reference\"],\"fullName\":\"story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"status\":\"passed\",\"title\":\"test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules\",\"duration\":12.564250000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794143666861,\"endTime\":1794143666982.5642,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_l1_modals.test.ts\"}]}",
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
          "status": "failed"
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
          "test_name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is",
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