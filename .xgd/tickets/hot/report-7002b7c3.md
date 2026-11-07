---
uid: report-7002b7c3
id: REPORT-11113
type: report
title: 'Report: batch_quality_check for story-7b1025b8'
created_by: xgd
created_at: '2026-11-07T08:00:37.164888+00:00'
updated_at: '2026-11-07T08:00:37.164888+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-7b1025b8
  parent_report_uid: report-72de7cec
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-07T07:56:43.660199Z",
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
      "duration_seconds": 8.328819958027452,
      "passed": 93,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 93,
      "deselected": 29,
      "test_filter": [
        "test_UAT_AC2175_",
        "test_UAT_AC2339_",
        "test_UAT_AC2253_",
        "test_UAT_AC2254_",
        "test_UAT_AC2257_",
        "test_UAT_AC1742_",
        "test_UAT_AC2115_",
        "test_UAT_AC2169_",
        "test_UAT_AC2170_",
        "test_UAT_AC2171_",
        "test_UAT_AC1743_",
        "test_UAT_AC1744_",
        "test_UAT_AC2172_",
        "test_UAT_AC2173_",
        "test_UAT_AC2176_",
        "test_UAT_AC1745_",
        "test_UAT_AC1759_",
        "test_UAT_AC2247_",
        "test_UAT_AC2248_",
        "test_UAT_AC2336_",
        "test_UAT_AC2337_",
        "test_UAT_AC2338_",
        "test_UAT_FC_REQ-199_",
        "test_UAT_FC_REQ-186_",
        "test_UAT_FC_BUG-53_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "mental act test_UAT_FC_REQ-199_adding_a_contact_leaves_them_a_lead_and_sends_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_adding_a_contact_leaves_them_a_lead_and_sends_nothing\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 add is the fundamental act\"],\"fullName\":\"REQ-199 \u2014 add is the fundamental act test_UAT_FC_REQ-199_adding_an_address_already_here_finds_them_rather_than_duplicating\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_adding_an_address_already_here_finds_them_rather_than_duplicating\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 one message per contact, one recipient each\"],\"fullName\":\"REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_inviting_n_contacts_produces_n_messages_with_one_recipient_each\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_inviting_n_contacts_produces_n_messages_with_one_recipient_each\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 one message per contact, one recipient each\"],\"fullName\":\"REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_each_message_goes_to_that_contacts_primary_address\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_each_message_goes_to_that_contacts_primary_address\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 one message per contact, one recipient each\"],\"fullName\":\"REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_a_contact_with_no_primary_address_is_refused_by_name_and_the_rest_still_send\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_a_contact_with_no_primary_address_is_refused_by_name_and_the_rest_still_send\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the operator sees afterwards\"],\"fullName\":\"REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_inviting_moves_a_lead_to_invited_and_never_to_member\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_inviting_moves_a_lead_to_invited_and_never_to_member\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the operator sees afterwards\"],\"fullName\":\"REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_a_send_the_provider_refused_is_recorded_and_still_counts_as_asking\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_a_send_the_provider_refused_is_recorded_and_still_counts_as_asking\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the operator sees afterwards\"],\"fullName\":\"REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_each_send_leaves_a_record_the_detail_pane_can_read\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_each_send_leaves_a_record_the_detail_pane_can_read\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the operator sees afterwards\"],\"fullName\":\"REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_a_second_press_is_a_second_message_and_a_second_event\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_a_second_press_is_a_second_message_and_a_second_event\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the operator sees afterwards\"],\"fullName\":\"REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_the_record_lands_with_its_journal_row_so_a_worker_can_write_a_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_record_lands_with_its_journal_row_so_a_worker_can_write_a_ticket\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send\"],\"fullName\":\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_the_modal_opens_with_the_sender_and_the_invite_templates_copy\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_modal_opens_with_the_sender_and_the_invite_templates_copy\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send\"],\"fullName\":\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_an_edited_subject_and_body_are_what_is_sent_and_the_template_is_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_an_edited_subject_and_body_are_what_is_sent_and_the_template_is_untouched\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send\"],\"fullName\":\"REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_copy_that_lost_its_link_refuses_and_nothing_is_sent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_copy_that_lost_its_link_refuses_and_nothing_is_sent\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the tenant barrier\"],\"fullName\":\"REQ-199 \u2014 the tenant barrier test_UAT_FC_REQ-199_a_contact_id_from_another_business_cannot_be_invited\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_a_contact_id_from_another_business_cannot_be_invited\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the tenant barrier\"],\"fullName\":\"REQ-199 \u2014 the tenant barrier test_UAT_FC_REQ-199_the_same_two_acts_from_two_businesses_differ_only_in_which_rows_move\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_same_two_acts_from_two_businesses_differ_only_in_which_rows_move\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794038209728,\"endTime\":1794038209854,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"status\":\"passed\",\"title\":\"test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"duration\":33,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"status\":\"passed\",\"title\":\"test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"duration\":51,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 who may add and invite\"],\"fullName\":\"story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"duration\":34,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"status\":\"passed\",\"title\":\"test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794038211982,\"endTime\":1794038212307,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_contacts_add_invite.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "BUG-53 \u2014 one control size, declared once test_UAT_FC_BUG-53_every_control_the_report_named_takes_one_declared_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 one control size, declared once test_UAT_FC_BUG-53_no_controls_size_is_left_to_a_later_font_shorthand",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 one control size, declared once test_UAT_FC_BUG-53_that_size_is_smaller_than_the_default_they_used_to_take",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 one control size, declared once test_UAT_FC_BUG-53_the_top_bars_own_actions_are_reached_by_that_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 one control size, declared once test_UAT_FC_BUG-53_the_filter_rows_controls_share_one_height",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 nothing these surfaces emit is unstyled test_UAT_FC_BUG-53_every_class_the_tab_and_its_dialogs_emit_has_a_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 nothing these surfaces emit is unstyled test_UAT_FC_BUG-53_no_dialog_anywhere_asks_for_a_class_that_does_not_exist",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-53 \u2014 nothing these surfaces emit is unstyled test_UAT_FC_BUG-53_each_dialog_marks_its_affirmative_button_the_way_the_app_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the invite is a control on the uniform tab test_UAT_FC_REQ-186_the_invite_sits_with_the_list_controls_and_not_in_a_persons_detail",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the invite is a control on the uniform tab test_UAT_FC_REQ-186_the_control_is_absent_for_someone_who_does_not_own_this_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the invite is a control on the uniform tab test_UAT_FC_REQ-186_the_control_is_not_the_fulfilment_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 what the operator is told test_UAT_FC_REQ-186_inviting_a_contact_is_reported_and_moves_them_along_the_pipeline",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 what the operator is told test_UAT_FC_REQ-186_a_refusal_is_put_in_front_of_the_operator",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the two controls compose test_UAT_FC_REQ-186_invite_plus_provision_is_what_makes_a_level_one_customer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 add is its own control test_UAT_FC_REQ-199_the_tab_carries_a_plus_control_that_adds_a_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 add is its own control test_UAT_FC_REQ-199_the_add_dialog_says_that_nothing_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_every_row_carries_a_checkbox",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_invite_is_disabled_with_none_checked_and_enabled_with_one_or_more",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_the_stylesheet_has_a_rule_for_the_disabled_state",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_ticking_a_row_does_not_move_the_detail_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_from_is_display_only_and_subject_and_body_come_from_the_template",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_recipient_field_is_labelled_to_list_and_explains_itself_on_hover",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_to_list_shows_one_selected_address_per_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_a_selected_contact_with_no_address_is_visible_before_anything_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_sending_posts_the_selected_ids_with_the_edited_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_report_names_every_selected_contact_and_the_selection_clears",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the report says test_UAT_FC_REQ-199_every_outcome_gets_a_line_and_a_refusal_names_the_person_and_the_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the report says test_UAT_FC_REQ-199_the_two_outcomes_worth_acting_on_are_accented_by_one_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2337_invite_is_disabled_until_a_row_is_checked_and_opens_a_message_with_read_only_from_and_a_to_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC2115_a_non_null_grant_subject_is_an_account_key_and_the_capacity_grant_names_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition on an existing contact test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1745_admission_refuses_an_unconfigured_platform_tenant_naming_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 one control, both levels test_UAT_FC_REQ-186_an_invited_person_appears_in_that_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 one control, both levels test_UAT_FC_REQ-186_the_same_invite_from_two_businesses_differs_only_in_tenant_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 one control, both levels test_UAT_FC_REQ-186_a_level_two_member_reaches_no_business_of_ours",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 a transition, not a creation test_UAT_FC_REQ-186_inviting_a_known_contact_updates_one_row_and_inserts_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 a transition, not a creation test_UAT_FC_REQ-186_an_id_that_names_nobody_here_cannot_be_invited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 a transition, not a creation test_UAT_FC_REQ-186_a_differently_cased_address_is_the_same_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 a transition, not a creation test_UAT_FC_REQ-186_re_inviting_a_member_does_not_restamp_when_they_were_invited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 a transition, not a creation test_UAT_FC_REQ-186_an_invite_with_no_address_is_refused_as_the_callers_mistake",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 who may invite test_UAT_FC_REQ-186_an_owner_invites_into_their_own_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 who may invite test_UAT_FC_REQ-186_an_owner_may_not_invite_into_a_business_they_do_not_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 who may invite test_UAT_FC_REQ-186_a_member_who_owns_nothing_here_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 who may invite test_UAT_FC_REQ-186_the_loopback_path_may_not_create_people",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 who may invite test_UAT_FC_REQ-186_the_list_reports_who_may_invite_separately_from_who_may_fulfil",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the invite writes no entitlement test_UAT_FC_REQ-186_an_invited_person_holds_no_grant_and_no_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-186 \u2014 the invite writes no entitlement test_UAT_FC_REQ-186_access_to_the_app_is_the_business_it_is_composed_with",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 POST /api/people/add test_UAT_FC_REQ-199_an_owner_adds_a_contact_and_the_new_row_is_a_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 POST /api/people/add test_UAT_FC_REQ-199_an_add_with_no_address_is_refused_as_the_callers_mistake",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 POST /api/people/add test_UAT_FC_REQ-199_a_caller_who_does_not_own_the_business_may_not_add_to_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 POST /api/people/add test_UAT_FC_REQ-199_the_loopback_path_may_not_add_people",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 GET /api/people/invite test_UAT_FC_REQ-199_the_draft_reports_the_sender_and_the_businesses_own_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 GET /api/people/invite test_UAT_FC_REQ-199_a_caller_who_does_not_own_the_business_may_not_read_its_invite_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the two acts are two paths test_UAT_FC_REQ-199_the_add_path_and_the_invite_path_are_different_routes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the two acts are two paths test_UAT_FC_REQ-199_the_add_path_never_sends_and_the_list_shows_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 add is the fundamental act test_UAT_FC_REQ-199_adding_a_contact_leaves_them_a_lead_and_sends_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 add is the fundamental act test_UAT_FC_REQ-199_adding_an_address_already_here_finds_them_rather_than_duplicating",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_inviting_n_contacts_produces_n_messages_with_one_recipient_each",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_each_message_goes_to_that_contacts_primary_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 one message per contact, one recipient each test_UAT_FC_REQ-199_a_contact_with_no_primary_address_is_refused_by_name_and_the_rest_still_send",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_inviting_moves_a_lead_to_invited_and_never_to_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_a_send_the_provider_refused_is_recorded_and_still_counts_as_asking",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_each_send_leaves_a_record_the_detail_pane_can_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_a_second_press_is_a_second_message_and_a_second_event",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 what the operator sees afterwards test_UAT_FC_REQ-199_the_record_lands_with_its_journal_row_so_a_worker_can_write_a_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_the_modal_opens_with_the_sender_and_the_invite_templates_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_an_edited_subject_and_body_are_what_is_sent_and_the_template_is_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the copy is the template\u2019s, and the edit is for this send test_UAT_FC_REQ-199_copy_that_lost_its_link_refuses_and_nothing_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the tenant barrier test_UAT_FC_REQ-199_a_contact_id_from_another_business_cannot_be_invited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-199 \u2014 the tenant barrier test_UAT_FC_REQ-199_the_same_two_acts_from_two_businesses_differ_only_in_which_rows_move",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name",
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