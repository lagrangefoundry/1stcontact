---
uid: report-71a7d46b
id: REPORT-11267
type: report
title: 'Scoped quality: fail (19 tests, 2 failed)'
created_by: xgd
created_at: '2026-11-08T04:21:02.915136+00:00'
updated_at: '2026-11-08T04:21:02.915136+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-7d255580
  commit: df149cfeed1db59689a433db01ee698817f142c9
---

{
  "timestamp": "2026-11-08T04:16:46.111330Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013545900583267212,
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
      "duration_seconds": 4.680819207802415,
      "passed": 17,
      "failed": 2,
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
      "stdout": "r_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"status\":\"passed\",\"title\":\"test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token\",\"duration\":0.677167000000054,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"status\":\"failed\",\"title\":\"test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses\",\"duration\":4.393542000000025,\"failureMessages\":[\"AssertionError: expected { \u2026(2) } to deeply equal { Object (vars, env.production.vars) }\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.test.ts:206:20\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending configuration\"],\"fullName\":\"story-7d255580 \u2014 the sending configuration test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"status\":\"passed\",\"title\":\"test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook\",\"duration\":355.42104199999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794111409101,\"endTime\":1794111409462.4211,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the fallback sending address\"],\"fullName\":\"story-7d255580 \u2014 the fallback sending address test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses\",\"duration\":13.136792000000014,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794111408163,\"endTime\":1794111408176.1367,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_fallback_from.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"passed\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"passed\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"failed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":9,\"failureMessages\":[\"AssertionError: expected 'Hello,\\\\n\\\\nYou have been invited to se\u2026' to be undefined\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.workers.test.ts:255:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794111410274,\"endTime\":1794111410321,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"status\":\"passed\",\"title\":\"test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794111411295,\"endTime\":1794111411385,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}