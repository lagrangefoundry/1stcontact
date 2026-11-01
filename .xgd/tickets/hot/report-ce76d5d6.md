---
uid: report-ce76d5d6
id: REPORT-7561
type: report
title: 'Scoped quality: pass (11 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T10:45:59.117481+00:00'
updated_at: '2026-11-01T10:45:59.117481+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-0cd18650
  commit: 912e5216d298efabc55d94bfdb70fc35841ead51
---

{
  "timestamp": "2026-11-01T10:43:01.012147Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016683293506503105,
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
      "duration_seconds": 4.773321124957874,
      "passed": 11,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 11,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2132_",
        "test_UAT_AC2133_",
        "test_UAT_AC2134_",
        "test_UAT_AC2135_",
        "test_UAT_AC2136_",
        "test_UAT_AC2137_",
        "test_UAT_AC2138_",
        "test_UAT_AC2139_",
        "test_UAT_AC2140_",
        "test_UAT_AC2141_",
        "test_UAT_AC2142_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35\\x1b[39m\n\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 before acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url\\x1b[32m 18\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 before acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 before acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 before acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 before acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2137_after_acceptance_the_same_urls_answer_normally\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 acceptance\\x1b[2m > \\x1b[22mtest_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 versions and configuration\\x1b[2m > \\x1b[22mtest_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-terms-of-service-gate.workers.test.ts\\x1b[2m > \\x1b[22mTerms of service gate \u2014 versions and configuration\\x1b[2m > \\x1b[22mtest_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m11 passed\\x1b[39m\\x1b[22m\\x1b[90m (11)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 02:43:02\n\\x1b[2m   Duration \\x1b[22m 3.89s\\x1b[2m (transform 1.58s, setup 0ms, import 3.50s, tests 153ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-z4nedjzc.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":11,\"numPassedTests\":11,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793529782072,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"Terms of service gate \u2014 before acceptance\"],\"fullName\":\"Terms of service gate \u2014 before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 before acceptance\"],\"fullName\":\"Terms of service gate \u2014 before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 before acceptance\"],\"fullName\":\"Terms of service gate \u2014 before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 before acceptance\"],\"fullName\":\"Terms of service gate \u2014 before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external\",\"status\":\"passed\",\"title\":\"test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 before acceptance\"],\"fullName\":\"Terms of service gate \u2014 before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 acceptance\"],\"fullName\":\"Terms of service gate \u2014 acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time\",\"status\":\"passed\",\"title\":\"test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 acceptance\"],\"fullName\":\"Terms of service gate \u2014 acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 acceptance\"],\"fullName\":\"Terms of service gate \u2014 acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally\",\"status\":\"passed\",\"title\":\"test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 acceptance\"],\"fullName\":\"Terms of service gate \u2014 acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 versions and configuration\"],\"fullName\":\"Terms of service gate \u2014 versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor\",\"status\":\"passed\",\"title\":\"test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Terms of service gate \u2014 versions and configuration\"],\"fullName\":\"Terms of service gate \u2014 versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check\",\"status\":\"passed\",\"title\":\"test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793529785868,\"endTime\":1793529785966,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-terms-of-service-gate.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check",
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