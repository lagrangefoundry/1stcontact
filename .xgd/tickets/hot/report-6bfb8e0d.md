---
uid: report-6bfb8e0d
id: REPORT-11272
type: report
title: 'Scoped quality: pass (19 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T04:34:10.697038+00:00'
updated_at: '2026-11-08T04:34:10.697038+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-7d255580
  commit: fd15fe9080a1201f2629038a203763298296d6ac
---

{
  "timestamp": "2026-11-08T04:31:01.929684Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001105419360101223,
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
      "duration_seconds": 4.228461958002299,
      "passed": 19,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 19,
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
        "test_UAT_AC2286_",
        "test_UAT_AC2369_",
        "test_UAT_AC2370_",
        "test_UAT_AC2371_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "econciliation_outgoing_messages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\\x1b[32m 58\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m19 passed\\x1b[39m\\x1b[22m\\x1b[90m (19)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 20:31:03\n\\x1b[2m   Duration \\x1b[22m 3.41s\\x1b[2m (transform 2.56s, setup 0ms, import 5.26s, tests 533ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-7ctivlxd.json\n\n{\"numTotalTestSuites\":11,\"numPassedTestSuites\":11,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":19,\"numPassedTests\":19,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794112263042,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 rendering\"],\"fullName\":\"story-7d255580 \u2014 rendering test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket\",\"duration\":1.078416000000061,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 rendering\"],\"fullName\":\"story-7d255580 \u2014 rendering test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"status\":\"passed\",\"title\":\"test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"duration\":0.7179999999998472,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"duration\":10.848040999999967,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"status\":\"passed\",\"title\":\"test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"duration\":287.49087499999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112264390,\"endTime\":1794112264690.491,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the fallback sending address\"],\"fullName\":\"story-7d255580 \u2014 the fallback sending address test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses\",\"duration\":12.76025,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112263443,\"endTime\":1794112263455.7603,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_fallback_from.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"passed\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"passed\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112265431,\"endTime\":1794112265479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"status\":\"passed\",\"title\":\"test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112266375,\"endTime\":1794112266462,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\"}]}",
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
          "name": "story-7d255580 \u2014 the fallback sending address test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses",
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
          "status": "passed"
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
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender",
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