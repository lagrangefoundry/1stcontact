---
uid: report-ed8cf76a
id: REPORT-11271
type: report
title: 'Report: batch_quality_check for story-7d255580'
created_by: xgd
created_at: '2026-11-08T04:30:57.802086+00:00'
updated_at: '2026-11-08T04:30:57.802086+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-7d255580
  parent_report_uid: report-2186404b
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T04:27:45.847652Z",
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
      "duration_seconds": 4.916640582960099,
      "passed": 35,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 35,
      "deselected": 12,
      "test_filter": [
        "test_UAT_AC2279_",
        "test_UAT_AC2281_",
        "test_UAT_FC_REQ-196_",
        "test_UAT_FC_REQ-205_",
        "test_UAT_AC2280_",
        "test_UAT_AC2286_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "emplate_with_no_from_sends_from_the_deployment_address\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the sending address is per template\"],\"fullName\":\"REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_a_sign_in_link_does_not_come_from_the_invite_address\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_a_sign_in_link_does_not_come_from_the_invite_address\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the sending address is per template\"],\"fullName\":\"REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_the_modal_shows_the_address_the_send_will_use\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_the_modal_shows_the_address_the_send_will_use\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the sending address is per template\"],\"fullName\":\"REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_the_route_ignores_a_from_sent_with_the_invite\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_the_route_ignores_a_from_sent_with_the_invite\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the sending address is per template\"],\"fullName\":\"REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_a_display_name_from_reaches_the_provider_verbatim\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_a_display_name_from_reaches_the_provider_verbatim\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112071039,\"endTime\":1794112071098,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-205_sending_address.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_a_sent_message_carries_both_an_html_part_and_a_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_a_sent_message_carries_both_an_html_part_and_a_text_part\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_every_url_in_an_href_appears_in_the_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_every_url_in_an_href_appears_in_the_text_part\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_an_anchor_renders_as_its_words_and_its_address\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_an_anchor_renders_as_its_words_and_its_address\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_an_anchor_whose_words_are_its_address_renders_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_an_anchor_whose_words_are_its_address_renders_once\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_the_text_reads_as_the_page_reads_rather_than_as_the_file_looks\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_the_text_reads_as_the_page_reads_rather_than_as_the_file_looks\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_a_body_with_no_derivable_text_is_refused_before_any_network_call\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_a_body_with_no_derivable_text_is_refused_before_any_network_call\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-205 \u2014 the derived text part\"],\"fullName\":\"REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_both_adapters_still_agree_on_what_a_sendable_message_is\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-205_both_adapters_still_agree_on_what_a_sendable_message_is\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112068104,\"endTime\":1794112068109,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-205_text_part.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112070055,\"endTime\":1794112070069,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112071048,\"endTime\":1794112071065,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\"}]}",
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
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_the_seeded_invite_names_an_address_and_the_other_templates_do_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_an_invite_is_sent_from_the_template_address_and_the_record_agrees",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_a_template_with_no_from_sends_from_the_deployment_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_a_sign_in_link_does_not_come_from_the_invite_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_the_modal_shows_the_address_the_send_will_use",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_the_route_ignores_a_from_sent_with_the_invite",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the sending address is per template test_UAT_FC_REQ-205_a_display_name_from_reaches_the_provider_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_a_sent_message_carries_both_an_html_part_and_a_text_part",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_every_url_in_an_href_appears_in_the_text_part",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_an_anchor_renders_as_its_words_and_its_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_an_anchor_whose_words_are_its_address_renders_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_the_text_reads_as_the_page_reads_rather_than_as_the_file_looks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_a_body_with_no_derivable_text_is_refused_before_any_network_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-205 \u2014 the derived text part test_UAT_FC_REQ-205_both_adapters_still_agree_on_what_a_sendable_message_is",
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
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part",
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}