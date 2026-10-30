---
uid: report-8fa2429a
id: REPORT-6880
type: report
title: 'Scoped quality: fail (5 tests, 2 failed, 13 orphan AC(s))'
created_by: xgd
created_at: '2026-10-30T19:01:15.081407+00:00'
updated_at: '2026-10-30T19:01:15.081407+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e15a19ef
  commit: d08ab0cd483845a8a1e20d358161cd68e91c7fac
---

{
  "timestamp": "2026-10-30T18:58:28.111699Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0002815830521285534,
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
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 7.910662875045091,
      "passed": 3,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 5,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1013_",
        "test_UAT_AC1014_",
        "test_UAT_AC1015_",
        "test_UAT_AC1016_",
        "test_UAT_AC1017_",
        "test_UAT_AC1415_",
        "test_UAT_AC1416_",
        "test_UAT_AC1417_",
        "test_UAT_AC1790_",
        "test_UAT_AC2064_",
        "test_UAT_AC2065_",
        "test_UAT_AC656_",
        "test_UAT_AC657_",
        "test_UAT_AC658_",
        "test_UAT_AC659_",
        "test_UAT_AC720_",
        "test_UAT_AC738_",
        "test_UAT_AC739_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "     const res = spawnSync('node', [BIN, 'list'], { cwd: REPO, encodi\u2026\n    \\x1b[90m155|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(res\\x1b[33m.\\x1b[39mstatus\\x1b[33m,\\x1b[39m res\\x1b[33m.\\x1b[39mstderr)\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[34m0\\x1b[39m)\n    \\x1b[90m   |\\x1b[39m                                      \\x1b[31m^\\x1b[39m\n    \\x1b[90m156|\\x1b[39m     }\\x1b[33m,\\x1b[39m\n    \\x1b[90m157|\\x1b[39m     \\x1b[34m120_000\\x1b[39m\\x1b[33m,\\x1b[39m\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[3/6]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m6 failed\\x1b[39m\\x1b[22m\\x1b[90m (6)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m2 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (5)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:58:30\n\\x1b[2m   Duration \\x1b[22m 5.40s\\x1b[2m (transform 6.87s, setup 0ms, import 1.96s, tests 7.09s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-snr9qif2.json\n\n{\"numTotalTestSuites\":11,\"numPassedTestSuites\":3,\"numFailedTestSuites\":8,\"numPendingTestSuites\":0,\"numTotalTests\":5,\"numPassedTests\":3,\"numFailedTests\":2,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793386710917,\"success\":false,\"testResults\":[{\"assertionResults\":[],\"startTime\":1793386710917,\"endTime\":1793386710917,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean\"],\"fullName\":\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"status\":\"failed\",\"title\":\"test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"duration\":2037.4775000000002,\"failureMessages\":[\"AssertionError: help: expected 1 to be +0 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-astro-free-render.test.ts:148:35\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148)\"],\"fullName\":\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC739_astro_container_never_created_for_any_page\",\"duration\":45.90220799999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793386712801,\"endTime\":1793386714885.902,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-astro-free-render.test.ts\"},{\"assertionResults\":[],\"startTime\":1793386710917,\"endTime\":1793386710917,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-cli-output-hygiene.test.ts\"},{\"assertionResults\":[],\"startTime\":1793386710917,\"endTime\":1793386710917,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-crop-offline-verb.test.ts\"},{\"assertionResults\":[],\"startTime\":1793386710917,\"endTime\":1793386710917,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-install-preflight.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server\"],\"fullName\":\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"status\":\"failed\",\"title\":\"test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"duration\":2098.020208,\"failureMessages\":[\"AssertionError: 11:58:33 AM [vite] (ssr) Error when evaluating SSR module /tools/generate/src/cli/index.ts: Failed to load url ./generated/ai-workers.js (resolved id: ./generated/ai-workers.js) in /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts. Does the file exist?\\n      at loadAndTransform (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/vite@8.1.0_@types+node@26.0.1_esbuild@0.28.1_yaml@2.9.0/node_modules/vite/dist/node/chunks/node.js:19714:31)\\nFailed to load url ./generated/ai-workers.js (resolved id: ./generated/ai-workers.js) in /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts. Does the file exist?\\n: expected 1 to be +0 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-launcher-bootstrap.test.ts:155:38\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro has left the repository\"],\"fullName\":\"story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"status\":\"passed\",\"title\":\"test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"duration\":56.12962500000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel\"],\"fullName\":\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"duration\":2852.4886659999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793386711325,\"endTime\":1793386716331.4888,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-launcher-bootstrap.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 3,
      "failed": 13,
      "total": 16,
      "failures": [
        {
          "test_name": "AC-1017 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1017 'Each command is gated on exactly what it loads; the offline verbs are never gated' (uid=acceptance_criterion-a465080d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1017.",
          "ac_uid": "acceptance_criterion-a465080d",
          "ac_id": "AC-1017",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1790 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1790 '1c crop is an offline verb: it is never gated and it crops on a tree with nothing installed' (uid=acceptance_criterion-2cadf6cf) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1790.",
          "ac_uid": "acceptance_criterion-2cadf6cf",
          "ac_id": "AC-1790",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1013 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1013 'A command that loads a declared runtime dependency refuses before doing any work when that dependency does not resolve' (uid=acceptance_criterion-0b79f27e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1013.",
          "ac_uid": "acceptance_criterion-0b79f27e",
          "ac_id": "AC-1013",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-720 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-720 'aligned-crops --sandbox renders, serves, and crops the sandbox reproduction, not the sites/ build' (uid=acceptance_criterion-72db61ca) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-720.",
          "ac_uid": "acceptance_criterion-72db61ca",
          "ac_id": "AC-720",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1415 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1415 'Every 1c command boots through a plain Vite SSR server the launcher configures itself, with no build-framework plugin' (uid=acceptance_criterion-deade1ff) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1415.",
          "ac_uid": "acceptance_criterion-deade1ff",
          "ac_id": "AC-1415",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-657 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-657 'values-diff --json prints exactly one parseable JSON document to stdout' (uid=acceptance_criterion-9c235ff1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-657.",
          "ac_uid": "acceptance_criterion-9c235ff1",
          "ac_id": "AC-657",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-658 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-658 'Render and bootstrap diagnostics are emitted on stderr, not stdout' (uid=acceptance_criterion-7f078026) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-658.",
          "ac_uid": "acceptance_criterion-7f078026",
          "ac_id": "AC-658",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-738 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-738 'Every 1c command boots with clean streams \u2014 no boot chatter from any source, and stderr is empty' (uid=acceptance_criterion-c7e51d45) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-738.",
          "ac_uid": "acceptance_criterion-c7e51d45",
          "ac_id": "AC-738",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1016 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1016 'The install refusal carries the ENVIRONMENT code, exit status 6, and the standard --json error envelope' (uid=acceptance_criterion-f7767486) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1016.",
          "ac_uid": "acceptance_criterion-f7767486",
          "ac_id": "AC-1016",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1015 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1015 'Both install faults are reported together in one refusal, not one at a time' (uid=acceptance_criterion-354f7ac4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1015.",
          "ac_uid": "acceptance_criterion-354f7ac4",
          "ac_id": "AC-1015",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1014 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1014 'An install that lags the committed lockfile is reported even when every dependency still resolves' (uid=acceptance_criterion-6876b061) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1014.",
          "ac_uid": "acceptance_criterion-6876b061",
          "ac_id": "AC-1014",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-659 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-659 'stdout is restored after the command runs, including when its computation fails' (uid=acceptance_criterion-76a08c5b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-659.",
          "ac_uid": "acceptance_criterion-76a08c5b",
          "ac_id": "AC-659",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-656 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-656 '--multi-viewport keeps the site slug as a positional in either flag order' (uid=acceptance_criterion-3e4b0eab) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-656.",
          "ac_uid": "acceptance_criterion-3e4b0eab",
          "ac_id": "AC-656",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
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
        "category": "test_failure",
        "field": "test results",
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}