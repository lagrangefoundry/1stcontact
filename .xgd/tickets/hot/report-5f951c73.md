---
uid: report-5f951c73
id: REPORT-12057
type: report
title: 'Report: batch_quality_check for story-179b8c06'
created_by: xgd
created_at: '2026-11-09T23:11:45.155529+00:00'
updated_at: '2026-11-09T23:11:45.155529+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-179b8c06
  parent_report_uid: report-d2930bf8
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T23:07:51.109575Z",
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
      "duration_seconds": 6.538987416308373,
      "passed": 9,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 9,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2329_",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC2573_",
        "test_UAT_AC2574_",
        "test_UAT_AC2575_",
        "test_UAT_AC1412_",
        "test_UAT_AC1413_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome is gated by a site declaration\\x1b[2m > \\x1b[22mtest_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\\x1b[32m 80\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 link controls\\x1b[2m > \\x1b[22mtest_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-strict-contract.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome v2 address prompt\\x1b[2m > \\x1b[22mtest_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully\\x1b[32m 50\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-strict-contract.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 behavior config and slots are closed at the write boundary\\x1b[2m > \\x1b[22mtest_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders\\x1b[32m 35\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-strict-contract.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 a refused write names every fault precisely\\x1b[2m > \\x1b[22mtest_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error\\x1b[32m 14\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-strict-contract.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation\\x1b[2m > \\x1b[22mtest_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind\\x1b[32m 42\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-strict-contract.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome v2 on the behavior contract\\x1b[2m > \\x1b[22mtest_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint\\x1b[32m 34\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-behavior-edge-runtime.workers.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed\\x1b[32m 23\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-behavior-edge-runtime.workers.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m9 passed\\x1b[39m\\x1b[22m\\x1b[90m (9)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 15:07:52\n\\x1b[2m   Duration \\x1b[22m 5.43s\\x1b[2m (transform 1.99s, setup 0ms, import 5.01s, tests 327ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-e81_149h.json\n\n{\"numTotalTestSuites\":11,\"numPassedTestSuites\":11,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":9,\"numPassedTests\":9,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794265672587,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome is gated by a site declaration\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\",\"duration\":79.91916700000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 link controls\"],\"fullName\":\"story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\",\"status\":\"passed\",\"title\":\"test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\",\"duration\":7.40949999999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265674794,\"endTime\":1794265674881.4094,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-account-chrome.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 address prompt\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 address prompt test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully\",\"status\":\"passed\",\"title\":\"test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully\",\"duration\":49.6104170000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 behavior config and slots are closed at the write boundary\"],\"fullName\":\"story-179b8c06 \u2014 behavior config and slots are closed at the write boundary test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders\",\"status\":\"passed\",\"title\":\"test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders\",\"duration\":34.659167000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a refused write names every fault precisely\"],\"fullName\":\"story-179b8c06 \u2014 a refused write names every fault precisely test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error\",\"status\":\"passed\",\"title\":\"test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error\",\"duration\":14.459541999999828,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind\",\"status\":\"passed\",\"title\":\"test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind\",\"duration\":41.859874999999874,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 on the behavior contract\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint\",\"status\":\"passed\",\"title\":\"test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint\",\"duration\":33.99712499999987,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265675085,\"endTime\":1794265675259.997,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-strict-contract.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\"],\"fullName\":\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed\",\"status\":\"passed\",\"title\":\"test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\"],\"fullName\":\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts\",\"status\":\"passed\",\"title\":\"test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265677990,\"endTime\":1794265678022,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-edge-runtime.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 address prompt test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior config and slots are closed at the write boundary test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a refused write names every fault precisely test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts",
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