---
uid: report-653cdc99
id: REPORT-7812
type: report
title: 'Scoped quality: fail (12 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-01T19:15:48.395261+00:00'
updated_at: '2026-11-01T19:15:48.395261+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-0034d937
  commit: 5a4f3c9aa9e6806887a3406589440a2a0347f29c
---

{
  "timestamp": "2026-11-01T19:12:03.878685Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016891700215637684,
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
      "duration_seconds": 8.77830966701731,
      "passed": 11,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 12,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2177_",
        "test_UAT_AC2178_",
        "test_UAT_AC2179_",
        "test_UAT_AC2180_",
        "test_UAT_AC2181_",
        "test_UAT_AC2182_",
        "test_UAT_AC2183_",
        "test_UAT_AC2184_",
        "test_UAT_AC2185_",
        "test_UAT_AC2186_",
        "test_UAT_AC2187_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 presentation\\x1b[2m > \\x1b[22mtest_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\\x1b[32m 82\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 presentation\\x1b[2m > \\x1b[22mtest_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the list is the scoped business, for every business\\x1b[2m > \\x1b[22mtest_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\\x1b[32m 58\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the business barrier\\x1b[2m > \\x1b[22mtest_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 every grant names its business\\x1b[2m > \\x1b[22mtest_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\\x1b[32m 19\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the tab and its name\\x1b[2m > \\x1b[22mtest_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: the selected contact did not survive a reload: expected undefined to be 'usr_named' // Object.is equality\\x1b[39m\n\n\\x1b[32m- Expected:\\x1b[39m\n\"usr_named\"\n\n\\x1b[31m+ Received:\\x1b[39m\nundefined\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/test_reconciliation_contacts_tab.test.ts:\\x1b[2m302:84\\x1b[22m\\x1b[39m\n    \\x1b[90m300|\\x1b[39m     \\x1b[35mawait\\x1b[39m \\x1b[34msettle\\x1b[39m()\n    \\x1b[90m301|\\x1b[39m     const selected = root.querySelector('.builder-people .list-detail-\u2026\n    \\x1b[90m302|\\x1b[39m     expect(selected?.dataset.key, 'the selected contact did not surviv\u2026\n    \\x1b[90m   |\\x1b[39m                                                                                    \\x1b[31m^\\x1b[39m\n    \\x1b[90m303|\\x1b[39m     app\\x1b[33m.\\x1b[39m\\x1b[34mdestroy\\x1b[39m()\n    \\x1b[90m304|\\x1b[39m   })\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m11 passed\\x1b[39m\\x1b[22m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:12:05\n\\x1b[2m   Duration \\x1b[22m 7.54s\\x1b[2m (transform 3.75s, setup 0ms, import 6.81s, tests 829ms, environment 437ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-ayvgar_v.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":7,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":11,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793560325322,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the list is the scoped business, for every business\"],\"fullName\":\"story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the business barrier\"],\"fullName\":\"story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"status\":\"passed\",\"title\":\"test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 every grant names its business\"],\"fullName\":\"story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793560332779,\"endTime\":1793560332867,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the tab and its name\"],\"fullName\":\"story-0034d937 \u2014 the tab and its name test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\",\"status\":\"failed\",\"title\":\"test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\",\"duration\":151.703083,\"failureMessages\":[\"AssertionError: the selected contact did not survive a reload: expected undefined to be 'usr_named' // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.test.ts:302:84\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the list\"],\"fullName\":\"story-0034d937 \u2014 the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet\",\"status\":\"passed\",\"title\":\"test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet\",\"duration\":2.9015830000000733,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the list\"],\"fullName\":\"story-0034d937 \u2014 the list test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business\",\"duration\":127.00712500000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\",\"status\":\"passed\",\"title\":\"test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\",\"duration\":6.714291999999887,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\",\"status\":\"passed\",\"title\":\"test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\",\"duration\":14.807000000000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\",\"duration\":6.57329199999981,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"duration\":14.79162499999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"duration\":82.1266250000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"duration\":12.169582999999875,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793560326193,\"endTime\":1793560326612.1697,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the tab and its name test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-0034d937 \u2014 the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 presentation test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 presentation test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-0034d937 \u2014 the tab and its name test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people",
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