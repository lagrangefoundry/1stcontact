---
uid: report-402f9f7b
id: REPORT-6884
type: report
title: 'Report: batch_quality_check for story-e15a19ef'
created_by: xgd
created_at: '2026-10-30T19:08:01.901781+00:00'
updated_at: '2026-10-30T19:08:01.901781+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e15a19ef
  parent_report_uid: report-a131ae1f
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-30T19:03:37.000350Z",
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
      "duration_seconds": 6.555203666910529,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC738",
        "test_UAT_AC1415"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-launcher-bootstrap.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 the launcher configures its own plain Vite SSR server\\x1b[2m > \\x1b[22mtest_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\\x1b[33m 1503\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-launcher-bootstrap.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 Astro has left the repository\\x1b[2m > \\x1b[22mtest_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-launcher-bootstrap.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel\\x1b[2m > \\x1b[22mtest_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-astro-free-render.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 the 1c bootstrap leaves both streams clean\\x1b[2m > \\x1b[22mtest_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\\x1b[33m 4554\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-1c-astro-free-render.test.ts\\x1b[2m > \\x1b[22mstory-e15a19ef \u2014 Astro is never engaged by the render (REQ-148)\\x1b[2m > \\x1b[22mtest_UAT_AC739_astro_container_never_created_for_any_page\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m3 skipped\\x1b[39m\\x1b[90m (5)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 12:03:38\n\\x1b[2m   Duration \\x1b[22m 5.48s\\x1b[2m (transform 582ms, setup 0ms, import 911ms, tests 6.06s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-ma00o9kw.json\n\n{\"numTotalTestSuites\":7,\"numPassedTestSuites\":7,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":5,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":3,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793387018301,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean\"],\"fullName\":\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"status\":\"passed\",\"title\":\"test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"duration\":4554.075958,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148)\"],\"fullName\":\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page\",\"status\":\"skipped\",\"title\":\"test_UAT_AC739_astro_container_never_created_for_any_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387019233,\"endTime\":1793387023787.076,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-astro-free-render.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server\"],\"fullName\":\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"duration\":1503.0522919999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro has left the repository\"],\"fullName\":\"story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel\"],\"fullName\":\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387018478,\"endTime\":1793387019981.0522,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-launcher-bootstrap.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself",
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