---
uid: report-2fc6c1c5
id: REPORT-11221
type: report
title: 'Scoped quality: fail (18 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T01:51:08.959079+00:00'
updated_at: '2026-11-08T01:51:08.959079+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-120
  commit: 1ea753f0a86f854fd617c7c90c5e187bc45fcb94
---

{
  "timestamp": "2026-11-08T01:46:29.385460Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00018958281725645065,
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
      "duration_seconds": 6.03212312515825,
      "passed": 17,
      "failed": 1,
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
      "stdout": "e_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\\x1b[32m 48\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\\x1b[2m > \\x1b[22mSTORY-120 \u2014 who a service token is\\x1b[2m > \\x1b[22mtest_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-private-access-automation.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: an ambiguous account was resolved anyway: expected +0 to be 1 // Object.is equality\\x1b[39m\n\n\\x1b[32m- Expected\\x1b[39m\n\\x1b[31m+ Received\\x1b[39m\n\n\\x1b[32m- 1\\x1b[39m\n\\x1b[31m+ 0\\x1b[39m\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-builder-private-access-automation.test.ts:\\x1b[2m603:70\\x1b[22m\\x1b[39m\n    \\x1b[90m601|\\x1b[39m         env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLA\u2026\n    \\x1b[90m602|\\x1b[39m       })\n    \\x1b[90m603|\\x1b[39m       expect(run.status, 'an ambiguous account was resolved anyway').t\u2026\n    \\x1b[90m   |\\x1b[39m                                                                      \\x1b[31m^\\x1b[39m\n    \\x1b[90m604|\\x1b[39m       expect(run.stderr, 'the refusal does not name the setting to dis\u2026\n    \\x1b[90m605|\\x1b[39m         \\x1b[32m'CLOUDFLARE_ACCOUNT_ID'\\x1b[39m\\x1b[33m,\\x1b[39m\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 17:46:30\n\\x1b[2m   Duration \\x1b[22m 5.11s\\x1b[2m (transform 4.22s, setup 0ms, import 8.01s, tests 2.42s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-cf39jodf.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":4,\"numFailedTestSuites\":1,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":17,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794102390852,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"status\":\"passed\",\"title\":\"test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header\",\"duration\":5.385250000000042,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves\",\"duration\":1640.5749170000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal\",\"duration\":0.8804169999998521,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"status\":\"failed\",\"title\":\"test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret\",\"duration\":510.74808299999995,\"failureMessages\":[\"AssertionError: an ambiguous account was resolved anyway: expected +0 to be 1 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-automation.test.ts:603:70\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794102392640,\"endTime\":1794102394797.748,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-automation.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate\",\"duration\":14.13104199999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity\",\"status\":\"passed\",\"title\":\"test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity\",\"duration\":4.910375000000158,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate\",\"duration\":11.41254200000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting\",\"status\":\"passed\",\"title\":\"test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting\",\"duration\":1.3127089999998134,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit\",\"status\":\"passed\",\"title\":\"test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit\",\"duration\":1.5526249999998072,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart\",\"status\":\"passed\",\"title\":\"test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart\",\"duration\":2.2375419999998485,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler\",\"status\":\"passed\",\"title\":\"test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler\",\"duration\":0.2567500000000109,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front\",\"status\":\"passed\",\"title\":\"test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front\",\"duration\":0.4884590000001481,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to\",\"status\":\"passed\",\"title\":\"test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to\",\"duration\":0.8379999999999654,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository\",\"status\":\"passed\",\"title\":\"test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository\",\"duration\":0.8048750000000382,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102392525,\"endTime\":1794102392562.838,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no\",\"status\":\"passed\",\"title\":\"test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no\",\"duration\":15.422334000000092,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102392530,\"endTime\":1794102392545.4224,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-builder-private-access-verdict.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\",\"status\":\"passed\",\"title\":\"test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\",\"status\":\"passed\",\"title\":\"test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-120 \u2014 who a service token is\"],\"fullName\":\"STORY-120 \u2014 who a service token is test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794102395905,\"endTime\":1794102395970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret",
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}