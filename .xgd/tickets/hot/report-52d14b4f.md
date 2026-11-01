---
uid: report-52d14b4f
id: REPORT-7527
type: report
title: 'Scoped quality: fail (11 tests, 0 failed, 17 orphan AC(s))'
created_by: xgd
created_at: '2026-11-01T09:10:12.919923+00:00'
updated_at: '2026-11-01T09:10:12.919923+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-c4f329d3
  commit: 40ca97f4f5cc5659ce9982bed05ea0f181cf2792
---

{
  "timestamp": "2026-11-01T09:08:53.646754Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.000128875020891428,
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
      "duration_seconds": 3.714869749965146,
      "passed": 11,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 11,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1291_",
        "test_UAT_AC1292_",
        "test_UAT_AC1293_",
        "test_UAT_AC1294_",
        "test_UAT_AC1295_",
        "test_UAT_AC1296_",
        "test_UAT_AC1297_",
        "test_UAT_AC1298_",
        "test_UAT_AC1299_",
        "test_UAT_AC1300_",
        "test_UAT_AC1301_",
        "test_UAT_AC1302_",
        "test_UAT_AC1303_",
        "test_UAT_AC1304_",
        "test_UAT_AC1305_",
        "test_UAT_AC1306_",
        "test_UAT_AC1632_",
        "test_UAT_AC1633_",
        "test_UAT_AC1647_",
        "test_UAT_AC1648_",
        "test_UAT_AC1649_",
        "test_UAT_AC2058_",
        "test_UAT_AC2059_",
        "test_UAT_AC2099_",
        "test_UAT_AC2100_",
        "test_UAT_AC2101_",
        "test_UAT_AC2102_",
        "test_UAT_AC2103_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\\x1b[2m > \\x1b[22mSystem knowledge base \u2014 the shipping gate\\x1b[2m > \\x1b[22mtest_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\\x1b[2m > \\x1b[22mSystem knowledge base \u2014 the shipping gate\\x1b[2m > \\x1b[22mtest_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\\x1b[2m > \\x1b[22mSystem knowledge base \u2014 one release command\\x1b[2m > \\x1b[22mtest_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\\x1b[2m > \\x1b[22mSystem knowledge base \u2014 stamp precision\\x1b[2m > \\x1b[22mtest_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n(node:57847) ExperimentalWarning: SQLite is an experimental feature and might change at any time\n(Use `node --trace-warnings ...` to show where the warning was created)\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-account-discovery.test.ts\\x1b[2m > \\x1b[22mstory-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\\x1b[2m > \\x1b[22mtest_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override\\x1b[33m 648\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-account-discovery.test.ts\\x1b[2m > \\x1b[22mstory-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\\x1b[2m > \\x1b[22mtest_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base-account-discovery.test.ts\\x1b[2m > \\x1b[22mstory-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\\x1b[2m > \\x1b[22mtest_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why\\x1b[33m 1194\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Suites 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-system-knowledge-base.test.ts\\x1b[2m [ tests/reconciliation-system-knowledge-base.test.ts ]\\x1b[22m\n\\x1b[31m\\x1b[1mError\\x1b[22m: Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/apps/control-app/src/ai.ts\\x1b[39m\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m apps/control-app/src/ai.ts:\\x1b[2m57:1\\x1b[22m\\x1b[39m\n    \\x1b[90m 55|\\x1b[39m  */\\x1b[39m\n    \\x1b[90m 56|\\x1b[39m\n    \\x1b[90m 57|\\x1b[39m \\x1b[35mimport\\x1b[39m \\x1b[33m*\\x1b[39m \\x1b[35mas\\x1b[39m aiLib \\x1b[35mfrom\\x1b[39m \\x1b[32m'./generated/ai-workers.js'\\x1b[39m\n    \\x1b[90m   |\\x1b[39m \\x1b[31m^\\x1b[39m\n    \\x1b[90m 58|\\x1b[39m import type { TenantSiteStore } from '../../../tools/generate/src/stor\u2026\n    \\x1b[90m 59|\\x1b[39m \\x1b[35mimport\\x1b[39m type { \\x1b[33mTicketStore\\x1b[39m } \\x1b[35mfrom\\x1b[39m \\x1b[32m'./tickets'\\x1b[39m\n\\x1b[90m \\x1b[2m\u276f\\x1b[22m apps/control-app/src/router.ts:\\x1b[2m26:1\\x1b[22m\\x1b[39m\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[22m\\x1b[39m\n\\x1b[31m\\x1b[1mSerialized Error:\\x1b[22m\\x1b[39m \\x1b[90m{ code: 'ERR_MODULE_NOT_FOUND' }\\x1b[39m\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m11 passed\\x1b[39m\\x1b[22m\\x1b[90m (11)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 01:08:55\n\\x1b[2m   Duration \\x1b[22m 2.45s\\x1b[2m (transform 1.19s, setup 0ms, import 1.57s, tests 1.97s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-45uj69ue.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":9,\"numFailedTestSuites\":1,\"numPendingTestSuites\":0,\"numTotalTests\":11,\"numPassedTests\":11,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793524135476,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\"],\"fullName\":\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override\",\"status\":\"passed\",\"title\":\"test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override\",\"duration\":648.466542,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\"],\"fullName\":\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call\",\"duration\":9.929167000000007,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it\"],\"fullName\":\"story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why\",\"duration\":1194.1528329999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793524136083,\"endTime\":1793524137935.1528,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-system-knowledge-base-account-discovery.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the built knowledge base, packed\"],\"fullName\":\"story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp\",\"duration\":2.2895410000000993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the built knowledge base, packed\"],\"fullName\":\"story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted\",\"status\":\"passed\",\"title\":\"test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted\",\"duration\":7.619958999999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the packed module is written on every application build\"],\"fullName\":\"story-c4f329d3 \u2014 the packed module is written on every application build test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built\",\"status\":\"passed\",\"title\":\"test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built\",\"duration\":4.176292000000103,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793524136116,\"endTime\":1793524136131.1763,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-system-knowledge-base-packed.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"System knowledge base \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing\",\"duration\":5.492875000000026,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused\",\"duration\":6.901958000000036,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line\",\"status\":\"passed\",\"title\":\"test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line\",\"duration\":2.607334000000037,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 one release command\"],\"fullName\":\"System knowledge base \u2014 one release command test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments\",\"status\":\"passed\",\"title\":\"test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments\",\"duration\":16.576041999999916,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 stamp precision\"],\"fullName\":\"System knowledge base \u2014 stamp precision test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision\",\"status\":\"passed\",\"title\":\"test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision\",\"duration\":2.254332999999974,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793524136144,\"endTime\":1793524136184.2544,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\"},{\"assertionResults\":[],\"startTime\":1793524135476,\"endTime\":1793524135476,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-system-knowledge-base.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the packed module is written on every application build test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 one release command test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 stamp precision test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 11,
      "failed": 17,
      "total": 23,
      "failures": [
        {
          "test_name": "AC-1632 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1632 'The shipped and scaffolded declarations restrict nothing, and a markdown file in the corpus is resolved whatever its frontmatter' (uid=acceptance_criterion-b1dc1e0b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1632.",
          "ac_uid": "acceptance_criterion-b1dc1e0b",
          "ac_id": "AC-1632",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1633 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1633 'The document listing is exhaustive past the store's default page, and a truncated envelope is refused by name' (uid=acceptance_criterion-4a58856c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1633.",
          "ac_uid": "acceptance_criterion-4a58856c",
          "ac_id": "AC-1633",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1305 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1305 'The declaration is what the build actually uses, is never overwritten by a build, and a missing declaration is refused by name' (uid=acceptance_criterion-038a6f21) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1305.",
          "ac_uid": "acceptance_criterion-038a6f21",
          "ac_id": "AC-1305",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1304 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1304 'The map is kept out of the corpus it describes, and is retrievable as that knowledge base's awareness report' (uid=acceptance_criterion-dead3c88) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1304.",
          "ac_uid": "acceptance_criterion-dead3c88",
          "ac_id": "AC-1304",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1303 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1303 'The map is generated from the corpus it describes, names its territories in the corpus's own words, and names any territory with no way in' (uid=acceptance_criterion-33f29429) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1303.",
          "ac_uid": "acceptance_criterion-33f29429",
          "ac_id": "AC-1303",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1302 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1302 'A passage search returns a section of a document and says which document it came from' (uid=acceptance_criterion-3db47b92) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1302.",
          "ac_uid": "acceptance_criterion-3db47b92",
          "ac_id": "AC-1302",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1301 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1301 'A document is found by describing what it is about, without knowing its id, filename or title' (uid=acceptance_criterion-d88c844a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1301.",
          "ac_uid": "acceptance_criterion-d88c844a",
          "ac_id": "AC-1301",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1300 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1300 'A build with nothing carrying the membership kind is refused naming the kind, and reaches no model' (uid=acceptance_criterion-54bad87d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1300.",
          "ac_uid": "acceptance_criterion-54bad87d",
          "ac_id": "AC-1300",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1299 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1299 'An unchanged document is not rewritten and an unchanged corpus is not re-embedded' (uid=acceptance_criterion-c8ca5afa) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1299.",
          "ac_uid": "acceptance_criterion-c8ca5afa",
          "ac_id": "AC-1299",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1298 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1298 'A document that leaves the knowledge base is deleted from the corpus and stops being searchable' (uid=acceptance_criterion-40c77d21) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1298.",
          "ac_uid": "acceptance_criterion-40c77d21",
          "ac_id": "AC-1298",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1297 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1297 'A document is addressed by its human id and reads back as a document, with structured fields dropped rather than coerced' (uid=acceptance_criterion-6ebb875b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1297.",
          "ac_uid": "acceptance_criterion-6ebb875b",
          "ac_id": "AC-1297",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1296 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1296 'Every document left out of the corpus is named individually, alongside the marker that would admit it' (uid=acceptance_criterion-9030cb80) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1296.",
          "ac_uid": "acceptance_criterion-9030cb80",
          "ac_id": "AC-1296",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1295 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1295 'A document is in the knowledge base only when its kind says so, and the retired boolean is not membership' (uid=acceptance_criterion-3ae69518) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1295.",
          "ac_uid": "acceptance_criterion-3ae69518",
          "ac_id": "AC-1295",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1294 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1294 'An unrecognised form of the command is refused with usage and a failing exit, and builds nothing' (uid=acceptance_criterion-35ddcab3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1294.",
          "ac_uid": "acceptance_criterion-35ddcab3",
          "ac_id": "AC-1294",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1293 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1293 'Asking what is built reports the corpus against the ticket count and each artefact as built or missing, and is what the bare command does' (uid=acceptance_criterion-9926d333) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1293.",
          "ac_uid": "acceptance_criterion-9926d333",
          "ac_id": "AC-1293",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1292 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1292 'The corpus can be built alone, with no model and no credentials, and still leaves a coherent tree' (uid=acceptance_criterion-4d4ee569) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1292.",
          "ac_uid": "acceptance_criterion-4d4ee569",
          "ac_id": "AC-1292",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1291 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1291 'Building the knowledge base runs the whole pipeline in order and reports what it produced' (uid=acceptance_criterion-2a7a9d2b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1291.",
          "ac_uid": "acceptance_criterion-2a7a9d2b",
          "ac_id": "AC-1291",
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
  }
}