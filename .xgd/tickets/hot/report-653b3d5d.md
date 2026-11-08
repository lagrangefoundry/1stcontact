---
uid: report-653b3d5d
id: REPORT-11341
type: report
title: 'Report: batch_quality_check for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T07:36:06.538325+00:00'
updated_at: '2026-11-08T07:36:06.538325+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-d87c1fe2
  parent_report_uid: report-05636ecb
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T07:32:51.601250Z",
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
      "duration_seconds": 4.709727791137993,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2364"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40\\x1b[39m\n\n(node:24602) ExperimentalWarning: SQLite is an experimental feature and might change at any time\n(Use `node --trace-warnings ...` to show where the warning was created)\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-priming-delivery.test.ts\\x1b[2m > \\x1b[22mthe Node CLI host sends the model the whole priming\\x1b[2m > \\x1b[22mtest_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder\\x1b[32m 14\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-assistant-priming-delivery.workers.test.ts\\x1b[2m > \\x1b[22mboth Worker paths send the model the whole priming\\x1b[2m > \\x1b[22mtest_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder\\x1b[32m 69\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 23:32:52\n\\x1b[2m   Duration \\x1b[22m 3.91s\\x1b[2m (transform 1.84s, setup 0ms, import 4.11s, tests 190ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-sg173nqv.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":2,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794123172678,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the Node CLI host sends the model the whole priming\"],\"fullName\":\"the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder\",\"duration\":14.046749999999975,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794123173990,\"endTime\":1794123174004.0466,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-priming-delivery.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"both Worker paths send the model the whole priming\"],\"fullName\":\"both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794123176524,\"endTime\":1794123176593,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-priming-delivery.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder",
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