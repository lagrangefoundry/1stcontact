---
uid: report-f1a106a1
id: REPORT-6893
type: report
title: 'Report: batch_quality_check for story-e15a19ef'
created_by: xgd
created_at: '2026-10-30T19:29:57.682215+00:00'
updated_at: '2026-10-30T19:29:57.682215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e15a19ef
  parent_report_uid: report-d412b1c1
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-30T19:24:50.485005Z",
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
      "duration_seconds": 4.1990182090085,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC720"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands\\x1b[2m > \\x1b[22mtest_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)\\x1b[2m > \\x1b[22mtest_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\\x1b[33m 1240\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 12:24:51\n\\x1b[2m   Duration \\x1b[22m 3.19s\\x1b[2m (transform 978ms, setup 0ms, import 1.83s, tests 1.24s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-t3kd9t8_.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":3,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":2,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793388291697,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands\"],\"fullName\":\"story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\",\"status\":\"passed\",\"title\":\"test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\",\"duration\":0.8954169999999522,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)\"],\"fullName\":\"story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\",\"status\":\"passed\",\"title\":\"test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\",\"duration\":1240.1182500000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793388293638,\"endTime\":1793388294880.1182,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
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