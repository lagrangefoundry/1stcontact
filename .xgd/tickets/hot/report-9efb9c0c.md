---
uid: report-9efb9c0c
id: REPORT-7829
type: report
title: 'Report: batch_quality_check for story-a55c2f35'
created_by: xgd
created_at: '2026-11-01T19:58:14.215646+00:00'
updated_at: '2026-11-01T19:58:14.215646+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-a55c2f35
  parent_report_uid: report-7c2db52c
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T19:54:36.635188Z",
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
      "duration_seconds": 5.9396780829411,
      "passed": 45,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 45,
      "deselected": 12,
      "test_filter": [
        "test_UAT_AC2198_",
        "test_UAT_AC2199_",
        "test_UAT_AC2200_",
        "test_UAT_AC2190_",
        "test_UAT_AC2192_",
        "test_UAT_AC2193_",
        "test_UAT_AC2194_",
        "test_UAT_AC2195_",
        "test_UAT_AC2196_",
        "test_UAT_AC2197_",
        "test_UAT_AC2201_",
        "test_UAT_AC2178_",
        "test_UAT_AC2181_",
        "test_UAT_AC2185_",
        "test_UAT_FC_REQ-170_",
        "test_UAT_FC_REQ-189_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "usiness you are in\"],\"fullName\":\"REQ-170 \u2014 the people of the business you are in test_UAT_FC_REQ-170_a_person_in_another_business_is_indistinguishable_from_one_that_does_not_exist\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_a_person_in_another_business_is_indistinguishable_from_one_that_does_not_exist\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 the four relations are not the same table\"],\"fullName\":\"REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_an_account_logs_in_holding_no_membership_on_the_business_it_logs_in_to\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_an_account_logs_in_holding_no_membership_on_the_business_it_logs_in_to\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 the four relations are not the same table\"],\"fullName\":\"REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_status_is_the_login_control_and_a_suspended_person_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_status_is_the_login_control_and_a_suspended_person_is_refused\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 the four relations are not the same table\"],\"fullName\":\"REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_the_detail_shows_the_businesses_that_person_runs\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_the_detail_shows_the_businesses_that_person_runs\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 grants are a list, and revocation keeps the row\"],\"fullName\":\"REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_an_account_holding_two_grants_shows_both\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_an_account_holding_two_grants_shows_both\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 grants are a list, and revocation keeps the row\"],\"fullName\":\"REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 grants are a list, and revocation keeps the row\"],\"fullName\":\"REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_revocation_marks_the_grant_and_does_not_delete_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_revocation_marks_the_grant_and_does_not_delete_it\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-170 \u2014 the gate is two conditions and neither is \\\"admin\\\"\"],\"fullName\":\"REQ-170 \u2014 the gate is two conditions and neither is \\\"admin\\\" test_UAT_FC_REQ-170_the_fulfilment_control_is_refused_to_a_customer_who_owns_their_own_business\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-170_the_fulfilment_control_is_refused_to_a_customer_who_owns_their_own_business\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793562879715,\"endTime\":1793562879786,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_UAT_FC_REQ-170_people.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-189 \u2014 the grant names its business\"],\"fullName\":\"REQ-189 \u2014 the grant names its business test_UAT_FC_REQ-189_a_grant_on_a_business_they_run_carries_that_businesss_name\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-189_a_grant_on_a_business_they_run_carries_that_businesss_name\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-189 \u2014 the grant names its business\"],\"fullName\":\"REQ-189 \u2014 the grant names its business test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_still_names_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_still_names_it\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793562879723,\"endTime\":1793562879749,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_UAT_FC_REQ-189_grant_names_its_business.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the list is the scoped business, for every business\"],\"fullName\":\"story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the business barrier\"],\"fullName\":\"story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"status\":\"passed\",\"title\":\"test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 every grant names its business\"],\"fullName\":\"story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793562882651,\"endTime\":1793562882732,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"status\":\"passed\",\"title\":\"test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"status\":\"passed\",\"title\":\"test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"status\":\"passed\",\"title\":\"test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 the login control, server-side only\"],\"fullName\":\"story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793562882605,\"endTime\":1793562882773,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-189 \u2014 nothing on this tab is unstyled test_UAT_FC_REQ-189_every_class_the_tab_emits_has_a_rule_in_the_stylesheet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 nothing on this tab is unstyled test_UAT_FC_REQ-189_the_dialogs_this_tab_opens_are_styled_too",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 nothing on this tab is unstyled test_UAT_FC_REQ-189_the_table_takes_its_type_scale_and_gutter_from_webui_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 nothing on this tab is unstyled test_UAT_FC_REQ-189_no_rule_here_branches_on_what_a_state_is_called",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the list shows the name when there is one test_UAT_FC_REQ-189_a_row_shows_the_name_and_the_address_rather_than_one_or_the_other",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the list shows the name when there is one test_UAT_FC_REQ-189_a_row_with_no_name_reads_as_no_name_yet_and_not_as_a_broken_cell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_the_detail_panel_holds_one_table_and_not_two",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_one_row_per_business_carries_both_the_membership_and_the_grant_facts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_a_business_they_run_with_no_grant_says_so_on_its_own_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_says_so_on_its_own_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_a_business_holding_two_grants_shows_both_under_one_business_cell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_withdrawing_a_grant_is_offered_only_where_there_is_one_to_withdraw",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 one table keyed by business, and the mismatches show test_UAT_FC_REQ-189_somebody_who_runs_nothing_and_holds_nothing_is_told_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the join itself test_UAT_FC_REQ-189_the_join_keys_on_the_business_and_keeps_operated_ones_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the join itself test_UAT_FC_REQ-189_a_business_named_only_by_a_grant_still_gets_its_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business",
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
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the people of the business you are in test_UAT_FC_REQ-170_lists_the_people_of_the_scoped_business_and_no_others",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the people of the business you are in test_UAT_FC_REQ-170_a_contact_is_listed_and_is_distinguishable_from_a_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the people of the business you are in test_UAT_FC_REQ-170_a_person_in_another_business_is_indistinguishable_from_one_that_does_not_exist",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_an_account_logs_in_holding_no_membership_on_the_business_it_logs_in_to",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_status_is_the_login_control_and_a_suspended_person_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the four relations are not the same table test_UAT_FC_REQ-170_the_detail_shows_the_businesses_that_person_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_an_account_holding_two_grants_shows_both",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 grants are a list, and revocation keeps the row test_UAT_FC_REQ-170_revocation_marks_the_grant_and_does_not_delete_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-170 \u2014 the gate is two conditions and neither is \"admin\" test_UAT_FC_REQ-170_the_fulfilment_control_is_refused_to_a_customer_who_owns_their_own_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the grant names its business test_UAT_FC_REQ-189_a_grant_on_a_business_they_run_carries_that_businesss_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-189 \u2014 the grant names its business test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_still_names_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist",
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
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits",
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