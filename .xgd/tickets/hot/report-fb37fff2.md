---
uid: report-fb37fff2
id: REPORT-10879
type: report
title: 'Scoped quality: fail (12 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-04T17:40:51.618511+00:00'
updated_at: '2026-11-04T17:40:51.618511+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-7d255580
  commit: d3a03cb48614cd29d98db0ac7b584ac226e1d0f4
---

{
  "timestamp": "2026-11-04T17:36:36.700674Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001152919139713049,
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
      "duration_seconds": 5.40585962519981,
      "passed": 11,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 12,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2275_",
        "test_UAT_AC2276_",
        "test_UAT_AC2277_",
        "test_UAT_AC2278_",
        "test_UAT_AC2279_",
        "test_UAT_AC2280_",
        "test_UAT_AC2281_",
        "test_UAT_AC2282_",
        "test_UAT_AC2283_",
        "test_UAT_AC2284_",
        "test_UAT_AC2285_",
        "test_UAT_AC2286_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[31m\u00d7\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2281_message_body_reaches_the_provider_as_html\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n\\x1b[31m   \u2192 expected undefined to be '<p>Hello,</p>\\n<p>You have been invit\u2026' // Object.is equality\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 templates in the business store\\x1b[2m > \\x1b[22mtest_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 templates in the business store\\x1b[2m > \\x1b[22mtest_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\\x1b[32m 20\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 templates in the business store\\x1b[2m > \\x1b[22mtest_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sender\\x1b[2m > \\x1b[22mtest_UAT_AC2281_message_body_reaches_the_provider_as_html\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: expected undefined to be '<p>Hello,</p>\\n<p>You have been invit\u2026' // Object.is equality\\x1b[39m\n\n\\x1b[32m- Expected:\\x1b[39m\n\"<p>Hello,</p>\n<p>You have been invited to set up your account. Everything is ready \u2014\nthe link below takes you straight in, and there is no password to choose.</p>\n<p><a href=\\\"https://app.example/i/ac2281\\\" style=\\\"display:inline-block;padding:12px 20px;\nbackground:#111111;color:#ffffff;text-decoration:none;border-radius:6px;\nfont-weight:600\\\">Accept your invitation</a></p>\n<p>If that button does not work, copy the address below and paste it into\nyour browser:</p>\n<p>https://app.example/i/ac2281</p>\n<p>If you were not expecting this, you can ignore it and nothing will happen.</p>\"\n\n\\x1b[31m+ Received:\\x1b[39m\nundefined\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/test_reconciliation_outgoing_messages.workers.test.ts:\\x1b[2m233:26\\x1b[22m\\x1b[39m\n    \\x1b[90m231|\\x1b[39m     const payload = JSON.parse(provider.mock.calls[0][1].body as strin\u2026\n    \\x1b[90m232|\\x1b[39m     // The provider's HTML body field carries the rendered body, butto\u2026\n    \\x1b[90m233|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(payload\\x1b[33m.\\x1b[39mhtml)\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(rendered\\x1b[33m.\\x1b[39mbody)\n    \\x1b[90m   |\\x1b[39m                          \\x1b[31m^\\x1b[39m\n    \\x1b[90m234|\\x1b[39m     expect(String(payload.html)).toMatch(new RegExp(`<a\\\\s[^>]*href=\"$\u2026\n    \\x1b[90m235|\\x1b[39m   })\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m11 passed\\x1b[39m\\x1b[22m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 09:36:38\n\\x1b[2m   Duration \\x1b[22m 4.11s\\x1b[2m (transform 2.33s, setup 0ms, import 4.67s, tests 424ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-5ci21oua.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":4,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":11,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793813798522,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 rendering\"],\"fullName\":\"story-7d255580 \u2014 rendering test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket\",\"duration\":1.1871249999999236,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 rendering\"],\"fullName\":\"story-7d255580 \u2014 rendering test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"status\":\"passed\",\"title\":\"test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"duration\":0.740333999999848,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"duration\":2.301292000000103,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"status\":\"passed\",\"title\":\"test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"duration\":352.57054200000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793813800832,\"endTime\":1793813801189.5706,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_messages.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"passed\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"passed\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"failed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":8,\"failureMessages\":[\"AssertionError: expected undefined to be '<p>Hello,</p>\\\\n<p>You have been invit\u2026' // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_messages.workers.test.ts:233:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793813802603,\"endTime\":1793813802646,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_messages.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-7d255580 \u2014 rendering test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 rendering test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending configuration test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html",
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