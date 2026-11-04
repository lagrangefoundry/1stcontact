---
uid: report-22d9ec95
id: REPORT-10887
type: report
title: 'Report: batch_quality_check for story-7d255580'
created_by: xgd
created_at: '2026-11-04T17:55:31.562045+00:00'
updated_at: '2026-11-04T17:55:31.562045+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-7d255580
  parent_report_uid: report-1da9821d
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T17:51:13.710242Z",
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
      "duration_seconds": 5.534546333132312,
      "passed": 20,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 20,
      "deselected": 2,
      "test_filter": [
        "test_UAT_AC2281_",
        "test_UAT_FC_REQ-196_",
        "test_UAT_AC2275_",
        "test_UAT_AC2276_",
        "test_UAT_AC2277_",
        "test_UAT_AC2278_",
        "test_UAT_AC2286_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "iness store\\x1b[2m > \\x1b[22mtest_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 templates in the business store\\x1b[2m > \\x1b[22mtest_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 templates in the business store\\x1b[2m > \\x1b[22mtest_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m20 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m2 skipped\\x1b[39m\\x1b[90m (22)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 09:51:15\n\\x1b[2m   Duration \\x1b[22m 4.51s\\x1b[2m (transform 1.76s, setup 0ms, import 3.51s, tests 366ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-eo9_ze8f.json\n\n{\"numTotalTestSuites\":7,\"numPassedTestSuites\":7,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":22,\"numPassedTests\":20,\"numFailedTests\":0,\"numPendingTests\":2,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793814675086,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_from_address_is_declared_on_both_sides\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_from_address_is_declared_on_both_sides\",\"duration\":2.034667000000013,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_api_key_is_in_no_committed_configuration\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_api_key_is_in_no_committed_configuration\",\"duration\":0.5414580000000342,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_pushes_a_supplied_credential_and_never_prints_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_hook_pushes_a_supplied_credential_and_never_prints_it\",\"duration\":188.734708,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_leaves_a_stored_credential_alone\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_hook_leaves_a_stored_credential_alone\",\"duration\":30.352499999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_warns_loudly_when_the_credential_exists_nowhere\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_hook_warns_loudly_when_the_credential_exists_nowhere\",\"duration\":71.43133399999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 the mail configuration\"],\"fullName\":\"REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_rehearses_and_leaves_the_public_site_alone\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_hook_rehearses_and_leaves_the_public_site_alone\",\"duration\":21.63495899999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793814675942,\"endTime\":1793814676257.635,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_UAT_FC_REQ-196_mail_configuration.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_a_refused_send_is_reported_to_the_caller\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_a_refused_send_is_reported_to_the_caller\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_an_accepted_send_with_no_message_id_is_a_failure\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_an_accepted_send_with_no_message_id_is_a_failure\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_local_adapter_records_and_performs_no_network_call\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_local_adapter_records_and_performs_no_network_call\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_both_adapters_refuse_the_same_unsendable_message\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_both_adapters_refuse_the_same_unsendable_message\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_from_address_is_configuration_and_absent_is_a_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_from_address_is_configuration_and_absent_is_a_refusal\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_credential_is_the_only_thing_that_selects_a_real_send\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_the_credential_is_the_only_thing_that_selects_a_real_send\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-196 \u2014 a sendEmail port, with Resend behind it\"],\"fullName\":\"REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_this_test_runtime_holds_no_mail_credential\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-196_this_test_runtime_holds_no_mail_credential\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793814676374,\"endTime\":1793814676380,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_UAT_FC_REQ-196_mail.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"passed\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"passed\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793814679583,\"endTime\":1793814679602,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_messages.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_from_address_is_declared_on_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_api_key_is_in_no_committed_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_pushes_a_supplied_credential_and_never_prints_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_leaves_a_stored_credential_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_warns_loudly_when_the_credential_exists_nowhere",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 the mail configuration test_UAT_FC_REQ-196_the_hook_rehearses_and_leaves_the_public_site_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_a_refused_send_is_reported_to_the_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_an_accepted_send_with_no_message_id_is_a_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_local_adapter_records_and_performs_no_network_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_both_adapters_refuse_the_same_unsendable_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_from_address_is_configuration_and_absent_is_a_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_the_credential_is_the_only_thing_that_selects_a_real_send",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-196 \u2014 a sendEmail port, with Resend behind it test_UAT_FC_REQ-196_this_test_runtime_holds_no_mail_credential",
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
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url",
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