---
uid: report-b5e12485
id: REPORT-11520
type: report
title: 'Report: batch_quality_check for report-49607926'
created_by: xgd
created_at: '2026-11-08T16:46:03.719442+00:00'
updated_at: '2026-11-08T16:46:03.719442+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-49607926
  parent_report_uid: report-bfdc6c51
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T16:42:02.951361Z",
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
      "duration_seconds": 26.561885749921203,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 3,
      "test_filter": [
        "test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
        "test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41\\x1b[39m\n\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\\x1b[2m > \\x1b[22mREQ-211 the fold rejoins a varying inline flow\\x1b[2m > \\x1b[22mtest_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\\x1b[2m > \\x1b[22mREQ-211 the fold rejoins a varying inline flow\\x1b[2m > \\x1b[22mtest_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\\x1b[2m > \\x1b[22mREQ-211 the fold rejoins a varying inline flow\\x1b[2m > \\x1b[22mtest_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\\x1b[2m > \\x1b[22mREQ-211 the capture records which runs are one flow\\x1b[2m > \\x1b[22mtest_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence\\x1b[33m 12011\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\\x1b[2m > \\x1b[22mREQ-211 the capture records which runs are one flow\\x1b[2m > \\x1b[22mtest_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow\\x1b[33m 11783\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m3 skipped\\x1b[39m\\x1b[90m (5)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 08:42:04\n\\x1b[2m   Duration \\x1b[22m 25.68s\\x1b[2m (transform 764ms, setup 0ms, import 1.49s, tests 23.79s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-dxmjlz8s.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":3,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":5,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":3,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794156124165,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the capture records which runs are one flow\"],\"fullName\":\"REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence\",\"duration\":12010.646209,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the capture records which runs are one flow\"],\"fullName\":\"REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow\",\"duration\":11783.313542,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794156126059,\"endTime\":1794156149852.3135,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
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