---
uid: report-64bcbf1c
id: REPORT-10920
type: report
title: 'Report: batch_quality_check for report-3f77b790'
created_by: xgd
created_at: '2026-11-04T19:52:55.370827+00:00'
updated_at: '2026-11-04T19:52:55.370827+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-3f77b790
  parent_report_uid: report-06a422ea
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T19:48:42.551193Z",
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
      "duration_seconds": 8.523023666115478,
      "passed": 114,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 114,
      "deselected": 23,
      "test_filter": [
        "test_UAT_AC2149_",
        "test_UAT_AC2152_",
        "test_UAT_AC2153_",
        "test_UAT_AC2154_",
        "test_UAT_AC2155_",
        "test_UAT_AC2156_",
        "test_UAT_AC2157_",
        "test_UAT_AC2165_",
        "test_UAT_AC2168_",
        "test_UAT_AC2178_",
        "test_UAT_AC2179_",
        "test_UAT_AC2182_",
        "test_UAT_AC2185_",
        "test_UAT_AC2188_",
        "test_UAT_AC2190_",
        "test_UAT_AC2192_",
        "test_UAT_AC2193_",
        "test_UAT_AC2194_",
        "test_UAT_AC2195_",
        "test_UAT_AC2196_",
        "test_UAT_AC2197_",
        "test_UAT_AC2198_",
        "test_UAT_AC2199_",
        "test_UAT_AC2200_",
        "test_UAT_AC2201_",
        "test_UAT_AC2212_",
        "test_UAT_AC2219_",
        "test_UAT_AC2222_",
        "test_UAT_AC2225_",
        "test_UAT_AC2226_",
        "test_UAT_AC2233_",
        "test_UAT_AC2234_",
        "test_UAT_FC_REQ-191_",
        "test_UAT_FC_REQ-193_",
        "test_UAT_FC_REQ-194_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "s_share_one_business_and_role_cell\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the detail pane\"],\"fullName\":\"story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business\",\"duration\":17.02166699999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 presentation\"],\"fullName\":\"story-0034d937 \u2014 presentation test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793821726943,\"endTime\":1793821726982.0217,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_contacts_tab.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"status\":\"passed\",\"title\":\"test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked\",\"duration\":55.5295000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent\",\"duration\":137.57104200000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Who they are\"],\"fullName\":\"story-a55c2f35 \u2014 Who they are test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads\",\"duration\":15.867707999999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2200_a_customer_owner_is_offered_no_withdraw_control\",\"status\":\"passed\",\"title\":\"test_UAT_AC2200_a_customer_owner_is_offered_no_withdraw_control\",\"duration\":7.045499999999947,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants and login, in the detail\"],\"fullName\":\"story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control\",\"duration\":11.366207999999915,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 Provision a business\"],\"fullName\":\"story-a55c2f35 \u2014 Provision a business test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793821726430,\"endTime\":1793821726657.3662,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_contacts_tab_editing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-83ff6262 \u2014 the portal is site content served at /account\"],\"fullName\":\"story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2213_authored_portal_site_is_served_else_the_shipped_default\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2213_authored_portal_site_is_served_else_the_shipped_default\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the portal is site content served at /account\"],\"fullName\":\"story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2214_portal_is_rendered_by_the_preview_renderer_with_assets_under_account\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2214_portal_is_rendered_by_the_preview_renderer_with_assets_under_account\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the portal is site content served at /account\"],\"fullName\":\"story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2215_portal_accepts_only_get_and_head_and_writes_change_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2215_portal_accepts_only_get_and_head_and_writes_change_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the portal is site content served at /account\"],\"fullName\":\"story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2216_no_admission_and_no_scope_is_404_but_a_scope_alone_serves_its_portal\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2216_no_admission_and_no_scope_is_404_but_a_scope_alone_serves_its_portal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the Delete account control and its explanation\"],\"fullName\":\"story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2218_delete_account_reveals_the_erasure_explanation_and_close_folds_it\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2218_delete_account_reveals_the_erasure_explanation_and_close_folds_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the Delete account control and its explanation\"],\"fullName\":\"story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2220_without_scripting_the_explanation_is_served_in_full_and_visible\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2220_without_scripting_the_explanation_is_served_in_full_and_visible\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the Delete account control and its explanation\"],\"fullName\":\"story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2221_copy_says_closing_is_done_by_asking_and_offers_no_dead_contact_channel\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2221_copy_says_closing_is_done_by_asking_and_offers_no_dead_contact_channel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the Delete account control and its explanation\"],\"fullName\":\"story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant\",\"duration\":84.73766699999987,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the Delete account control and its explanation\"],\"fullName\":\"story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2219_pressing_delete_account_and_close_sends_only_gets_and_changes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2219_pressing_delete_account_and_close_sends_only_gets_and_changes_nothing\",\"duration\":54.55195800000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the caller's own account facts\"],\"fullName\":\"story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email\",\"status\":\"passed\",\"title\":\"test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email\",\"duration\":89.17204099999981,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the caller's own account facts\"],\"fullName\":\"story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2223_holdings_sentence_names_every_business_including_lapsed_ones\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2223_holdings_sentence_names_every_business_including_lapsed_ones\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the caller's own account facts\"],\"fullName\":\"story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2224_failed_account_load_is_announced_and_the_explanation_still_works\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2224_failed_account_load_is_announced_and_the_explanation_still_works\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 the avatar dialog links out to the portal\"],\"fullName\":\"story-83ff6262 \u2014 the avatar dialog links out to the portal test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else\",\"duration\":8.137459000000035,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793821728827,\"endTime\":1793821729063.1375,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_customer_portal.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-191 \u2014 the shape test_UAT_FC_REQ-191_users_carries_no_address_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 the shape test_UAT_FC_REQ-191_a_person_holds_several_addresses_and_exactly_one_is_primary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 the shape test_UAT_FC_REQ-191_an_address_resolves_to_exactly_one_person_in_a_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 the shape test_UAT_FC_REQ-191_the_same_address_in_two_businesses_is_two_unrelated_people",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 the shape test_UAT_FC_REQ-191_addresses_are_stored_casefolded_and_the_schema_enforces_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_admit_resolves_identity_through_user_emails",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_repriming_an_address_changes_no_key_and_no_foreign_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_the_detail_pane_gets_every_address_primary_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_inviting_at_a_secondary_address_matches_the_existing_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_correcting_the_address_rewrites_the_primary_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_entitlements_name_their_subject_by_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 what reads it test_UAT_FC_REQ-191_the_break_glass_seed_writes_a_person_and_an_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every part of a name is optional test_UAT_FC_REQ-193_a_person_with_one_name_is_representable_and_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every part of a name is optional test_UAT_FC_REQ-193_the_displayed_name_is_the_one_that_was_stored_and_not_one_assembled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every part of a name is optional test_UAT_FC_REQ-193_a_title_and_a_suffix_are_free_text_and_no_enum_refuses_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_a_second_live_name_row_is_refused_by_the_index_and_not_by_code",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_replacing_a_name_supersedes_rather_than_overwrites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_changing_a_name_changes_no_key_and_no_foreign_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_a_patch_carries_the_other_parts_forward",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_committing_a_value_that_did_not_change_writes_no_history",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_clearing_the_displayed_name_leaves_them_with_no_name_at_all",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 exactly one name is current, and the database says so test_UAT_FC_REQ-193_clearing_the_displayed_name_while_parts_remain_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a correction and a name change are different facts test_UAT_FC_REQ-193_a_former_name_marked_changed_is_found_by_search_and_shown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a correction and a name change are different facts test_UAT_FC_REQ-193_a_correction_is_kept_for_audit_and_never_leaves_the_server",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a correction and a name change are different facts test_UAT_FC_REQ-193_a_supersession_with_no_reason_is_treated_as_a_correction",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a correction and a name change are different facts test_UAT_FC_REQ-193_an_unrecognised_reason_is_a_correction_and_not_a_name_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 erasure reaches names test_UAT_FC_REQ-193_redaction_removes_the_text_and_keeps_the_row_and_its_timeline",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the operator curates through the route test_UAT_FC_REQ-193_the_parts_arrive_flat_and_are_gathered_into_one_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the operator curates through the route test_UAT_FC_REQ-193_the_route_records_a_correction_unless_it_is_told_otherwise",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the operator curates through the route test_UAT_FC_REQ-193_the_route_records_a_name_change_when_it_is_told_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the operator curates through the route test_UAT_FC_REQ-193_naming_nobody_leaves_the_name_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every reader goes through the name table test_UAT_FC_REQ-193_the_users_table_carries_no_display_name_column_any_more",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every reader goes through the name table test_UAT_FC_REQ-193_the_account_switcher_names_the_person_from_the_name_table",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every reader goes through the name table test_UAT_FC_REQ-193_the_switcher_says_no_name_rather_than_guessing_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 every reader goes through the name table test_UAT_FC_REQ-193_an_invite_gives_a_person_their_first_name_and_never_renames_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_the_seed_gives_every_person_exactly_one_current_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_mononym_has_no_given_name_and_no_family_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_display_name_is_stored_and_not_assembled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_known_as_is_the_greeting_and_no_parse_would_find_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_person_with_no_known_as_is_greeted_by_given_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_name_change_is_a_former_name_and_a_typo_is_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_supersession_with_no_reason_is_a_correction",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the seeded names test_UAT_FC_REQ-193_a_seeded_name_change_moved_no_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_an_invite_mints_an_account_with_an_opaque_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_a_person_with_no_account_is_refused_by_the_schema",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_a_business_names_the_account_that_owns_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_no_id_the_product_mints_for_a_business_reads_acct",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_an_account_may_hold_several_people_and_all_of_them_operate_its_businesses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_a_grant_names_its_subject_by_account_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_the_capacity_grant_keeps_its_null_subject_and_its_meaning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_find_account_answers_with_an_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_the_platform_business_is_owned_by_nobody",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_provisioning_refuses_an_account_that_does_not_exist_or_holds_nobody",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grants_are_the_operators_act_and_refused_403_to_every_customer_owner",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2233_a_grant_naming_a_business_outside_the_scope_is_refused_and_nothing_is_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_a_persons_login_status_is_an_owner_act_refused_403_to_a_non_owner",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2234_the_portal_is_the_business_the_caller_is_an_account_of_never_tenant_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 using the portal destroys nothing test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-387c9dfe \u2014 owning 1st Contact is ordinary ownership test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-387c9dfe \u2014 no single predicate answers both questions test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 a second address is visible test_UAT_FC_REQ-191_the_pane_lists_every_address_that_is_not_the_primary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 a second address is visible test_UAT_FC_REQ-191_the_section_is_absent_for_a_person_holding_one_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-191 \u2014 a second address is visible test_UAT_FC_REQ-191_the_addresses_it_shows_are_styled_and_offer_no_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the list shows a name, or says there is none test_UAT_FC_REQ-193_a_mononym_renders_as_itself_and_not_as_a_missing_surname",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the list shows a name, or says there is none test_UAT_FC_REQ-193_a_person_with_no_name_reads_as_no_name_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the list shows a name, or says there is none test_UAT_FC_REQ-193_searching_a_former_name_finds_the_row_and_says_why_it_matched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the list shows a name, or says there is none test_UAT_FC_REQ-193_a_row_with_no_former_name_draws_no_formerly_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_every_part_of_the_name_has_a_box_and_shows_what_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_the_greeting_is_shown_so_the_person_filling_it_in_can_see_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_the_greeting_falls_back_to_the_given_name_then_to_the_displayed_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_the_pane_says_which_names_this_person_used_to_have",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_editing_a_part_sends_that_part_alone_and_no_reason_at_all",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 the record pane is where the operator curates test_UAT_FC_REQ-193_the_greeting_follows_the_part_that_was_just_edited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a real name change is a deliberate act test_UAT_FC_REQ-193_the_dialog_says_what_it_will_do_before_it_is_used",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a real name change is a deliberate act test_UAT_FC_REQ-193_it_is_prefilled_from_the_current_name_because_most_of_it_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a real name change is a deliberate act test_UAT_FC_REQ-193_recording_a_change_sends_every_part_once_and_marks_it_changed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-193 \u2014 a real name change is a deliberate act test_UAT_FC_REQ-193_the_old_name_becomes_a_former_name_the_list_can_be_searched_by",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_the_baseline_declares_the_account_and_both_edges_of_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_the_capacity_grant_survives_the_subject_becoming_real",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_no_business_the_deployment_names_reads_acct",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_no_permission_check_reads_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-194 \u2014 the account is a table test_UAT_FC_REQ-194_the_chrome_is_told_who_is_signed_in_under_that_noun",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2200_a_customer_owner_is_offered_no_withdraw_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2219_pressing_delete_account_and_close_sends_only_gets_and_changes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the avatar dialog links out to the portal test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else",
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