---
uid: report-fa839839
id: REPORT-11226
type: report
title: 'Scoped quality: pass (18 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T02:00:33.894081+00:00'
updated_at: '2026-11-08T02:00:33.894081+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-120
  commit: d0ff0acd0acb6944ccbe7b9e1674f5ad4d62ec72
---

{
  "timestamp": "2026-11-08T01:56:19.836786Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015950016677379608,
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
      "exit_code": 0,
      "duration_seconds": 5.60960479080677,
      "passed": 18,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 18,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1375_",
        "test_UAT_AC1376_",
        "test_UAT_AC1377_",
        "test_UAT_AC1378_",
        "test_UAT_AC1379_",
        "test_UAT_AC1380_",
        "test_UAT_AC1381_",
        "test_UAT_AC1382_",
        "test_UAT_AC1383_",
        "test_UAT_AC1384_",
        "test_UAT_AC1450_",
        "test_UAT_AC1451_",
        "test_UAT_AC1452_",
        "test_UAT_AC1453_",
        "test_UAT_AC1761_",
        "test_UAT_AC2358_",
        "test_UAT_AC2359_",
        "test_UAT_AC2360_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " tests/reconciliation-builder-private-access-gate.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-gate.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\\x1b[33m 1341\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\\x1b[33m 1032\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\\x1b[32m 33\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m18 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 17:56:21\n\\x1b[2m   Duration \\x1b[22m 4.79s\\x1b[2m (transform 4.05s, setup 0ms, import 7.72s, tests 2.61s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-o8_7aau2.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":18,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794102980994,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"status\":\"passed\",\"title\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"duration\":5.69033300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"duration\":1341.0298339999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"duration\":0.9852089999999407,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"duration\":1031.9044589999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102982691,\"endTime\":1794102985070.9045,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-automation.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate\",\"duration\":13.55925000000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity\",\"status\":\"passed\",\"title\":\"test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity\",\"duration\":7.25591600000007,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate\",\"duration\":10.209082999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting\",\"status\":\"passed\",\"title\":\"test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting\",\"duration\":1.0104590000000826,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit\",\"status\":\"passed\",\"title\":\"test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit\",\"duration\":1.158292000000074,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart\",\"status\":\"passed\",\"title\":\"test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart\",\"duration\":1.7613750000000437,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler\",\"status\":\"passed\",\"title\":\"test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler\",\"duration\":0.2178750000000491,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front\",\"status\":\"passed\",\"title\":\"test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front\",\"duration\":0.4295839999999771,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to\",\"status\":\"passed\",\"title\":\"test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to\",\"duration\":0.785082999999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository\",\"status\":\"passed\",\"title\":\"test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository\",\"duration\":0.753291999999874,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102982600,\"endTime\":1794102982636.7532,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no\",\"status\":\"passed\",\"title\":\"test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no\",\"duration\":17.674958999999944,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102982587,\"endTime\":1794102982604.675,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-verdict.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\",\"status\":\"passed\",\"title\":\"test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\",\"duration\":33,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\",\"status\":\"passed\",\"title\":\"test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102985745,\"endTime\":1794102985793,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request",
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
  }
}