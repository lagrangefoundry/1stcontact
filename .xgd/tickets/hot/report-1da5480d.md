---
uid: report-1da5480d
id: REPORT-7583
type: report
title: 'Scoped quality: pass (12 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T12:03:09.868999+00:00'
updated_at: '2026-11-01T12:03:09.868999+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-387c9dfe
  commit: b7861fed676a1c76c61fd162889c256e0c03913b
---

{
  "timestamp": "2026-11-01T12:00:20.577012Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001470409333705902,
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
      "duration_seconds": 4.639404040994123,
      "passed": 12,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 12,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2149_",
        "test_UAT_AC2150_",
        "test_UAT_AC2151_",
        "test_UAT_AC2152_",
        "test_UAT_AC2153_",
        "test_UAT_AC2154_",
        "test_UAT_AC2155_",
        "test_UAT_AC2156_",
        "test_UAT_AC2157_",
        "test_UAT_AC2158_",
        "test_UAT_AC2159_",
        "test_UAT_AC2160_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "hooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":\"recon-fulfil-1@example.test\"}\n\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":\"recon-fulfil-2@example.test\"}\n\n\\x1b[90mstderr\\x1b[2m | tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\n\\x1b[22m\\x1b[39m{\"event\":\"admin_route_refused\",\"path\":\"/api/admin/businesses\",\"email\":null}\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2154_creating_an_account_provisions_its_first_business\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_business_fulfilment.workers.test.ts\\x1b[2m > \\x1b[22mBusiness Fulfilment \u2014 the operator adds a business, nobody else can\\x1b[2m > \\x1b[22mtest_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m12 passed\\x1b[39m\\x1b[22m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 04:00:21\n\\x1b[2m   Duration \\x1b[22m 3.81s\\x1b[2m (transform 1.42s, setup 0ms, import 3.46s, tests 129ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-rod3cn0_.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":12,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793534421585,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"duration\":6.163999999999987,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"status\":\"passed\",\"title\":\"test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"duration\":4.961207999999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"duration\":14.777958000000012,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793534421771,\"endTime\":1793534421796.778,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_fulfilment_guards.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\",\"status\":\"passed\",\"title\":\"test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\",\"status\":\"passed\",\"title\":\"test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2154_creating_an_account_provisions_its_first_business\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\",\"status\":\"passed\",\"title\":\"test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the operator adds a business, nobody else can\"],\"fullName\":\"Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793534425347,\"endTime\":1793534425403,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_fulfilment.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant",
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
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business",
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
  }
}