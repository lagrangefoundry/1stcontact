---
uid: report-0265a2a8
id: REPORT-11638
type: report
title: 'Report: batch_quality_check for story-f2e5032c'
created_by: xgd
created_at: '2026-11-09T00:49:46.754841+00:00'
updated_at: '2026-11-09T00:49:46.754841+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-f2e5032c
  parent_report_uid: report-0dbd477a
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T00:45:24.396647Z",
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
      "duration_seconds": 6.118241750169545,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 14,
      "test_filter": [
        "test_UAT_AC2503"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\\x1b[32m 58\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m14 skipped\\x1b[39m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 16:45:26\n\\x1b[2m   Duration \\x1b[22m 4.90s\\x1b[2m (transform 1.95s, setup 0ms, import 4.54s, tests 100ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-gvjpkfb2.json\n\n{\"numTotalTestSuites\":2,\"numPassedTestSuites\":2,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":14,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794185126245,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794185131091,\"endTime\":1794185131149,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_lead_capture.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page",
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