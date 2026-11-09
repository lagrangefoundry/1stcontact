---
uid: report-42f629fd
id: REPORT-11634
type: report
title: 'Scoped quality: fail (17 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-09T00:43:04.529646+00:00'
updated_at: '2026-11-09T00:43:04.529646+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-f2e5032c
  commit: 8c7d16f4f02d9b28a246628b738d7f7022597d48
---

{
  "timestamp": "2026-11-09T00:38:47.753903Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016791699454188347,
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
      "duration_seconds": 5.216178250033408,
      "passed": 16,
      "failed": 1,
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
      "stdout": "\\x1b[22mtest_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\\x1b[32m 18\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_public_lead_capture.workers.test.ts\\x1b[2m > \\x1b[22mstory-f2e5032c \u2014 public lead capture\\x1b[2m > \\x1b[22mtest_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: expected [ 'nojs-multipart@example.com', 400 ] to deeply equal [ 'nojs-multipart@example.com', 200 ]\\x1b[39m\n\n\\x1b[32m- Expected\\x1b[39m\n\\x1b[31m+ Received\\x1b[39m\n\n\\x1b[2m  [\\x1b[22m\n\\x1b[2m    \"nojs-multipart@example.com\",\\x1b[22m\n\\x1b[32m-   200,\\x1b[39m\n\\x1b[31m+   400,\\x1b[39m\n\\x1b[2m  ]\\x1b[22m\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/test_reconciliation_public_lead_capture.workers.test.ts:\\x1b[2m458:42\\x1b[22m\\x1b[39m\n    \\x1b[90m456|\\x1b[39m\n    \\x1b[90m457|\\x1b[39m     \\x1b[35mfor\\x1b[39m (\\x1b[35mconst\\x1b[39m { address\\x1b[33m,\\x1b[39m response } \\x1b[35mof\\x1b[39m results) {\n    \\x1b[90m458|\\x1b[39m       \\x1b[34mexpect\\x1b[39m([address\\x1b[33m,\\x1b[39m response\\x1b[33m.\\x1b[39mstatus])\\x1b[33m.\\x1b[39m\\x1b[34mtoEqual\\x1b[39m([address\\x1b[33m,\\x1b[39m \\x1b[34m200\\x1b[39m])\n    \\x1b[90m   |\\x1b[39m                                          \\x1b[31m^\\x1b[39m\n    \\x1b[90m459|\\x1b[39m       expect(response.headers.get('content-type')).toBe('text/html; ch\u2026\n    \\x1b[90m460|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(response\\x1b[33m.\\x1b[39mheaders\\x1b[33m.\\x1b[39m\\x1b[35mget\\x1b[39m(\\x1b[32m'cache-control'\\x1b[39m))\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[32m'no-store'\\x1b[39m)\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m16 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 16:38:49\n\\x1b[2m   Duration \\x1b[22m 4.22s\\x1b[2m (transform 1.51s, setup 0ms, import 3.49s, tests 376ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-n9jjvk0s.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":2,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":16,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794184729083,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 the public form surface\"],\"fullName\":\"story-f2e5032c \u2014 the public form surface test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder\",\"duration\":10.385083000000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the public form surface\"],\"fullName\":\"story-f2e5032c \u2014 the public form surface test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post\",\"status\":\"passed\",\"title\":\"test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post\",\"duration\":0.682124999999985,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794184729732,\"endTime\":1794184729742.6821,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_form_surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"duration\":55,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"status\":\"failed\",\"title\":\"test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"duration\":16,\"failureMessages\":[\"AssertionError: expected [ 'nojs-multipart@example.com', 400 ] to deeply equal [ 'nojs-multipart@example.com', 200 ]\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_lead_capture.workers.test.ts:458:42\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"status\":\"passed\",\"title\":\"test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"status\":\"passed\",\"title\":\"test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"status\":\"passed\",\"title\":\"test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"duration\":57,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794184732969,\"endTime\":1794184733309,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_lead_capture.workers.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page",
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