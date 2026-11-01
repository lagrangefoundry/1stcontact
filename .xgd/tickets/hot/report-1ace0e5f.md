---
uid: report-1ace0e5f
id: REPORT-7817
type: report
title: 'Scoped quality: pass (12 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T19:28:04.558360+00:00'
updated_at: '2026-11-01T19:28:04.558360+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-0034d937
  commit: 1f232a44e4091bb4d017f509e2a08bd9420961f1
---

{
  "timestamp": "2026-11-01T19:22:53.335349Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001740830484777689,
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
      "duration_seconds": 5.9781174580566585,
      "passed": 12,
      "failed": 0,
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
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the tab and its name\\x1b[2m > \\x1b[22mtest_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\\x1b[32m 145\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the list\\x1b[2m > \\x1b[22mtest_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the list\\x1b[2m > \\x1b[22mtest_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business\\x1b[32m 123\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the detail pane\\x1b[2m > \\x1b[22mtest_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 presentation\\x1b[2m > \\x1b[22mtest_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\\x1b[32m 103\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 presentation\\x1b[2m > \\x1b[22mtest_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\\x1b[32m 18\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the list is the scoped business, for every business\\x1b[2m > \\x1b[22mtest_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\\x1b[32m 56\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 the business barrier\\x1b[2m > \\x1b[22mtest_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contacts_tab.workers.test.ts\\x1b[2m > \\x1b[22mstory-0034d937 \u2014 every grant names its business\\x1b[2m > \\x1b[22mtest_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m12 passed\\x1b[39m\\x1b[22m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:22:54\n\\x1b[2m   Duration \\x1b[22m 4.94s\\x1b[2m (transform 2.19s, setup 0ms, import 4.54s, tests 803ms, environment 205ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-cbmvm95_.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":12,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793560974559,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the list is the scoped business, for every business\"],\"fullName\":\"story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the business barrier\"],\"fullName\":\"story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"status\":\"passed\",\"title\":\"test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 every grant names its business\"],\"fullName\":\"story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793560979425,\"endTime\":1793560979509,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the tab and its name\"],\"fullName\":\"story-0034d937 \u2014 the tab and its name test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\",\"status\":\"passed\",\"title\":\"test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people\",\"duration\":145.35749999999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the list\"],\"fullName\":\"story-0034d937 \u2014 the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet\",\"status\":\"passed\",\"title\":\"test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet\",\"duration\":2.5853329999999914,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the list\"],\"fullName\":\"story-0034d937 \u2014 the list test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business\",\"duration\":123.23116600000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\",\"status\":\"passed\",\"title\":\"test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections\",\"duration\":6.309999999999945,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\",\"status\":\"passed\",\"title\":\"test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps\",\"duration\":16.00604199999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\",\"status\":\"passed\",\"title\":\"test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\",\"duration\":6.486958999999956,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"duration\":12.771124999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"status\":\"passed\",\"title\":\"test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"duration\":102.74858299999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"duration\":17.72779199999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793560975097,\"endTime\":1793560975529.7278,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.test.ts\"}]}",
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
          "status": "passed"
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