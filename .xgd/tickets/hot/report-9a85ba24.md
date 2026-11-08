---
uid: report-9a85ba24
id: REPORT-11206
type: report
title: 'Report: batch_quality_check for report-05835b4c'
created_by: xgd
created_at: '2026-11-08T00:08:22.454897+00:00'
updated_at: '2026-11-08T00:08:22.454897+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-05835b4c
  parent_report_uid: report-29699f90
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T00:03:02.768887Z",
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
      "duration_seconds": 9.436261999886483,
      "passed": 24,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 24,
      "deselected": 31,
      "test_filter": [
        "test_UAT_AC2254_",
        "test_UAT_AC2257_",
        "test_UAT_AC1741_",
        "test_UAT_AC1742_",
        "test_UAT_AC2115_",
        "test_UAT_AC2255_",
        "test_UAT_AC2256_",
        "test_UAT_FC_REQ-203_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": ":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794096192395,\"endTime\":1794096192498,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-identity-invite-provision-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates\",\"duration\":121,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"correcting an address\"],\"fullName\":\"correcting an address test_UAT_AC2249_correcting_the_address_rewrites_the_primary_row_and_neither_that_nor_repriming_moves_a_key\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2249_correcting_the_address_rewrites_the_primary_row_and_neither_that_nor_repriming_moves_a_key\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name is a row that is superseded, never updated\"],\"fullName\":\"a name is a row that is superseded, never updated test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name is a row that is superseded, never updated\"],\"fullName\":\"a name is a row that is superseded, never updated test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794096192408,\"endTime\":1794096192529,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-identity-person-addresses-names.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_an_invited_contact_is_admitted_rather_than_told_their_access_has_ended\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_an_invited_contact_is_admitted_rather_than_told_their_access_has_ended\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_relaxed_admission_reaches_the_terms_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_the_relaxed_admission_reaches_the_terms_and_nothing_else\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_accepting_the_terms_provisions_a_business_with_a_membership_and_an_open_grant\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_accepting_the_terms_provisions_a_business_with_a_membership_and_an_open_grant\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_no_second_account_is_written_and_the_business_belongs_to_the_one_they_had\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_no_second_account_is_written_and_the_business_belongs_to_the_one_they_had\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_new_business_has_a_starter_site_that_is_servable_at_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_the_new_business_has_a_starter_site_that_is_servable_at_once\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_accepting_a_second_time_provisions_nothing_further\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_accepting_a_second_time_provisions_nothing_further\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_an_operator_who_re_accepts_is_not_given_a_business_of_their_own\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_an_operator_who_re_accepts_is_not_given_a_business_of_their_own\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_after_accepting_they_land_in_the_builder_and_the_site_tab_is_first\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_after_accepting_they_land_in_the_builder_and_the_site_tab_is_first\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_a_lead_nobody_invited_is_treated_identically\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_a_lead_nobody_invited_is_treated_identically\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_business_is_named_after_the_contact_or_visibly_unnamed\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_the_business_is_named_after_the_contact_or_visibly_unnamed\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_a_member_who_holds_nothing_is_still_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_a_member_who_holds_nothing_is_still_refused\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-203 \u2014 signing up is what gives somebody a business\"],\"fullName\":\"REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_provisioning_is_the_hook_and_reports_whether_it_acted\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-203_provisioning_is_the_hook_and_reports_whether_it_acted\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794096192441,\"endTime\":1794096192622,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-203_signup_provisions_business.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the business id the deployment names test_UAT_AC2255_the_configured_platform_business_id_agrees_across_both_environments_and_the_seed_and_reads_biz",
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
          "name": "a business is owned by an account test_UAT_AC1741_business_key_is_opaque_biz_and_distinct_from_its_owning_account_key",
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
          "name": "a business is owned by an account test_UAT_AC2255_a_business_names_its_owning_account_the_platform_is_owned_by_nobody_and_no_business_key_reads_acct",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning needs a real payer test_UAT_AC2256_provisioning_refuses_a_missing_or_empty_account_and_the_operator_lookup_answers_with_an_account",
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
          "name": "provisioning a business test_UAT_AC1741_the_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_an_invited_contact_is_admitted_rather_than_told_their_access_has_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_relaxed_admission_reaches_the_terms_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_accepting_the_terms_provisions_a_business_with_a_membership_and_an_open_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_no_second_account_is_written_and_the_business_belongs_to_the_one_they_had",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_new_business_has_a_starter_site_that_is_servable_at_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_accepting_a_second_time_provisions_nothing_further",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_an_operator_who_re_accepts_is_not_given_a_business_of_their_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_after_accepting_they_land_in_the_builder_and_the_site_tab_is_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_a_lead_nobody_invited_is_treated_identically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_the_business_is_named_after_the_contact_or_visibly_unnamed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_a_member_who_holds_nothing_is_still_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-203 \u2014 signing up is what gives somebody a business test_UAT_FC_REQ-203_provisioning_is_the_hook_and_reports_whether_it_acted",
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