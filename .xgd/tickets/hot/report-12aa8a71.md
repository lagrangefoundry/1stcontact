---
uid: report-12aa8a71
id: REPORT-11492
type: report
title: 'Report: batch_quality_check for STORY-99'
created_by: xgd
created_at: '2026-11-08T15:16:55.253522+00:00'
updated_at: '2026-11-08T15:16:55.253522+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-99
  parent_report_uid: report-f32587ff
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T15:13:03.685708Z",
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
      "duration_seconds": 17.18633820815012,
      "passed": 136,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 136,
      "deselected": 48,
      "test_filter": [
        "test_UAT_AC2232_",
        "test_UAT_AC2144_",
        "test_UAT_AC1402_",
        "test_UAT_AC960_",
        "test_UAT_AC2143_",
        "test_UAT_AC2146_",
        "test_UAT_AC2230_",
        "test_UAT_AC2231_",
        "test_UAT_AC977_",
        "test_UAT_AC2463_",
        "test_UAT_AC2336_",
        "test_UAT_AC2339_",
        "test_UAT_AC2367_",
        "test_UAT_AC2409_",
        "test_UAT_FC_BUG-53_",
        "test_UAT_FC_BUG-58_",
        "test_UAT_FC_REQ-199_",
        "test_UAT_FC_BUG-47_",
        "test_UAT_FC_REQ-181_",
        "test_UAT_FC_REQ-213_",
        "test_UAT_AC1715_",
        "test_UAT_AC1716_",
        "test_UAT_AC1717_",
        "test_UAT_AC1718_",
        "test_UAT_AC1725_",
        "test_UAT_AC1726_",
        "test_UAT_AC1727_",
        "test_UAT_AC1728_",
        "test_UAT_AC1729_",
        "test_UAT_AC1730_",
        "test_UAT_AC1731_",
        "test_UAT_AC1732_",
        "test_UAT_AC1733_",
        "test_UAT_AC1734_",
        "test_UAT_AC1735_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2021_",
        "test_UAT_AC2161_",
        "test_UAT_AC2324_",
        "test_UAT_AC2326_",
        "test_UAT_AC2458_",
        "test_UAT_AC2459_",
        "test_UAT_AC2461_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "lureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 invite is a selection, not a form\"],\"fullName\":\"REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_the_stylesheet_has_a_rule_for_the_disabled_state\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_stylesheet_has_a_rule_for_the_disabled_state\",\"duration\":0.3249999999999318,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 invite is a selection, not a form\"],\"fullName\":\"REQ-199 \u2014 invite is a selection, not a form test_UAT_FC_REQ-199_ticking_a_row_does_not_move_the_detail_pane\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_ticking_a_row_does_not_move_the_detail_pane\",\"duration\":11.83783399999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_from_is_display_only_and_subject_and_body_come_from_the_template\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_from_is_display_only_and_subject_and_body_come_from_the_template\",\"duration\":8.945917000000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_recipient_field_is_labelled_to_list_and_explains_itself_on_hover\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_recipient_field_is_labelled_to_list_and_explains_itself_on_hover\",\"duration\":8.170499999999947,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_to_list_shows_one_selected_address_per_line\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_to_list_shows_one_selected_address_per_line\",\"duration\":7.755166000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_a_selected_contact_with_no_address_is_visible_before_anything_is_sent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_a_selected_contact_with_no_address_is_visible_before_anything_is_sent\",\"duration\":6.147458000000029,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_sending_posts_the_selected_ids_with_the_edited_copy\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_sending_posts_the_selected_ids_with_the_edited_copy\",\"duration\":7.917749999999955,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 the invite modal is a message\"],\"fullName\":\"REQ-199 \u2014 the invite modal is a message test_UAT_FC_REQ-199_the_report_names_every_selected_contact_and_the_selection_clears\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_report_names_every_selected_contact_and_the_selection_clears\",\"duration\":9.188750000000027,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the report says\"],\"fullName\":\"REQ-199 \u2014 what the report says test_UAT_FC_REQ-199_every_outcome_gets_a_line_and_a_refusal_names_the_person_and_the_reason\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_every_outcome_gets_a_line_and_a_refusal_names_the_person_and_the_reason\",\"duration\":0.27474999999992633,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-199 \u2014 what the report says\"],\"fullName\":\"REQ-199 \u2014 what the report says test_UAT_FC_REQ-199_the_two_outcomes_worth_acting_on_are_accented_by_one_rule\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-199_the_two_outcomes_worth_acting_on_are_accented_by_one_rule\",\"duration\":0.09895900000003621,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794150791164,\"endTime\":1794150791256.2747,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-199_contacts_tab.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-213 \u2014 one row unlocked, and only one\"],\"fullName\":\"REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_what_it_is_for_is_editable_and_the_rest_of_the_rights_record_is_not\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_what_it_is_for_is_editable_and_the_rest_of_the_rights_record_is_not\",\"duration\":16.830208999999968,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 one row unlocked, and only one\"],\"fullName\":\"REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_material_whose_role_nobody_chose_is_not_offered_as_editable\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_material_whose_role_nobody_chose_is_not_offered_as_editable\",\"duration\":7.806375000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 one row unlocked, and only one\"],\"fullName\":\"REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_a_capture_is_locked_even_though_its_bytes_are_republishable\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_a_capture_is_locked_even_though_its_bytes_are_republishable\",\"duration\":4.952250000000049,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 it edits in the vocabulary it displays\"],\"fullName\":\"REQ-213 \u2014 it edits in the vocabulary it displays test_UAT_FC_REQ-213_the_select_offers_the_words_the_block_already_displays\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_the_select_offers_the_words_the_block_already_displays\",\"duration\":6.835332999999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 it edits in the vocabulary it displays\"],\"fullName\":\"REQ-213 \u2014 it edits in the vocabulary it displays test_UAT_FC_REQ-213_picking_an_option_sends_the_wire_value_and_not_the_label\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_picking_an_option_sends_the_wire_value_and_not_the_label\",\"duration\":6.369750000000067,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 a change repaints everything it changed\"],\"fullName\":\"REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_the_whole_rights_block_repaints_not_just_the_row_that_was_picked\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_the_whole_rights_block_repaints_not_just_the_row_that_was_picked\",\"duration\":6.394290999999953,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 a change repaints everything it changed\"],\"fullName\":\"REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_the_list_redraws_because_the_badge_and_the_warning_read_what_changed\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_the_list_redraws_because_the_badge_and_the_warning_read_what_changed\",\"duration\":7.370917000000077,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 a change repaints everything it changed\"],\"fullName\":\"REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_a_correction_that_could_not_be_placed_is_warned_about_by_the_row\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_a_correction_that_could_not_be_placed_is_warned_about_by_the_row\",\"duration\":4.7504579999999805,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-213 \u2014 a refusal reaches the person who clicked\"],\"fullName\":\"REQ-213 \u2014 a refusal reaches the person who clicked test_UAT_FC_REQ-213_a_refused_correction_rolls_the_control_back_and_says_why\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-213_a_refused_correction_rolls_the_control_back_and_says_why\",\"duration\":4.67937500000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794150791166,\"endTime\":1794150791232.6794,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-213_library_role_field.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add dialog\"],\"fullName\":\"story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open\",\"status\":\"passed\",\"title\":\"test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open\",\"duration\":38.66425000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite modal\"],\"fullName\":\"story-7b1025b8 \u2014 the invite modal test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list\",\"status\":\"passed\",\"title\":\"test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list\",\"duration\":23.238833,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite modal\"],\"fullName\":\"story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent\",\"status\":\"passed\",\"title\":\"test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent\",\"duration\":31.451125000000047,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794150791151,\"endTime\":1794150791244.4512,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_contacts_add_invite_tab.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite composer fits its dialog\"],\"fullName\":\"story-7b1025b8 \u2014 the invite composer fits its dialog test_UAT_AC2367_invite_subject_tolist_and_body_lie_within_the_dialog_panel_at_desktop_and_narrow_widths\",\"status\":\"passed\",\"title\":\"test_UAT_AC2367_invite_subject_tolist_and_body_lie_within_the_dialog_panel_at_desktop_and_narrow_widths\",\"duration\":2608.117916,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794150790993,\"endTime\":1794150793601.118,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_contacts_invite_composer_fits.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 an event's row is the list's own row, built from the change test_UAT_AC2326_event_row_equals_the_re_read_list_row_and_is_built_without_reading_ticket_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2458 \u2014 an upload's role is corrected, and republishable is derived server-side test_UAT_AC2458_upload_role_corrects_both_ways_validates_and_derives_republishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 fetched and captured material is refused 403; no recorded origin counts as uploaded test_UAT_AC2459_fetched_and_captured_roles_are_refused_403_unchanged_and_absent_origin_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 narrowing a placed material is refused 409 and changes nothing test_UAT_AC2461_narrowing_a_placed_upload_is_refused_409_naming_uid_and_placed_on_and_nothing_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 placement is where the bytes went test_UAT_FC_BUG-47_a_file_kept_for_reading_is_never_marked_as_on_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 placement is where the bytes went test_UAT_FC_BUG-47_a_promotion_that_landed_records_the_site_it_landed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 placement is where the bytes went test_UAT_FC_BUG-47_a_promotion_that_failed_is_not_badged_as_one_that_landed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 placement is where the bytes went test_UAT_FC_BUG-47_material_on_two_of_a_clients_sites_records_both_exactly_once",
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
          "name": "REQ-213 \u2014 background information becomes a site asset test_UAT_FC_REQ-213_background_becomes_an_asset_and_the_bytes_land_on_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 background information becomes a site asset test_UAT_FC_REQ-213_the_correction_never_overwrites_an_asset_already_on_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 and back again, until the bytes have landed test_UAT_FC_REQ-213_an_asset_that_never_landed_can_go_back_to_being_background",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 and back again, until the bytes have landed test_UAT_FC_REQ-213_a_file_already_on_the_site_cannot_become_background_again",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a role nobody chose is not the client's to correct test_UAT_FC_REQ-213_material_we_fetched_keeps_the_role_provenance_gave_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a role nobody chose is not the client's to correct test_UAT_FC_REQ-213_a_capture_keeps_the_role_the_captured_host_gave_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 the request is validated, never coerced test_UAT_FC_REQ-213_republishable_is_derived_from_the_role_and_never_taken_from_the_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 the request is validated, never coerced test_UAT_FC_REQ-213_a_role_the_select_could_not_have_sent_is_refused_never_coerced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 placement is soft, and the correction is not test_UAT_FC_REQ-213_with_no_site_to_place_on_the_correction_still_lands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 placement is soft, and the correction is not test_UAT_FC_REQ-213_a_placement_that_fails_leaves_the_correction_standing_and_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 the upload path is unchanged by sharing the placement test_UAT_FC_REQ-213_an_upload_still_places_its_bytes_and_still_refuses_a_reference_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the empty detail state is one styled box test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole business, and a switch leaves nothing behind test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 a business switch closes the feed, then re-reads, then reopens test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only but for an upload's role test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description, and on an upload the role, are the editable fields test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 no role control where the origin chose the role test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 a placed material's narrowing is refused and the select reverts test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1725_the_overlay_asks_what_the_file_is_for_and_states_the_privacy_promise",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1726_dropping_files_into_an_area_commits_that_role_and_withdraws_the_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1727_every_area_is_activatable_without_dragging_and_commits_the_same_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1728_a_file_dropped_outside_both_areas_creates_nothing_and_says_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1729_only_a_file_drag_raises_the_overlay_and_it_stays_up_across_the_workspace",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1734_dismissing_the_overlay_creates_nothing_and_the_next_raise_starts_clean",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1730_the_conversation_and_the_library_raise_the_one_same_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1731_a_conversational_handover_is_the_clients_own_turn_and_a_library_one_adds_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1732_a_handover_that_did_not_fully_succeed_reports_what_went_wrong",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1733_the_open_site_travels_with_the_handover_and_a_reference_file_is_never_placed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1735_several_files_are_reported_one_by_one_and_the_library_is_re_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 one definition names each area everywhere test_UAT_AC2021_overlay_labels_library_pills_filter_detail_and_manual_read_from_one_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 the surface reads placement, not upload context test_UAT_FC_BUG-47_a_file_kept_for_reading_is_not_marked_as_being_on_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-47 \u2014 the surface reads placement, not upload context test_UAT_FC_BUG-47_the_placed_on_field_agrees_with_the_warning",
          "file": "",
          "status": "passed"
        },
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
          "name": "BUG-58 \u2014 the composer is copy, and the panel is sized for it test_UAT_FC_BUG-58_the_composer_keeps_the_copy_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-58 \u2014 the composer is copy, and the panel is sized for it test_UAT_FC_BUG-58_the_composer_asserts_no_width_of_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-58 \u2014 measured against a real browser test_UAT_FC_BUG-58_invite_fields_stay_inside_the_panel_at_every_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the row badges what went wrong test_UAT_FC_REQ-181_no_row_claims_to_be_on_this_site_and_the_failed_promotion_is_marked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the row badges what went wrong test_UAT_FC_REQ-181_background_information_is_never_marked_however_unplaced_it_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the row badges what went wrong test_UAT_FC_REQ-181_the_warning_says_what_it_means_without_relying_on_colour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the filter loses the axis that degenerated test_UAT_FC_REQ-181_there_is_no_used_on_this_site_filter_and_the_rest_still_narrow",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the filter loses the axis that degenerated test_UAT_FC_REQ-181_the_rights_record_still_holds_the_placement_under_its_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the Library no longer knows about the site test_UAT_FC_REQ-181_the_library_reads_no_site_anywhere",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-181 \u2014 the Library no longer knows about the site test_UAT_FC_REQ-181_switching_business_leaves_no_row_from_the_previous_one",
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
          "name": "REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_what_it_is_for_is_editable_and_the_rest_of_the_rights_record_is_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_material_whose_role_nobody_chose_is_not_offered_as_editable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 one row unlocked, and only one test_UAT_FC_REQ-213_a_capture_is_locked_even_though_its_bytes_are_republishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 it edits in the vocabulary it displays test_UAT_FC_REQ-213_the_select_offers_the_words_the_block_already_displays",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 it edits in the vocabulary it displays test_UAT_FC_REQ-213_picking_an_option_sends_the_wire_value_and_not_the_label",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_the_whole_rights_block_repaints_not_just_the_row_that_was_picked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_the_list_redraws_because_the_badge_and_the_warning_read_what_changed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a change repaints everything it changed test_UAT_FC_REQ-213_a_correction_that_could_not_be_placed_is_warned_about_by_the_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-213 \u2014 a refusal reaches the person who clicked test_UAT_FC_REQ-213_a_refused_correction_rolls_the_control_back_and_says_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite composer fits its dialog test_UAT_AC2367_invite_subject_tolist_and_body_lie_within_the_dialog_panel_at_desktop_and_narrow_widths",
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