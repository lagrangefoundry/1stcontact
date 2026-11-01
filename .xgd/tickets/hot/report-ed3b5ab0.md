---
uid: report-ed3b5ab0
id: REPORT-7866
type: report
title: 'Report: batch_quality_check for report-54bc92a7'
created_by: xgd
created_at: '2026-11-01T22:36:46.476708+00:00'
updated_at: '2026-11-01T22:36:46.476708+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-54bc92a7
  parent_report_uid: report-d43d2825
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T22:32:56.349011Z",
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
      "duration_seconds": 5.814244708046317,
      "passed": 9,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 9,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC2158",
        "test_UAT_AC2149",
        "test_UAT_AC2150",
        "test_UAT_AC2152",
        "test_UAT_AC2153",
        "test_UAT_AC2154",
        "test_UAT_AC2155",
        "test_UAT_AC2156",
        "test_UAT_AC2157"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":\"recon-fulfil-1@example.test\"}\n\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":\"recon-fulfil-2@example.test\"}\n\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":\"recon-fulfil-3@example.test\"}\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\\x1b[32m 32\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\\x1b[32m 18\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2154_creating_an_account_provisions_its_first_business\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m9 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m3 skipped\\x1b[39m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 14:32:57\n\\x1b[2m   Duration \\x1b[22m 4.77s\\x1b[2m (transform 1.97s, setup 0ms, import 4.35s, tests 219ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-uxtxgw2x.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":9,\"numFailedTests\":0,\"numPendingTests\":3,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793572377620,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"duration\":8.12266600000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793572377813,\"endTime\":1793572377821.1226,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_fulfilment_guards.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\",\"status\":\"passed\",\"title\":\"test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\",\"status\":\"passed\",\"title\":\"test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2154_creating_an_account_provisions_its_first_business\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\",\"status\":\"passed\",\"title\":\"test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793572382291,\"endTime\":1793572382397,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_fulfilment.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses",
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