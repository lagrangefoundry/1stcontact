---
uid: report-ee5c14a1
id: REPORT-10932
type: report
title: 'Report: batch_quality_check for report-3f77b790'
created_by: xgd
created_at: '2026-11-04T20:50:00.384120+00:00'
updated_at: '2026-11-04T20:50:00.384120+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-3f77b790
  parent_report_uid: report-a931f6c9
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T20:45:20.648073Z",
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
      "duration_seconds": 2.785966250114143,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 4,
      "test_filter": [
        "test_UAT_AC1421"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37\\x1b[39m\n\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\\x1b[32m 44\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC894_publishing_always_renders_from_the_current_draft\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m4 skipped\\x1b[39m\\x1b[90m (5)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 12:45:22\n\\x1b[2m   Duration \\x1b[22m 1.76s\\x1b[2m (transform 799ms, setup 0ms, import 1.24s, tests 44ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-11fgjbas.json\n\n{\"numTotalTestSuites\":2,\"numPassedTestSuites\":2,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":5,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":4,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793825122085,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\",\"duration\":43.6557499999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC894_publishing_always_renders_from_the_current_draft\",\"status\":\"skipped\",\"title\":\"test_UAT_AC894_publishing_always_renders_from_the_current_draft\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\",\"status\":\"skipped\",\"title\":\"test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793825123807,\"endTime\":1793825123850.6558,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-publish-revision.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only",
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