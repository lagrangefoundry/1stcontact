---
uid: report-1dfe2d58
id: REPORT-11225
type: report
title: 'Report: batch_quality_check for STORY-120'
created_by: xgd
created_at: '2026-11-08T01:56:12.818863+00:00'
updated_at: '2026-11-08T01:56:12.818863+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-120
  parent_report_uid: report-3091a642
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T01:52:38.535930Z",
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
      "duration_seconds": 3.1459971670992672,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC1453"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39\\x1b[39m\n\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\\x1b[33m 1009\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m3 skipped\\x1b[39m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 17:52:39\n\\x1b[2m   Duration \\x1b[22m 2.32s\\x1b[2m (transform 578ms, setup 0ms, import 934ms, tests 1.01s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-bw6pauwi.json\n\n{\"numTotalTestSuites\":1,\"numPassedTestSuites\":1,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":4,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":3,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794102759669,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"duration\":1008.860042,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102760984,\"endTime\":1794102761992.86,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-automation.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret",
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