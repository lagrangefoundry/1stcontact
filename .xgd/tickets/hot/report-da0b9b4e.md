---
uid: report-da0b9b4e
id: REPORT-11369
type: report
title: 'Report: batch_quality_check for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:49:06.093373+00:00'
updated_at: '2026-11-08T08:49:06.093373+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-d87c1fe2
  parent_report_uid: report-0080ff31
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T08:45:59.463751Z",
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
      "duration_seconds": 4.228603750001639,
      "passed": 3,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 3,
      "deselected": 17,
      "test_filter": [
        "test_UAT_AC2409_",
        "test_UAT_AC2337_",
        "test_UAT_AC2371_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "essages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\\x1b[32m 66\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\\x1b[2m > \\x1b[22mstory-7d255580 \u2014 the sending address is per template (REQ-205)\\x1b[2m > \\x1b[22mtest_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m17 skipped\\x1b[39m\\x1b[90m (20)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 00:46:00\n\\x1b[2m   Duration \\x1b[22m 3.42s\\x1b[2m (transform 2.41s, setup 0ms, import 5.33s, tests 290ms, environment 188ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-uyscou9h.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":10,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":20,\"numPassedTests\":3,\"numFailedTests\":0,\"numPendingTests\":17,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794127560551,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add dialog\"],\"fullName\":\"story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite modal\"],\"fullName\":\"story-7b1025b8 \u2014 the invite modal test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list\",\"status\":\"passed\",\"title\":\"test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list\",\"duration\":30.164250000000038,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite modal\"],\"fullName\":\"story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794127561191,\"endTime\":1794127561221.1643,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_contacts_add_invite_tab.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 who may add and invite\"],\"fullName\":\"story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender\",\"status\":\"passed\",\"title\":\"test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794127563923,\"endTime\":1794127563955,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_contacts_add_invite.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794127563908,\"endTime\":1794127563974,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable",
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