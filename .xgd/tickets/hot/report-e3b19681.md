---
uid: report-e3b19681
id: REPORT-11140
type: report
title: 'Scoped quality: fail (1 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-07T19:32:34.623843+00:00'
updated_at: '2026-11-07T19:32:34.623843+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e0ca0a36
  commit: 28bba085f84ee93b4f900f376c8ad81f38ef9a11
---

{
  "timestamp": "2026-11-07T19:27:54.969166Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001566670835018158,
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
      "exit_code": 1,
      "duration_seconds": 4.135144167114049,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2343_",
        "test_UAT_AC2344_",
        "test_UAT_AC2345_",
        "test_UAT_AC2346_",
        "test_UAT_AC2347_",
        "test_UAT_AC2348_",
        "test_UAT_AC2349_",
        "test_UAT_AC2350_",
        "test_UAT_AC2351_",
        "test_UAT_AC2352_",
        "test_UAT_AC2353_",
        "test_UAT_AC2354_",
        "test_UAT_AC2355_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38\\x1b[39m\n\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Suites 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m [ tests/test_reconciliation_passwordless_sign_in.workers.test.ts ]\\x1b[22m\n\\x1b[31m\\x1b[1mError\\x1b[22m: Cannot find module './generated/ticketing' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/apps/control-app/src/tickets.ts\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m maybeHandleRunRequest Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/@cloudflare+vitest-pool-workers@0.18.5_@cloudflare+workers-types@4.20260630.1_@vitest+r_5b94a1ad7f38114eefcc0af644ec7eb8/node_modules/@cloudflare/vitest-pool-workers/dist/worker/lib/cloudflare/test-internal.mjs:\\x1b[2m164:18\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m __VITEST_POOL_WORKERS_RUNNER_DURABLE_OBJECT__.fetch index.mjs:\\x1b[2m834:20\\x1b[22m\\x1b[39m\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[22m\\x1b[39m\n\\x1b[31m\\x1b[1mSerialized Error:\\x1b[22m\\x1b[39m \\x1b[90m{ code: 'ERR_MODULE_NOT_FOUND' }\\x1b[39m\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[2mno tests\\x1b[22m\n\\x1b[2m   Start at \\x1b[22m 11:27:57\n\\x1b[2m   Duration \\x1b[22m 2.17s\\x1b[2m (transform 50ms, setup 0ms, import 0ms, tests 0ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-mykg2vq0.json\n\n{\"numTotalTestSuites\":1,\"numPassedTestSuites\":0,\"numFailedTestSuites\":1,\"numPendingTestSuites\":0,\"numTotalTests\":0,\"numPassedTests\":0,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794079677268,\"success\":false,\"testResults\":[{\"assertionResults\":[],\"startTime\":1794079677268,\"endTime\":1794079677268,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ticketing' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/apps/control-app/src/tickets.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 1,
      "total": 1,
      "failures": [
        {
          "test_name": "suite: javascript-vitest",
          "k_eligible": false,
          "error_type": "infrastructure_bug",
          "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
          "suggested_fix": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
          "field": "suite: javascript-vitest",
          "kind": "quality_config_violation"
        }
      ],
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
        "category": "infrastructure_bug",
        "field": "suite: javascript-vitest",
        "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
        "suggestion": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
        "context": {
          "actual": 0
        }
      }
    ]
  }
}