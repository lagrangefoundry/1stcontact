---
uid: report-36fdae84
id: REPORT-6889
type: report
title: 'Report: batch_quality_check for story-e15a19ef'
created_by: xgd
created_at: '2026-10-30T19:18:31.991937+00:00'
updated_at: '2026-10-30T19:18:31.991937+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: story-e15a19ef
  parent_report_uid: report-d412b1c1
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-30T19:15:13.122383Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 2.2158466670662165,
      "passed": 1,
      "failed": 1,
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
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands\\x1b[2m > \\x1b[22mtest_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[31m\u00d7\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)\\x1b[2m > \\x1b[22mtest_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\\x1b[32m 75\\x1b[2mms\\x1b[22m\\x1b[39m\n\\x1b[31m   \u2192 reproduction imported into the sandbox tree: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)\\x1b[2m > \\x1b[22mtest_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: reproduction imported into the sandbox tree: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string\\x1b[39m\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:\\x1b[2m220:77\\x1b[22m\\x1b[39m\n    \\x1b[90m218|\\x1b[39m       \\x1b[90m// tree the render and serve must be routed to.\\x1b[39m\n    \\x1b[90m219|\\x1b[39m       const repro = cmdRepro('tastingmenu', { cwd, ref, sandbox: true \u2026\n    \\x1b[90m220|\\x1b[39m       expect(repro.draftDir, 'reproduction imported into the sandbox t\u2026\n    \\x1b[90m   |\\x1b[39m                                                                             \\x1b[31m^\\x1b[39m\n    \\x1b[90m221|\\x1b[39m         path\\x1b[33m.\\x1b[39m\\x1b[34mjoin\\x1b[39m(\\x1b[32m'storage'\\x1b[39m\\x1b[33m,\\x1b[39m \\x1b[32m'sandbox'\\x1b[39m)\\x1b[33m,\\x1b[39m\n    \\x1b[90m222|\\x1b[39m       )\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Unhandled Errors \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\\x1b[31m\\x1b[1m\nVitest caught 2 unhandled errors during the test run.\nThis might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Unhandled Rejection \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\\x1b[31m\\x1b[1mTypeError\\x1b[22m: bundle.write is not a function\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m writeL1 tools/generate/src/cli/capture/bundle.ts:\\x1b[2m143:16\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m refBundle tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:\\x1b[2m173:5\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:\\x1b[2m215:25\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:\\x1b[2m302:11\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:\\x1b[2m1903:26\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:\\x1b[2m2326:20\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m runWithCancel node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:\\x1b[2m2323:10\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:\\x1b[2m2305:20\\x1b[22m\\x1b[39m\n\n\\x1b[31mThis error originated in \"\\x1b[1mtests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[22m\" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.\\x1b[39m\n\\x1b[31mThe latest test that might've caused the error is \"\\x1b[1mtest_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\\x1b[22m\". It might mean one of the following:\n- The error was thrown, while Vitest was running this test.\n- If the error occurred after the test had been completed, this was the last documented test before it was thrown.\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Unhandled Rejection \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\\x1b[31m\\x1b[1mError\\x1b[22m: No l1.json in bundle '/var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/ac720-r2PmxC/ref'. The bundle predates the L1 fold \u2014 re-capture with `1c capture page <url>` before reproducing.\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m cmdRepro tools/generate/src/cli/repro.ts:\\x1b[2m115:11\\x1b[22m\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m processTicksAndRejections node:internal/process/task_queues:\\x1b[2m105:5\\x1b[22m\\x1b[39m\n\n\\x1b[31mThis error originated in \"\\x1b[1mtests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\\x1b[22m\" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.\\x1b[39m\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m     Errors \\x1b[22m \\x1b[1m\\x1b[31m2 errors\\x1b[39m\\x1b[22m\n\\x1b[2m   Start at \\x1b[22m 12:15:14\n\\x1b[2m   Duration \\x1b[22m 1.36s\\x1b[2m (transform 571ms, setup 0ms, import 1.21s, tests 77ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-tmjgh0n9.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":1,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":2,\"numPassedTests\":1,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793387714146,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands\"],\"fullName\":\"story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\",\"status\":\"passed\",\"title\":\"test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve\",\"duration\":0.8759159999999611,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)\"],\"fullName\":\"story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\",\"status\":\"failed\",\"title\":\"test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs\",\"duration\":75.04708299999993,\"failureMessages\":[\"AssertionError: reproduction imported into the sandbox tree: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string\\n    at Proxy.<anonymous> (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1319:15)\\n    at Proxy.<anonymous> (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1156:15)\\n    at Proxy.methodWrapper (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:220:77\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793387715435,\"endTime\":1793387715511.047,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\"}]}",
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
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    }
  },
  "overall": {
    "status": "failure",
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