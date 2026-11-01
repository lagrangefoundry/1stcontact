---
uid: report-27bcec96
id: REPORT-7846
type: report
title: 'Report: batch_quality_check for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T20:44:11.020367+00:00'
updated_at: '2026-11-01T20:44:11.020367+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e674c60a
  parent_report_uid: report-5b83c2c7
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T20:41:01.182205Z",
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
      "duration_seconds": 4.616932708071545,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2144_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36\\x1b[39m\n\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-builder-businesses-endpoint.workers.test.ts\\x1b[2m > \\x1b[22mstory-e674c60a \u2014 the businesses endpoint\\x1b[2m > \\x1b[22mtest_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 12:41:02\n\\x1b[2m   Duration \\x1b[22m 3.72s\\x1b[2m (transform 1.37s, setup 0ms, import 3.37s, tests 93ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-ms5kt1k5.json\n\n{\"numTotalTestSuites\":2,\"numPassedTestSuites\":2,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":1,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793565662262,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the businesses endpoint\"],\"fullName\":\"story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565665970,\"endTime\":1793565665986,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-businesses-endpoint.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
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