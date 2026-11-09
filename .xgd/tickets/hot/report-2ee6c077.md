---
uid: report-2ee6c077
id: REPORT-11639
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T00:54:09.774174+00:00'
updated_at: '2026-11-09T00:54:09.774174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-f2e5032c
  commit: 586e44d3cf14b7386c4701cbfeee4e64dc3ba6ba
---

{
  "timestamp": "2026-11-09T00:49:52.308908Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00038737477734684944,
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
      "duration_seconds": 6.699998250231147,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2500_",
        "test_UAT_AC2501_",
        "test_UAT_AC2502_",
        "test_UAT_AC2503_",
        "test_UAT_AC2504_",
        "test_UAT_AC2505_",
        "test_UAT_AC2506_",
        "test_UAT_AC2507_",
        "test_UAT_AC2508_",
        "test_UAT_AC2509_",
        "test_UAT_AC2510_",
        "test_UAT_AC2511_",
        "test_UAT_AC2512_",
        "test_UAT_AC2513_",
        "test_UAT_AC2514_",
        "test_UAT_AC2515_",
        "test_UAT_AC2516_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "n_asset\n\\x1b[22m\\x1b[39m{\"event\":\"email_webhook_applied\",\"providerId\":\"local_6d4e85217d93475f8dbf029064731da4\",\"status\":\"bounced\",\"business\":\"recon-lead-mw8jnuao-16\"}\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\\x1b[32m 25\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\\x1b[32m 54\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\\x1b[32m 66\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\\x1b[32m 21\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 16:49:53\n\\x1b[2m   Duration \\x1b[22m 5.67s\\x1b[2m (transform 2.04s, setup 0ms, import 4.66s, tests 473ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-0mispccn.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794185393720,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 the public form surface\"],\"fullName\":\"story-f2e5032c \u2014 the public form surface test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder\",\"duration\":11.684791000000018,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the public form surface\"],\"fullName\":\"story-f2e5032c \u2014 the public form surface test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post\",\"status\":\"passed\",\"title\":\"test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post\",\"duration\":0.9486249999999927,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794185394590,\"endTime\":1794185394602.9487,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_form_surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"duration\":43,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"status\":\"passed\",\"title\":\"test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"status\":\"passed\",\"title\":\"test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"status\":\"passed\",\"title\":\"test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794185398963,\"endTime\":1794185399393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_lead_capture.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once",
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